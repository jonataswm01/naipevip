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

    // Buscar ingressos do usuário com evento e lote
    const { data: ingressos, error } = await supabase
      .from("ingressos")
      .select(`
        *,
        evento:eventos(nome, slug, data_evento, horario_inicio, local_bairro),
        lote:lotes(nome, preco)
      `)
      .eq("usuario_id", usuario.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar ingressos:", error);
      return NextResponse.json(
        { error: "Erro ao buscar ingressos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ingressos: ingressos ?? [] });
  } catch (error) {
    console.error("Erro ao buscar ingressos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
