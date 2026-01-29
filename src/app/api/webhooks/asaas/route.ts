import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mapearStatusAsaas, AsaasPaymentStatus } from "@/lib/asaas";
import QRCode from "qrcode";

// =============================================
// TIPOS DO WEBHOOK ASAAS
// =============================================

interface AsaasWebhookPayment {
  id: string;
  customer: string;
  value: number;
  netValue: number;
  billingType: string;
  status: AsaasPaymentStatus;
  dueDate: string;
  paymentDate?: string;
  description?: string;
  externalReference?: string;
}

interface AsaasWebhookPayload {
  event: string;
  payment: AsaasWebhookPayment;
}

// =============================================
// HELPER: Gerar QR Code para ingresso
// =============================================
async function gerarQRCodeIngresso(codigo: string): Promise<string> {
  try {
    const qrCode = await QRCode.toDataURL(codigo, {
      width: 200,
      margin: 1,
      color: {
        dark: "#1a1a1a",
        light: "#ffffff",
      },
    });
    return qrCode;
  } catch {
    return "";
  }
}

// =============================================
// HELPER: Gerar ingressos após pagamento aprovado
// =============================================
async function gerarIngressos(pedidoId: string): Promise<void> {
  try {
    // Buscar dados do pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select(
        `
        *,
        usuarios(nome),
        pedido_itens(*, lotes(*))
      `
      )
      .eq("id", pedidoId)
      .single();

    if (pedidoError || !pedido) {
      console.error("Erro ao buscar pedido para gerar ingressos:", pedidoError);
      return;
    }

    // Verificar se já existem ingressos
    const { data: ingressosExistentes } = await supabase
      .from("ingressos")
      .select("id")
      .eq("pedido_id", pedidoId)
      .limit(1);

    if (ingressosExistentes && ingressosExistentes.length > 0) {
      console.log("Ingressos já existem para o pedido:", pedidoId);
      return;
    }

    // Gerar ingressos para cada item
    for (const item of pedido.pedido_itens || []) {
      for (let i = 0; i < item.quantidade; i++) {
        // Inserir ingresso sem código - o trigger do banco gera automaticamente (5 dígitos)
        const { data: ingresso, error: ingressoError } = await supabase
          .from("ingressos")
          .insert({
            // codigo será gerado automaticamente pelo trigger
            pedido_id: pedidoId,
            pedido_item_id: item.id,
            usuario_id: pedido.usuario_id,
            evento_id: pedido.evento_id,
            lote_id: item.lote_id,
            nome_titular: pedido.usuarios?.nome || "Participante",
            status: "ativo",
          })
          .select()
          .single();

        if (ingressoError || !ingresso) {
          console.error("Erro ao criar ingresso:", ingressoError);
          continue;
        }

        // Gerar QR Code após obter o código gerado pelo trigger
        if (ingresso.codigo) {
          const qrCode = await gerarQRCodeIngresso(ingresso.codigo);
          
          // Atualizar ingresso com QR Code
          await supabase
            .from("ingressos")
            .update({ qr_code: qrCode })
            .eq("id", ingresso.id);
        }
      }
    }

    console.log(`Ingressos gerados com sucesso para o pedido ${pedidoId}`);
  } catch (error) {
    console.error("Erro ao gerar ingressos:", error);
  }
}

// =============================================
// POST - Receber Webhook do Asaas
// =============================================

