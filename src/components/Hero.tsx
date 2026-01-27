'use client';

import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="bg-hero min-h-screen flex flex-col justify-end items-center px-6 pb-12 pt-20 texture-noise relative overflow-hidden">
      {/* Overlay escuro para melhor contraste do texto */}
      <div className="absolute inset-0 bg-gradient-to-t from-marrom-dark/80 via-marrom-dark/40 to-transparent z-0" />
      
      {/* Conteúdo principal */}
      <motion.div 
        className="text-center max-w-lg mx-auto relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Nome do evento */}
        <motion.h1 
          className="font-titulo text-5xl sm:text-6xl md:text-7xl font-bold text-cream uppercase tracking-wide mb-2 drop-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Tardezinha
        </motion.h1>
        
        {/* Identificação Pré-Carnaval */}
        <motion.p 
          className="font-titulo text-xl sm:text-2xl md:text-3xl text-amarelo uppercase tracking-widest mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Pré-Carnaval
        </motion.p>
        
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
            <span className="font-texto">📅 15 de Fevereiro</span>
            <span className="text-amarelo hidden sm:block">•</span>
            <span className="font-texto">⏰ A partir do pôr do sol</span>
          </div>
        </motion.div>
        
        {/* Preço */}
        <motion.p 
          className="font-titulo text-lg sm:text-xl text-amarelo mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          🎟️ Ingressos a partir de <span className="font-bold">R$ 50</span>
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
          <button className="bg-amarelo hover:bg-amarelo-light text-marrom-dark font-titulo text-lg sm:text-xl uppercase tracking-wide px-8 sm:px-10 py-4 sm:py-5 rounded-lg transition-all shadow-warm hover:shadow-glow hover:scale-105 active:scale-95">
            Garantir meu ingresso
          </button>
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
