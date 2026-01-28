import crypto from "crypto";

// =============================================
// CONFIGURAÇÃO DO MERCADO PAGO
// =============================================

// Export para compatibilidade (usa getters para ler variáveis no momento da execução)
export const mercadoPagoConfig = {
  get accessToken() { return process.env.MERCADO_PAGO_ACCESS_TOKEN || ""; },
  get publicKey() { return process.env.MERCADO_PAGO_PUBLIC_KEY || ""; },
  get webhookSecret() { return process.env.MERCADO_PAGO_WEBHOOK_SECRET || ""; },
  baseUrl: "https://api.mercadopago.com",
};

// =============================================
// TIPOS
// =============================================

export interface CriarPagamentoPixParams {
  valor: number;
  descricao: string;
  email: string;
  nome: string;
  cpf?: string;
  externalReference: string;
  expiracaoMinutos?: number;
}

export interface MercadoPagoOrderResponse {
  id: string;
  status: string;
  status_detail: string;
  external_reference: string;
  total_amount: string;
  transactions: {
    payments: Array<{
      id: string;
      status: string;
      status_detail: string;
      amount: string;
      payment_method: {
        id: string;
        type: string;
        data?: {
          qr_code?: string;
          qr_code_base64?: string;
          ticket_url?: string;
        };
      };
    }>;
  };
}

export interface MercadoPagoError {
  message: string;
  error: string;
  status: number;
  cause?: Array<{
    code: string;
    description: string;
  }>;
}

// =============================================
// FUNÇÕES DE INTEGRAÇÃO
// =============================================

/**
 * Criar pagamento PIX via API de Orders do Mercado Pago
 */
export async function criarPagamentoPix(
  params: CriarPagamentoPixParams
): Promise<{ success: true; data: MercadoPagoOrderResponse } | { success: false; error: string }> {
  const {
    valor,
    descricao,
    email,
    nome,
    cpf,
    externalReference,
    expiracaoMinutos = 15,
  } = params;

  // Obter Access Token
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  
  // Debug: verificar se o token existe
  console.log("=== DEBUG MERCADO PAGO ===");
  console.log("Access Token existe:", !!accessToken);
  console.log("Access Token primeiros 20 chars:", accessToken?.substring(0, 20) + "...");
  
  if (!accessToken) {
    console.error("ERRO: MERCADO_PAGO_ACCESS_TOKEN não está definido!");
    return { success: false, error: "Configuração do Mercado Pago incompleta" };
  }

  // Montar requisição conforme documentação da API de Orders
  const orderData = {
    type: "online",
    processing_mode: "automatic",
    external_reference: externalReference,
    total_amount: valor.toFixed(2),
    payer: {
      email: email,
      first_name: nome.split(" ")[0],
      last_name: nome.split(" ").slice(1).join(" ") || nome.split(" ")[0],
      ...(cpf && {
        identification: {
          type: "CPF",
          number: cpf.replace(/\D/g, ""),
        },
      }),
    },
    transactions: {
      payments: [
        {
          amount: valor.toFixed(2),
          payment_method: {
            id: "pix",
            type: "bank_transfer",
          },
          expiration_time: `PT${expiracaoMinutos}M`, // ISO 8601 duration (ex: PT15M = 15 minutos)
        },
      ],
    },
  };

  console.log("Order Data:", JSON.stringify(orderData, null, 2));

  try {
    const url = "https://api.mercadopago.com/v1/orders";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "X-Idempotency-Key": `${externalReference}-${Date.now()}`,
    };
    
    console.log("URL:", url);
    console.log("Headers (sem token completo):", { ...headers, Authorization: "Bearer ***" });

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(orderData),
    });

    const data = await response.json();
    
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Erro Mercado Pago:", JSON.stringify(data, null, 2));
      const errorMessage =
        data.message ||
        data.cause?.[0]?.description ||
        "Erro ao criar pagamento";
      return { success: false, error: errorMessage };
    }

    return { success: true, data: data as MercadoPagoOrderResponse };
  } catch (error) {
    console.error("Erro ao chamar API Mercado Pago:", error);
    return { success: false, error: "Erro de conexão com Mercado Pago" };
  }
}