export async function POST(request: NextRequest) {
  try {
    // Verificar Supabase
    if (!isSupabaseConfigured()) {
      console.error("Supabase não configurado");
      return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 });
    }

    // Parse do body
    const body: AsaasWebhookPayload = await request.json();
    console.log("=== WEBHOOK ASAAS RECEBIDO ===");
    console.log("Evento:", body.event);
    console.log("Payment:", JSON.stringify(body.payment, null, 2));

    // Verificar se é um evento de pagamento
    if (!body.payment) {
      console.log("Webhook sem dados de pagamento, ignorando");
      return NextResponse.json({ received: true });
    }

    const payment = body.payment;
    const pedidoId = payment.externalReference;
    const asaasPaymentId = payment.id;

    // =============================================
    // LOGS DETALHADOS PARA DEBUG
    // =============================================
    console.log("=== WEBHOOK ASAAS - DADOS RECEBIDOS ===");
    console.log("Payment ID (ASAS):", asaasPaymentId);
    console.log("Pedido ID (externalReference):", pedidoId);
    console.log("Status ASAS:", payment.status);
    console.log("Valor:", payment.value);

    if (!pedidoId) {
      console.error("❌ ERRO: externalReference não encontrado no pagamento");
      console.error("Payment completo:", JSON.stringify(payment, null, 2));
      return NextResponse.json({ received: true, error: "Pedido não identificado" });
    }

    // =============================================
    // BUSCAR PAGAMENTO NO BANCO (BUSCA ROBUSTA)
    // =============================================
    // Buscar por pedido_id OU por asaas_payment_id (caso o externalReference não corresponda)
    const { data: pagamentoExistente, error: buscaError } = await supabase
      .from("pagamentos")
      .select("*")
      .or(`pedido_id.eq.${pedidoId},asaas_payment_id.eq.${asaasPaymentId}`)
      .single();

    if (buscaError || !pagamentoExistente) {
      console.error("❌ ERRO: Pagamento não encontrado no banco!");
      console.error("Buscado por pedido_id:", pedidoId);
      console.error("Buscado por asaas_payment_id:", asaasPaymentId);
      console.error("Erro da busca:", buscaError);
      
      // Tentar buscar apenas por pedido_id para debug
      const { data: pagamentoPorPedido } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("pedido_id", pedidoId)
        .maybeSingle();
      
      console.log("Pagamento encontrado por pedido_id:", pagamentoPorPedido);
      
      return NextResponse.json({ 
        received: true, 
        error: "Pagamento não encontrado no banco",
        pedidoId,
        asaasPaymentId
      });
    }

    console.log("✅ Pagamento encontrado no banco!");
    console.log("Pagamento ID:", pagamentoExistente.id);
    console.log("Status atual no banco:", pagamentoExistente.status);

    // =============================================
    // MAPEAR STATUS DO ASAS
    // =============================================
    const { pagamentoStatus, pedidoStatus } = mapearStatusAsaas(payment.status);

    console.log("=== MAPEAMENTO DE STATUS ===");
    console.log("Status ASAS recebido:", payment.status);
    console.log("Status mapeado (pagamento):", pagamentoStatus);
    console.log("Status mapeado (pedido):", pedidoStatus);

    // =============================================
    // ATUALIZAR PAGAMENTO NO BANCO
    // =============================================
    const updateData: Record<string, unknown> = {
      status: pagamentoStatus,
      raw_response: payment,
    };

    // Atualizar asaas_payment_id se não estiver preenchido
    if (!pagamentoExistente.asaas_payment_id && asaasPaymentId) {
      updateData.asaas_payment_id = asaasPaymentId;
      console.log("✅ Atualizando asaas_payment_id:", asaasPaymentId);
    }

    // Adicionar data de pagamento se aprovado
    if (pagamentoStatus === "approved") {
      updateData.pago_em = new Date().toISOString();
      console.log("✅ Pagamento aprovado! Adicionando pago_em");
    }

    const { error: pagamentoError } = await supabase
      .from("pagamentos")
      .update(updateData)
      .eq("id", pagamentoExistente.id);

    if (pagamentoError) {
      console.error("❌ ERRO CRÍTICO ao atualizar pagamento:", pagamentoError);
      console.error("Dados que tentou atualizar:", updateData);
      return NextResponse.json({ 
        received: true, 
        error: "Erro ao atualizar pagamento",
        details: pagamentoError.message
      });
    }

    console.log("✅ Pagamento atualizado com sucesso!");

    // =============================================
    // ATUALIZAR PEDIDO NO BANCO
    // =============================================
    const { error: pedidoError } = await supabase
      .from("pedidos")
      .update({
        status: pedidoStatus,
      })
      .eq("id", pedidoId);

    if (pedidoError) {
      console.error("❌ ERRO CRÍTICO ao atualizar pedido:", pedidoError);
      return NextResponse.json({ 
        received: true, 
        error: "Erro ao atualizar pedido",
        details: pedidoError.message
      });
    }

    console.log("✅ Pedido atualizado com sucesso!");

    // =============================================
    // GERAR INGRESSOS SE PAGAMENTO APROVADO
    // =============================================
    if (pagamentoStatus === "approved") {
      console.log("✅ Pagamento aprovado! Iniciando geração de ingressos...");
      try {
        await gerarIngressos(pedidoId);
        console.log("✅ Ingressos gerados com sucesso!");
      } catch (ingressoError) {
        console.error("❌ ERRO ao gerar ingressos:", ingressoError);
        // Não retornar erro aqui, pois o pagamento já foi atualizado
        // Os ingressos podem ser gerados manualmente depois se necessário
      }
    } else {
      console.log("⏳ Pagamento ainda não aprovado. Status:", pagamentoStatus);
    }

    // =============================================
    // RETORNAR SUCESSO
    // =============================================
    console.log("=== WEBHOOK PROCESSADO COM SUCESSO ===");
    return NextResponse.json({
      received: true,
      success: true,
      paymentId: asaasPaymentId,
      pedidoId: pedidoId,
      status: pedidoStatus,
      pagamentoStatus: pagamentoStatus,
      ingressosGerados: pagamentoStatus === "approved",
    });
  } catch (error) {
    console.error("Erro no webhook do Asaas:", error);
    // Retornar 200 para não causar retry infinito
    return NextResponse.json({ received: true, error: "Erro interno" });
  }
}

// =============================================
// GET - Health check
// =============================================

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Webhook do Asaas configurado",
    timestamp: new Date().toISOString(),
  });
}
