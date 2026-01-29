# 🔍 FLUXO DE PAGAMENTO DETALHADO - DIAGNÓSTICO COMPLETO

## 🚨 PROBLEMA IDENTIFICADO

**Situação:** Cliente comprou, pagamento foi confirmado no ASAS, mas não foi atualizado no sistema.

---

## 📋 FLUXO COMPLETO DE PAGAMENTO (PASSO A PASSO)

### **ETAPA 1: Cliente Inicia Compra** ✅

**Onde:** `/compra/carrinho` → Clica em "Continuar para pagamento"

**O que acontece:**
1. Sistema verifica se usuário está logado
2. Se não estiver, salva carrinho e redireciona para login
3. Se estiver logado, chama `/api/comprar`

---

### **ETAPA 2: Criação do Pedido** ✅

**Arquivo:** `src/app/api/comprar/route.ts`

**O que acontece:**
1. ✅ Valida dados (lote, quantidade, CPF)
2. ✅ Verifica disponibilidade de ingressos
3. ✅ Verifica limite por usuário
4. ✅ **CRIA PEDIDO no banco** com status `"pendente"`
   ```sql
   INSERT INTO pedidos (usuario_id, evento_id, status, quantidade_total, valor_total, expires_at)
   VALUES (..., 'pendente', ...)
   ```
5. ✅ **CRIA ITEM DO PEDIDO** no banco
6. ✅ **CRIA COBRANÇA NO ASAS** via API
   - Chama `criarCobrancaPix()` em `src/lib/asaas.ts`
   - Passa `externalReference: pedido.id` ← **IMPORTANTE!**
7. ✅ **OBTÉM QR CODE PIX** do ASAS (com retry 3x)
8. ✅ **SALVA PAGAMENTO no banco** com:
   ```typescript
   {
     pedido_id: pedido.id,
     asaas_payment_id: cobranca.id,  // ← ID do pagamento no ASAS
     metodo: "pix",
     status: "pending",  // ← Status inicial
     valor: valorTotal,
     pix_qr_code: "...",
     pix_qr_code_base64: "...",
   }
   ```
9. ✅ Retorna dados do pedido + QR Code para o frontend

**Status no banco após esta etapa:**
- `pedidos.status` = `"pendente"`
- `pagamentos.status` = `"pending"`
- `pagamentos.asaas_payment_id` = `"pay_xxxxx"` (ID do ASAS)

---

### **ETAPA 3: Cliente Paga o PIX** ✅

**Onde:** Cliente escaneia QR Code e paga no app do banco

**O que acontece:**
- Cliente paga o PIX
- ASAS recebe confirmação do banco
- ASAS marca pagamento como `CONFIRMED` ou `RECEIVED`

---

### **ETAPA 4: Webhook do ASAS** ⚠️ **AQUI ESTÁ O PROBLEMA!**

**Arquivo:** `src/app/api/webhooks/asaas/route.ts`

**URL do Webhook:** `https://seudominio.com/api/webhooks/asaas`

**O que DEVERIA acontecer:**
1. ✅ ASAS envia webhook para nossa API
2. ✅ Recebemos o payload com status do pagamento
3. ✅ Extraímos `pedidoId` de `payment.externalReference`
4. ✅ Mapeamos status do ASAS para nosso status interno
5. ⚠️ **ATUALIZAMOS PAGAMENTO** no banco
6. ⚠️ **ATUALIZAMOS PEDIDO** no banco
7. ⚠️ **GERAMOS INGRESSOS** se status = `"approved"`

**PROBLEMA IDENTIFICADO:**

O webhook está buscando o pagamento assim:
```typescript
.eq("pedido_id", pedidoId)
```

Mas **NÃO está usando o `asaas_payment_id`** para validar! Isso pode causar problemas se:
- O webhook não conseguir encontrar o pagamento
- Houver múltiplos pagamentos para o mesmo pedido
- O `externalReference` não corresponder ao `pedido_id`

---

## 🔴 PROBLEMAS POTENCIAIS IDENTIFICADOS

### **PROBLEMA 1: Webhook Não Está Sendo Chamado** ⚠️

**Sintomas:**
- Pagamento confirmado no ASAS
- Status continua "pending" no sistema
- Ingressos não foram gerados

**Possíveis causas:**
1. ❌ Webhook não configurado no painel do ASAS
2. ❌ URL do webhook incorreta
3. ❌ Webhook bloqueado por firewall/CORS
4. ❌ Erro no webhook que retorna 200 mas não processa

**Como verificar:**
```sql
-- Verificar logs do webhook (se houver)
-- Verificar se há erros no console do servidor
```

---

### **PROBLEMA 2: Webhook Está Sendo Chamado Mas Falha Silenciosamente** ⚠️

**Sintomas:**
- Webhook recebe requisição
- Mas não atualiza o banco
- Retorna 200 (sucesso) mas não processa

**Possíveis causas:**
1. ❌ `externalReference` não corresponde ao `pedido_id`
2. ❌ Erro ao buscar pagamento no banco
3. ❌ Erro ao atualizar pagamento (mas não logado)
4. ❌ Status do ASAS não está sendo mapeado corretamente

**Como verificar:**
- Verificar logs do servidor
- Verificar se `externalReference` está correto
- Verificar mapeamento de status

---

### **PROBLEMA 3: Mapeamento de Status Incorreto** ⚠️

**Arquivo:** `src/lib/asaas.ts` → função `mapearStatusAsaas()`

**Status do ASAS:**
- `PENDING` → `pending` (pendente)
- `RECEIVED` → `approved` (pago) ✅
- `CONFIRMED` → `approved` (pago) ✅
- `OVERDUE` → `cancelled` (expirado)

