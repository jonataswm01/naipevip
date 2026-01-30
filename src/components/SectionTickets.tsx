'use client';

import { motion, Variants } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { getWhatsAppUrlIngressos } from '@/lib/whatsapp';

// =============================================
// TYPES
// =============================================

interface TicketOption {
  id: number;
  quantity: number;
  price: number;
  highlight?: boolean;
  highlightLabel?: string;
  savings?: number;
}

// =============================================
// DADOS DOS INGRESSOS
// =============================================

const ticketOptions: TicketOption[] = [
  {
    id: 1,
    quantity: 1,
    price: 20,
  },
  {
    id: 2,
    quantity: 2,
    price: 35,
    highlight: true,
    highlightLabel: 'Mais escolhido',
    savings: 5,
  },
  {
    id: 3,
    quantity: 4,
    price: 60,
    savings: 20,
  },
];

// =============================================
// ICONS
// =============================================

const Icons = {
  fire: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  ),
};

// =============================================
// MAIN COMPONENT
// =============================================

export default function SectionTickets() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  };

  // Abre WhatsApp com mensagem já informando a quantidade de ingressos
  const handleComprar = (quantity: number) => {
    window.open(getWhatsAppUrlIngressos(quantity), '_blank', 'noopener,noreferrer');
  };

  return (
    <section
      id="ingressos"
      className="bg-tickets min-h-screen py-10 px-4 sm:px-6 relative overflow-hidden flex flex-col justify-center"
      ref={ref}
    >
      {/* Overlay sutil */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-azul-petroleo-dark/20 to-azul-petroleo-dark/40 pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-md mx-auto flex flex-col"
        variants={containerVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        {/* Cabeçalho */}
        <motion.div className="text-center mb-6" variants={itemVariants}>
          <h2 className="font-titulo text-2xl sm:text-3xl text-cream uppercase tracking-wide mb-3">
            Garanta seu ingresso
          </h2>
          
          {/* Badge do lote */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amarelo/10 border border-amarelo/30 rounded-full">
            <span className="w-2 h-2 bg-amarelo rounded-full animate-pulse" />
            <span className="font-texto text-sm text-amarelo uppercase tracking-wider">
              1º Lote • Ingressos limitados
            </span>
          </div>
        </motion.div>

        {/* Cards de ingressos */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {ticketOptions.map((ticket) => (
            <TicketCard 
              key={ticket.id} 
              ticket={ticket} 
              variants={itemVariants} 
              onComprar={() => handleComprar(ticket.quantity)}
            />
          ))}
        </div>

        {/* Aviso de limite */}
        <motion.p
          className="text-center mt-6 font-texto text-sm text-off-white-soft/70"
          variants={itemVariants}
        >
          Limite de 4 ingressos por pessoa
        </motion.p>
      </motion.div>
    </section>
  );
}

// =============================================
// TICKET CARD COMPONENT
// =============================================

interface TicketCardProps {
  ticket: TicketOption;
  variants: Variants;
  onComprar: () => void;
}

function TicketCard({ ticket, variants, onComprar }: TicketCardProps) {
  const isHighlighted = ticket.highlight;

  return (
    <motion.div
      className={`
        relative rounded-2xl overflow-hidden transition-all duration-300
        ${isHighlighted
          ? 'bg-off-white/[0.08] border-2 border-amarelo/60 shadow-ticket-highlight'
          : 'bg-off-white/[0.04] border border-off-white/10 hover:border-off-white/20'
        }
      `}
      variants={variants}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Badge de destaque */}
      {ticket.highlightLabel && (
        <div className="absolute top-0 left-0 right-0 bg-amarelo/90 py-1 flex items-center justify-center gap-1">
          <span className="text-marrom-dark">{Icons.fire}</span>
          <p className="text-center font-titulo text-xs text-marrom-dark uppercase tracking-wider">
            {ticket.highlightLabel}
          </p>
        </div>
      )}

      {/* Conteúdo do card */}
      <div className={`flex items-center justify-between p-4 sm:p-5 ${ticket.highlightLabel ? 'pt-8' : ''}`}>
        {/* Info do ingresso */}
        <div className="flex-1">
          <p className="font-titulo text-lg sm:text-xl text-cream">
            {ticket.quantity} {ticket.quantity === 1 ? 'Convite' : 'Convites'}
          </p>
          
          {/* Economia (para pacotes) */}
          {ticket.savings && (
            <p className="font-texto text-xs text-verde-musgo-light mt-0.5 opacity-80">
              Economia de R$ {ticket.savings}
            </p>
          )}
        </div>

        {/* Preço e CTA */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right">
            <p className={`font-titulo text-2xl sm:text-3xl ${isHighlighted ? 'text-amarelo' : 'text-cream'}`}>
              R$ {ticket.price}
            </p>
          </div>

          <button
            onClick={onComprar}
            className={`
              font-titulo text-sm uppercase tracking-wide px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg transition-all duration-300
              ${isHighlighted
                ? 'bg-amarelo hover:bg-amarelo-light text-marrom-dark shadow-warm hover:shadow-glow'
                : 'bg-transparent border border-amarelo/50 text-amarelo hover:bg-amarelo/10 hover:border-amarelo'
              }
            `}
          >
            Garantir
          </button>
        </div>
      </div>
    </motion.div>
  );
}
