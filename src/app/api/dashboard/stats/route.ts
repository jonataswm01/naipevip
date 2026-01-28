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

    // Contar pedidos do usuário
    const { count: totalPedidos } = await supabase
      .from("pedidos")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", usuario.id);

    // Contar ingressos ativos do usuário
    const { count: totalIngressos } = await supabase
      .from("ingressos")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", usuario.id)
      .eq("status", "ativo");

    // Verificar se tem pelo menos um ingresso ativo
    const temIngressoAtivo = (totalIngressos ?? 0) > 0;

    return NextResponse.json({
      totalPedidos: totalPedidos ?? 0,
      totalIngressos: totalIngressos ?? 0,
      temIngressoAtivo,
    });
  } catch (error) {
    console.error("Erro ao buscar stats:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
