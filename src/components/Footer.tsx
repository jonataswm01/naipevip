'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

// Ícone Instagram
const IconInstagram = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="6" r="1.5" fill="currentColor"/>
  </svg>
);

export default function Footer() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const navLinks = [
    { label: 'Reservar Ingresso', href: '#ingressos' },
    { label: 'Atrações', href: '#musica' },
    { label: 'Informações', href: '#info' },
  ];

  const instagramLinks = [
    { handle: '@ravazzy_', url: 'https://instagram.com/ravazzy_' },
    { handle: '@itz_mnds', url: 'https://instagram.com/itz_mnds' },
  ];

  return (
    <footer
      ref={ref}
      className="relative overflow-hidden bg-[#3D261D] pt-10 pb-4"
    >
      {/* TARDEZINHA - Marca d'água gigante */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span 
          className="font-titulo text-off-white/[0.05] uppercase select-none text-center font-bold"
          style={{ 
            fontSize: '15vw',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          TARDEZINHA
        </span>
      </div>

      {/* Conteúdo do Footer */}
      <motion.div
        className="relative z-10 max-w-md mx-auto px-4 sm:px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Navegação */}
        <nav className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
          {navLinks.map((link, index) => (
            <span key={link.label} className="flex items-center gap-3 sm:gap-4">
              <motion.a
                href={link.href}
                className="font-texto text-sm sm:text-base text-off-white/60 hover:text-amarelo transition-colors duration-300"
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.4, delay: 0.1 * index, ease: 'easeOut' }}
              >
                {link.label}
              </motion.a>
              {index < navLinks.length - 1 && (
                <span className="text-off-white/20 text-xs">•</span>
              )}
            </span>
          ))}
        </nav>

        {/* Divisor sutil */}
        <div className="w-16 h-px bg-off-white/10 mx-auto mb-6" />

        {/* Título redes sociais */}
        <motion.p
          className="text-center font-texto text-xs sm:text-sm text-off-white/40 uppercase tracking-wider mb-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
        >
          Acompanhe nas redes
        </motion.p>

        {/* Instagram dos organizadores */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-10"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
        >
          {instagramLinks.map((ig) => (
            <a
              key={ig.handle}
              href={ig.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-off-white/50 hover:text-amarelo transition-colors duration-300 group"
            >
              <span className="text-off-white/40 group-hover:text-amarelo transition-colors duration-300">
                <IconInstagram />
              </span>
              <span className="font-texto text-sm sm:text-base">
                {ig.handle}
              </span>
            </a>
          ))}
        </motion.div>

        {/* Créditos */}
        <motion.p
          className="text-center font-texto text-xs sm:text-sm text-off-white/30"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
        >
          Criado por{' '}
          <span className="text-off-white/50">Jonatas</span>
          {' '}•{' '}
          <span className="text-off-white/40">2026</span>
        </motion.p>
      </motion.div>
    </footer>
  );
}
