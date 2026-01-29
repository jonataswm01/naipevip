# 📊 ANÁLISE COMPLETA DO SISTEMA NAIPE VIP

## 🎯 RESUMO EXECUTIVO

Este documento apresenta uma análise detalhada do código, fluxos de compra, integração com ASAS, geração de ingressos e banco de dados, além de um plano de melhorias estruturado.

---

## 📋 1. ESTRUTURA ATUAL DO SISTEMA

### 1.1 Stack Tecnológica
- **Frontend**: Next.js 14+ (App Router), React, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes
- **Banco de Dados**: Supabase (PostgreSQL)
- **Pagamento**: ASAS (PIX)
- **Autenticação**: Sistema próprio com sessões via cookies

### 1.2 Arquitetura de Pastas
```
src/
├── app/
│   ├── (auth)/          # Rotas de autenticação
│   ├── (dashboard)/     # Área logada
│   ├── api/             # Endpoints da API
│   ├── compra/          # Fluxo de compra
│   └── page.tsx         # Landing page
├── components/          # Componentes React
├── lib/                 # Bibliotecas (ASAS, Supabase, Auth)
└── types/               # Tipos TypeScript
```

---

## 🔄 2. FLUXO DE COMPRA ATUAL

### 2.1 Fluxo Completo

```
1. Landing Page (/)
   ↓
2. Seleção de Ingressos (SectionTickets)
   ↓
3. Carrinho (/compra/carrinho)
   ├─ Seleciona quantidade (1, 2 ou 4)
   ├─ Informa CPF
   ├─ Aceita termos
   └─ Clica em "Continuar para pagamento"
   ↓
4. Verificação de Autenticação
   ├─ Se NÃO logado → Salva carrinho no sessionStorage
   │   └─ Redireciona para /login
   └─ Se logado → Continua
   ↓
5. API /api/comprar (POST)
   ├─ Valida dados (lote, quantidade, CPF)
   ├─ Verifica disponibilidade
   ├─ Verifica limite por usuário
   ├─ Cria pedido no banco (status: "pendente")
   ├─ Cria item do pedido
   ├─ Integra com ASAS:
   │   ├─ Cria/busca cliente no ASAS
   │   ├─ Cria cobrança PIX
   │   └─ Obtém QR Code PIX (com retry 3x)
   ├─ Salva pagamento no banco
   └─ Retorna dados do pedido + PIX
   ↓
6. Página de Pagamento PIX (/compra/pix/[pedidoId])
   ├─ Exibe QR Code
   ├─ Exibe código copia e cola
   ├─ Timer de expiração (30 minutos)
   └─ Polling a cada 5s para verificar pagamento
   ↓
7. Webhook ASAS (/api/webhooks/asaas)
   ├─ Recebe notificação de pagamento
   ├─ Atualiza status do pagamento
   ├─ Atualiza status do pedido
   └─ Se aprovado → Gera ingressos
   ↓
8. Página de Sucesso (/compra/sucesso/[pedidoId])
   └─ Exibe confirmação e link para ingressos
```

### 2.2 Pontos Críticos do Fluxo

#### ✅ **Funcionando Bem:**
- Validação de autenticação
- Verificação de disponibilidade
- Criação de pedido
- Geração de QR Code PIX
- Polling de status

#### ⚠️ **Problemas Identificados:**

1. **Integração ASAS Parcialmente Conectada**
   - O campo `mp_payment_id` na tabela `pagamentos` está sendo usado para armazenar o ID do ASAS
   - Não há campo específico para `asaas_payment_id`
   - Isso pode causar confusão e problemas futuros

2. **Geração de Código de Ingresso**
   - Atualmente gera código de **8 caracteres alfanuméricos**
   - Usuário precisa de código de **5 dígitos numéricos**
   - Há conflito entre trigger do banco (8 chars) e código manual (8 chars)

3. **Falta de Flexibilidade no Método de Pagamento**
   - Sistema está hardcoded para PIX via ASAS
   - Não há abstração para trocar facilmente o gateway
   - Não há suporte a múltiplos métodos (cartão, boleto, etc.)

4. **Webhook ASAS Pode Não Estar Totalmente Conectado**
   - Webhook existe mas pode não estar configurado no painel ASAS
   - Falta validação de assinatura do webhook ASAS

