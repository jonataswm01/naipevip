'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-hero section-soft min-h-screen flex flex-col justify-center items-center px-6 py-8 texture-noise texture-canvas relative overflow-hidden">
      {/* Overlay para contraste - mais sutil para não competir com a arte */}
      <div className="absolute inset-0 bg-gradient-to-t from-marrom-dark/70 via-transparent to-transparent z-0" />
      
      {/* Conteúdo principal - centralizado */}
      <motion.div 
        className="text-center w-full max-w-lg mx-auto relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Nome do evento */}
        <motion.h1 
          className="font-titulo text-4xl sm:text-5xl md:text-7xl font-bold text-cream uppercase tracking-wide mb-2 drop-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Naipe VIP
        </motion.h1>
        
        {/* Subheadline */}
        <motion.p 
          className="font-texto text-base sm:text-lg text-off-white mb-8 leading-relaxed px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Uma festa pra curtir o pôr do sol e atravessar a noite no clima do carnaval.
        </motion.p>
        
        {/* Informações do evento */}
        <motion.div 
          className="flex flex-col gap-2 justify-center items-center mb-4 text-sm sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex flex-wrap gap-3 justify-center items-center text-off-white-soft">
            <span className="font-texto">📅 06 de Fevereiro</span>
            <span className="text-amarelo hidden sm:block">•</span>
            <span className="font-texto">⏰ A partir das 20h</span>
          </div>
        </motion.div>
        
        {/* Preço */}
        <motion.p 
          className="font-titulo text-lg sm:text-xl text-amarelo mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          🎟️ Ingressos a partir de <span className="font-bold">R$ 20</span>
        </motion.p>
        
        {/* Aviso de ingressos limitados */}
        <motion.p 
          className="font-texto text-sm text-off-white-soft mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.65 }}
        >
          Ingressos limitados.
        </motion.p>
        
        {/* CTA Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Link 
            href="/compra/carrinho"
            className="inline-block bg-amarelo hover:bg-amarelo-light text-marrom-dark font-titulo text-lg sm:text-xl uppercase tracking-wide px-8 sm:px-10 py-4 sm:py-5 rounded-lg transition-all shadow-warm hover:shadow-glow hover:scale-105 active:scale-95"
          >
            Garantir meu ingresso
          </Link>
        </motion.div>
      </motion.div>
      
      {/* Indicador de scroll (sutil) */}
      <motion.div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-off-white-soft/50 text-2xl"
        >
          ↓
        </motion.div>
      </motion.div>
    </section>
  );
}
