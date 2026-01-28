import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação dos campos
    const { identificador, senha } = body;

    if (!identificador || !senha) {
      return NextResponse.json(
        { error: "E-mail/telefone e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Autenticar usuário
    const result = await authenticateUser({ identificador, senha });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Criar resposta com cookie de sessão
    const response = NextResponse.json(
      {
        message: "Login realizado com sucesso",
        usuario: result.usuario,
      },
      { status: 200 }
    );

    // Definir cookie httpOnly com o token
    response.cookies.set("session_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
