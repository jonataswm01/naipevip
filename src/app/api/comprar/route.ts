import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { validateSession } from "@/lib/auth";
import { criarCobrancaPix, obterQrCodePix } from "@/lib/asaas";

// =============================================
// TYPES
// =============================================

interface CompraRequest {
  loteId: string;
  quantidade: number;
  cpf?: string;
}

// =============================================
// POST - Criar Pedido com PIX do Asaas
// =============================================

export async function POST(request: NextRequest) {
  try {
    // Verificar Supabase
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Serviço indisponível" },
        { status: 503 }
      );
    }

    // Verificar autenticação
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 }
      );
    }

    const session = await validateSession(token);
    if (!session) {
      return NextResponse.json(
        { error: "Sessão expirada. Faça login novamente." },
        { status: 401 }
      );
    }

    // Parse body
    const body: CompraRequest = await request.json();
    const { loteId, quantidade, cpf } = body;

    // Validações básicas
    if (!loteId || typeof loteId !== "string") {
      return NextResponse.json(
        { error: "Lote não especificado" },
        { status: 400 }
      );
    }

    if (!quantidade || quantidade < 1 || quantidade > 10) {
      return NextResponse.json(
        { error: "Quantidade inválida" },
        { status: 400 }
      );
    }

    // Validar CPF (obrigatório para PIX)
    const cpfLimpo = cpf?.replace(/\D/g, "");
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      return NextResponse.json(
        { error: "CPF inválido. Informe um CPF válido com 11 dígitos." },
        { status: 400 }
      );
    }

    // Buscar lote
    const { data: lote, error: loteError } = await supabase
      .from("lotes")
      .select("*, eventos(*)")
      .eq("id", loteId)
      .eq("ativo", true)
      .single();

    if (loteError || !lote) {
      return NextResponse.json(
        { error: "Lote não encontrado" },
        { status: 404 }
      );
    }

    // Verificar disponibilidade
    const disponivel = lote.quantidade_total - lote.quantidade_vendida;
    if (disponivel < quantidade) {
      return NextResponse.json(
        { error: `Apenas ${disponivel} ingressos disponíveis` },
        { status: 400 }
      );
    }

    // Verificar limite por usuário
    if (quantidade > lote.limite_por_usuario) {
      return NextResponse.json(
        { error: `Limite de ${lote.limite_por_usuario} ingressos por pessoa` },
        { status: 400 }
      );
    }

    // Verificar quantos o usuário já comprou deste lote
    const { data: pedidosAnteriores } = await supabase
      .from("pedido_itens")
      .select("quantidade, pedidos!inner(usuario_id, status)")
      .eq("lote_id", loteId)
      .eq("pedidos.usuario_id", session.id)
      .in("pedidos.status", ["pago", "pendente", "processando"]);

    const quantidadeJaComprada = (pedidosAnteriores || []).reduce(
      (acc, item) => acc + item.quantidade,
      0
    );

    if (quantidadeJaComprada + quantidade > lote.limite_por_usuario) {
      const restante = lote.limite_por_usuario - quantidadeJaComprada;
      return NextResponse.json(
        {
          error:
            restante > 0
              ? `Você já possui ${quantidadeJaComprada} ingresso(s). Pode comprar mais ${restante}.`
              : `Você já atingiu o limite de ${lote.limite_por_usuario} ingressos.`,
        },
        { status: 400 }
      );
    }

    // Calcular valores (usando preços de pacote)
    const precosFixos: Record<number, number> = { 1: 20, 2: 35, 4: 60 };
    const valorTotal = precosFixos[quantidade] || lote.preco * quantidade;
    const expiracaoMinutos = 30; // Asaas trabalha com datas, não minutos exatos
    const expiresAt = new Date(Date.now() + expiracaoMinutos * 60 * 1000);

    // Criar pedido no banco (status pendente)
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({
        usuario_id: session.id,
        evento_id: lote.evento_id,
        status: "pendente",
        quantidade_total: quantidade,
        valor_total: valorTotal,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (pedidoError || !pedido) {
      console.error("Erro ao criar pedido:", pedidoError);
      return NextResponse.json(
        { error: "Erro ao criar pedido" },
        { status: 500 }
      );
    }

    // Criar item do pedido
    const { error: itemError } = await supabase.from("pedido_itens").insert({
      pedido_id: pedido.id,
      lote_id: loteId,
      quantidade,
      preco_unitario: valorTotal / quantidade,
      subtotal: valorTotal,
    });

    if (itemError) {
      console.error("Erro ao criar item do pedido:", itemError);
      await supabase.from("pedidos").delete().eq("id", pedido.id);
      return NextResponse.json(
        { error: "Erro ao processar pedido" },
        { status: 500 }
      );
    }

    // =============================================
    // INTEGRAÇÃO COM ASAAS - PIX
    // =============================================

    const eventoNome = lote.eventos?.nome || "Naipe VIP";
    const descricao = `${quantidade}x Ingresso - ${eventoNome}`;

    // 1. Criar cobrança no Asaas
    const cobrancaResult = await criarCobrancaPix({
      nome: session.nome,
      email: session.email,
      cpf: cpfLimpo, // CPF já validado e limpo
      valor: valorTotal,
      descricao: descricao,
      externalReference: pedido.id,
    });

    if (!cobrancaResult.success) {
      console.error("Erro ao criar cobrança Asaas:", cobrancaResult.error);
      await supabase.from("pedidos").delete().eq("id", pedido.id);
      return NextResponse.json(
        { error: `Erro ao gerar PIX: ${cobrancaResult.error}` },
        { status: 500 }
      );
    }

    const cobranca = cobrancaResult.data;
    console.log("Cobrança Asaas criada:", cobranca.id);

    // 2. Obter QR Code PIX
    const qrCodeResult = await obterQrCodePix(cobranca.id);

    if (!qrCodeResult.success) {
      console.error("Erro ao obter QR Code Asaas:", qrCodeResult.error);
      // Não reverter, a cobrança foi criada
    }

    const pixData = qrCodeResult.success ? qrCodeResult.data : null;

    // Criar registro de pagamento com dados do Asaas
    const { error: pagamentoError } = await supabase.from("pagamentos").insert({
      pedido_id: pedido.id,
      mp_payment_id: cobranca.id, // Usando campo existente para ID do Asaas
      metodo: "pix",
      status: "pending",
      valor: valorTotal,
      pix_qr_code: pixData?.payload || "",
      pix_qr_code_base64: pixData?.encodedImage 
        ? `data:image/png;base64,${pixData.encodedImage}`
        : "",
      pix_expiration: expiresAt.toISOString(),
      raw_response: cobranca,
    });

    if (pagamentoError) {
      console.error("Erro ao criar pagamento:", pagamentoError);
    }

    // Retornar dados do pedido
    return NextResponse.json({
      pedido: {
        id: pedido.id,
        numero: pedido.numero,
        quantidade: quantidade,
        valor_total: valorTotal,
        expires_at: expiresAt.toISOString(),
        lote: {
          nome: lote.nome,
          preco: lote.preco,
        },
        evento: {
          nome: lote.eventos?.nome || "Evento",
          data: lote.eventos?.data_evento,
        },
      },
      pix: {
        qr_code: pixData?.payload || "",
        qr_code_base64: pixData?.encodedImage 
          ? `data:image/png;base64,${pixData.encodedImage}`
          : "",
        copia_cola: pixData?.payload || "",
        expiration: expiresAt.toISOString(),
      },
      asaas: {
        paymentId: cobranca.id,
        status: cobranca.status,
        invoiceUrl: cobranca.invoiceUrl,
      },
    });
  } catch (error) {
    console.error("Erro na API de comprar:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
