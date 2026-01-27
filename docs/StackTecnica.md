# Stack Técnica – Tardezinha Pré-Carnaval

## 1. Visão Geral do Projeto

**Tipo:** Landing Page Mobile-First para venda de ingressos  
**Objetivo:** Conversão de visitantes em compradores de ingressos  
**Foco:** Experiência imersiva com identidade visual artística brasileira

---

## 2. Requisitos Técnicos Identificados

### 2.1 Frontend
- ✅ Mobile-first (100% otimizado para celular)
- ✅ Design artístico imersivo com arte como protagonista
- ✅ Scroll vertical fluido
- ✅ Botão flutuante de compra
- ✅ Tipografia específica (Cinzel, Source Serif 4/Libre Baskerville)
- ✅ Paleta de cores terrosas e quentes
- ✅ Performance otimizada
- ✅ SEO básico

### 2.2 Backend/Funcionalidades
- ✅ Sistema de ingressos (lotes, preços, limites)
- ✅ Integração de pagamento (Pix)
- ✅ Confirmação via WhatsApp
- ✅ Gerenciamento de compras
- ✅ Revelação de local após compra
- ✅ Controle de estoque de ingressos

### 2.3 Infraestrutura
- ✅ Hospedagem confiável
- ✅ SSL/HTTPS
- ✅ Domínio próprio
- ✅ Backup de dados

---

## 3. Stack Técnica Proposta

### 3.1 Frontend

#### Framework: **Next.js 14+ (App Router)**
**Justificativa:**
- ✅ Performance otimizada (SSR/SSG)
- ✅ SEO nativo
- ✅ Mobile-first por padrão
- ✅ Otimização de imagens automática
- ✅ Roteamento eficiente
- ✅ Suporte a TypeScript

**Alternativa:** React + Vite (se preferir SPA puro)

#### Estilização: **Tailwind CSS + CSS Modules**
**Justificativa:**
- ✅ Desenvolvimento rápido
- ✅ Customização total das cores terrosas
- ✅ Responsividade nativa
- ✅ Performance (purge automático)
- ✅ CSS Modules para componentes específicos com texturas/efeitos artísticos

**Extras:**
- `framer-motion` para animações suaves de scroll e transições
- `react-intersection-observer` para animações on-scroll

#### Tipografia:
- **Google Fonts** para Cinzel e Source Serif 4
- Carregamento otimizado com `next/font`

#### Imagens/Arte:
- **Next.js Image** para otimização automática
- **WebP/AVIF** para compressão
- Lazy loading nativo

---

### 3.2 Backend/API

#### **Next.js API Routes (server-only)**
**Justificativa:**
- ✅ Tudo em um projeto
- ✅ Deploy simplificado
- ✅ Ideal para landing pages
- ✅ Custo reduzido
- ✅ Segredos e integrações sempre ocultos no servidor

**Diretriz de segurança:**
- O frontend **não acessa** Supabase, Mercado Pago ou n8n diretamente.
- Todas as chamadas sensíveis passam por API Routes (server-side).

**Estrutura sugerida:**
- `/api/ingressos` - Listar ingressos e lotes
- `/api/comprar` - Criar cobrança Pix no Mercado Pago
- `/api/webhooks/mercado-pago` - Receber confirmação de pagamento
- `/api/n8n` - Disparar workflows (confirmação, envio de ingresso, etc.)

---

### 3.3 Banco de Dados

#### **Supabase (PostgreSQL) via API direta**
**Justificativa:**
- ✅ Relacional (ideal para ingressos, compras, lotes)
- ✅ Escalável
- ✅ API pronta para uso (REST/JS)
- ✅ Backup automático (cloud)

**Diretriz:**
- Acesso ao Supabase **apenas no server-side** (API Routes).

**Estrutura de tabelas:**
- `ingressos` - Lotes, preços, estoque
- `compras` - Transações
- `clientes` - Dados de compradores

---

### 3.4 Pagamento (Pix)

#### **Mercado Pago (Pix)**
**Justificativa:**
- ✅ Suporte nativo a Pix
- ✅ Webhooks confiáveis
- ✅ Documentação em português (Mercado Pago)
- ✅ SDKs para Node.js
- ✅ Painel administrativo

**Fluxo:**
1. Cliente seleciona ingresso
2. API Route gera QR Code Pix via Mercado Pago
3. Cliente paga
4. Webhook confirma pagamento (recebido via API Route ou n8n)
5. n8n atualiza Supabase e dispara confirmações
6. Libera local completo

---

### 3.5 Automação e Endpoints

