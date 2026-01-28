// =============================================
// INTEGRAÇÃO ASAAS - PIX
// Documentação: https://docs.asaas.com/reference
// =============================================

// =============================================
// CONFIGURAÇÃO
// =============================================

function getConfig() {
  const apiKey = process.env.ASAAS_API_KEY;
  const environment = process.env.ASAAS_ENVIRONMENT || "production";
  
  const baseUrl = environment === "sandbox" 
    ? "https://api-sandbox.asaas.com/v3"
    : "https://api.asaas.com/v3";

  return { apiKey, baseUrl, environment };
}

// =============================================
// TIPOS
// =============================================

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpfCnpj?: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  netValue: number;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD";
  status: AsaasPaymentStatus;
  dueDate: string;
  description?: string;
  externalReference?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  invoiceNumber?: string;
}

export type AsaasPaymentStatus = 
  | "PENDING"           // Aguardando pagamento
  | "RECEIVED"          // Recebido (saldo ainda não disponível)
  | "CONFIRMED"         // Pagamento confirmado (saldo disponível)
  | "OVERDUE"           // Vencida
  | "REFUNDED"          // Estornada
  | "RECEIVED_IN_CASH"  // Recebido em dinheiro
  | "REFUND_REQUESTED"  // Estorno solicitado
  | "REFUND_IN_PROGRESS"// Estorno em processamento
  | "CHARGEBACK_REQUESTED" // Chargeback solicitado
  | "CHARGEBACK_DISPUTE"   // Em disputa de chargeback
  | "AWAITING_CHARGEBACK_REVERSAL" // Aguardando reversão
  | "DUNNING_REQUESTED" // Negativação solicitada
  | "DUNNING_RECEIVED"  // Negativação recebida
  | "AWAITING_RISK_ANALYSIS"; // Aguardando análise de risco

export interface AsaasPixQrCode {
  encodedImage: string;  // QR Code em Base64
  payload: string;       // Código copia e cola
  expirationDate: string;
}

export interface CriarCobrancaParams {
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  valor: number;
  descricao: string;
  externalReference: string;
  vencimento?: string; // YYYY-MM-DD
}

// =============================================
// FUNÇÕES DE INTEGRAÇÃO
// =============================================

/**
 * Criar ou buscar cliente no Asaas
 */
export async function criarOuBuscarCliente(params: {
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
}): Promise<{ success: true; data: AsaasCustomer } | { success: false; error: string }> {
  const { apiKey, baseUrl } = getConfig();

  if (!apiKey) {
    return { success: false, error: "ASAAS_API_KEY não configurada" };
  }

  try {
    // Primeiro, tentar buscar cliente pelo email
    const searchResponse = await fetch(
      `${baseUrl}/customers?email=${encodeURIComponent(params.email)}`,
      {
        method: "GET",
        headers: {
          "access_token": apiKey,
        },
      }
    );

    const searchData = await searchResponse.json();

    if (searchData.data && searchData.data.length > 0) {
      const clienteExistente = searchData.data[0];
      
      // Se o cliente existe mas não tem CPF, e estamos passando um CPF, atualizar
      if (!clienteExistente.cpfCnpj && params.cpf) {
        console.log("Atualizando CPF do cliente existente:", clienteExistente.id);
        
        const updateResponse = await fetch(`${baseUrl}/customers/${clienteExistente.id}`, {
          method: "PUT",
          headers: {
            "access_token": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cpfCnpj: params.cpf.replace(/\D/g, ""),
          }),
        });

        const updateData = await updateResponse.json();

        if (!updateResponse.ok) {
          console.error("Erro ao atualizar cliente Asaas:", updateData);
          // Mesmo se falhar, retorna o cliente existente para tentar continuar
          return { success: true, data: clienteExistente };
        }

        return { success: true, data: updateData };
      }
      
      // Cliente já existe com CPF
      return { success: true, data: clienteExistente };
    }

    // Cliente não existe, criar novo
    const createResponse = await fetch(`${baseUrl}/customers`, {
      method: "POST",
      headers: {
        "access_token": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: params.nome,
        email: params.email,
        cpfCnpj: params.cpf?.replace(/\D/g, ""),
        phone: params.telefone?.replace(/\D/g, ""),
      }),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      console.error("Erro ao criar cliente Asaas:", createData);
      return { 
        success: false, 
        error: createData.errors?.[0]?.description || "Erro ao criar cliente" 
      };
    }

    return { success: true, data: createData };
  } catch (error) {
    console.error("Erro ao conectar com Asaas:", error);
    return { success: false, error: "Erro de conexão com Asaas" };
  }
}

/**
 * Criar cobrança PIX no Asaas
 */
