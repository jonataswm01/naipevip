'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function SectionCTA() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  return (
    <section
      className="bg-cta-final min-h-[70vh] py-12 md:py-16 px-4 sm:px-6 relative overflow-hidden flex flex-col justify-center"
      ref={ref}
    >

      <motion.div
        className="relative z-10 text-center max-w-lg mx-auto"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Subtítulo de urgência */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-vermelho/20 border border-vermelho/40 rounded-full">
            <span className="w-2 h-2 bg-vermelho rounded-full animate-pulse" />
            <span className="font-texto text-sm sm:text-base text-off-white uppercase tracking-wider">
              Ingressos limitados • 1º Lote
            </span>
          </span>
        </motion.div>

        {/* Título principal */}
        <motion.h2
          className="font-titulo text-3xl sm:text-4xl md:text-5xl text-cream uppercase tracking-wide mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
        >
          Garanta antes que acabe.
        </motion.h2>

        {/* Info do evento */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
        >
          <p className="font-texto text-base sm:text-lg text-off-white/80">
            06 de Fevereiro • A partir das 20h
          </p>
          <p className="font-titulo text-lg sm:text-xl text-amarelo mt-2">
            Ingressos a partir de R$ 20
          </p>
        </motion.div>

        {/* CTA Principal com glow animado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
        >
          <motion.button 
            className="bg-amarelo hover:bg-amarelo-light text-marrom-dark font-titulo text-lg sm:text-xl uppercase tracking-wide px-10 sm:px-12 py-4 sm:py-5 rounded-lg transition-colors shadow-warm"
            animate={{
              boxShadow: [
                '0 4px 30px rgba(212, 160, 58, 0.3)',
                '0 4px 40px rgba(212, 160, 58, 0.5)',
                '0 4px 30px rgba(212, 160, 58, 0.3)',
              ],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Garantir meu ingresso
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
}
