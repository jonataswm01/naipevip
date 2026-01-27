'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function SectionBar() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <section
      className="bg-bar-night texture-noise overlay-night min-h-screen py-12 md:py-16 px-6 relative overflow-hidden flex flex-col justify-between"
      ref={ref}
    >
      {/* Título - abaixo das luzes, acima das garrafas */}
      <motion.div
        className="relative z-10 text-center pt-20 md:pt-28"
        initial={{ opacity: 0, y: -20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
      >
        <h2 className="font-titulo text-3xl md:text-4xl lg:text-5xl text-off-white tracking-wide drop-shadow-lg">
          Bar no local
        </h2>
      </motion.div>

      {/* Espaço central para as garrafas do background ficarem visíveis */}
      <div className="flex-1" aria-hidden="true" />

      {/* Texto e CTA - acima do final da seção */}
      <motion.div
        className="relative z-10 text-center pb-16 md:pb-20 max-w-lg mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, delay: 0.9, ease: 'easeOut' }}
      >
        <p className="font-texto text-xl md:text-2xl text-off-white-soft leading-relaxed drop-shadow-md">
          Drinks, bebidas geladas e estrutura completa pra você curtir do começo ao fim, sem preocupação.
        </p>

        {/* CTA sutil */}
        <motion.a
          href="#ingressos"
          className="inline-block mt-8 font-texto text-base md:text-lg text-off-white/70 hover:text-off-white border-b border-off-white/30 hover:border-off-white/60 pb-1 transition-all duration-300"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 1.3, ease: 'easeOut' }}
          whileHover={{ y: -2 }}
        >
          Garantir meu ingresso
        </motion.a>
      </motion.div>
    </section>
  );
}
