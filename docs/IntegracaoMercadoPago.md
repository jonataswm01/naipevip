# Integração Mercado Pago - Checkout Transparente (PIX)

## Visão Geral

Vamos integrar o **Checkout Transparente** do Mercado Pago para processar pagamentos PIX reais. Esta solução permite que todo o processo de pagamento aconteça dentro do nosso site, sem redirecionamento.

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
   - Nome: "Naipe VIP - Ingressos"
   - Tipo: **Pagamentos online**
   - Integração: **Loja desenvolvida por conta própria**
   - Solução: **Checkout Transparente**
   - API: **API de Orders**
4. Aceitar termos e confirmar

### 4. Obter Credenciais

Após criar a aplicação, você terá acesso às credenciais:

| Credencial | Uso | Onde usar |
|------------|-----|-----------|
| **Public Key** | Frontend (identificar integração) | Não usaremos (só backend) |
| **Access Token** | Backend (criar pagamentos) | `.env.local` |

#### Credenciais de Teste vs Produção

- **Teste**: Para desenvolvimento e testes (não processa pagamentos reais)
- **Produção**: Para ambiente real (processa pagamentos de verdade)

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
               │  (Criar PIX) │            │            │  Mercado Pago│
               └──────┬───────┘            │            └───────┬──────┘
                       │                   │                    │
                       ▼                   ▼                    │
               ┌──────────────┐    ┌──────────────┐             │
               │ Retorna:     │    │ Polling ou   │─────────────┘
               │ - QR Code    │    │ Webhook      │
               │ - Copia/Cola │    │ verifica     │
               │ - ID do pag. │    │ pagamento    │
               └──────────────┘    └──────────────┘
```

---

## O Que Precisamos Implementar

### 1. Configuração de Ambiente

**Arquivo: `.env.local`**
```env
# Credenciais de TESTE (desenvolvimento)
MERCADO_PAGO_ACCESS_TOKEN=TEST-xxxx...
MERCADO_PAGO_PUBLIC_KEY=TEST-xxxx...

# Credenciais de PRODUÇÃO (quando for ao ar)
# MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxx...
# MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxxx...

# URL do webhook (para MP notificar pagamentos)
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

### 2. Instalar SDK do Mercado Pago

```bash
npm install mercadopago
```

### 3. Modificar Arquivos

| Arquivo | Ação |
|---------|------|
| `src/lib/mercado-pago.ts` | Configurar SDK e criar funções helper |
| `src/app/api/comprar/route.ts` | Criar pagamento PIX real via API |
| `src/app/api/webhooks/mercado-pago/route.ts` | Receber notificação de pagamento |
| `src/app/compra/pix/[pedidoId]/page.tsx` | Nenhuma mudança (já funciona) |

---

## Implementação Detalhada

### Passo 1: Configurar SDK (`src/lib/mercado-pago.ts`)

```typescript
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Configurar cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 }
});

// Instância para criar pagamentos
export const paymentClient = new Payment(client);

// Função para criar pagamento PIX
export async function criarPagamentoPix({
  valor,
  descricao,
  email,
  nome,
  cpf,
  pedidoId,
}: {
  valor: number;
  descricao: string;
  email: string;
  nome: string;
  cpf: string;
  pedidoId: string;
}) {
  const nomeParts = nome.split(' ');
  const firstName = nomeParts[0];
  const lastName = nomeParts.slice(1).join(' ') || firstName;

  const response = await paymentClient.create({
    body: {
      transaction_amount: valor,
      payment_method_id: 'pix',
      payer: {
        email,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: 'CPF',
          number: cpf.replace(/\D/g, ''),
        },
      },
      description: descricao,
      external_reference: pedidoId, // ID do nosso pedido
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercado-pago`,
    },
  });

  return {
    id: response.id,
    status: response.status,
    qrCode: response.point_of_interaction?.transaction_data?.qr_code,
    qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64,
    ticketUrl: response.point_of_interaction?.transaction_data?.ticket_url,
    expirationDate: response.date_of_expiration,
  };
}

// Função para buscar status do pagamento
export async function buscarPagamento(paymentId: string) {
  const response = await paymentClient.get({ id: paymentId });
  return {
    id: response.id,
    status: response.status,
    statusDetail: response.status_detail,
    externalReference: response.external_reference,
  };
}
```

### Passo 2: Modificar API de Compra (`src/app/api/comprar/route.ts`)

Substituir a geração de PIX fake pela chamada real:

```typescript
// ANTES (fake)
const pixCode = gerarPixSimulado(pedido.id, valorTotal);
const pixQRCodeBase64 = await gerarQRCodeBase64(pixCode);

// DEPOIS (real)
import { criarPagamentoPix } from '@/lib/mercado-pago';

const pagamentoMP = await criarPagamentoPix({
  valor: valorTotal,
  descricao: `Ingresso ${lote.nome} - Naipe VIP`,
  email: session.email,
  nome: session.nome,
  cpf: session.cpf,
  pedidoId: pedido.id,
});

