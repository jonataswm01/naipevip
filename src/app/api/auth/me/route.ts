import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const usuario = await validateSession(token);

    if (!usuario) {
      // Token inválido ou expirado, remover cookie
      const response = NextResponse.json(
        { error: "Sessão inválida ou expirada" },
        { status: 401 }
      );

      response.cookies.set("session_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ usuario }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const usuario = await validateSession(token);

    if (!usuario) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nome, email, telefone } = body;

    // Validações
    if (nome && nome.trim().length < 3) {
      return NextResponse.json(
        { error: "Nome deve ter pelo menos 3 caracteres" },
        { status: 400 }
      );
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "E-mail inválido" },
          { status: 400 }
        );
      }

      // Verificar se email já existe (outro usuário)
      const { data: existingEmail } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", email.toLowerCase())
        .neq("id", usuario.id)
        .single();

      if (existingEmail) {
        return NextResponse.json(
          { error: "Este e-mail já está em uso" },
          { status: 400 }
        );
      }
    }

    if (telefone) {
      const telefoneNumeros = telefone.replace(/\D/g, "");
      if (telefoneNumeros.length < 10 || telefoneNumeros.length > 11) {
        return NextResponse.json(
          { error: "Telefone inválido" },
          { status: 400 }
        );
      }

      // Verificar se telefone já existe (outro usuário)
      const { data: existingPhone } = await supabase
        .from("usuarios")
        .select("id")
        .eq("telefone", telefoneNumeros)
        .neq("id", usuario.id)
        .single();

      if (existingPhone) {
        return NextResponse.json(
          { error: "Este telefone já está em uso" },
          { status: 400 }
        );
      }
    }

    // Montar objeto de atualização
    const updateData: Record<string, string> = {};
    if (nome) updateData.nome = nome.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (telefone) updateData.telefone = telefone.replace(/\D/g, "");

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Nenhum dado para atualizar" },
        { status: 400 }
      );
    }

    // Atualizar usuário
    const { data: usuarioAtualizado, error } = await supabase
      .from("usuarios")
      .update(updateData)
      .eq("id", usuario.id)
      .select("id, nome, email, telefone, email_verificado, telefone_verificado, ativo, created_at, updated_at")
      .single();

    if (error || !usuarioAtualizado) {
      console.error("Erro ao atualizar usuário:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar dados" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Dados atualizados com sucesso",
      usuario: usuarioAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
