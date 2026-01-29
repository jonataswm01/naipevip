# 🚨 DIAGNÓSTICO E CORREÇÃO IMEDIATA - PAGAMENTO PENDENTE

## ⚡ AÇÃO IMEDIATA NECESSÁRIA

Um cliente comprou, pagou no ASAS, mas o sistema não atualizou. Siga estes passos:

---

## 📋 PASSO 1: VERIFICAR STATUS NO BANCO

Execute no SQL Editor do Supabase:

```sql
-- Substitua 'NUMERO_DO_PEDIDO' pelo número do pedido do cliente
-- Exemplo: 'NV-20260128-001'

SELECT 
  p.id as pedido_id,
  p.numero as pedido_numero,
  p.status as pedido_status,
  p.valor_total,
  p.created_at as pedido_criado_em,
  pag.id as pagamento_id,
  pag.asaas_payment_id,
  pag.status as pagamento_status,
  pag.valor as pagamento_valor,
  pag.pago_em,
  pag.created_at as pagamento_criado_em,
  (SELECT COUNT(*) FROM ingressos WHERE pedido_id = p.id) as quantidade_ingressos
FROM pedidos p
LEFT JOIN pagamentos pag ON pag.pedido_id = p.id
WHERE p.numero = 'NUMERO_DO_PEDIDO'  -- SUBSTITUA AQUI
ORDER BY p.created_at DESC
LIMIT 1;
```

**O que verificar:**
- ✅ `asaas_payment_id` está preenchido? (deve ter um valor como `pay_xxxxx`)
- ✅ `pagamento_status` está como `"pending"`? (problema confirmado se sim)
- ✅ `pedido_status` está como `"pendente"`? (problema confirmado se sim)
- ✅ `quantidade_ingressos` é 0? (problema confirmado se sim)

---

## 📋 PASSO 2: VERIFICAR STATUS NO ASAS

1. Acesse o painel do ASAS: https://www.asaas.com/
2. Vá em **Cobranças** → Busque pelo `asaas_payment_id` encontrado no Passo 1
3. Verifique:
   - ✅ Status do pagamento (deve estar `CONFIRMED` ou `RECEIVED`)
   - ✅ Data de confirmação do pagamento
   - ✅ Se o webhook foi enviado (verificar logs do ASAS)

---

## 📋 PASSO 3: VERIFICAR SE WEBHOOK ESTÁ CONFIGURADO

### No Painel do ASAS:

1. Vá em **Configurações** → **Webhooks**
2. Verifique se há um webhook configurado com a URL:
   ```
   https://seudominio.com/api/webhooks/asaas
   ```
3. Verifique se os eventos estão marcados:
   - ✅ `PAYMENT_RECEIVED`
   - ✅ `PAYMENT_CONFIRMED`
   - ✅ `PAYMENT_OVERDUE`

**Se o webhook NÃO estiver configurado:**
- Configure agora mesmo!
- URL: `https://seudominio.com/api/webhooks/asaas`
- Eventos: Todos os eventos de pagamento

---

## 📋 PASSO 4: CORREÇÃO MANUAL (SE NECESSÁRIO)

Se o pagamento foi confirmado no ASAS mas não atualizou no sistema, você pode atualizar manualmente:

### **Opção A: Atualizar via SQL (RÁPIDO)**

```sql
-- SUBSTITUA OS VALORES:
-- 'ID_DO_PEDIDO' = ID do pedido encontrado no Passo 1
-- 'ID_DO_PAGAMENTO_ASAS' = ID do pagamento no ASAS (ex: pay_xxxxx)

BEGIN;

-- 1. Atualizar status do pagamento
UPDATE pagamentos
SET 
  status = 'approved',
  pago_em = NOW(),
  asaas_payment_id = 'ID_DO_PAGAMENTO_ASAS'  -- Se não estiver preenchido
WHERE pedido_id = 'ID_DO_PEDIDO';

-- 2. Atualizar status do pedido
UPDATE pedidos
SET status = 'pago'
WHERE id = 'ID_DO_PEDIDO';

-- 3. Verificar se deu certo
SELECT 
  p.status as pedido_status,
  pag.status as pagamento_status,
  pag.pago_em
FROM pedidos p
JOIN pagamentos pag ON pag.pedido_id = p.id
WHERE p.id = 'ID_DO_PEDIDO';

COMMIT;
```