**Problema:** Se o ASAS enviar status `RECEIVED` mas o webhook não processar corretamente, o pagamento não será marcado como aprovado.

---

## 🔧 SOLUÇÃO: MELHORAR O WEBHOOK

### **Melhorias Necessárias:**

1. **Adicionar busca por `asaas_payment_id`:**
```typescript
// Buscar pagamento tanto por pedido_id quanto por asaas_payment_id
const { data: pagamento } = await supabase
  .from("pagamentos")
  .select("*")
  .or(`pedido_id.eq.${pedidoId},asaas_payment_id.eq.${payment.id}`)
  .single();
```

2. **Adicionar logs detalhados:**
```typescript
console.log("=== WEBHOOK ASAAS DEBUG ===");
console.log("Payment ID:", payment.id);
console.log("Pedido ID:", pedidoId);
console.log("Status ASAS:", payment.status);
console.log("Status mapeado:", pagamentoStatus);
```

3. **Validar se pagamento existe antes de atualizar:**
```typescript
const { data: pagamentoExistente } = await supabase
  .from("pagamentos")
  .select("*")
  .eq("pedido_id", pedidoId)
  .single();

if (!pagamentoExistente) {
  console.error("Pagamento não encontrado para pedido:", pedidoId);
  return NextResponse.json({ received: true, error: "Pagamento não encontrado" });
}
```

4. **Adicionar tratamento de erros mais robusto:**
```typescript
if (pagamentoError) {
  console.error("ERRO CRÍTICO ao atualizar pagamento:", pagamentoError);
  // Não retornar 200 imediatamente, tentar novamente
}
```

---

## 📊 VERIFICAÇÃO MANUAL DO PROBLEMA

### **Passo 1: Verificar se o pagamento foi salvo corretamente**

Execute no SQL Editor do Supabase:
```sql
-- Buscar o pedido do cliente
SELECT 
  p.id as pedido_id,
  p.numero as pedido_numero,
  p.status as pedido_status,
  pag.id as pagamento_id,
  pag.asaas_payment_id,
  pag.status as pagamento_status,
  pag.valor,
  pag.created_at as pagamento_criado_em
FROM pedidos p
LEFT JOIN pagamentos pag ON pag.pedido_id = p.id
WHERE p.numero = 'NV-20260128-001'  -- Substitua pelo número do pedido
ORDER BY p.created_at DESC
LIMIT 1;
```

**O que verificar:**
- ✅ `asaas_payment_id` está preenchido?
- ✅ `pagamento_status` está como `"pending"`?
- ✅ `pedido_status` está como `"pendente"`?

---

### **Passo 2: Verificar no painel do ASAS**

1. Acesse o painel do ASAS
2. Busque pelo `asaas_payment_id` encontrado no passo 1
3. Verifique:
   - ✅ Status do pagamento no ASAS (deve estar `CONFIRMED` ou `RECEIVED`)
   - ✅ Se o webhook foi enviado (verificar logs do ASAS)
   - ✅ URL do webhook configurada corretamente

---

### **Passo 3: Verificar se ingressos foram gerados**

Execute no SQL Editor:
```sql
-- Verificar ingressos do pedido
SELECT 
  i.id,
  i.codigo,
  i.status,
  i.created_at,
  LENGTH(i.codigo) as tamanho_codigo
FROM ingressos i
WHERE i.pedido_id = 'ID_DO_PEDIDO_AQUI'  -- Substitua pelo ID do pedido
ORDER BY i.created_at DESC;
```

**O que verificar:**
- ❌ Se não há ingressos → webhook não processou ou falhou
- ✅ Se há ingressos → verificar se código tem 5 dígitos numéricos

---

## 🛠️ CORREÇÃO IMEDIATA NECESSÁRIA

Vou criar uma versão melhorada do webhook que:
1. ✅ Busca pagamento de forma mais robusta
2. ✅ Adiciona logs detalhados
3. ✅ Valida dados antes de processar
4. ✅ Trata erros adequadamente
5. ✅ Gera ingressos com código de 5 dígitos

---

## 📝 CHECKLIST DE VERIFICAÇÃO

### **Configuração do Webhook no ASAS:**
- [ ] Webhook configurado no painel do ASAS
- [ ] URL correta: `https://seudominio.com/api/webhooks/asaas`
- [ ] Eventos selecionados: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`
- [ ] Webhook ativo e funcionando

### **Banco de Dados:**
- [ ] Campo `asaas_payment_id` existe na tabela `pagamentos`
- [ ] Campo está sendo preenchido ao criar pagamento
- [ ] Trigger de geração de código de 5 dígitos está funcionando

### **Código:**
- [ ] Webhook recebe requisições corretamente
- [ ] Webhook atualiza status do pagamento
- [ ] Webhook atualiza status do pedido
- [ ] Webhook gera ingressos quando pagamento aprovado
- [ ] Ingressos são gerados com código de 5 dígitos

---

## 🚀 PRÓXIMOS PASSOS

1. **IMEDIATO:** Verificar se webhook está configurado no ASAS
2. **IMEDIATO:** Verificar logs do servidor para ver se webhook está sendo chamado
3. **IMEDIATO:** Melhorar webhook com busca mais robusta e logs
4. **CURTO PRAZO:** Adicionar validação de assinatura do webhook (segurança)
5. **CURTO PRAZO:** Implementar retry automático se webhook falhar

---

**Documento criado em:** 28/01/2026  
**Última atualização:** 28/01/2026  
**Status:** 🔴 PROBLEMA IDENTIFICADO - CORREÇÃO NECESSÁRIA
