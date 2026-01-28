import bcrypt from "bcryptjs";
import { supabase } from "./supabase";
import type { Usuario, UsuarioPublico, SessaoInsert } from "@/types/database";

// Configurações
const SALT_ROUNDS = 12;
const SESSION_DURATION_DAYS = 7;

// =============================================
// FUNÇÕES DE SENHA
// =============================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// =============================================
// FUNÇÕES DE TOKEN
// =============================================

export function generateToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function getSessionExpiration(): Date {
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + SESSION_DURATION_DAYS);
  return expiration;
}

// =============================================
// FUNÇÕES DE USUÁRIO
// =============================================

export async function createUser(data: {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
}): Promise<{ usuario: UsuarioPublico } | { error: string }> {
  // Verificar se email já existe
  const { data: existingEmail } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", data.email.toLowerCase())
    .single();

  if (existingEmail) {
    return { error: "Este e-mail já está cadastrado" };
  }

  // Verificar se telefone já existe
  const telefoneNumeros = data.telefone.replace(/\D/g, "");
  const { data: existingPhone } = await supabase
    .from("usuarios")
    .select("id")
    .eq("telefone", telefoneNumeros)
    .single();

  if (existingPhone) {
    return { error: "Este telefone já está cadastrado" };
  }

  // Hash da senha
  const senhaHash = await hashPassword(data.senha);

  // Criar usuário
  const { data: usuario, error } = await supabase
    .from("usuarios")
    .insert({
      nome: data.nome.trim(),
      email: data.email.toLowerCase().trim(),
      telefone: telefoneNumeros,
      senha_hash: senhaHash,
    })
    .select()
    .single();

  if (error || !usuario) {
    console.error("Erro ao criar usuário:", error);
    return { error: "Erro ao criar conta. Tente novamente." };
  }

  // Retornar usuário sem a senha
  const usuarioPublico = removePasswordFromUser(usuario);
  return { usuario: usuarioPublico };
}

export async function authenticateUser(data: {
  identificador: string; // email ou telefone
  senha: string;
}): Promise<
  { usuario: UsuarioPublico; token: string } | { error: string }
> {
  // Detectar se é email ou telefone
  const isEmail = data.identificador.includes("@");
  const identificadorLimpo = isEmail
    ? data.identificador.toLowerCase().trim()
    : data.identificador.replace(/\D/g, "");

  // Buscar usuário
  const { data: usuario, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq(isEmail ? "email" : "telefone", identificadorLimpo)
    .single();

  if (error || !usuario) {
    return { error: "E-mail/telefone ou senha incorretos" };
  }

  // Verificar se conta está ativa
  if (!usuario.ativo) {
    return { error: "Conta desativada. Entre em contato com o suporte." };
  }

  // Verificar senha
  const senhaValida = await verifyPassword(data.senha, usuario.senha_hash);
  if (!senhaValida) {
    return { error: "E-mail/telefone ou senha incorretos" };
  }

  // Criar sessão
  const token = generateToken();
  const expiresAt = getSessionExpiration();

  const { error: sessaoError } = await supabase.from("sessoes").insert({
    usuario_id: usuario.id,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (sessaoError) {
    console.error("Erro ao criar sessão:", sessaoError);
    return { error: "Erro ao fazer login. Tente novamente." };
  }

  const usuarioPublico = removePasswordFromUser(usuario);
  return { usuario: usuarioPublico, token };
}

export async function validateSession(
  token: string
): Promise<UsuarioPublico | null> {
  // Buscar sessão válida
  const { data: sessao } = await supabase
    .from("sessoes")
    .select("usuario_id, expires_at")
    .eq("token", token)
    .single();

  if (!sessao) {
    return null;
  }

  // Verificar expiração
  if (new Date(sessao.expires_at) < new Date()) {
    // Sessão expirada, deletar
    await supabase.from("sessoes").delete().eq("token", token);
    return null;
  }

  // Buscar usuário
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", sessao.usuario_id)
    .eq("ativo", true)
    .single();

  if (!usuario) {
    return null;
  }

  return removePasswordFromUser(usuario);
}

export async function logout(token: string): Promise<boolean> {
  const { error } = await supabase.from("sessoes").delete().eq("token", token);
  return !error;
}

export async function getUserById(id: string): Promise<UsuarioPublico | null> {
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", id)
    .eq("ativo", true)
    .single();

  if (!usuario) {
    return null;
  }

  return removePasswordFromUser(usuario);
}

// =============================================
// HELPERS
// =============================================

function removePasswordFromUser(usuario: Usuario): UsuarioPublico {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { senha_hash, ...usuarioPublico } = usuario;
  return usuarioPublico;
}

// Limpar sessões expiradas (pode ser chamado periodicamente)
export async function cleanExpiredSessions(): Promise<void> {
  await supabase
    .from("sessoes")
    .delete()
    .lt("expires_at", new Date().toISOString());
}
