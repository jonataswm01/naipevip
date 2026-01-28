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

    // Buscar pedidos do usuário com evento e pagamento
    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select(`
        *,
        evento:eventos(nome, slug, data_evento),
        pagamento:pagamentos(status, metodo, pago_em)
      `)
      .eq("usuario_id", usuario.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar pedidos:", error);
      return NextResponse.json(
        { error: "Erro ao buscar pedidos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ pedidos: pedidos ?? [] });
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
