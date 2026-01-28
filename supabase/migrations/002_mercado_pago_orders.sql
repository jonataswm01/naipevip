-- =============================================
-- MIGRATION: Suporte à API de Orders do Mercado Pago
-- Execute este arquivo no SQL Editor do Supabase
-- =============================================

-- Adicionar coluna para Order ID do Mercado Pago
-- O mp_payment_id existente será usado para o Order ID
-- Adicionamos mp_transaction_id para o ID da transação individual

ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS mp_order_id VARCHAR(100);

-- Renomear mp_payment_id para clareza (opcional - comentado para não quebrar)
-- COMMENT ON COLUMN pagamentos.mp_payment_id IS 'ID da Order no Mercado Pago (API de Orders)';

-- Criar índice para mp_order_id
CREATE INDEX IF NOT EXISTS idx_pagamentos_mp_order_id ON pagamentos(mp_order_id);

-- Atualizar constraint de status para incluir novos status
ALTER TABLE pagamentos DROP CONSTRAINT IF EXISTS chk_pagamento_status;
ALTER TABLE pagamentos ADD CONSTRAINT chk_pagamento_status CHECK (status IN (
  'pending', 'approved', 'authorized', 'in_process', 
  'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back',
  'action_required', 'processing', 'expired', 'failed'
));

-- Atualizar constraint de status do pedido para incluir 'expirado'
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS chk_pedido_status;
ALTER TABLE pedidos ADD CONSTRAINT chk_pedido_status CHECK (status IN (
  'pendente', 'processando', 'pago', 'cancelado', 'expirado', 'reembolsado'
));

-- =============================================
-- FIM DA MIGRATION
-- =============================================
