import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  try {
    // Verificar configuração do Supabase
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase não configurado" },
        { status: 500 }
      );
    }

    // Buscar evento ativo com vendas abertas
    const { data: evento, error: eventoError } = await supabase
      .from("eventos")
      .select("*")
      .eq("ativo", true)
      .eq("vendas_abertas", true)
      .single();

    if (eventoError || !evento) {
      return NextResponse.json(
        { error: "Nenhum evento disponível no momento" },
        { status: 404 }
      );
    }

    // Buscar lotes do evento
    const { data: lotes, error: lotesError } = await supabase
      .from("lotes")
      .select("*")
      .eq("evento_id", evento.id)
      .eq("ativo", true)
      .order("ordem", { ascending: true });

    if (lotesError) {
      console.error("Erro ao buscar lotes:", lotesError);
      return NextResponse.json(
        { error: "Erro ao buscar lotes" },
        { status: 500 }
      );
    }

    // Calcular disponibilidade de cada lote
    const lotesComDisponibilidade = (lotes || []).map((lote) => {
      const quantidadeDisponivel =
        lote.quantidade_total - lote.quantidade_vendida;
      const esgotado = quantidadeDisponivel <= 0;
      const dentroPeriodo = verificarPeriodoVendas(
        lote.data_inicio_vendas,
        lote.data_fim_vendas
      );

      return {
        id: lote.id,
        nome: lote.nome,
        descricao: lote.descricao,
        preco: lote.preco,
        quantidade_disponivel: Math.max(0, quantidadeDisponivel),
        limite_por_usuario: lote.limite_por_usuario,
        ordem: lote.ordem,
        disponivel: !esgotado && dentroPeriodo,
        esgotado,
      };
    });

    // Formatar data do evento
    const dataEvento = new Date(evento.data_evento);
    const dataFormatada = dataEvento.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    return NextResponse.json({
      evento: {
        id: evento.id,
        nome: evento.nome,
        slug: evento.slug,
        descricao: evento.descricao,
        data_evento: evento.data_evento,
        data_formatada: capitalize(dataFormatada),
        horario_inicio: evento.horario_inicio,
        horario_fim: evento.horario_fim,
        local_nome: evento.local_nome,
        local_endereco: evento.local_endereco,
        local_bairro: evento.local_bairro,
        local_cidade: evento.local_cidade,
        classificacao: evento.classificacao,
        imagem_url: evento.imagem_url,
      },
      lotes: lotesComDisponibilidade,
    });
  } catch (error) {
    console.error("Erro na API de lotes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Helper: Verificar se está dentro do período de vendas
function verificarPeriodoVendas(
  dataInicio: string | null,
  dataFim: string | null
): boolean {
  const agora = new Date();

  if (dataInicio) {
    const inicio = new Date(dataInicio);
    if (agora < inicio) return false;
  }

  if (dataFim) {
    const fim = new Date(dataFim);
    if (agora > fim) return false;
  }

  return true;
}

// Helper: Capitalizar primeira letra
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
