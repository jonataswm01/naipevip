-- =============================================
-- MIGRATION: Adicionar campo ASAS e corrigir código de ingresso
-- Execute este arquivo no SQL Editor do Supabase
-- =============================================

-- =============================================
-- 1. ADICIONAR CAMPO ASAAS_PAYMENT_ID
-- =============================================

-- Adicionar coluna para ID do pagamento ASAS
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS asaas_payment_id VARCHAR(100);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_pagamentos_asaas_payment_id 
ON pagamentos(asaas_payment_id);

-- Migrar dados existentes (se houver pagamentos PIX que usam mp_payment_id para ASAS)
-- ATENÇÃO: Execute apenas se tiver certeza que mp_payment_id contém IDs do ASAS
-- Descomente a linha abaixo apenas após verificar os dados:
-- UPDATE pagamentos 
-- SET asaas_payment_id = mp_payment_id 
-- WHERE mp_payment_id IS NOT NULL 
--   AND metodo = 'pix'
--   AND asaas_payment_id IS NULL;

-- =============================================
-- 2. ATUALIZAR FUNÇÃO E CAMPO DE GERAÇÃO DE CÓDIGO DE INGRESSO
-- Alterar de 8 caracteres alfanuméricos para 5 dígitos numéricos
-- IMPORTANTE: Precisamos remover o trigger antes de alterar a coluna
-- =============================================

-- PASSO 1: Migrar automaticamente ingressos existentes com código maior que 5 caracteres
DO $$
DECLARE
  ingresso_record RECORD;
  novo_codigo VARCHAR(5);
  codigo_existe BOOLEAN;
  max_tentativas INTEGER := 100;
  tentativa INTEGER;
  ingressos_migrados INTEGER := 0;
BEGIN
  -- Verificar se há ingressos com código maior que 5 caracteres
  IF EXISTS (SELECT 1 FROM ingressos WHERE LENGTH(codigo) > 5) THEN
    RAISE NOTICE 'Encontrados ingressos com código maior que 5 caracteres. Iniciando migração automática...';
    
    -- Para cada ingresso com código maior que 5 caracteres
    FOR ingresso_record IN 
      SELECT id, codigo FROM ingressos WHERE LENGTH(codigo) > 5
    LOOP
      -- Gerar novo código numérico de 5 dígitos
      tentativa := 0;
      LOOP
        tentativa := tentativa + 1;
        novo_codigo := LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
        
        -- Verificar se já existe (incluindo códigos antigos que ainda não foram migrados)
        SELECT EXISTS(
          SELECT 1 FROM ingressos 
          WHERE codigo = novo_codigo 
            AND id != ingresso_record.id
        ) INTO codigo_existe;
        
        EXIT WHEN NOT codigo_existe;
        
        IF tentativa >= max_tentativas THEN
          RAISE EXCEPTION 'Não foi possível gerar código único para ingresso % após % tentativas', ingresso_record.id, max_tentativas;
        END IF;
      END LOOP;
      
      -- Atualizar código do ingresso
      UPDATE ingressos 
      SET codigo = novo_codigo 
      WHERE id = ingresso_record.id;
      
      ingressos_migrados := ingressos_migrados + 1;
      RAISE NOTICE 'Ingresso % migrado de "%" para "%"', ingresso_record.id, ingresso_record.codigo, novo_codigo;
    END LOOP;
    
    RAISE NOTICE 'Migração automática concluída! % ingressos migrados com sucesso.', ingressos_migrados;
  ELSE
    RAISE NOTICE 'Nenhum ingresso com código maior que 5 caracteres encontrado. Prosseguindo...';
  END IF;
END $$;

-- PASSO 2: Remover o trigger existente
DROP TRIGGER IF EXISTS trigger_generate_ingresso_codigo ON ingressos;

-- PASSO 3: Atualizar a função para gerar código de 5 dígitos
CREATE OR REPLACE FUNCTION generate_ingresso_codigo()
RETURNS TRIGGER AS $$
DECLARE
  new_codigo VARCHAR(5) := '';
  max_tentativas INTEGER := 100;
  tentativa INTEGER := 0;
BEGIN
  -- Gera código numérico de 5 dígitos (10000 a 99999)
  LOOP
    tentativa := tentativa + 1;
    
    -- Gera número aleatório entre 10000 e 99999
    new_codigo := LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
    
    -- Verifica se já existe
    EXIT WHEN NOT EXISTS (SELECT 1 FROM ingressos WHERE codigo = new_codigo);
    
    -- Proteção contra loop infinito (muito improvável, mas por segurança)
    IF tentativa >= max_tentativas THEN
      RAISE EXCEPTION 'Não foi possível gerar código único após % tentativas', max_tentativas;
    END IF;
  END LOOP;
  
  NEW.codigo := new_codigo;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 4: Alterar tamanho máximo do campo codigo para garantir que seja 5 dígitos
ALTER TABLE ingressos 
ALTER COLUMN codigo TYPE VARCHAR(5);

-- PASSO 5: Recriar o trigger com a função atualizada
CREATE TRIGGER trigger_generate_ingresso_codigo
  BEFORE INSERT ON ingressos
  FOR EACH ROW
  WHEN (NEW.codigo IS NULL OR NEW.codigo = '')
  EXECUTE FUNCTION generate_ingresso_codigo();

-- =============================================
-- 3. ATUALIZAR CONSTRAINT DO CAMPO CÓDIGO
-- Garantir que o campo aceita apenas números de 5 dígitos
-- =============================================

-- Adicionar constraint para garantir formato numérico (opcional, mas recomendado)
-- Isso garante que apenas números sejam aceitos
ALTER TABLE ingressos 
DROP CONSTRAINT IF EXISTS chk_ingresso_codigo_numerico;

ALTER TABLE ingressos 
ADD CONSTRAINT chk_ingresso_codigo_numerico 
CHECK (codigo ~ '^[0-9]{5}$');

-- =============================================
-- 4. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================

COMMENT ON COLUMN pagamentos.asaas_payment_id IS 'ID do pagamento no gateway ASAS';
COMMENT ON COLUMN pagamentos.mp_payment_id IS 'ID do pagamento no Mercado Pago (para compatibilidade futura)';
COMMENT ON COLUMN ingressos.codigo IS 'Código único do ingresso - 5 dígitos numéricos (10000-99999)';

-- =============================================
-- FIM DA MIGRATION
-- =============================================
