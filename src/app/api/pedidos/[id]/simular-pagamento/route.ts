import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { validateSession } from "@/lib/auth";
import QRCode from "qrcode";

// =============================================
// POST - Simular Pagamento (APENAS PARA TESTES)
// =============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se está em ambiente de desenvolvimento
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Endpoint não disponível em produção" },
        { status: 403 }
      );
    }

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

    // Buscar pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select("*, pedido_itens(*)")
      .eq("id", id)
      .eq("usuario_id", session.usuario.id)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    if (pedido.status !== "pendente") {
      return NextResponse.json(
        { error: "Pedido não está pendente" },
        { status: 400 }
      );
    }

    // Atualizar pedido para pago
    const { error: updatePedidoError } = await supabase
      .from("pedidos")
      .update({
        status: "pago",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updatePedidoError) {
      console.error("Erro ao atualizar pedido:", updatePedidoError);
      return NextResponse.json(
        { error: "Erro ao processar pagamento" },
        { status: 500 }
      );
    }

    // Atualizar pagamento
    await supabase
      .from("pagamentos")
      .update({
        status: "approved",
        pago_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("pedido_id", id);

    // Criar ingressos
    const itens = pedido.pedido_itens || [];
    
    for (const item of itens) {
      for (let i = 0; i < item.quantidade; i++) {
        // Gerar QR Code único para o ingresso
        const ingressoData = {
          pedido_id: pedido.id,
          pedido_item_id: item.id,
          usuario_id: session.usuario.id,
          evento_id: pedido.evento_id,
          lote_id: item.lote_id,
          nome_titular: session.usuario.nome,
          status: "ativo" as const,
        };

        // Inserir ingresso (o trigger gera o código automaticamente)
        const { data: ingresso, error: ingressoError } = await supabase
          .from("ingressos")
          .insert(ingressoData)
          .select()
          .single();

        if (ingressoError) {
          console.error("Erro ao criar ingresso:", ingressoError);
          continue;
        }

        // Gerar QR Code
        if (ingresso) {
          const qrCodeData = JSON.stringify({
            codigo: ingresso.codigo,
            evento: pedido.evento_id,
            validacao: Date.now(),
          });

          try {
            const qrCode = await QRCode.toDataURL(qrCodeData, {
              width: 300,
              margin: 2,
            });

            await supabase
              .from("ingressos")
              .update({ qr_code: qrCode })
              .eq("id", ingresso.id);
          } catch (qrError) {
            console.error("Erro ao gerar QR Code:", qrError);
          }
        }
      }

      // Atualizar quantidade vendida do lote
      await supabase.rpc("update_lote_quantidade_vendida", {
        p_lote_id: item.lote_id,
      }).catch(() => {
        // Se a função RPC não existir, fazer update manual
        supabase
          .from("lotes")
          .update({
            quantidade_vendida: supabase.rpc("increment_quantidade", {
              row_id: item.lote_id,
              amount: item.quantidade,
            }),
          })
          .eq("id", item.lote_id);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Pagamento simulado com sucesso",
      pedido: {
        id: pedido.id,
        numero: pedido.numero,
        status: "pago",
      },
    });
  } catch (error) {
    console.error("Erro ao simular pagamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
