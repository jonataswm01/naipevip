'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function SectionInfo() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  const infoItems = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="6" width="24" height="22" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M4 12H28" stroke="currentColor" strokeWidth="2"/>
          <path d="M10 4V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M22 4V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="16" cy="20" r="3" fill="currentColor" opacity="0.6"/>
        </svg>
      ),
      label: 'Data',
      value: '06 de Fevereiro',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M16 8V16L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="16" cy="16" r="2" fill="currentColor" opacity="0.6"/>
        </svg>
      ),
      label: 'Horário',
      value: 'A partir das 20h',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 4L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 6C20 6 24 10 24 16C24 22 20 28 16 28C12 28 8 22 8 16C8 10 12 6 16 6Z" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="16" cy="16" r="4" fill="currentColor" opacity="0.4"/>
        </svg>
      ),
      label: 'Local',
      value: 'Centro Comunitário',
      sublabel: 'Fernando Prestes - SP',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="4" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M11 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M11 17H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <text x="16" y="26" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="bold">18+</text>
        </svg>
      ),
      label: 'Classificação',
      value: 'Maiores de 18 anos',
    },
  ];

  return (
    <section
      className="bg-info-counter min-h-screen py-16 md:py-24 px-4 sm:px-6 relative overflow-hidden flex items-center"
      ref={ref}
    >
      <motion.div
        className="relative z-10 w-full max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
      >
        {/* Título */}
        <motion.h2
          className="font-titulo text-2xl sm:text-3xl md:text-4xl text-cream text-center uppercase tracking-wide mb-8 md:mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
        >
          Informações importantes
        </motion.h2>

        {/* Painel principal */}
        <motion.div
          className="panel-night border-organic-lg px-6 sm:px-10 py-10 sm:py-14"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
        >
          <div className="space-y-8 sm:space-y-10">
            {infoItems.map((item, index) => (
              <motion.div
                key={item.label}
                className="flex items-start gap-5 sm:gap-6"
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1, ease: 'easeOut' }}
              >
                {/* Ícone */}
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-amarelo">
                  {item.icon}
                </div>

                {/* Texto */}
                <div className="flex-1 pt-1">
                  <p className="font-texto text-sm text-off-white-soft uppercase tracking-wider mb-1">
                    {item.label}
                  </p>
                  <p className="font-titulo text-lg sm:text-xl md:text-2xl text-cream">
                    {item.value}
                  </p>
                  {item.sublabel && (
                    <p className="font-texto text-sm text-off-white-soft/70 mt-1">
                      {item.sublabel}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Divisor decorativo */}
          <div className="mt-10 pt-8 border-t border-off-white/10">
            <p className="font-texto text-center text-off-white-soft/60 text-sm">
              Dúvidas? Entre em contato pelo WhatsApp
            </p>
          </div>
        </motion.div>

        {/* CTA sutil */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.6, delay: 1.1, ease: 'easeOut' }}
        >
          <a
            href="#ingressos"
            className="inline-block font-titulo text-base md:text-lg text-off-white/80 hover:text-off-white uppercase tracking-wider px-6 py-3 border border-off-white/25 hover:border-off-white/50 rounded-lg transition-all duration-300 hover:bg-off-white/5"
          >
            Ver ingressos disponíveis
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
