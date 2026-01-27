'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function SectionAbout() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.25,
  });

  return (
    <section
      className="bg-section-texture texture-grain min-h-[70vh] py-24 md:py-32 px-6 relative overflow-hidden flex items-center"
      ref={ref}
    >
      <div className="absolute inset-0 opacity-40 bg-pattern" aria-hidden="true" />
      <motion.div
        className="relative z-10 max-w-lg mx-auto text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <h2 className="font-titulo text-3xl md:text-4xl text-cream uppercase tracking-wide mb-5">
          Não é só mais uma festa.
        </h2>
        <p className="font-texto text-lg md:text-xl text-off-white leading-relaxed">
          É encontro, música e clima de carnaval, do jeito que a tarde pede e a
          noite continua.
        </p>

        {/* CTA sutil */}
        <motion.a
          href="#ingressos"
          className="inline-block mt-6 font-texto text-base md:text-lg text-off-white/70 hover:text-off-white border-b border-off-white/30 hover:border-off-white/60 pb-1 transition-all duration-300"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
          whileHover={{ y: -2 }}
        >
          Garantir meu ingresso
        </motion.a>
      </motion.div>

      <div
        className="absolute -bottom-12 -right-8 h-40 w-40 bg-marrom/60 border-organic-lg blur-sm"
        aria-hidden="true"
      />
    </section>
  );
}
