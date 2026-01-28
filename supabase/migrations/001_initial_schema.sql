-- =============================================
-- NAIPE VIP - SCHEMA INICIAL DO BANCO DE DADOS
-- Execute este arquivo no SQL Editor do Supabase
-- =============================================

-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: usuarios
-- Dados dos clientes/compradores
-- =============================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefone VARCHAR(20) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  email_verificado BOOLEAN DEFAULT FALSE,
  telefone_verificado BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_telefone ON usuarios(telefone);

-- =============================================
-- TABELA: sessoes
-- Sessões de autenticação
-- =============================================
CREATE TABLE sessoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para sessoes
CREATE INDEX idx_sessoes_usuario_id ON sessoes(usuario_id);
CREATE INDEX idx_sessoes_token ON sessoes(token);
CREATE INDEX idx_sessoes_expires_at ON sessoes(expires_at);

-- =============================================
-- TABELA: eventos
-- Eventos disponíveis
-- =============================================
CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  data_evento DATE NOT NULL,
  horario_inicio TIME,
  horario_fim TIME,
  local_nome VARCHAR(255),
  local_endereco TEXT, -- Revelado apenas após compra
  local_bairro VARCHAR(100),
  local_cidade VARCHAR(100),
  classificacao VARCHAR(10) DEFAULT '18+',
  imagem_url TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  vendas_abertas BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para eventos
CREATE INDEX idx_eventos_slug ON eventos(slug);
CREATE INDEX idx_eventos_data ON eventos(data_evento);
CREATE INDEX idx_eventos_ativo ON eventos(ativo);

-- =============================================
-- TABELA: lotes
-- Lotes de ingressos por evento
-- =============================================
CREATE TABLE lotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(255),
  preco DECIMAL(10,2) NOT NULL,
  quantidade_total INTEGER NOT NULL,
  quantidade_vendida INTEGER DEFAULT 0,
  limite_por_usuario INTEGER DEFAULT 4,
  ordem INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT TRUE,
  data_inicio_vendas TIMESTAMPTZ,
  data_fim_vendas TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para lotes
CREATE INDEX idx_lotes_evento_id ON lotes(evento_id);
CREATE INDEX idx_lotes_ativo ON lotes(ativo);
CREATE INDEX idx_lotes_ordem ON lotes(ordem);

-- =============================================
-- TABELA: pedidos
-- Pedidos de compra
-- =============================================
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero VARCHAR(20) NOT NULL UNIQUE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'pendente',
  quantidade_total INTEGER NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_pedido_status CHECK (status IN (
    'pendente', 'processando', 'pago', 'cancelado', 'expirado', 'reembolsado'
  ))
);

-- Índices para pedidos
CREATE INDEX idx_pedidos_numero ON pedidos(numero);
CREATE INDEX idx_pedidos_usuario_id ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_evento_id ON pedidos(evento_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_created_at ON pedidos(created_at);

-- =============================================
-- TABELA: pedido_itens
-- Itens de cada pedido
-- =============================================
CREATE TABLE pedido_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  lote_id UUID NOT NULL REFERENCES lotes(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para pedido_itens
CREATE INDEX idx_pedido_itens_pedido_id ON pedido_itens(pedido_id);
CREATE INDEX idx_pedido_itens_lote_id ON pedido_itens(lote_id);

-- =============================================
-- TABELA: pagamentos
-- Dados de pagamento (Mercado Pago)
-- =============================================
CREATE TABLE pagamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL UNIQUE REFERENCES pedidos(id) ON DELETE CASCADE,
  mp_payment_id VARCHAR(100) UNIQUE,
  mp_preference_id VARCHAR(100),
  metodo VARCHAR(20) DEFAULT 'pix',
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  valor DECIMAL(10,2) NOT NULL,
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  pix_expiration TIMESTAMPTZ,
  pago_em TIMESTAMPTZ,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_pagamento_status CHECK (status IN (
    'pending', 'approved', 'authorized', 'in_process', 
    'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back'
  ))
);

-- Índices para pagamentos
CREATE INDEX idx_pagamentos_pedido_id ON pagamentos(pedido_id);
CREATE INDEX idx_pagamentos_mp_payment_id ON pagamentos(mp_payment_id);
CREATE INDEX idx_pagamentos_status ON pagamentos(status);

-- =============================================
-- TABELA: ingressos
-- Ingressos emitidos (após pagamento confirmado)
-- =============================================
CREATE TABLE ingressos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT,
  pedido_item_id UUID NOT NULL REFERENCES pedido_itens(id) ON DELETE RESTRICT,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE RESTRICT,
  lote_id UUID NOT NULL REFERENCES lotes(id) ON DELETE RESTRICT,
  nome_titular VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'ativo',
  qr_code TEXT,
  utilizado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_ingresso_status CHECK (status IN (
    'ativo', 'utilizado', 'cancelado', 'transferido'
  ))
);

-- Índices para ingressos
CREATE INDEX idx_ingressos_codigo ON ingressos(codigo);
CREATE INDEX idx_ingressos_pedido_id ON ingressos(pedido_id);
CREATE INDEX idx_ingressos_usuario_id ON ingressos(usuario_id);
CREATE INDEX idx_ingressos_evento_id ON ingressos(evento_id);
CREATE INDEX idx_ingressos_status ON ingressos(status);

