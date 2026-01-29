// =============================================
// TIPOS DO BANCO DE DADOS - SUPABASE
// Gerado manualmente baseado no schema SQL
// =============================================

export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          nome: string;
          email: string;
          telefone: string;
          senha_hash: string;
          email_verificado: boolean;
          telefone_verificado: boolean;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email: string;
          telefone: string;
          senha_hash: string;
          email_verificado?: boolean;
          telefone_verificado?: boolean;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          telefone?: string;
          senha_hash?: string;
          email_verificado?: boolean;
          telefone_verificado?: boolean;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessoes: {
        Row: {
          id: string;
          usuario_id: string;
          token: string;
          ip_address: string | null;
          user_agent: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          token: string;
          ip_address?: string | null;
          user_agent?: string | null;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          token?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          expires_at?: string;
          created_at?: string;
        };
      };
      eventos: {
        Row: {
          id: string;
          nome: string;
          slug: string;
          descricao: string | null;
          data_evento: string;
          horario_inicio: string | null;
          horario_fim: string | null;
          local_nome: string | null;
          local_endereco: string | null;
          local_bairro: string | null;
          local_cidade: string | null;
          classificacao: string;
          imagem_url: string | null;
          ativo: boolean;
          vendas_abertas: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          slug: string;
          descricao?: string | null;
          data_evento: string;
          horario_inicio?: string | null;
          horario_fim?: string | null;
          local_nome?: string | null;
          local_endereco?: string | null;
          local_bairro?: string | null;
          local_cidade?: string | null;
          classificacao?: string;
          imagem_url?: string | null;
          ativo?: boolean;
          vendas_abertas?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          slug?: string;
          descricao?: string | null;
          data_evento?: string;
          horario_inicio?: string | null;
          horario_fim?: string | null;
          local_nome?: string | null;
          local_endereco?: string | null;
          local_bairro?: string | null;
          local_cidade?: string | null;
          classificacao?: string;
          imagem_url?: string | null;
          ativo?: boolean;
          vendas_abertas?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      lotes: {
        Row: {
          id: string;
          evento_id: string;
          nome: string;
          descricao: string | null;
          preco: number;
          quantidade_total: number;
          quantidade_vendida: number;
          limite_por_usuario: number;
          ordem: number;
          ativo: boolean;
          data_inicio_vendas: string | null;
          data_fim_vendas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          evento_id: string;
          nome: string;
          descricao?: string | null;
          preco: number;
          quantidade_total: number;
          quantidade_vendida?: number;
          limite_por_usuario?: number;
          ordem?: number;
          ativo?: boolean;
          data_inicio_vendas?: string | null;
          data_fim_vendas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          evento_id?: string;
          nome?: string;
          descricao?: string | null;
          preco?: number;
          quantidade_total?: number;
          quantidade_vendida?: number;
          limite_por_usuario?: number;
          ordem?: number;
          ativo?: boolean;
          data_inicio_vendas?: string | null;
          data_fim_vendas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pedidos: {
        Row: {
          id: string;
          numero: string;
          usuario_id: string;
          evento_id: string;
          status: PedidoStatus;
          quantidade_total: number;
          valor_total: number;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          numero?: string;
          usuario_id: string;
          evento_id: string;
          status?: PedidoStatus;
          quantidade_total: number;
          valor_total: number;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          numero?: string;
          usuario_id?: string;
          evento_id?: string;
          status?: PedidoStatus;
          quantidade_total?: number;
          valor_total?: number;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pedido_itens: {
        Row: {
          id: string;
          pedido_id: string;
          lote_id: string;
          quantidade: number;
          preco_unitario: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          pedido_id: string;
          lote_id: string;
          quantidade: number;
          preco_unitario: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          pedido_id?: string;
          lote_id?: string;
          quantidade?: number;
          preco_unitario?: number;
          subtotal?: number;
          created_at?: string;
        };
      };
      pagamentos: {
        Row: {
          id: string;
          pedido_id: string;
          mp_payment_id: string | null;
          mp_preference_id: string | null;
          asaas_payment_id: string | null;
          metodo: string;
          status: PagamentoStatus;
          valor: number;
          pix_qr_code: string | null;
          pix_qr_code_base64: string | null;
          pix_expiration: string | null;
          pago_em: string | null;
          raw_response: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pedido_id: string;
          mp_payment_id?: string | null;
          mp_preference_id?: string | null;
          asaas_payment_id?: string | null;
          metodo?: string;
          status?: PagamentoStatus;
          valor: number;
          pix_qr_code?: string | null;
          pix_qr_code_base64?: string | null;
          pix_expiration?: string | null;
          pago_em?: string | null;
          raw_response?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pedido_id?: string;
          mp_payment_id?: string | null;
          mp_preference_id?: string | null;
          asaas_payment_id?: string | null;
          metodo?: string;
          status?: PagamentoStatus;
          valor?: number;
          pix_qr_code?: string | null;
          pix_qr_code_base64?: string | null;
          pix_expiration?: string | null;
          pago_em?: string | null;
          raw_response?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ingressos: {
        Row: {
          id: string;
          codigo: string;
          pedido_id: string;
          pedido_item_id: string;
          usuario_id: string;
          evento_id: string;
          lote_id: string;
          nome_titular: string;
          status: IngressoStatus;
          qr_code: string | null;
          utilizado_em: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          codigo?: string;
          pedido_id: string;
          pedido_item_id: string;
          usuario_id: string;
          evento_id: string;
          lote_id: string;
          nome_titular: string;
          status?: IngressoStatus;
          qr_code?: string | null;
          utilizado_em?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          codigo?: string;
          pedido_id?: string;
          pedido_item_id?: string;
          usuario_id?: string;
          evento_id?: string;
          lote_id?: string;
          nome_titular?: string;
          status?: IngressoStatus;
          qr_code?: string | null;
          utilizado_em?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

// =============================================
// ENUMS E TIPOS AUXILIARES
// =============================================

export type PedidoStatus =
  | "pendente"
  | "processando"
  | "pago"
  | "cancelado"
  | "expirado"
  | "reembolsado";

export type PagamentoStatus =
  | "pending"
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";

export type IngressoStatus = "ativo" | "utilizado" | "cancelado" | "transferido";

// =============================================
// TIPOS PARA USO NA APLICAÇÃO
// =============================================

// Tipos de linha (dados retornados do banco)
export type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
export type Sessao = Database["public"]["Tables"]["sessoes"]["Row"];
export type Evento = Database["public"]["Tables"]["eventos"]["Row"];
export type Lote = Database["public"]["Tables"]["lotes"]["Row"];
export type Pedido = Database["public"]["Tables"]["pedidos"]["Row"];
export type PedidoItem = Database["public"]["Tables"]["pedido_itens"]["Row"];
export type Pagamento = Database["public"]["Tables"]["pagamentos"]["Row"];
export type Ingresso = Database["public"]["Tables"]["ingressos"]["Row"];

// Tipos de inserção
export type UsuarioInsert = Database["public"]["Tables"]["usuarios"]["Insert"];
export type SessaoInsert = Database["public"]["Tables"]["sessoes"]["Insert"];
export type EventoInsert = Database["public"]["Tables"]["eventos"]["Insert"];
export type LoteInsert = Database["public"]["Tables"]["lotes"]["Insert"];
export type PedidoInsert = Database["public"]["Tables"]["pedidos"]["Insert"];
export type PedidoItemInsert = Database["public"]["Tables"]["pedido_itens"]["Insert"];
export type PagamentoInsert = Database["public"]["Tables"]["pagamentos"]["Insert"];
export type IngressoInsert = Database["public"]["Tables"]["ingressos"]["Insert"];

// Tipos de atualização
export type UsuarioUpdate = Database["public"]["Tables"]["usuarios"]["Update"];
export type PedidoUpdate = Database["public"]["Tables"]["pedidos"]["Update"];
export type PagamentoUpdate = Database["public"]["Tables"]["pagamentos"]["Update"];
export type IngressoUpdate = Database["public"]["Tables"]["ingressos"]["Update"];

// =============================================
// TIPOS PARA API RESPONSES
// =============================================

// Usuario sem senha (para retornar na API)
export type UsuarioPublico = Omit<Usuario, "senha_hash">;

// Lote com quantidade disponível calculada
export type LoteComDisponibilidade = Lote & {
  quantidade_disponivel: number;
};

// Evento com lotes
export type EventoComLotes = Evento & {
  lotes: LoteComDisponibilidade[];
};

// Pedido com itens e pagamento
export type PedidoCompleto = Pedido & {
  itens: (PedidoItem & { lote: Lote })[];
  pagamento: Pagamento | null;
  evento: Evento;
};
