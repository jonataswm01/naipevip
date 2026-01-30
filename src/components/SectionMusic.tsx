'use client';

import { motion, Variants } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function SectionMusic() {
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
      id="musica"
      className="bg-music-night section-soft texture-noise overlay-night min-h-screen py-28 md:py-36 px-6 relative overflow-hidden flex items-center"
      ref={ref}
    >
      <div className="absolute inset-0 bg-pattern opacity-8" aria-hidden="true" />
      <div
        className="absolute -top-6 -right-8 h-28 w-28 bg-azul-petroleo/35 border-organic-lg blur-sm"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -left-16 h-56 w-56 bg-azul-petroleo/25 border-organic-lg blur-md"
        aria-hidden="true"
      />

      <motion.div
        className="relative z-10 max-w-xl mx-auto text-center"
        variants={containerVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        <div className="panel-night border-organic-lg px-6 sm:px-10 py-12 sm:py-14">
          {/* Ícone com animação sutil */}
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
              <path
                d="M14 34c0-10 8-18 18-18s18 8 18 18"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <rect x="8" y="34" width="10" height="16" rx="4" fill="currentColor" opacity="0.35" />
              <rect x="46" y="34" width="10" height="16" rx="4" fill="currentColor" opacity="0.35" />
              <path
                d="M24 42h4m4 0h4m4 0h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
          </motion.div>

          <motion.h2
            className="font-titulo text-3xl md:text-4xl text-cream uppercase tracking-wide mb-6 text-night-glow"
            variants={itemVariants}
          >
            Música do começo ao fim.
          </motion.h2>

          <motion.p
            className="font-texto text-lg md:text-xl text-off-white leading-relaxed"
            variants={itemVariants}
          >
            Do pôr do sol ao último track. DJs e atrações pra manter a energia lá em cima até a noite.
          </motion.p>

          {/* CTA Ver quem toca */}
          <motion.div className="mt-8" variants={itemVariants}>
            <a
              href="#djs"
              className="inline-block font-titulo text-base md:text-lg text-off-white hover:text-amarelo uppercase tracking-wider px-6 py-3 border border-off-white/50 hover:border-amarelo rounded-lg transition-all duration-300 hover:bg-amarelo/5"
            >
              Ver quem toca
            </a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
