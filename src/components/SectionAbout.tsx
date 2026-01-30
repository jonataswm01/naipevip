'use client';

import { motion, Variants } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { getWhatsAppUrl } from '@/lib/whatsapp';

export default function SectionAbout() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.25,
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <section
      id="about"
      className="bg-section-texture texture-grain min-h-[70vh] py-24 md:py-32 px-6 relative overflow-hidden flex items-center"
      ref={ref}
    >
      <div className="absolute inset-0 opacity-40 bg-pattern" aria-hidden="true" />

      <motion.div
        className="relative z-10 max-w-lg mx-auto text-center"
        variants={containerVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        {/* Ícone com animação sutil (vibe festa / pré-carnaval) */}
        <motion.div
          className="flex justify-center mb-4 text-cream/80"
          variants={itemVariants}
          animate={inView ? { scale: [1, 1.03, 1] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="14" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M32 18v6M32 40v6M18 32h6M40 32h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M24 24l4 4M40 40l4 4M40 24l-4 4M24 40l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            <circle cx="32" cy="32" r="4" fill="currentColor" opacity="0.6" />
          </svg>
        </motion.div>

        <motion.h2
          className="font-titulo text-3xl md:text-4xl text-cream uppercase tracking-wide mb-6"
          variants={itemVariants}
        >
          Não é só mais uma festa.
        </motion.h2>

        <motion.p
          className="font-texto text-lg md:text-xl text-off-white leading-relaxed"
          variants={itemVariants}
        >
          É música e clima de pré-carnaval, do jeito que a tarde pede e a noite continua.
        </motion.p>

        {/* CTA no estilo da seção Música */}
        <motion.div className="mt-8" variants={itemVariants}>
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-titulo text-base md:text-lg text-off-white hover:text-amarelo uppercase tracking-wider px-6 py-3 border border-off-white/50 hover:border-amarelo rounded-lg transition-all duration-300 hover:bg-amarelo/5"
          >
            Garantir meu ingresso
          </a>
        </motion.div>
      </motion.div>

      <div
        className="absolute -bottom-12 -right-8 h-40 w-40 bg-marrom/60 border-organic-lg blur-sm"
        aria-hidden="true"
      />
    </section>
  );
}