#### **n8n (webhooks e workflows)**
**Justificativa:**
- ✅ Orquestração de fluxos (pagamento → confirmação → envio)
- ✅ Conecta Mercado Pago, Supabase e canais de comunicação
- ✅ Centraliza webhooks e notificações

**Uso previsto:**
- Receber webhooks de pagamento
- Atualizar dados no Supabase
- Disparar confirmação (WhatsApp/Email) quando aplicável

---

### 3.6 Autenticação (Opcional)

#### **NextAuth.js** ou **Clerk**
**Justificativa:**
- ✅ Se houver área administrativa
- ✅ Controle de acesso
- ✅ Gestão de usuários

**Nota:** Para landing page simples, pode não ser necessário inicialmente.

---

### 3.7 Hospedagem/Deploy

#### **Vercel** (Recomendado)
**Justificativa:**
- ✅ Otimizado para Next.js
- ✅ Deploy automático (Git)
- ✅ SSL gratuito
- ✅ CDN global
- ✅ Performance excelente
- ✅ Plano gratuito robusto

**Alternativas:**
- **Netlify** - Similar ao Vercel
- **Railway** - Full-stack com banco
- **Render** - Full-stack com banco

---

### 3.8 Monitoramento e Analytics

#### **Vercel Analytics** (gratuito)
- Performance
- Core Web Vitals

#### **Google Analytics 4** (opcional)
- Conversões
- Comportamento do usuário

---

## 4. Stack Completa Recomendada

### Stack Principal (Full-Stack Next.js)

```
Frontend:
├── Next.js 14+ (App Router)
├── TypeScript
├── Tailwind CSS
├── Framer Motion
├── React Intersection Observer
└── Google Fonts (Cinzel, Source Serif 4)

Backend:
├── Next.js API Routes
└── Supabase API (PostgreSQL)

Pagamento:
└── Mercado Pago API (Pix)

Automação/Endpoints:
└── n8n (webhooks e workflows)

Deploy:
└── Vercel

Monitoramento:
└── Vercel Analytics
```

---

## 5. Estrutura de Pastas Sugerida

```
naipevip/
├── app/                    # Next.js App Router
│   ├── (routes)/          # Rotas públicas
│   │   ├── page.tsx       # Landing Page
│   │   └── compra/        # Página de compra
│   ├── api/               # API Routes
│   │   ├── ingressos/
│   │   ├── comprar/
│   │   ├── webhooks/
│   │   │   └── mercado-pago/
│   │   └── n8n/
│   └── layout.tsx
├── components/            # Componentes React
│   ├── Hero/
│   ├── Secoes/
│   ├── CTA/
│   └── NavBar/
├── lib/                  # Utilitários
│   ├── supabase.ts      # Cliente Supabase (server)
│   ├── mercado-pago.ts  # Integração pagamento
│   └── n8n.ts           # Disparo de workflows
├── public/              # Assets estáticos
│   ├── images/
│   └── artes/
├── styles/              # CSS global
└── docs/                # Documentação
```

---

## 6. Próximos Passos

1. **Setup inicial**
   - Criar projeto Next.js
   - Configurar TypeScript
   - Instalar dependências

2. **Design System**
   - Configurar Tailwind com cores terrosas
   - Carregar fontes (Cinzel, Source Serif 4)
   - Criar componentes base

3. **Estrutura da Landing**
   - Implementar 8 seções conforme UX
   - Integrar arte como background
   - Implementar botão flutuante

4. **Backend**
   - Setup Supabase
   - Criar API de ingressos (server-side)
   - Integrar Mercado Pago (Pix)

5. **Integrações**
   - Configurar n8n (webhooks e workflows)
   - Testes de pagamento e automações

6. **Deploy**
   - Configurar Vercel
   - Variáveis de ambiente
   - Testes em produção

---

## 7. Considerações Finais

### Performance
- ✅ Lazy loading de imagens
- ✅ Code splitting automático (Next.js)
- ✅ Otimização de fontes
- ✅ Minificação CSS/JS

### SEO
- ✅ Meta tags otimizadas
- ✅ Open Graph
- ✅ Structured Data (Event)

### Acessibilidade
- ✅ Contraste adequado (cores terrosas)
- ✅ Navegação por teclado
- ✅ Screen readers

### Segurança
- ✅ Validação de dados
- ✅ Rate limiting nas APIs
- ✅ Sanitização de inputs
- ✅ HTTPS obrigatório

---

**Esta stack foi pensada para:**
- ✅ Desenvolvimento rápido
- ✅ Performance otimizada
- ✅ Custo controlado
- ✅ Manutenção simples
- ✅ Escalabilidade futura