-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de updated_at para cada tabela
CREATE TRIGGER trigger_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_eventos_updated_at
  BEFORE UPDATE ON eventos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_lotes_updated_at
  BEFORE UPDATE ON lotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pagamentos_updated_at
  BEFORE UPDATE ON pagamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNÇÃO: Gerar número do pedido
-- Formato: NV-YYYYMMDD-XXX
-- =============================================
CREATE OR REPLACE FUNCTION generate_pedido_numero()
RETURNS TRIGGER AS $$
DECLARE
  today_str VARCHAR(8);
  seq_num INTEGER;
  new_numero VARCHAR(20);
BEGIN
  today_str := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Conta quantos pedidos já existem hoje
  SELECT COUNT(*) + 1 INTO seq_num
  FROM pedidos
  WHERE numero LIKE 'NV-' || today_str || '-%';
  
  -- Gera o número com 3 dígitos sequenciais
  new_numero := 'NV-' || today_str || '-' || LPAD(seq_num::TEXT, 3, '0');
  
  NEW.numero := new_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_pedido_numero
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION generate_pedido_numero();

-- =============================================
-- FUNÇÃO: Gerar código do ingresso
-- Formato: 8 caracteres alfanuméricos
-- =============================================
CREATE OR REPLACE FUNCTION generate_ingresso_codigo()
RETURNS TRIGGER AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  new_codigo VARCHAR(8) := '';
  i INTEGER;
BEGIN
  -- Gera código aleatório de 8 caracteres
  FOR i IN 1..8 LOOP
    new_codigo := new_codigo || SUBSTR(chars, FLOOR(RANDOM() * 36 + 1)::INTEGER, 1);
  END LOOP;
  
  -- Verifica se já existe (muito improvável, mas por segurança)
  WHILE EXISTS (SELECT 1 FROM ingressos WHERE codigo = new_codigo) LOOP
    new_codigo := '';
    FOR i IN 1..8 LOOP
      new_codigo := new_codigo || SUBSTR(chars, FLOOR(RANDOM() * 36 + 1)::INTEGER, 1);
    END LOOP;
  END LOOP;
  
  NEW.codigo := new_codigo;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ingresso_codigo
  BEFORE INSERT ON ingressos
  FOR EACH ROW
  WHEN (NEW.codigo IS NULL OR NEW.codigo = '')
  EXECUTE FUNCTION generate_ingresso_codigo();

-- =============================================
-- FUNÇÃO: Atualizar quantidade vendida do lote
-- Chamada após pagamento confirmado
-- =============================================
CREATE OR REPLACE FUNCTION update_lote_quantidade_vendida()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando pagamento é aprovado, incrementa quantidade vendida
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE lotes l
    SET quantidade_vendida = quantidade_vendida + pi.quantidade
    FROM pedido_itens pi
    WHERE pi.pedido_id = NEW.pedido_id
      AND l.id = pi.lote_id;
  END IF;
  
  -- Se pagamento for cancelado/reembolsado após aprovado, decrementa
  IF OLD.status = 'approved' AND NEW.status IN ('cancelled', 'refunded', 'charged_back') THEN
    UPDATE lotes l
    SET quantidade_vendida = quantidade_vendida - pi.quantidade
    FROM pedido_itens pi
    WHERE pi.pedido_id = NEW.pedido_id
      AND l.id = pi.lote_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lote_quantidade
  AFTER UPDATE ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_lote_quantidade_vendida();

-- =============================================
-- SEED: Evento inicial (Naipe VIP)
-- Ajuste a data conforme necessário
-- =============================================
INSERT INTO eventos (
  nome,
  slug,
  descricao,
  data_evento,
  horario_inicio,
  local_nome,
  local_bairro,
  local_cidade,
  local_endereco,
  classificacao
) VALUES (
  'Naipe VIP',
  'naipe-vip',
  'Uma festa pra curtir o pôr do sol e atravessar a noite no clima do carnaval.',
  '2026-02-06', -- Ajuste a data do evento
  '16:00',
  'Local Secreto',
  'Região Central',
  'São Paulo',
  'Endereço completo revelado após a compra', -- Endereço real aqui
  '18+'
);

-- =============================================
-- SEED: Lotes iniciais
-- Ajuste preços e quantidades conforme necessário
-- =============================================
INSERT INTO lotes (evento_id, nome, descricao, preco, quantidade_total, limite_por_usuario, ordem) 
SELECT 
  id,
  '1º Lote',
  'Lote promocional - Quantidade limitada',
  50.00,
  100,
  4,
  1
FROM eventos WHERE slug = 'naipe-vip';

INSERT INTO lotes (evento_id, nome, descricao, preco, quantidade_total, limite_por_usuario, ordem) 
SELECT 
  id,
  '2º Lote',
  'Segundo lote',
  70.00,
  150,
  4,
  2
FROM eventos WHERE slug = 'naipe-vip';

INSERT INTO lotes (evento_id, nome, descricao, preco, quantidade_total, limite_por_usuario, ordem) 
SELECT 
  id,
  '3º Lote',
  'Terceiro lote',
  90.00,
  200,
  4,
  3
FROM eventos WHERE slug = 'naipe-vip';

-- =============================================
-- FIM DO SCRIPT
-- =============================================
