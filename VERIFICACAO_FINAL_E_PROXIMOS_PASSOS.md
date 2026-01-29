# ✅ VERIFICAÇÃO FINAL E PRÓXIMOS PASSOS

## 🎉 SITUAÇÃO ATUAL

✅ **Webhook configurado no ASAS:**
- URL: `https://naipevip.com.br/api/webhooks/asaas`
- Status: Funcionando (retorna `{"status":"ok"}`)

✅ **Eventos configurados:**
- `PAYMENT_CONFIRMED` ✅
- `PAYMENT_RECEIVED` ✅
- `PAYMENT_OVERDUE` ✅
- `PAYMENT_REFUNDED` ✅

✅ **Pedido do cliente corrigido manualmente**

---

## 🔍 VERIFICAÇÕES NECESSÁRIAS

### **1. Verificar se os ingressos foram gerados**

Execute no SQL Editor do Supabase:

```sql
-- Substitua 'NUMERO_DO_PEDIDO' pelo número do pedido do cliente
SELECT 
  p.numero as pedido_numero,
  p.status as pedido_status,
  pag.status as pagamento_status,
  pag.pago_em,
  COUNT(i.id) as quantidade_ingressos,
  STRING_AGG(i.codigo, ', ') as codigos_ingressos,
  CASE 
    WHEN COUNT(i.id) > 0 THEN '✅ Ingressos gerados'
    ELSE '⚠️ Ingressos NÃO gerados'
  END as status_ingressos
FROM pedidos p
JOIN pagamentos pag ON pag.pedido_id = p.id
LEFT JOIN ingressos i ON i.pedido_id = p.id
WHERE p.numero = 'NUMERO_DO_PEDIDO'  -- SUBSTITUA AQUI
GROUP BY p.id, p.numero, p.status, pag.status, pag.pago_em;
```

**O que verificar:**
- ✅ `quantidade_ingressos` deve ser > 0
- ✅ `codigos_ingressos` deve mostrar códigos de 5 dígitos (ex: `12345, 67890`)
- ✅ Cada código deve ter exatamente 5 dígitos numéricos

---

### **2. Se os ingressos NÃO foram gerados, gere manualmente**

Execute este script SQL:

```sql
-- Substitua 'ID_DO_PEDIDO' pelo ID do pedido
DO $$
DECLARE
  pedido_record RECORD;
  item_record RECORD;
  ingresso_criado RECORD;
  total_ingressos INTEGER := 0;
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

  -- Verificar se pedido está pago
  IF pedido_record.status != 'pago' THEN
    RAISE EXCEPTION 'Pedido não está marcado como pago. Status atual: %', pedido_record.status;
  END IF;

  -- Gerar ingressos para cada item
  FOR item_record IN 
    SELECT * FROM pedido_itens WHERE pedido_id = pedido_record.id
  LOOP
    FOR i IN 1..item_record.quantidade LOOP
      -- Inserir ingresso (o trigger gera o código automaticamente de 5 dígitos)
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
      ) RETURNING id, codigo INTO ingresso_criado;
      
      total_ingressos := total_ingressos + 1;
      RAISE NOTICE 'Ingresso % criado: ID=%, Código=%', total_ingressos, ingresso_criado.id, ingresso_criado.codigo;
    END LOOP;
  END LOOP;

  RAISE NOTICE '✅ Total de % ingressos gerados com sucesso!', total_ingressos;
END $$;
```

---

## 🔍 POR QUE O WEBHOOK NÃO FUNCIONOU ANTES?

Possíveis causas:

1. **Webhook configurado depois do pagamento**
   - Se o webhook foi configurado após o cliente pagar, o ASAS não enviaria notificação retroativa
   - ✅ **Solução:** Webhook já está configurado agora

2. **Primeira configuração do webhook**
   - Pode ter demorado alguns minutos para ativar
   - ✅ **Solução:** Já está ativo agora

3. **Erro temporário no servidor**
   - Pode ter havido um erro momentâneo que não foi logado
   - ✅ **Solução:** Webhook melhorado com logs detalhados

---

## ✅ GARANTIAS PARA O FUTURO

### **O que está funcionando agora:**