---

## 💾 3. ANÁLISE DO BANCO DE DADOS

### 3.1 Estrutura Atual

#### Tabela: `pagamentos`
```sql
- id (UUID)
- pedido_id (UUID, UNIQUE)
- mp_payment_id (VARCHAR) ← USADO PARA ASAS (PROBLEMA!)
- mp_preference_id (VARCHAR)
- metodo (VARCHAR) DEFAULT 'pix'
- status (VARCHAR)
- valor (DECIMAL)
- pix_qr_code (TEXT)
- pix_qr_code_base64 (TEXT)
- pix_expiration (TIMESTAMPTZ)
- pago_em (TIMESTAMPTZ)
- raw_response (JSONB)
```

**Problema**: Campo `mp_payment_id` sendo usado para ASAS, mas nome sugere Mercado Pago.

#### Tabela: `ingressos`
```sql
- id (UUID)
- codigo (VARCHAR(20), UNIQUE) ← ATUALMENTE 8 CHARS
- pedido_id (UUID)
- pedido_item_id (UUID)
- usuario_id (UUID)
- evento_id (UUID)
- lote_id (UUID)
- nome_titular (VARCHAR)
- status (VARCHAR)
- qr_code (TEXT)
- utilizado_em (TIMESTAMPTZ)
```

**Problema**: Trigger gera código de 8 caracteres, mas usuário precisa de 5 dígitos.

### 3.2 Triggers e Funções

#### Função: `generate_ingresso_codigo()`
- Gera código de **8 caracteres alfanuméricos**
- Precisa ser alterado para **5 dígitos numéricos**

---

## 🔌 4. INTEGRAÇÃO COM ASAS

### 4.1 Arquivo: `src/lib/asaas.ts`

#### Funções Principais:
1. `criarOuBuscarCliente()` - ✅ Funcionando
2. `criarCobrancaPix()` - ✅ Funcionando
3. `obterQrCodePix()` - ✅ Funcionando (com retry)
4. `buscarCobranca()` - ✅ Funcionando
5. `mapearStatusAsaas()` - ✅ Funcionando

#### Problemas:
- Não há validação de webhook signature
- Não há tratamento de erros específicos do ASAS
- Falta campo específico no banco para `asaas_payment_id`

### 4.2 Webhook: `src/app/api/webhooks/asaas/route.ts`

#### Status:
- ✅ Recebe webhook do ASAS
- ✅ Atualiza pagamento e pedido
- ✅ Gera ingressos após aprovação
- ⚠️ **Falta validação de assinatura do webhook**

---

## 🎫 5. GERAÇÃO DE INGRESSOS

### 5.1 Processo Atual

1. **Após pagamento aprovado** (via webhook):
   - Busca pedido com itens
   - Para cada item, cria N ingressos (onde N = quantidade)
   - Gera código de 8 caracteres
   - Gera QR Code
   - Salva no banco

2. **Código atual**: 8 caracteres alfanuméricos (ex: `A3B7C9D2`)

### 5.2 Problema Identificado

**Usuário precisa de código de 5 dígitos numéricos** (ex: `12345`)

**Locais que precisam ser alterados:**
1. Trigger do banco: `generate_ingresso_codigo()`
2. Webhook ASAS: `gerarIngressos()`
3. Webhook Mercado Pago: `gerarIngressos()`
4. Simulação de pagamento: `simular-pagamento/route.ts`

---

## 🚨 6. PROBLEMAS CRÍTICOS IDENTIFICADOS

### 6.1 🔴 **CRÍTICO - Integração ASAS Não Totalmente Conectada**

**Problema:**
- Campo `mp_payment_id` sendo usado para armazenar ID do ASAS
- Nome do campo causa confusão
- Não há campo específico para ASAS

**Impacto:**
- Dificulta manutenção
- Pode causar bugs futuros
- Não permite usar múltiplos gateways simultaneamente

**Solução:**
- Adicionar campo `asaas_payment_id` na tabela `pagamentos`
- Migrar dados existentes
- Atualizar código para usar campo correto

### 6.2 🔴 **CRÍTICO - Código de Ingresso Incorreto**

**Problema:**
- Sistema gera código de 8 caracteres alfanuméricos
- Usuário precisa de código de 5 dígitos numéricos

