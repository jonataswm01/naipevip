# CTAs – Redirecionamento para WhatsApp

## Número

- **WhatsApp:** 5516996130592  
- **URL base:** `https://wa.me/5516996130592`

## Mensagens

| Contexto | Mensagem pré-preenchida |
|----------|--------------------------|
| **Genérico** (Hero, Security, About, DJs, Bar, CTA, Footer, NavBar, Dashboard) | "Olá! Gostaria de garantir meu ingresso para o Naipe VIP / Tardezinha Pré-Carnaval." |
| **Seção Ingressos** (botão "Garantir" em cada card) | "Olá! Gostaria de garantir **X ingresso(s)** para o Naipe VIP / Tardezinha Pré-Carnaval." (X = 1, 2 ou 4 conforme o card) |

---

## Mapeamento de CTAs alterados

| # | Página / Componente | Texto do CTA | Antes | Depois |
|---|--------------------|--------------|--------|--------|
| 1 | **Hero** | Garantir meu ingresso | `/compra/carrinho` | WhatsApp (mensagem genérica) |
| 2 | **SectionTickets** | Garantir (em cada card) | `/compra/carrinho?qtd=X` | WhatsApp com **quantidade na mensagem** (1, 2 ou 4 ingressos) |
| 3 | **SectionSecurity** | Garantir meu ingresso | `#ingressos` | WhatsApp (genérica) |
| 4 | **SectionInfo** | Ver ingressos disponíveis | `#ingressos` | WhatsApp (genérica) |
| 5 | **SectionAbout** | Garantir meu ingresso | `#ingressos` | WhatsApp (genérica) |
| 6 | **SectionDJs** | Garantir meu ingresso | `#ingressos` | WhatsApp (genérica) |
| 7 | **SectionBar** | Garantir meu ingresso | `#ingressos` | WhatsApp (genérica) |
| 8 | **SectionCTA** | Garantir meu ingresso | `/compra/carrinho` | WhatsApp (genérica) |
| 9 | **Footer** | Reservar Ingresso | `#ingressos` | WhatsApp (genérica) |
| 10 | **NavBar** | Ingressos | `#ingressos` | WhatsApp (genérica), abre em nova aba |
| 11 | **Dashboard (page)** | Comprar ingresso (link no bloco do evento) | `/#ingressos` | WhatsApp (genérica) |
| 12 | **Dashboard (page)** | Comprar Ingresso (CTA quando não tem ingresso) | `/#ingressos` | WhatsApp (genérica) |
| 13 | **Dashboard > Meus Ingressos** | Comprar Ingresso (quando lista vazia) | `/#ingressos` | WhatsApp (genérica) |
| 14 | **Dashboard > Meus Pedidos** | Comprar Ingresso (quando lista vazia) | `/#ingressos` | WhatsApp (genérica) |

---

## Implementação

- **Lib:** `src/lib/whatsapp.ts`  
  - `getWhatsAppUrl(texto?)` – mensagem genérica ou customizada  
  - `getWhatsAppUrlIngressos(quantidade)` – mensagem com quantidade de ingressos  

- Todos os links para WhatsApp abrem em **nova aba** (`target="_blank"` e `rel="noopener noreferrer"`).

- Para alterar o número ou os textos, edite apenas `src/lib/whatsapp.ts`.
