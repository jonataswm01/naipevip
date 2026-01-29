-- =============================================
-- SCRIPT DE DIAGNÓSTICO DE PAGAMENTO
-- Execute este script para verificar o status de um pedido
-- =============================================

-- Substitua 'NUMERO_DO_PEDIDO' pelo número do pedido
-- Exemplo: 'NV-20260128-001'

WITH pedido_info AS (
  SELECT 
    p.id as pedido_id,
    p.numero as pedido_numero,
    p.status as pedido_status,
    p.valor_total,
    p.created_at as pedido_criado_em,
    p.expires_at as pedido_expira_em,
    pag.id as pagamento_id,
    pag.asaas_payment_id,
    pag.mp_payment_id,
    pag.status as pagamento_status,
    pag.valor as pagamento_valor,
    pag.pago_em,
    pag.created_at as pagamento_criado_em,
    pag.metodo as metodo_pagamento
  FROM pedidos p
  LEFT JOIN pagamentos pag ON pag.pedido_id = p.id
  WHERE p.numero = 'NUMERO_DO_PEDIDO'  -- SUBSTITUA AQUI
  LIMIT 1
),
ingressos_info AS (
  SELECT 
    COUNT(*) as quantidade_ingressos,
    STRING_AGG(codigo, ', ') as codigos_ingressos,
    MIN(created_at) as primeiro_ingresso_criado_em
  FROM ingressos
  WHERE pedido_id = (SELECT pedido_id FROM pedido_info)
)
SELECT 
  pi.*,
  COALESCE(ii.quantidade_ingressos, 0) as quantidade_ingressos,
  ii.codigos_ingressos,
  ii.primeiro_ingresso_criado_em,
  CASE 
    WHEN pi.pagamento_status = 'approved' AND pi.pedido_status = 'pago' AND COALESCE(ii.quantidade_ingressos, 0) > 0 THEN '✅ TUDO OK'
    WHEN pi.pagamento_status = 'approved' AND pi.pedido_status = 'pago' AND COALESCE(ii.quantidade_ingressos, 0) = 0 THEN '⚠️ PAGO MAS SEM INGRESSOS'
    WHEN pi.pagamento_status = 'pending' AND pi.pedido_status = 'pendente' THEN '⏳ AGUARDANDO PAGAMENTO'
    WHEN pi.pagamento_status = 'approved' AND pi.pedido_status = 'pendente' THEN '🔴 PROBLEMA: PAGO MAS PEDIDO NÃO ATUALIZADO'
    WHEN pi.pagamento_status = 'pending' AND pi.pedido_status = 'pago' THEN '🔴 PROBLEMA: PEDIDO MARCADO COMO PAGO MAS PAGAMENTO PENDENTE'
    ELSE '⚠️ STATUS INCONSISTENTE'
  END as diagnostico
FROM pedido_info pi
LEFT JOIN ingressos_info ii ON TRUE;

-- =============================================
-- VERIFICAR TODOS OS PEDIDOS RECENTES COM PROBLEMAS
-- =============================================

SELECT 
  p.numero as pedido_numero,
  p.status as pedido_status,
  pag.status as pagamento_status,
  pag.asaas_payment_id,
  pag.pago_em,
  (SELECT COUNT(*) FROM ingressos WHERE pedido_id = p.id) as ingressos_gerados,
  CASE 
    WHEN pag.status = 'approved' AND p.status != 'pago' THEN '🔴 PAGO MAS PEDIDO NÃO ATUALIZADO'
    WHEN pag.status = 'approved' AND p.status = 'pago' AND (SELECT COUNT(*) FROM ingressos WHERE pedido_id = p.id) = 0 THEN '⚠️ PAGO MAS SEM INGRESSOS'
    ELSE 'OK'
  END as problema
FROM pedidos p
JOIN pagamentos pag ON pag.pedido_id = p.id
WHERE p.created_at >= NOW() - INTERVAL '7 days'
  AND (
    (pag.status = 'approved' AND p.status != 'pago')
    OR (pag.status = 'approved' AND (SELECT COUNT(*) FROM ingressos WHERE pedido_id = p.id) = 0)
  )
ORDER BY p.created_at DESC;
