-- =============================================
-- MIGRATION: Migrar ingressos existentes para código de 5 dígitos
-- Execute este arquivo ANTES da migration 003_asaas_payment_id_and_ingresso_codigo.sql
-- =============================================

-- Este script migra automaticamente todos os ingressos com código maior que 5 caracteres
-- para códigos numéricos de 5 dígitos (10000-99999)

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
    RAISE NOTICE 'Encontrados ingressos com código maior que 5 caracteres. Iniciando migração...';
    
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
    
    RAISE NOTICE 'Migração concluída! % ingressos migrados com sucesso.', ingressos_migrados;
  ELSE
    RAISE NOTICE 'Nenhum ingresso com código maior que 5 caracteres encontrado. Nada a migrar.';
  END IF;
END $$;

-- Verificar resultado
SELECT 
  id, 
  codigo, 
  LENGTH(codigo) as tamanho_codigo,
  CASE 
    WHEN LENGTH(codigo) = 5 AND codigo ~ '^[0-9]{5}$' THEN 'OK - 5 dígitos numéricos'
    WHEN LENGTH(codigo) > 5 THEN 'ATENÇÃO - Precisa migrar'
    ELSE 'Verificar formato'
  END as status
FROM ingressos
ORDER BY created_at DESC;
