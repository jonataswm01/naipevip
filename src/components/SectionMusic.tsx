'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function SectionMusic() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.25,
  });

  return (
    <section
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
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="panel-night border-organic-lg px-6 sm:px-10 py-12 sm:py-14">
          <div className="flex justify-center mb-4 text-cream/80">
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
          </div>
          <h2 className="font-titulo text-3xl md:text-4xl text-cream uppercase tracking-wide mb-6 text-night-glow">
            Música do começo ao fim.
          </h2>
          <p className="font-texto text-lg md:text-xl text-off-white leading-relaxed">
            DJs e atrações pra acompanhar o pôr do sol e manter a energia lá em
            cima até a noite.
          </p>
          <div className="mt-5">
            <p className="font-texto text-base md:text-lg text-off-white-soft leading-relaxed">
              No line-up da noite:
            </p>
            <div className="mt-3 flex flex-col items-center text-off-white">
              <span className="font-titulo text-lg md:text-xl tracking-wide">DJ Meomas</span>
              <span className="h-px w-40 bg-off-white/30 my-2" aria-hidden="true" />
              <span className="font-titulo text-lg md:text-xl tracking-wide">DJ Valle</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