1. ✅ **Webhook configurado e ativo**
2. ✅ **Eventos corretos marcados** (`PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`)
3. ✅ **Webhook melhorado** com:
   - Busca robusta por `pedido_id` ou `asaas_payment_id`
   - Logs detalhados para debug
   - Validação antes de processar
   - Tratamento de erros melhorado

4. ✅ **Geração de código de 5 dígitos** funcionando
   - Trigger do banco atualizado
   - Todos os locais que geram ingressos atualizados

---

## 📊 COMO MONITORAR SE ESTÁ FUNCIONANDO

### **1. Verificar logs do servidor**

Procure por estas mensagens nos logs (Vercel, Railway, etc.):

```
=== WEBHOOK ASAAS RECEBIDO ===
Payment ID (ASAS): pay_xxxxx
Pedido ID: uuid-do-pedido
Status ASAS: CONFIRMED
✅ Pagamento atualizado com sucesso!
✅ Pedido atualizado com sucesso!
✅ Pagamento aprovado! Iniciando geração de ingressos...
✅ Ingressos gerados com sucesso!
```

### **2. Verificar no banco após cada compra**

Execute este script para verificar pedidos recentes:

```sql
SELECT 
  p.numero,
  p.status as pedido_status,
  pag.status as pagamento_status,
  pag.pago_em,
  COUNT(i.id) as ingressos_gerados,
  CASE 
    WHEN pag.status = 'approved' AND p.status = 'pago' AND COUNT(i.id) > 0 THEN '✅ TUDO OK'
    WHEN pag.status = 'approved' AND p.status = 'pago' AND COUNT(i.id) = 0 THEN '⚠️ PAGO MAS SEM INGRESSOS'
    WHEN pag.status = 'pending' THEN '⏳ AGUARDANDO PAGAMENTO'
    ELSE '⚠️ VERIFICAR'
  END as diagnostico
FROM pedidos p
JOIN pagamentos pag ON pag.pedido_id = p.id
LEFT JOIN ingressos i ON i.pedido_id = p.id
WHERE p.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY p.id, p.numero, p.status, pag.status, pag.pago_em
ORDER BY p.created_at DESC;
```

---

## 🚀 TESTE RECOMENDADO

Para garantir que está funcionando, faça um teste:

1. **Crie um pedido de teste** (você mesmo)
2. **Gere o PIX** normalmente
3. **Simule o pagamento** usando a função de simulação (se disponível) OU
4. **Aguarde alguns minutos** e verifique se:
   - ✅ Status do pedido mudou para `"pago"`
   - ✅ Status do pagamento mudou para `"approved"`
   - ✅ Ingressos foram gerados automaticamente
   - ✅ Códigos dos ingressos têm 5 dígitos numéricos

---

## 📝 CHECKLIST FINAL

- [x] Webhook configurado no ASAS
- [x] URL do webhook correta
- [x] Eventos marcados (`PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`)
- [x] Webhook respondendo corretamente
- [x] Pedido do cliente corrigido manualmente
- [ ] Ingressos do cliente gerados (verificar)
- [ ] Códigos dos ingressos têm 5 dígitos (verificar)
- [ ] Teste de compra realizado
- [ ] Logs do servidor verificados

---

## 🎯 PRÓXIMOS PASSOS

1. **AGORA:** Verificar se ingressos do cliente foram gerados
2. **HOJE:** Se não foram gerados, executar script SQL para gerar
3. **HOJE:** Fazer um teste de compra completa
4. **ESTA SEMANA:** Monitorar logs para garantir que webhook está funcionando
5. **ESTA SEMANA:** Considerar adicionar notificação por email/WhatsApp quando ingressos forem gerados

---

## 📞 SE ALGO DER ERRADO NO FUTURO

1. **Verificar logs do servidor** - Procure por `=== WEBHOOK ASAAS RECEBIDO ===`
2. **Verificar no ASAS** - Veja se o webhook foi enviado (logs do ASAS)
3. **Verificar no banco** - Execute o script de diagnóstico
4. **Corrigir manualmente** - Use os scripts SQL fornecidos

---

**Status:** ✅ WEBHOOK CONFIGURADO E FUNCIONANDO  
**Próxima ação:** Verificar se ingressos foram gerados para o cliente
