'use client';

import { motion, Variants } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

// Ícone Pix
const IconPix = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.5 7.5L14 14L7.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 20.5L14 14L20.5 20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 7.5L4 11L7.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.5 7.5L24 11L20.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 20.5L4 17L7.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.5 20.5L24 17L20.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Ícone Mercado Pago (carteira/wallet estilizada)
const IconMercadoPago = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M3 11H25" stroke="currentColor" strokeWidth="2"/>
    <circle cx="20" cy="17" r="2" fill="currentColor" opacity="0.6"/>
    <path d="M7 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Ícone Cadeado/Segurança
const IconSecure = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="12" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M8 12V8C8 4.68629 10.6863 2 14 2C17.3137 2 20 4.68629 20 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="14" cy="18" r="2" fill="currentColor"/>
    <path d="M14 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Ícone Ingresso Digital (celular com ticket)
const IconDigitalTicket = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="7" y="2" width="14" height="24" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M11 22H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M11 8H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <path d="M11 11H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <path d="M11 14H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <path d="M11 17H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

// Ícone WhatsApp (balão de mensagem com check)
const IconWhatsApp = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 24L5.5 19C4.5 17 4 15 4 13C4 7.48 8.48 3 14 3C19.52 3 24 7.48 24 13C24 18.52 19.52 23 14 23C12 23 10 22.5 8.5 21.5L4 24Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
    <path d="M10 13L12.5 15.5L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Ícone Localização (pin de mapa)
const IconLocation = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2C9.58 2 6 5.58 6 10C6 15.5 14 26 14 26C14 26 22 15.5 22 10C22 5.58 18.42 2 14 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="14" cy="10" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

interface SecurityItem {
  icon: React.ReactNode;
  text: string;
}

const securityItems: SecurityItem[] = [
  {
    icon: <IconPix />,
    text: 'Pagamento via Pix',
  },
  {
    icon: <IconMercadoPago />,
    text: 'Pague com Mercado Pago',
  },
  {
    icon: <IconSecure />,
    text: 'Compra 100% segura',
  },
  {
    icon: <IconDigitalTicket />,
    text: 'Ingresso digital no celular',
  },
  {
    icon: <IconWhatsApp />,
    text: 'Confirmação via WhatsApp',
  },
  {
    icon: <IconLocation />,
    text: 'Local revelado após a compra',
  },
];

export default function SectionSecurity() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  // Variants alternados para entrada (esquerda/direita)
  const getItemVariants = (index: number): Variants => ({
    hidden: { 
      opacity: 0, 
      x: index % 2 === 0 ? -25 : 25,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  });

  return (
    <section
      className="bg-security min-h-[75vh] py-16 md:py-20 px-4 sm:px-6 relative overflow-hidden flex items-center"
      ref={ref}
    >
      {/* Overlay sutil para profundidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-marrom-dark/10 to-marrom-dark/30 pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-md mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        {/* Título */}
        <motion.div 
          className="text-center mb-10" 
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-full bg-amarelo/10 border border-amarelo/20">
            <IconSecure />
          </div>
          <h2 className="font-titulo text-2xl sm:text-3xl text-cream uppercase tracking-wide">
            Compra simples
          </h2>
          <p className="font-titulo text-xl sm:text-2xl text-amarelo uppercase tracking-wide mt-1">
            e segura
          </p>
        </motion.div>

        {/* Lista de itens de segurança */}
        <div className="space-y-4">
          {securityItems.map((item, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-4 p-4 rounded-xl bg-off-white/[0.03] border border-off-white/[0.06] hover:border-off-white/10 transition-colors duration-300"
              variants={getItemVariants(index)}
              whileHover={{ 
                x: index % 2 === 0 ? 6 : -6,
                transition: { duration: 0.2 }
              }}
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-amarelo">
                {item.icon}
              </div>
              <p className="font-texto text-base sm:text-lg text-off-white">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA sutil (mesmo estilo da SectionInfo) */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
        >
          <a
            href="#ingressos"
            className="inline-block font-titulo text-base md:text-lg text-off-white hover:text-amarelo uppercase tracking-wider px-6 py-3 border border-off-white/50 hover:border-amarelo rounded-lg transition-all duration-300 hover:bg-amarelo/5"
          >
            Garantir meu ingresso
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