// Salvar no banco
await supabase.from('pagamentos').insert({
  pedido_id: pedido.id,
  metodo: 'pix',
  status: 'pending',
  valor: valorTotal,
  mercado_pago_id: pagamentoMP.id?.toString(),
  pix_qr_code: pagamentoMP.qrCode,
  pix_qr_code_base64: `data:image/png;base64,${pagamentoMP.qrCodeBase64}`,
  pix_expiration: pagamentoMP.expirationDate,
});
```

### Passo 3: Implementar Webhook (`src/app/api/webhooks/mercado-pago/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { buscarPagamento } from '@/lib/mercado-pago';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mercado Pago envia diferentes tipos de notificação
    if (body.type === 'payment' || body.action === 'payment.updated') {
      const paymentId = body.data?.id || body.id;
      
      if (!paymentId) {
        return NextResponse.json({ error: 'Payment ID não encontrado' }, { status: 400 });
      }

      // Buscar detalhes do pagamento no Mercado Pago
      const pagamento = await buscarPagamento(paymentId.toString());
      
      // Buscar nosso registro de pagamento
      const { data: pagamentoLocal } = await supabase
        .from('pagamentos')
        .select('*, pedidos(*)')
        .eq('mercado_pago_id', paymentId.toString())
        .single();

      if (!pagamentoLocal) {
        console.log('Pagamento não encontrado:', paymentId);
        return NextResponse.json({ message: 'OK' });
      }

      const pedidoId = pagamentoLocal.pedido_id;

      // Mapear status do Mercado Pago para nosso sistema
      if (pagamento.status === 'approved') {
        // Pagamento aprovado!
        
        // 1. Atualizar pagamento
        await supabase
          .from('pagamentos')
          .update({ 
            status: 'approved',
            pago_em: new Date().toISOString()
          })
          .eq('id', pagamentoLocal.id);

        // 2. Atualizar pedido
        await supabase
          .from('pedidos')
          .update({ status: 'pago' })
          .eq('id', pedidoId);

        // 3. Gerar ingressos
        await gerarIngressos(pedidoId);
        
        // 4. Atualizar quantidade vendida do lote
        await atualizarQuantidadeVendida(pedidoId);

        console.log('✅ Pagamento aprovado:', pedidoId);
      } else if (pagamento.status === 'rejected') {
        // Pagamento rejeitado
        await supabase
          .from('pagamentos')
          .update({ status: 'rejected' })
          .eq('id', pagamentoLocal.id);

        await supabase
          .from('pedidos')
          .update({ status: 'cancelado' })
          .eq('id', pedidoId);

        console.log('❌ Pagamento rejeitado:', pedidoId);
      }
    }

    return NextResponse.json({ message: 'OK' });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// Função para gerar ingressos após pagamento
async function gerarIngressos(pedidoId: string) {
  // Buscar itens do pedido
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

  await supabase.from('ingressos').insert(ingressos);
}

// Função para atualizar quantidade vendida do lote
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

## Status do Mercado Pago

| Status MP | Significado | Ação no Sistema |
|-----------|-------------|-----------------|
| `pending` | Aguardando pagamento | Manter pedido pendente |
| `approved` | Pago | Gerar ingressos |
| `rejected` | Rejeitado | Cancelar pedido |
| `cancelled` | Cancelado | Cancelar pedido |
| `refunded` | Reembolsado | Cancelar ingressos |

---

## Testes

### Ambiente de Testes

O Mercado Pago fornece um ambiente sandbox para testes:

1. Use as **Credenciais de Teste** (começam com `TEST-`)
2. Use [Usuários de Teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-users)
3. O PIX de teste pode ser "pago" simulando via API ou painel

### Testar Webhook Localmente

Use o [ngrok](https://ngrok.com/) para expor sua máquina local:

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000
ngrok http 3000

# Copiar URL gerada (ex: https://abc123.ngrok.io)
# Usar como NEXT_PUBLIC_APP_URL no .env.local
```

---

## Checklist de Implementação

- [ ] Criar conta Mercado Pago de vendedor
- [ ] Cadastrar chave PIX na conta
- [ ] Criar aplicação no painel de desenvolvedores
- [ ] Obter credenciais de teste
- [ ] Instalar SDK: `npm install mercadopago`
- [ ] Configurar `.env.local` com credenciais
- [ ] Implementar `src/lib/mercado-pago.ts`
- [ ] Modificar `src/app/api/comprar/route.ts`
- [ ] Implementar webhook `src/app/api/webhooks/mercado-pago/route.ts`
- [ ] Testar com ngrok localmente
- [ ] Testar fluxo completo em sandbox
- [ ] Trocar para credenciais de produção
- [ ] Deploy em produção

---

## Próximos Passos

1. **Você precisa**: Criar conta MP, cadastrar PIX, criar aplicação e pegar credenciais
2. **Eu implemento**: Todo o código necessário

Quando tiver as credenciais de teste, me avise para implementarmos!
