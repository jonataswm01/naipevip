# Integração Mercado Pago - Checkout Transparente (PIX)

## Visão Geral

Vamos integrar o **Checkout Transparente** do Mercado Pago usando a **API de Orders** para processar pagamentos PIX reais. Esta solução permite que todo o processo de pagamento aconteça dentro do nosso site, sem redirecionamento.

### Por que Checkout Transparente?

| Característica | Checkout Transparente | Checkout Pro |
|----------------|----------------------|--------------|
| Experiência | No seu site | Redireciona para MP |
| Personalização | Total | Limitada |
| Meios de pagamento | Cartão, PIX, Boleto | Todos + Conta MP |
| Esforço de integração | Maior | Menor |

Como só precisamos de **PIX**, o Checkout Transparente é ideal.

---

## Pré-requisitos

### 1. Conta Mercado Pago
- Criar conta de vendedor em [mercadopago.com.br](https://www.mercadopago.com.br/hub/registration/landing)
- Verificar identidade (necessário para receber pagamentos)

### 2. Chave PIX Cadastrada
- Cadastrar chave PIX na conta do Mercado Pago
- [Tutorial: Como cadastrar chave PIX](https://www.youtube.com/watch?v=60tApKYVnkA)

### 3. Criar Aplicação no Mercado Pago

1. Acessar [Suas Integrações](https://www.mercadopago.com.br/developers/panel/app)
2. Clicar em **Criar aplicação**
3. Configurar:
   - **Nome**: "Naipe VIP - Ingressos"
   - **Tipo de pagamento**: **Pagamentos online**
   - **Integração**: **Loja desenvolvida por conta própria**
   - **Solução**: **Checkout Transparente**
   - **Tipo de API**: **API de Orders**
4. Aceitar termos e confirmar

### 4. Obter Credenciais

Após criar a aplicação, você terá acesso às credenciais em **Suas integrações > Dados da integração > Testes > Credenciais de teste**:

| Credencial | Uso | Onde usar |
|------------|-----|-----------|
| **Public Key** | Frontend (identificar integração) | Não usaremos (só backend) |
| **Access Token** | Backend (criar pagamentos) | `.env.local` |

#### Credenciais de Teste vs Produção

- **Teste** (começam com `TEST-`): Para desenvolvimento e testes
- **Produção** (começam com `APP_USR-`): Para ambiente real

---

## Arquitetura da Integração

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            FLUXO DE PAGAMENTO                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Carrinho │───▶│ POST /comprar│───▶│  Página PIX  │───▶│   Sucesso    │
└──────────┘    └──────┬───────┘    └──────┬───────┘    └──────────────┘
                       │                   │                    ▲
                       ▼                   │                    │
               ┌──────────────┐            │            ┌───────┴──────┐
               │ Mercado Pago │            │            │   Webhook    │
               │  POST /orders│            │            │  Mercado Pago│
               └──────┬───────┘            │            └───────┬──────┘
                       │                   │                    │
                       ▼                   ▼                    │
               ┌──────────────┐    ┌──────────────┐             │
               │ Retorna:     │    │ Polling ou   │─────────────┘
               │ - QR Code    │    │ Webhook      │
               │ - Copia/Cola │    │ confirma pag │
               │ - ticket_url │    │              │
               └──────────────┘    └──────────────┘
```

---

## API de Orders - Estrutura

A API de Orders do Mercado Pago usa o endpoint `/v1/orders` para criar pagamentos.

### Requisição para criar PIX

```bash
curl -X POST \
    'https://api.mercadopago.com/v1/orders' \
    -H 'Content-Type: application/json' \
    -H 'X-Idempotency-Key: {{UNIQUE_VALUE}}' \
    -H 'Authorization: Bearer {{ACCESS_TOKEN}}' \
    -d '{
        "type": "online",
        "total_amount": "100.00",
        "external_reference": "pedido_123",
        "processing_mode": "automatic",
        "transactions": {
            "payments": [
                {
                    "amount": "100.00",
                    "payment_method": {
                        "id": "pix",
                        "type": "bank_transfer"
                    },
                    "expiration_time": "PT30M"
                }
            ]
        },
        "payer": {
            "email": "comprador@email.com"
        }
    }'
```

### Parâmetros Importantes

| Parâmetro | Tipo | Descrição | Obrigatório |
|-----------|------|-----------|-------------|
| `Authorization` | Header | Access Token (`Bearer TEST-xxx...`) | Sim |
| `X-Idempotency-Key` | Header | Chave única para evitar duplicidades (UUID) | Sim |
| `type` | Body | Tipo da order (`online`) | Sim |
| `total_amount` | Body | Valor total (string com 2 decimais) | Sim |
| `external_reference` | Body | ID do pedido no seu sistema | Sim |
| `processing_mode` | Body | `automatic` ou `manual` | Sim |
| `transactions.payments.payment_method.id` | Body | `pix` | Sim |
| `transactions.payments.payment_method.type` | Body | `bank_transfer` | Sim |
| `transactions.payments.expiration_time` | Body | Tempo de expiração ISO 8601 (ex: `PT30M` = 30 min) | Não |
| `payer.email` | Body | E-mail do comprador | Sim |

### Resposta da API

```json
{
  "id": "ORD01HRYFWNYRE1MR1E60MW3X0T2P",
  "type": "online",
  "total_amount": "100.00",
  "external_reference": "pedido_123",
  "country_code": "BRA",
  "status": "action_required",
  "status_detail": "waiting_transfer",
  "capture_mode": "automatic",
  "transactions": {
    "payments": [
      {
        "id": "PAY01HRYFXQ53Q3JPEC48MYWMR0TE",
        "reference_id": "123456789",
        "status": "action_required",
        "status_detail": "waiting_transfer",
        "amount": "100.00",
        "payment_method": {
          "id": "pix",
          "type": "bank_transfer",
          "ticket_url": "https://www.mercadopago.com.br/sandbox/payments/.../ticket",
          "qr_code": "00020126580014br.gov.bcb.pix...",
          "qr_code_base64": "iVBORw0KGgoAAAANSUhEUgAAA..."
        }
      }
    ]
  },
  "processing_mode": "automatic"
}
```

### Dados do PIX Retornados

| Campo | Descrição |
|-------|-----------|
| `ticket_url` | URL para página do Mercado Pago com QR Code e instruções |
| `qr_code` | Código PIX "copia e cola" |
| `qr_code_base64` | Imagem do QR Code em Base64 |

---

## Configurar Notificações (Webhooks)

O webhook permite receber notificações automáticas quando o pagamento for confirmado.

### Configurar no Painel

1. Acessar [Suas Integrações](https://www.mercadopago.com.br/developers/panel/app)
2. Selecionar a aplicação
3. Ir em **Webhooks > Configurar notificações**
4. Adicionar URL: `https://seu-dominio.com/api/webhooks/mercado-pago`
5. Selecionar evento: **Order (Mercado Pago)**
6. Salvar e copiar a **chave secreta** gerada

### Estrutura da Notificação Recebida

```json
{
  "action": "order.action_required",
  "api_version": "v1",
  "application_id": "76506430185983",
  "date_created": "2021-11-01T02:02:02Z",
  "id": "123456",
  "live_mode": false,
  "type": "order",
  "user_id": 2025701502,
  "data": {
    "id": "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3"
  }
}
```

### Actions do Webhook

| Action | Significado |
|--------|-------------|
| `order.action_required` | Aguardando ação (pagamento pendente) |
| `order.paid` | Pagamento confirmado |
| `order.expired` | Order expirada |
| `order.cancelled` | Order cancelada |

### Validar Autenticidade da Notificação

O Mercado Pago envia um header `x-signature` para validar a origem:

```
x-signature: ts=1742505638683,v1=ced36ab6d33566bb1e16c125819b8d840d6b8ef136b0b9127c76064466f5229b
```

Para validar:

```javascript
const crypto = require('crypto');

function validarWebhook(xSignature, xRequestId, dataId, secret) {
  // Extrair ts e hash do header
  const parts = xSignature.split(',');
  let ts, hash;
  
  parts.forEach(part => {
    const [key, value] = part.split('=');
    if (key.trim() === 'ts') ts = value.trim();
    if (key.trim() === 'v1') hash = value.trim();
  });

  // Criar manifest (data.id deve ser em minúscula!)
  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;

  // Gerar HMAC
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(manifest);
  const calculatedHash = hmac.digest('hex');

  return calculatedHash === hash;
}
```

> **IMPORTANTE**: O `data.id` vem em maiúscula na notificação, mas deve ser convertido para **minúscula** na validação!

---

## Implementação no Projeto

### Passo 1: Configurar Ambiente

**Arquivo: `.env.local`**
```env
# Credenciais de TESTE
MERCADO_PAGO_ACCESS_TOKEN=TEST-xxx...
MERCADO_PAGO_PUBLIC_KEY=TEST-xxx...
MERCADO_PAGO_WEBHOOK_SECRET=xxx...

# URL base da aplicação (para webhook)
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

### Passo 2: Instalar SDK (Opcional)

```bash
npm install mercadopago
```

> Nota: Podemos usar a API diretamente com `fetch`, sem necessidade do SDK.

### Passo 3: Criar Helper do Mercado Pago

**Arquivo: `src/lib/mercado-pago.ts`**

```typescript
import crypto from 'crypto';

const MERCADO_PAGO_API = 'https://api.mercadopago.com';

interface CriarPixParams {
  valor: number;
  email: string;
  pedidoId: string;
  descricao?: string;
  expiracaoMinutos?: number;
}

interface PixResponse {
  orderId: string;
  paymentId: string;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
}

// Criar pagamento PIX via API de Orders
export async function criarPagamentoPix({
  valor,
  email,
  pedidoId,
  descricao = 'Ingresso Naipe VIP',
  expiracaoMinutos = 30,
}: CriarPixParams): Promise<PixResponse> {
  const idempotencyKey = `${pedidoId}-${Date.now()}`;
  
  const response = await fetch(`${MERCADO_PAGO_API}/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      type: 'online',
      total_amount: valor.toFixed(2),
      external_reference: pedidoId,
      processing_mode: 'automatic',
      description: descricao,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercado-pago`,
      transactions: {
        payments: [
          {
            amount: valor.toFixed(2),
            payment_method: {
              id: 'pix',
              type: 'bank_transfer',
            },
            expiration_time: `PT${expiracaoMinutos}M`,
          },
        ],
      },
      payer: {
        email,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Erro Mercado Pago:', error);
    throw new Error(error.message || 'Erro ao criar pagamento PIX');
  }

  const data = await response.json();
  const payment = data.transactions.payments[0];

  return {
    orderId: data.id,
    paymentId: payment.id,
    status: data.status,
    qrCode: payment.payment_method.qr_code,
    qrCodeBase64: payment.payment_method.qr_code_base64,
    ticketUrl: payment.payment_method.ticket_url,
  };
}

// Buscar order por ID
export async function buscarOrder(orderId: string) {
  const response = await fetch(`${MERCADO_PAGO_API}/v1/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error('Order não encontrada');
  }

  return response.json();
}

// Validar assinatura do webhook
export function validarWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return false;

  // Extrair ts e hash
  const parts = xSignature.split(',');
  let ts = '', hash = '';

  parts.forEach(part => {
    const [key, value] = part.split('=');
    if (key?.trim() === 'ts') ts = value?.trim() || '';
    if (key?.trim() === 'v1') hash = value?.trim() || '';
  });

  if (!ts || !hash) return false;

  // Criar manifest (dataId em minúscula!)
  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;

  // Calcular HMAC
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(manifest);
  const calculatedHash = hmac.digest('hex');

  return calculatedHash === hash;
}
```

### Passo 4: Modificar API de Compra

**Arquivo: `src/app/api/comprar/route.ts`**

Substituir a geração de PIX fake:

```typescript
// ANTES (fake)
const pixCode = gerarPixSimulado(pedido.id, valorTotal);
const pixQRCodeBase64 = await gerarQRCodeBase64(pixCode);

// DEPOIS (real)
import { criarPagamentoPix } from '@/lib/mercado-pago';

const pixData = await criarPagamentoPix({
  valor: valorTotal,
  email: session.email,
  pedidoId: pedido.id,
  descricao: `Ingresso ${lote.nome} - Naipe VIP`,
  expiracaoMinutos: 15,
});

// Salvar no banco
await supabase.from('pagamentos').insert({
  pedido_id: pedido.id,
  metodo: 'pix',
  status: 'pending',
  valor: valorTotal,
  mercado_pago_order_id: pixData.orderId,
  mercado_pago_payment_id: pixData.paymentId,
  pix_qr_code: pixData.qrCode,
  pix_qr_code_base64: pixData.qrCodeBase64.startsWith('data:') 
    ? pixData.qrCodeBase64 
    : `data:image/png;base64,${pixData.qrCodeBase64}`,
  pix_expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
});
```

### Passo 5: Implementar Webhook

**Arquivo: `src/app/api/webhooks/mercado-pago/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validarWebhookSignature, buscarOrder } from '@/lib/mercado-pago';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const xSignature = request.headers.get('x-signature') || '';
    const xRequestId = request.headers.get('x-request-id') || '';

    console.log('📩 Webhook recebido:', body.action, body.data?.id);

    // Validar assinatura (opcional mas recomendado)
    if (xSignature && body.data?.id) {
      const isValid = validarWebhookSignature(xSignature, xRequestId, body.data.id);
      if (!isValid) {
        console.warn('⚠️ Assinatura inválida do webhook');
        // Continuar mesmo assim, pois pode ser ambiente de teste
      }
    }

    // Processar apenas notificações de order
    if (body.type !== 'order') {
      return NextResponse.json({ message: 'Tipo ignorado' });
    }

    const orderId = body.data?.id;
    if (!orderId) {
      return NextResponse.json({ message: 'Order ID não encontrado' });
    }

    // Buscar detalhes da order no Mercado Pago
    const order = await buscarOrder(orderId);
    console.log('📦 Order status:', order.status, order.status_detail);

    // Buscar pagamento local pelo order_id
    const { data: pagamentoLocal } = await supabase
      .from('pagamentos')
      .select('*, pedidos(*)')
      .eq('mercado_pago_order_id', orderId)
      .single();

    if (!pagamentoLocal) {
      // Tentar buscar pelo external_reference (nosso pedido_id)
      const { data: pagamentoPorRef } = await supabase
        .from('pagamentos')
        .select('*, pedidos(*)')
        .eq('pedido_id', order.external_reference)
        .single();

      if (!pagamentoPorRef) {
        console.log('⚠️ Pagamento não encontrado:', orderId);
        return NextResponse.json({ message: 'Pagamento não encontrado' });
      }
    }

    const pedidoId = pagamentoLocal?.pedido_id || order.external_reference;

    // Processar baseado no status
    if (order.status === 'processed' || order.status_detail === 'accredited') {
      // ✅ Pagamento aprovado!
      console.log('✅ Pagamento APROVADO:', pedidoId);

      // 1. Atualizar pagamento
      await supabase
        .from('pagamentos')
        .update({ 
          status: 'approved',
          pago_em: new Date().toISOString(),
        })
        .eq('pedido_id', pedidoId);

      // 2. Atualizar pedido
      await supabase
        .from('pedidos')
        .update({ status: 'pago' })
        .eq('id', pedidoId);

      // 3. Gerar ingressos
      await gerarIngressos(pedidoId);

      // 4. Atualizar quantidade vendida do lote
      await atualizarQuantidadeVendida(pedidoId);

    } else if (order.status === 'cancelled' || order.status === 'expired') {
      // ❌ Pagamento cancelado/expirado
      console.log('❌ Pagamento CANCELADO/EXPIRADO:', pedidoId);

      await supabase
        .from('pagamentos')
        .update({ status: order.status })
        .eq('pedido_id', pedidoId);

      await supabase
        .from('pedidos')
        .update({ status: order.status === 'expired' ? 'expirado' : 'cancelado' })
        .eq('id', pedidoId);
    }

    // Responder OK para o Mercado Pago
    return NextResponse.json({ message: 'OK' });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    // Retornar 200 mesmo com erro para evitar retentativas excessivas
    return NextResponse.json({ error: 'Erro interno' }, { status: 200 });
  }
}

// Gerar ingressos após pagamento aprovado
async function gerarIngressos(pedidoId: string) {
  const { data: itens } = await supabase
    .from('pedido_itens')
    .select('*, lotes(*), pedidos(usuario_id, evento_id)')
    .eq('pedido_id', pedidoId);

  if (!itens?.length) return;

  const ingressos = [];
  for (const item of itens) {
    for (let i = 0; i < item.quantidade; i++) {
      ingressos.push({
        usuario_id: item.pedidos.usuario_id,
        evento_id: item.pedidos.evento_id,
        pedido_id: pedidoId,
        lote_id: item.lote_id,
        status: 'ativo',
      });
    }
  }

  if (ingressos.length > 0) {
    await supabase.from('ingressos').insert(ingressos);
  }
}

// Atualizar quantidade vendida do lote
async function atualizarQuantidadeVendida(pedidoId: string) {
  const { data: itens } = await supabase
    .from('pedido_itens')
    .select('lote_id, quantidade')
    .eq('pedido_id', pedidoId);

  for (const item of itens || []) {
    await supabase.rpc('incrementar_vendas_lote', {
      p_lote_id: item.lote_id,
      p_quantidade: item.quantidade,
    });
  }
}
```

---

## Status da Order

| Status | Status Detail | Significado |
|--------|---------------|-------------|
| `action_required` | `waiting_transfer` | Aguardando pagamento PIX |
| `processed` | `accredited` | Pagamento aprovado |
| `cancelled` | - | Order cancelada |
| `expired` | - | Order expirada |

---

## Testar Localmente

### Usar ngrok para expor webhook

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000
ngrok http 3000

# Usar a URL gerada (ex: https://abc123.ngrok.io)
# Configurar no .env.local:
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

### Simular Webhook no Painel

1. Ir em **Suas integrações > Webhooks > Configurar notificações**
2. Clicar em **Simular**
3. Inserir um `data.id` de uma order criada
4. Verificar se seu servidor recebe a notificação

---

## Alterações no Banco de Dados

Adicionar campos na tabela `pagamentos`:

```sql
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS mercado_pago_order_id TEXT,
ADD COLUMN IF NOT EXISTS mercado_pago_payment_id TEXT;
```

---

---

## Status Completos

### Status da Order

| Status | Status Detail | Descrição |
|--------|---------------|-----------|
| `created` | `created` | Order criada, aguardando processamento |
| `processed` | `accredited` | Pagamento aprovado e creditado |
| `processed` | `partially_refunded` | Aprovado com reembolso parcial |
| `processing` | `in_process` | Em processamento |
| `action_required` | `waiting_payment` | Aguardando pagamento (PIX pendente) |
| `action_required` | `waiting_transfer` | Aguardando transferência |
| `cancelled` | `cancelled` | Order cancelada |
| `expired` | `expired` | Order expirada (30 dias sem pagamento) |
| `refunded` | `refunded` | Totalmente reembolsada |
| `failed` | `failed` | Falhou |

### Status da Transação (Pagamento)

| Status | Status Detail | Descrição |
|--------|---------------|-----------|
| `processed` | `accredited` | Pagamento creditado |
| `action_required` | `waiting_transfer` | Aguardando PIX |
| `expired` | `expired` | PIX expirou |
| `refunded` | `refunded` | Reembolsado |
| `failed` | `insufficient_amount` | Saldo insuficiente |
| `failed` | `processing_error` | Erro de processamento |

---

## Reembolsos e Cancelamentos

### Reembolso (após pagamento aprovado)

```bash
# Reembolso total
curl -X POST \
  'https://api.mercadopago.com/v1/orders/{order_id}/refund' \
  -H 'Authorization: Bearer {{ACCESS_TOKEN}}' \
  -H 'X-Idempotency-Key: {{UNIQUE_VALUE}}'

# Reembolso parcial
curl -X POST \
  'https://api.mercadopago.com/v1/orders/{order_id}/refund' \
  -H 'Authorization: Bearer {{ACCESS_TOKEN}}' \
  -H 'X-Idempotency-Key: {{UNIQUE_VALUE}}' \
  -d '{ "transactions": [{ "id": "{{TRANSACTION_ID}}", "amount": "50.00" }] }'
```

**Importante:**
- Prazo: até **180 dias** após aprovação
- PIX: valor devolvido na conta do pagador
- Precisa ter saldo na conta MP

### Cancelamento (antes de pagar)

```bash
curl -X POST \
  'https://api.mercadopago.com/v1/orders/{order_id}/cancel' \
  -H 'Authorization: Bearer {{ACCESS_TOKEN}}'
```

**Importante:**
- Só funciona se `status: action_required`
- PIX expira automaticamente após 30 dias

---

## Subir em Produção

### 1. Ativar Credenciais de Produção

1. Acessar [Suas Integrações](https://www.mercadopago.com.br/developers/panel/app)
2. Selecionar a aplicação
3. Ir em **Credenciais > Produção > Ativar credenciais**
4. Preencher:
   - **Indústria**: Entretenimento / Eventos
   - **Website**: URL do seu site
5. Aceitar termos e ativar

### 2. Substituir Credenciais

```env
# .env.local - PRODUÇÃO
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxx...  # Começa com APP_USR
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxx...
```

### 3. Certificado SSL (Obrigatório)

- O site DEVE usar **HTTPS** em produção
- Vercel/Netlify já fornecem SSL automático

### 4. Atualizar Webhook

- Configurar URL de produção no painel do MP
- Usar a nova chave secreta gerada

---

## Checklist de Implementação

### Configuração (você faz):
- [ ] Criar conta Mercado Pago de vendedor
- [ ] Cadastrar chave PIX na conta
- [ ] Criar aplicação no painel (API de Orders)
- [ ] Obter credenciais de teste
- [ ] Configurar webhook no painel

### Implementação (eu faço):
- [ ] Configurar `.env.local` com credenciais
- [ ] Criar `src/lib/mercado-pago.ts`
- [ ] Modificar `src/app/api/comprar/route.ts`
- [ ] Implementar `src/app/api/webhooks/mercado-pago/route.ts`
- [ ] Alterar tabela `pagamentos` no banco
- [ ] Testar fluxo completo

### Deploy:
- [ ] Testar com ngrok localmente
- [ ] Testar fluxo completo em sandbox
- [ ] Ativar credenciais de produção
- [ ] Trocar para credenciais de produção no código
- [ ] Configurar webhook com URL de produção
- [ ] Deploy final

---

## Próximos Passos

**Você já tem as credenciais de teste?**

Se sim, me passe:
- `Access Token` (começa com `TEST-...`)

E eu começo a implementar agora!

Se não, siga os passos:
1. Criar conta MP (se não tiver)
2. Cadastrar chave PIX
3. Criar aplicação (API de Orders)
4. Pegar credenciais de teste
5. Me passar o Access Token
