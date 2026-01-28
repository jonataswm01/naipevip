import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const usuario = await validateSession(token);
    if (!usuario) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    // Verificar se usuário tem ingresso ativo
    const { data: ingresso } = await supabase
      .from("ingressos")
      .select("evento_id")
      .eq("usuario_id", usuario.id)
      .eq("status", "ativo")
      .limit(1)
      .single();

    if (!ingresso) {
      return NextResponse.json(
        { error: "Você não possui ingresso ativo" },
        { status: 403 }
      );
    }

    // Buscar dados do evento
    const { data: evento, error } = await supabase
      .from("eventos")
      .select("local_nome, local_endereco, local_bairro, local_cidade")
      .eq("id", ingresso.evento_id)
      .single();

    if (error || !evento) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }

    // Montar URL do Google Maps
    const enderecoCompleto = `${evento.local_endereco}, ${evento.local_bairro}, ${evento.local_cidade}`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto)}`;

    return NextResponse.json({
      nome: evento.local_nome,
      endereco: evento.local_endereco,
      bairro: evento.local_bairro,
      cidade: evento.local_cidade,
      mapsUrl,
    });
  } catch (error) {
    console.error("Erro ao buscar local:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
