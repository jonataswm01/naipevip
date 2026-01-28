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
        // Gerar código único (o trigger do banco também gera, mas vamos garantir)
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let codigo = "";
        for (let j = 0; j < 8; j++) {
          codigo += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const qrCode = await gerarQRCodeIngresso(codigo);

        const { error: ingressoError } = await supabase
          .from("ingressos")
          .insert({
            codigo: codigo,
            pedido_id: pedidoId,
            pedido_item_id: item.id,
            usuario_id: pedido.usuario_id,
            evento_id: pedido.evento_id,
            lote_id: item.lote_id,
            nome_titular: pedido.usuarios?.nome || "Participante",
            status: "ativo",
            qr_code: qrCode,
          });

        if (ingressoError) {
          console.error("Erro ao criar ingresso:", ingressoError);
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

    if (!pedidoId) {
      console.error("externalReference não encontrado no pagamento");
      return NextResponse.json({ received: true, error: "Pedido não identificado" });
    }

    // Mapear status
    const { pagamentoStatus, pedidoStatus } = mapearStatusAsaas(payment.status);

    console.log(
      `Atualizando pedido ${pedidoId}: status=${pedidoStatus}, pagamento=${pagamentoStatus}`
    );

    // Atualizar pagamento no banco
    const { error: pagamentoError } = await supabase
      .from("pagamentos")
      .update({
        status: pagamentoStatus,
        raw_response: payment,
        ...(pagamentoStatus === "approved" && { pago_em: new Date().toISOString() }),
      })
      .eq("pedido_id", pedidoId);

    if (pagamentoError) {
      console.error("Erro ao atualizar pagamento:", pagamentoError);
    }

    // Atualizar pedido no banco
    const { error: pedidoError } = await supabase
      .from("pedidos")
      .update({
        status: pedidoStatus,
      })
      .eq("id", pedidoId);

    if (pedidoError) {
      console.error("Erro ao atualizar pedido:", pedidoError);
    }

    // Se pagamento aprovado, gerar ingressos
    if (pagamentoStatus === "approved") {
      await gerarIngressos(pedidoId);
    }

    // Retornar sucesso
    return NextResponse.json({
      received: true,
      paymentId: payment.id,
      pedidoId: pedidoId,
      status: pedidoStatus,
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
