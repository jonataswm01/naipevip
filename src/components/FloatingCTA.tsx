'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Mostrar após 300px de scroll
      const scrolled = window.scrollY > 300;
      setIsVisible(scrolled);

      // Verificar se está perto do footer/seção de ingressos
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollPosition = window.scrollY + clientHeight;
      
      // Esconder quando estiver nos últimos 500px (área do footer/CTA final)
      setIsAtBottom(scrollPosition > scrollHeight - 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Não mostrar se está no topo ou muito perto do final
  const shouldShow = isVisible && !isAtBottom;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: 100, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 100, x: '-50%' }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30 
          }}
        >
          <Link
            href="/compra/carrinho"
            className="flex items-center gap-2 px-6 py-3 bg-amarelo hover:bg-amarelo-light text-marrom-dark font-titulo text-sm uppercase tracking-wide rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" 
              />
            </svg>
            Garantir Ingresso
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
