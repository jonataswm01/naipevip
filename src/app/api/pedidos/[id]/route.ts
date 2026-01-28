import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { validateSession } from "@/lib/auth";

// =============================================
// GET - Buscar Pedido por ID
// =============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const session = await validateSession(token);
    if (!session) {
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
    }

    // Buscar pedido com itens, pagamento e evento
    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select(
        `
        *,
        eventos(id, nome, data_evento, horario_inicio, local_nome, local_endereco, local_bairro, local_cidade),
        pedido_itens(*, lotes(id, nome, preco)),
        pagamentos(*)
      `
      )
      .eq("id", id)
      .eq("usuario_id", session.id)
      .single();

    if (error || !pedido) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se expirou
    const expirado =
      pedido.status === "pendente" &&
      pedido.expires_at &&
      new Date(pedido.expires_at) < new Date();

    // Atualizar status se expirado
    if (expirado && pedido.status === "pendente") {
      await supabase
        .from("pedidos")
        .update({ status: "expirado" })
        .eq("id", pedido.id);

      pedido.status = "expirado";
    }

    // Formatar resposta
    // Obs: como `pagamentos.pedido_id` é UNIQUE, o Supabase pode retornar a relação como
    // objeto (1:1) em vez de array (1:n). Então suportamos ambos os formatos.
    const pagamentosRel = (pedido as any).pagamentos;
    const pagamento = Array.isArray(pagamentosRel)
      ? pagamentosRel[0] || null
      : pagamentosRel || null;
    const itens = pedido.pedido_itens || [];

    // Debug: Log do pagamento
    console.log("=== DEBUG PEDIDO ===");
    console.log("Pagamento encontrado:", !!pagamento);
    if (pagamento) {
      console.log(
        "pix_qr_code:",
        pagamento.pix_qr_code ? `${pagamento.pix_qr_code.substring(0, 50)}...` : "NULL/VAZIO"
      );
      console.log(
        "pix_qr_code_base64:",
        pagamento.pix_qr_code_base64
          ? `${pagamento.pix_qr_code_base64.substring(0, 50)}...`
          : "NULL/VAZIO"
      );
    }

    return NextResponse.json({
      pedido: {
        id: pedido.id,
        numero: pedido.numero,
        status: pedido.status,
        quantidade_total: pedido.quantidade_total,
        valor_total: pedido.valor_total,
        expires_at: pedido.expires_at,
        created_at: pedido.created_at,
        expirado,
      },
      evento: pedido.eventos,
      itens: itens.map((item: Record<string, unknown>) => ({
        id: item.id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
        lote: item.lotes,
      })),
      pagamento: pagamento
        ? {
            id: pagamento.id,
            status: pagamento.status,
            metodo: pagamento.metodo,
            valor: pagamento.valor,
            pix_qr_code: pagamento.pix_qr_code,
            pix_qr_code_base64: pagamento.pix_qr_code_base64,
            pix_expiration: pagamento.pix_expiration,
            pago_em: pagamento.pago_em,
          }
        : null,
    });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