export async function criarCobrancaPix(
  params: CriarCobrancaParams
): Promise<{ success: true; data: AsaasPayment } | { success: false; error: string }> {
  const { apiKey, baseUrl } = getConfig();

  console.log("=== DEBUG ASAAS ===");
  console.log("API Key existe:", !!apiKey);
  console.log("Base URL:", baseUrl);

  if (!apiKey) {
    return { success: false, error: "ASAAS_API_KEY não configurada" };
  }

  try {
    console.log("CPF recebido:", params.cpf);
    
    // Primeiro, criar ou buscar o cliente
    const clienteResult = await criarOuBuscarCliente({
      nome: params.nome,
      email: params.email,
      cpf: params.cpf,
      telefone: params.telefone,
    });

    if (!clienteResult.success) {
      return { success: false, error: clienteResult.error };
    }

    const cliente = clienteResult.data;
    console.log("Cliente Asaas:", cliente.id, "CPF:", cliente.cpfCnpj);

    // Calcular data de vencimento (hoje + 1 dia se não especificado)
    const vencimento = params.vencimento || new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Criar cobrança
    const paymentData = {
      customer: cliente.id,
      billingType: "PIX",
      value: params.valor,
      dueDate: vencimento,
      description: params.descricao,
      externalReference: params.externalReference,
    };

    console.log("Payment Data:", JSON.stringify(paymentData, null, 2));

    const response = await fetch(`${baseUrl}/payments`, {
      method: "POST",
      headers: {
        "access_token": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Erro ao criar cobrança Asaas:", data);
      return { 
        success: false, 
        error: data.errors?.[0]?.description || "Erro ao criar cobrança" 
      };
    }

    return { success: true, data: data as AsaasPayment };
  } catch (error) {
    console.error("Erro ao conectar com Asaas:", error);
    return { success: false, error: "Erro de conexão com Asaas" };
  }
}

/**
 * Obter QR Code PIX de uma cobrança
 */
export async function obterQrCodePix(
  paymentId: string
): Promise<{ success: true; data: AsaasPixQrCode } | { success: false; error: string }> {
  const { apiKey, baseUrl } = getConfig();

  if (!apiKey) {
    return { success: false, error: "ASAAS_API_KEY não configurada" };
  }

  try {
    const url = `${baseUrl}/payments/${paymentId}/pixQrCode`;
    console.log("Buscando QR Code PIX:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "access_token": apiKey,
      },
    });

    console.log("Response status:", response.status);
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Erro ao obter QR Code Asaas:", data);
      return { 
        success: false, 
        error: data.errors?.[0]?.description || data.message || `Erro HTTP ${response.status}: Erro ao obter QR Code` 
      };
    }

    // Validar se os dados necessários estão presentes
    if (!data.payload || !data.encodedImage) {
      console.error("QR Code retornado sem payload ou encodedImage:", data);
      return {
        success: false,
        error: "QR Code retornado sem dados completos"
      };
    }

    return { success: true, data: data as AsaasPixQrCode };
  } catch (error) {
    console.error("Erro ao conectar com Asaas:", error);
    return { success: false, error: `Erro de conexão com Asaas: ${error instanceof Error ? error.message : "Desconhecido"}` };
  }
}

/**
 * Buscar cobrança por ID
 */
export async function buscarCobranca(
  paymentId: string
): Promise<{ success: true; data: AsaasPayment } | { success: false; error: string }> {
  const { apiKey, baseUrl } = getConfig();

  if (!apiKey) {
    return { success: false, error: "ASAAS_API_KEY não configurada" };
  }

  try {
    const response = await fetch(`${baseUrl}/payments/${paymentId}`, {
      method: "GET",
      headers: {
        "access_token": apiKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro ao buscar cobrança Asaas:", data);
      return { 
        success: false, 
        error: data.errors?.[0]?.description || "Cobrança não encontrada" 
      };
    }

    return { success: true, data: data as AsaasPayment };
  } catch (error) {
    console.error("Erro ao conectar com Asaas:", error);
    return { success: false, error: "Erro de conexão com Asaas" };
  }
}

/**
 * Mapear status do Asaas para status interno
 */
export function mapearStatusAsaas(
  asaasStatus: AsaasPaymentStatus
): { pagamentoStatus: string; pedidoStatus: string } {
  switch (asaasStatus) {
    case "CONFIRMED":
    case "RECEIVED":
    case "RECEIVED_IN_CASH":
      return { pagamentoStatus: "approved", pedidoStatus: "pago" };

    case "PENDING":
      return { pagamentoStatus: "pending", pedidoStatus: "pendente" };

    case "OVERDUE":
      return { pagamentoStatus: "cancelled", pedidoStatus: "expirado" };

    case "REFUNDED":
    case "REFUND_REQUESTED":
    case "REFUND_IN_PROGRESS":
      return { pagamentoStatus: "refunded", pedidoStatus: "reembolsado" };

    case "CHARGEBACK_REQUESTED":
    case "CHARGEBACK_DISPUTE":
    case "AWAITING_CHARGEBACK_REVERSAL":
      return { pagamentoStatus: "charged_back", pedidoStatus: "cancelado" };

    default:
      return { pagamentoStatus: "pending", pedidoStatus: "pendente" };
  }
}
