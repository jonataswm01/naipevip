import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  buscarOrder,
  validarWebhookSignature,
  mapearStatusPagamento,
} from "@/lib/mercado-pago";
import QRCode from "qrcode";

// =============================================
// TIPOS
// =============================================

interface WebhookPayload {
  id: string;
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  live_mode: boolean;
  type: string;
  user_id: string;
}

// =============================================
// HELPER: Gerar código único para ingresso
// =============================================
function gerarCodigoIngresso(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let codigo = "";
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
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
        const codigo = gerarCodigoIngresso();
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

    console.log(
      `Ingressos gerados com sucesso para o pedido ${pedidoId}`
    );
  } catch (error) {
    console.error("Erro ao gerar ingressos:", error);
  }
}

// =============================================
// POST - Receber Webhook do Mercado Pago
// =============================================

export async function POST(request: NextRequest) {
  try {
    // Verificar Supabase
    if (!isSupabaseConfigured()) {
      console.error("Supabase não configurado");
      return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 });
    }

    // Ler headers de segurança
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");

    // Parse do body
    const body: WebhookPayload = await request.json();
    console.log("Webhook recebido:", JSON.stringify(body, null, 2));

    // Validar assinatura (se configurada)
    if (xSignature && xRequestId && body.data?.id) {
      const isValid = validarWebhookSignature(
        xSignature,
        xRequestId,
        body.data.id
      );

      if (!isValid) {
        console.error("Assinatura do webhook inválida");
        // Não retornar erro para não dar dicas a atacantes
        // Mas logar para monitoramento
      }
    }

    // Verificar tipo do evento
    // Tipos possíveis: "order" para API de Orders
    if (body.type !== "order" && body.action !== "order.updated") {
      // Ignorar outros tipos de notificação
      console.log("Tipo de webhook ignorado:", body.type, body.action);
      return NextResponse.json({ received: true });
    }

    // Buscar detalhes da order no Mercado Pago
    const orderId = body.data.id;
    const orderResult = await buscarOrder(orderId);

    if (!orderResult.success) {
      console.error("Erro ao buscar order no MP:", orderResult.error);
      // Retornar 200 para não causar retry infinito
      return NextResponse.json({ received: true, error: "Order não encontrada" });
    }

    const orderData = orderResult.data;
    console.log("Order MP:", JSON.stringify(orderData, null, 2));

    // Extrair external_reference (nosso pedido_id)
    const pedidoId = orderData.external_reference;

    if (!pedidoId) {
      console.error("external_reference não encontrado na order");
      return NextResponse.json({ received: true, error: "Pedido não identificado" });
    }

    // Mapear status
    const { pagamentoStatus, pedidoStatus } = mapearStatusPagamento(
      orderData.status,
      orderData.status_detail
    );

    console.log(
      `Atualizando pedido ${pedidoId}: status=${pedidoStatus}, pagamento=${pagamentoStatus}`
    );

    // Atualizar pagamento no banco
    const { error: pagamentoError } = await supabase
      .from("pagamentos")
      .update({
        status: pagamentoStatus,
        mp_payment_id: orderId,
        raw_response: orderData,
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

      // Atualizar quantidade vendida do lote
      // (O trigger no banco já faz isso quando o status do pagamento muda para 'approved')
    }

    // Retornar sucesso
    return NextResponse.json({
      received: true,
      orderId: orderId,
      pedidoId: pedidoId,
      status: pedidoStatus,
    });
  } catch (error) {
    console.error("Erro no webhook do Mercado Pago:", error);
    // Retornar 200 para não causar retry infinito
    return NextResponse.json({ received: true, error: "Erro interno" });
  }
}

// =============================================
// GET - Health check / Confirmação de configuração
// =============================================

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Webhook do Mercado Pago configurado",
    timestamp: new Date().toISOString(),
  });
}
