import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente para uso no servidor (API Routes)
// Usa a Service Role Key para bypass de RLS quando necessário
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Função helper para verificar se o Supabase está configurado
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceKey);
}

// Exporta configuração para uso em outros lugares se necessário
export const supabaseConfig = {
  url: supabaseUrl,
  serviceRoleKey: supabaseServiceKey,
};