/**
 * Buscar order por ID no Mercado Pago
 */
export async function buscarOrder(
  orderId: string
): Promise<{ success: true; data: MercadoPagoOrderResponse } | { success: false; error: string }> {
  try {
    const response = await fetch(
      `${mercadoPagoConfig.baseUrl}/v1/orders/${orderId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${mercadoPagoConfig.accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro ao buscar order:", JSON.stringify(data, null, 2));
      return { success: false, error: data.message || "Order não encontrada" };
    }

    return { success: true, data: data as MercadoPagoOrderResponse };
  } catch (error) {
    console.error("Erro ao buscar order:", error);
    return { success: false, error: "Erro de conexão" };
  }
}

/**
 * Validar assinatura do webhook do Mercado Pago
 * 
 * Conforme documentação:
 * - Template: id:[data.id_v1];request-id:[x-request-id_header];ts:[ts_header];
 * - IMPORTANTE: data.id deve ser convertido para lowercase
 */
export function validarWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
  if (!mercadoPagoConfig.webhookSecret) {
    console.warn("MERCADO_PAGO_WEBHOOK_SECRET não configurado");
    return false;
  }

  try {
    // Extrair ts e hash do header x-signature
    const parts = xSignature.split(",");
    let ts = "";
    let hash = "";

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key.trim() === "ts") {
        ts = value.trim();
      } else if (key.trim() === "v1") {
        hash = value.trim();
      }
    }

    if (!ts || !hash) {
      console.error("x-signature inválido:", xSignature);
      return false;
    }

    // IMPORTANTE: data.id deve ser lowercase conforme documentação
    const dataIdLower = dataId.toLowerCase();

    // Montar template conforme documentação
    const template = `id:${dataIdLower};request-id:${xRequestId};ts:${ts};`;

    // Gerar HMAC SHA256
    const hmac = crypto.createHmac("sha256", mercadoPagoConfig.webhookSecret);
    hmac.update(template);
    const calculatedHash = hmac.digest("hex");

    // Comparar hashes
    return calculatedHash === hash;
  } catch (error) {
    console.error("Erro ao validar assinatura:", error);
    return false;
  }
}

/**
 * Mapear status do Mercado Pago para status interno
 */
export function mapearStatusPagamento(
  mpStatus: string,
  mpStatusDetail: string
): { pagamentoStatus: string; pedidoStatus: string } {
  // Mapeamento baseado na documentação de status da order
  switch (mpStatus) {
    case "processed":
      if (mpStatusDetail === "accredited") {
        return { pagamentoStatus: "approved", pedidoStatus: "pago" };
      }
      if (mpStatusDetail === "partially_refunded") {
        return { pagamentoStatus: "approved", pedidoStatus: "pago" };
      }
      return { pagamentoStatus: "approved", pedidoStatus: "pago" };

    case "action_required":
      if (mpStatusDetail === "waiting_payment" || mpStatusDetail === "waiting_transfer") {
        return { pagamentoStatus: "pending", pedidoStatus: "pendente" };
      }
      return { pagamentoStatus: "pending", pedidoStatus: "pendente" };

    case "processing":
      return { pagamentoStatus: "in_process", pedidoStatus: "processando" };

    case "cancelled":
      return { pagamentoStatus: "cancelled", pedidoStatus: "cancelado" };

    case "expired":
      return { pagamentoStatus: "cancelled", pedidoStatus: "expirado" };

    case "failed":
      return { pagamentoStatus: "rejected", pedidoStatus: "cancelado" };

    case "refunded":
      return { pagamentoStatus: "refunded", pedidoStatus: "reembolsado" };

    default:
      return { pagamentoStatus: "pending", pedidoStatus: "pendente" };
  }
}
