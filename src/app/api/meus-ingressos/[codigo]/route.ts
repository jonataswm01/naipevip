import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import QRCode from "qrcode";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const usuario = await validateSession(token);
    if (!usuario) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const { codigo } = await params;

    // Buscar ingresso pelo código
    const { data: ingresso, error } = await supabase
      .from("ingressos")
      .select(`
        *,
        evento:eventos(
          nome, 
          slug, 
          data_evento, 
          horario_inicio, 
          local_nome,
          local_endereco,
          local_bairro, 
          local_cidade,
          classificacao
        ),
        lote:lotes(nome, preco)
      `)
      .eq("codigo", codigo)
      .eq("usuario_id", usuario.id)
      .single();

    if (error || !ingresso) {
      return NextResponse.json(
        { error: "Ingresso não encontrado" },
        { status: 404 }
      );
    }

    // Gerar QR Code
    const qrCodeData = JSON.stringify({
      codigo: ingresso.codigo,
      evento: ingresso.evento_id,
      tipo: "ingresso_naipevip",
    });

    const qrCodeBase64 = await QRCode.toDataURL(qrCodeData, {
      width: 300,
      margin: 2,
      color: {
        dark: "#3D261D", // marrom-dark
        light: "#F5F0E8", // off-white
      },
    });

    return NextResponse.json({
      ingresso: {
        ...ingresso,
        qr_code_image: qrCodeBase64,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar ingresso:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