**Impacto:**
- Códigos não atendem requisito do negócio
- Pode causar problemas na validação de ingressos

**Solução:**
- Alterar função `generate_ingresso_codigo()` para gerar 5 dígitos
- Atualizar todos os locais que geram código manualmente
- Garantir unicidade dos códigos

### 6.3 🟡 **MÉDIO - Falta de Flexibilidade no Método de Pagamento**

**Problema:**
- Sistema hardcoded para PIX via ASAS
- Não há abstração para trocar gateway facilmente

**Impacto:**
- Dificulta mudança de gateway
- Não permite múltiplos métodos de pagamento

**Solução:**
- Criar interface/abstração para gateway de pagamento
- Implementar factory pattern para gateways
- Permitir configuração via variáveis de ambiente

### 6.4 🟡 **MÉDIO - Webhook ASAS Sem Validação**

**Problema:**
- Webhook não valida assinatura
- Qualquer requisição POST pode atualizar pagamentos

**Impacto:**
- Risco de segurança
- Possibilidade de fraude

**Solução:**
- Implementar validação de assinatura do webhook ASAS
- Verificar origem da requisição

---

## 📝 7. PLANO DE MELHORIAS

### 7.1 FASE 1: Correções Críticas (Prioridade ALTA)

#### ✅ **Tarefa 1.1: Adicionar Campo ASAS no Banco**
- [ ] Criar migration para adicionar `asaas_payment_id` na tabela `pagamentos`
- [ ] Migrar dados existentes de `mp_payment_id` para `asaas_payment_id` (se forem ASAS)
- [ ] Manter `mp_payment_id` para compatibilidade futura com Mercado Pago

#### ✅ **Tarefa 1.2: Atualizar Código para Usar Campo ASAS**
- [ ] Atualizar `src/lib/asaas.ts` para salvar em `asaas_payment_id`
- [ ] Atualizar `src/app/api/comprar/route.ts`
- [ ] Atualizar `src/app/api/webhooks/asaas/route.ts`
- [ ] Atualizar queries que buscam por `mp_payment_id`

#### ✅ **Tarefa 1.3: Alterar Geração de Código para 5 Dígitos**
- [ ] Atualizar função SQL `generate_ingresso_codigo()` para gerar 5 dígitos numéricos
- [ ] Atualizar `src/app/api/webhooks/asaas/route.ts` (função `gerarIngressos`)
- [ ] Atualizar `src/app/api/webhooks/mercado-pago/route.ts` (função `gerarIngressos`)
- [ ] Atualizar `src/app/api/pedidos/[id]/simular-pagamento/route.ts`
- [ ] Testar unicidade dos códigos

### 7.2 FASE 2: Melhorias de Segurança e Robustez (Prioridade MÉDIA)

#### ✅ **Tarefa 2.1: Validar Webhook ASAS**
- [ ] Pesquisar documentação ASAS sobre validação de webhook
- [ ] Implementar validação de assinatura
- [ ] Adicionar logs de segurança

#### ✅ **Tarefa 2.2: Melhorar Tratamento de Erros**
- [ ] Adicionar tratamento específico para erros do ASAS
- [ ] Implementar retry com backoff exponencial
- [ ] Adicionar alertas para erros críticos

### 7.3 FASE 3: Flexibilidade e Escalabilidade (Prioridade BAIXA)

#### ✅ **Tarefa 3.1: Criar Abstração para Gateway de Pagamento**
- [ ] Criar interface `PaymentGateway`
- [ ] Implementar `AsaasGateway` e `MercadoPagoGateway`
- [ ] Criar factory para instanciar gateway baseado em config
- [ ] Refatorar código para usar abstração

#### ✅ **Tarefa 3.2: Suporte a Múltiplos Métodos de Pagamento**
- [ ] Adicionar campo `metodo_pagamento` na tabela `pagamentos`
- [ ] Implementar suporte a cartão de crédito (se necessário)
- [ ] Implementar suporte a boleto (se necessário)
- [ ] Atualizar UI para seleção de método

---

## 🔧 8. IMPLEMENTAÇÃO DAS CORREÇÕES

### 8.1 Migration: Adicionar Campo ASAS