### **Opção B: Gerar Ingressos Manualmente**

Depois de atualizar o status, gere os ingressos:

```sql
-- Este script vai gerar os ingressos para o pedido
-- Execute APENAS se o pagamento foi atualizado para 'approved'

DO $$
DECLARE
  pedido_record RECORD;
  item_record RECORD;
  ingresso_id UUID;
  codigo_gerado VARCHAR(5);
BEGIN
  -- Buscar pedido
  SELECT * INTO pedido_record
  FROM pedidos
  WHERE id = 'ID_DO_PEDIDO'  -- SUBSTITUA AQUI
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  -- Verificar se já tem ingressos
  IF EXISTS (SELECT 1 FROM ingressos WHERE pedido_id = pedido_record.id LIMIT 1) THEN
    RAISE NOTICE 'Ingressos já existem para este pedido';
    RETURN;
  END IF;

  -- Gerar ingressos para cada item
  FOR item_record IN 
    SELECT * FROM pedido_itens WHERE pedido_id = pedido_record.id
  LOOP
    FOR i IN 1..item_record.quantidade LOOP
      -- Inserir ingresso (o trigger gera o código automaticamente)
      INSERT INTO ingressos (
        pedido_id,
        pedido_item_id,
        usuario_id,
        evento_id,
        lote_id,
        nome_titular,
        status
      ) VALUES (
        pedido_record.id,
        item_record.id,
        pedido_record.usuario_id,
        pedido_record.evento_id,
        item_record.lote_id,
        (SELECT nome FROM usuarios WHERE id = pedido_record.usuario_id),
        'ativo'
      ) RETURNING id, codigo INTO ingresso_id, codigo_gerado;
      
      RAISE NOTICE 'Ingresso criado: ID=%, Código=%', ingresso_id, codigo_gerado;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Ingressos gerados com sucesso!';
END $$;
```

---

## 📋 PASSO 5: VERIFICAR LOGS DO SERVIDOR

Verifique os logs do seu servidor (Vercel, Railway, etc.) para ver se o webhook está sendo chamado:

**Procure por:**
- `=== WEBHOOK ASAAS RECEBIDO ===`
- `Payment ID (ASAS):`
- `Pedido ID (externalReference):`
- `Status ASAS:`

**Se não encontrar nenhum log:**
- ❌ Webhook não está sendo chamado pelo ASAS
- ✅ Configure o webhook no painel do ASAS

**Se encontrar logs mas com erro:**
- Verifique a mensagem de erro
- Corrija o problema identificado

---

## 🔧 MELHORIAS IMPLEMENTADAS NO WEBHOOK

O webhook foi melhorado com:

1. ✅ **Busca robusta:** Busca pagamento por `pedido_id` OU `asaas_payment_id`
2. ✅ **Logs detalhados:** Mostra exatamente o que está acontecendo
3. ✅ **Validação:** Verifica se pagamento existe antes de atualizar
4. ✅ **Tratamento de erros:** Loga erros de forma clara
5. ✅ **Atualização de `asaas_payment_id`:** Preenche se não estiver preenchido

---

## 📊 CHECKLIST DE VERIFICAÇÃO

Após seguir os passos acima, verifique:

- [ ] Pagamento atualizado para `"approved"` no banco
- [ ] Pedido atualizado para `"pago"` no banco
- [ ] Ingressos gerados (quantidade correta)
- [ ] Códigos dos ingressos têm 5 dígitos numéricos
- [ ] Webhook configurado no ASAS
- [ ] Webhook funcionando (verificar logs)

---

## 🚀 PRÓXIMOS PASSOS

1. **IMEDIATO:** Corrigir o pagamento pendente do cliente atual
2. **HOJE:** Configurar webhook no ASAS (se não estiver configurado)
3. **HOJE:** Testar webhook com um pagamento de teste
4. **ESTA SEMANA:** Adicionar monitoramento de webhooks
5. **ESTA SEMANA:** Implementar retry automático se webhook falhar

---

## 📞 SUPORTE

Se ainda tiver problemas:

1. Verifique os logs do servidor
2. Verifique os logs do ASAS
3. Execute os scripts SQL de diagnóstico
4. Entre em contato com suporte técnico

---

**Documento criado em:** 28/01/2026  
**Status:** 🔴 URGENTE - CORREÇÃO NECESSÁRIA
