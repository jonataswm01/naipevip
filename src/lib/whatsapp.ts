/**
 * Número do WhatsApp para vendas (com DDI, sem +)
 * Formato: 5516996130592
 */
export const WHATSAPP_NUMBER = '5516996130592';

/** Mensagem padrão quando não se especifica quantidade */
const MENSAGEM_PADRAO =
  'Olá! Gostaria de garantir meu ingresso para o Naipe VIP / Tardezinha Pré-Carnaval.';

/**
 * Gera o link do WhatsApp com mensagem opcional.
 * @param texto Mensagem pré-preenchida (será codificada para URL)
 */
export function getWhatsAppUrl(texto: string = MENSAGEM_PADRAO): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
}

/**
 * Gera o link do WhatsApp com mensagem já incluindo a quantidade de ingressos.
 * Usado na seção de ingressos (cada card com "Garantir").
 */
export function getWhatsAppUrlIngressos(quantidade: number): string {
  const qtd = quantidade === 1 ? '1 ingresso' : `${quantidade} ingressos`;
  const texto = `Olá! Gostaria de garantir ${qtd} para o Naipe VIP / Tardezinha Pré-Carnaval.`;
  return getWhatsAppUrl(texto);
}