```sql
-- Migration: Adicionar campo asaas_payment_id
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS asaas_payment_id VARCHAR(100);

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_pagamentos_asaas_payment_id 
ON pagamentos(asaas_payment_id);

-- Migrar dados existentes (se houver)
-- ATENÇÃO: Verificar se mp_payment_id contém IDs do ASAS antes de migrar
UPDATE pagamentos 
SET asaas_payment_id = mp_payment_id 
WHERE mp_payment_id IS NOT NULL 
  AND metodo = 'pix'
  AND asaas_payment_id IS NULL;
```

### 8.2 Atualizar Função de Geração de Código

```sql
-- Atualizar função para gerar código de 5 dígitos numéricos
CREATE OR REPLACE FUNCTION generate_ingresso_codigo()
RETURNS TRIGGER AS $$
DECLARE
  new_codigo VARCHAR(5) := '';
  i INTEGER;
BEGIN
  -- Gera código numérico de 5 dígitos (10000 a 99999)
  LOOP
    new_codigo := LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
    
    -- Verifica se já existe
    EXIT WHEN NOT EXISTS (SELECT 1 FROM ingressos WHERE codigo = new_codigo);
  END LOOP;
  
  NEW.codigo := new_codigo;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 8.3 Atualizar Código TypeScript

**Arquivo: `src/lib/asaas.ts`**
- Atualizar para salvar `asaas_payment_id` em vez de `mp_payment_id`

**Arquivo: `src/app/api/comprar/route.ts`**
- Atualizar para salvar `asaas_payment_id`

**Arquivo: `src/app/api/webhooks/asaas/route.ts`**
- Atualizar função `gerarIngressos()` para não gerar código manualmente (deixar trigger fazer)
- Ou atualizar para gerar código de 5 dígitos se necessário

---

## 📊 9. CHECKLIST DE VALIDAÇÃO

### Antes de Deploy:

- [ ] Migration executada com sucesso
- [ ] Códigos de ingresso sendo gerados com 5 dígitos
- [ ] Campo `asaas_payment_id` sendo preenchido corretamente
- [ ] Webhook ASAS funcionando
- [ ] Testes de compra end-to-end
- [ ] Validação de unicidade de códigos
- [ ] Logs de erro funcionando

### Testes Necessários:

1. **Teste de Compra Completa**
   - Criar pedido
   - Gerar PIX
   - Simular pagamento
   - Verificar geração de ingressos
   - Verificar código de 5 dígitos

2. **Teste de Webhook**
   - Enviar webhook simulado do ASAS
   - Verificar atualização de status
   - Verificar geração de ingressos

3. **Teste de Unicidade**
   - Gerar múltiplos ingressos
   - Verificar que todos têm códigos únicos
   - Verificar formato (5 dígitos numéricos)

---

## 🎯 10. PRÓXIMOS PASSOS RECOMENDADOS

### Imediato (Esta Semana):
1. ✅ Criar migration para campo ASAS
2. ✅ Atualizar função de geração de código
3. ✅ Atualizar código TypeScript
4. ✅ Testar fluxo completo

### Curto Prazo (Próximas 2 Semanas):
1. Implementar validação de webhook ASAS
2. Melhorar tratamento de erros
3. Adicionar logs estruturados
4. Documentar API

### Médio Prazo (Próximo Mês):
1. Criar abstração para gateway de pagamento
2. Implementar suporte a múltiplos métodos
3. Adicionar testes automatizados
4. Implementar monitoramento

---

## 📞 11. OBSERVAÇÕES FINAIS

### Pontos Positivos:
- ✅ Código bem estruturado e organizado
- ✅ TypeScript com tipagem adequada
- ✅ Fluxo de compra funcional
- ✅ Integração ASAS implementada
- ✅ Webhook configurado

### Pontos de Atenção:
- ⚠️ Falta campo específico para ASAS
- ⚠️ Código de ingresso não atende requisito (5 dígitos)
- ⚠️ Webhook sem validação de segurança
- ⚠️ Sistema não flexível para trocar gateway

### Recomendações:
1. **Priorizar correção do código de ingresso** (requisito de negócio)
2. **Adicionar campo ASAS** (melhora manutenibilidade)
3. **Implementar validação de webhook** (segurança)
4. **Criar abstração de gateway** (escalabilidade)

---

**Documento criado em:** 28/01/2026  
**Última atualização:** 28/01/2026  
**Versão:** 1.0
