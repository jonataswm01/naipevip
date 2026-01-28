import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { validateSession } from "@/lib/auth";
import QRCode from "qrcode";

// =============================================
// TYPES
// =============================================

interface CompraRequest {
  loteId: string;
  quantidade: number;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

// Gerar código PIX simulado (em produção, usar Mercado Pago)
function gerarPixSimulado(pedidoId: string, valor: number): string {
  const timestamp = Date.now();
  // Simula um código PIX EMV
  return `00020126580014BR.GOV.BCB.PIX0136${pedidoId}520400005303986540${valor.toFixed(2)}5802BR5913NAIPE VIP6008SAOPAULO62070503***6304${timestamp.toString(16).slice(-4).toUpperCase()}`;
}

// Gerar QR Code base64
async function gerarQRCodeBase64(texto: string): Promise<string> {
  try {
    const qrCode = await QRCode.toDataURL(texto, {
      width: 300,
      margin: 2,
      color: {
        dark: "#1a1a1a",
        light: "#ffffff",
      },
    });
    return qrCode;
  } catch {
    throw new Error("Erro ao gerar QR Code");
  }
}

// =============================================
// POST - Criar Pedido
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
    const { loteId, quantidade } = body;

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

    // Calcular valores
    const valorTotal = lote.preco * quantidade;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Criar pedido
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
      preco_unitario: lote.preco,
      subtotal: valorTotal,
    });

    if (itemError) {
      console.error("Erro ao criar item do pedido:", itemError);
      // Reverter pedido
      await supabase.from("pedidos").delete().eq("id", pedido.id);
      return NextResponse.json(
        { error: "Erro ao processar pedido" },
        { status: 500 }
      );
    }

    // Gerar PIX (simulado por enquanto)
    // TODO: Integrar com Mercado Pago
    const pixCode = gerarPixSimulado(pedido.id, valorTotal);
    const pixQRCodeBase64 = await gerarQRCodeBase64(pixCode);

    // Criar registro de pagamento
    const { error: pagamentoError } = await supabase.from("pagamentos").insert({
      pedido_id: pedido.id,
      metodo: "pix",
      status: "pending",
      valor: valorTotal,
      pix_qr_code: pixCode,
      pix_qr_code_base64: pixQRCodeBase64,
      pix_expiration: expiresAt.toISOString(),
    });

    if (pagamentoError) {
      console.error("Erro ao criar pagamento:", pagamentoError);
      // Não reverter, o pedido ainda é válido
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
        qr_code: pixCode,
        qr_code_base64: pixQRCodeBase64,
        copia_cola: pixCode,
        expiration: expiresAt.toISOString(),
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
