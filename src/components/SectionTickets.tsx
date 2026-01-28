'use client';

import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useRouter } from 'next/navigation';

// =============================================
// TYPES
// =============================================

interface Lote {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  quantidade_disponivel: number;
  limite_por_usuario: number;
  ordem: number;
  disponivel: boolean;
  esgotado: boolean;
}

interface LotesData {
  evento: {
    id: string;
    nome: string;
  };
  lotes: Lote[];
}

// =============================================
// ICONS
// =============================================

const Icons = {
  ticket: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  fire: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  ),
  spinner: (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
};

// =============================================
// MAIN COMPONENT
// =============================================

export default function SectionTickets() {
  const router = useRouter();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch lotes
  useEffect(() => {
    async function fetchLotes() {
      try {
        const response = await fetch('/api/lotes');
        const data: LotesData = await response.json();

        if (response.ok) {
          setLotes(data.lotes);
        } else {
          setError('Não há ingressos disponíveis no momento');
        }
      } catch {
        setError('Erro ao carregar ingressos');
      } finally {
        setLoading(false);
      }
    }

    fetchLotes();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  };

  // Encontrar lote ativo (primeiro disponível)
  const loteAtivo = lotes.find((l) => l.disponivel);

  // Handler de compra
  const handleComprar = (loteId: string) => {
    router.push(`/compra/carrinho?lote=${loteId}`);
  };

  return (
    <section
      id="ingressos"
      className="bg-tickets min-h-screen py-10 px-4 sm:px-6 relative overflow-hidden flex flex-col justify-center"
      ref={ref}
    >
      {/* Overlay sutil */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-azul-petroleo-dark/20 to-azul-petroleo-dark/40 pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-md mx-auto flex flex-col"
        variants={containerVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        {/* Cabeçalho */}
        <motion.div className="text-center mb-6" variants={itemVariants}>
          <h2 className="font-titulo text-2xl sm:text-3xl text-cream uppercase tracking-wide mb-3">
            Garanta seu ingresso
          </h2>

          {/* Badge do lote ativo */}
          {loteAtivo && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amarelo/10 border border-amarelo/30 rounded-full">
              <span className="w-2 h-2 bg-amarelo rounded-full animate-pulse" />
              <span className="font-texto text-sm text-amarelo uppercase tracking-wider">
                {loteAtivo.nome} • Ingressos limitados
              </span>
            </div>
          )}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            className="flex flex-col items-center justify-center py-12 gap-4"
            variants={itemVariants}
          >
            <div className="text-amarelo">{Icons.spinner}</div>
            <p className="font-texto text-sm text-off-white-soft/70">
              Carregando ingressos...
            </p>
          </motion.div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            className="text-center py-12"
            variants={itemVariants}
          >
            <p className="font-texto text-off-white-soft/70">{error}</p>
          </motion.div>
        )}

        {/* Cards de ingressos */}
        {!loading && !error && lotes.length > 0 && (
          <div className="flex flex-col gap-3 sm:gap-4">
            {lotes.map((lote, index) => (
              <TicketCard
                key={lote.id}
                lote={lote}
                isFirst={index === 0}
                isHighlighted={lote.disponivel && index === 0}
                variants={itemVariants}
                onComprar={() => handleComprar(lote.id)}
              />
            ))}
          </div>
        )}

        {/* Aviso de limite */}
        {!loading && loteAtivo && (
          <motion.p
            className="text-center mt-6 font-texto text-sm text-off-white-soft/70"
            variants={itemVariants}
          >
            Limite de {loteAtivo.limite_por_usuario} ingressos por pessoa
          </motion.p>
        )}
      </motion.div>
    </section>
  );
}

// =============================================
// TICKET CARD COMPONENT
// =============================================

interface TicketCardProps {
  lote: Lote;
  isFirst: boolean;
  isHighlighted: boolean;
  variants: Variants;
  onComprar: () => void;
}

function TicketCard({ lote, isFirst, isHighlighted, variants, onComprar }: TicketCardProps) {
  const esgotado = lote.esgotado || !lote.disponivel;

  return (
    <motion.div
      className={`
        relative rounded-2xl overflow-hidden transition-all duration-300
        ${isHighlighted
          ? 'bg-off-white/[0.08] border-2 border-amarelo/60 shadow-ticket-highlight'
          : esgotado
            ? 'bg-off-white/[0.02] border border-off-white/5 opacity-60'
            : 'bg-off-white/[0.04] border border-off-white/10 hover:border-off-white/20'
        }
      `}
      variants={variants}
      whileHover={esgotado ? {} : { scale: 1.02 }}
      whileTap={esgotado ? {} : { scale: 0.98 }}
    >
      {/* Badge de destaque */}
      {isHighlighted && isFirst && (
        <div className="absolute top-0 left-0 right-0 bg-amarelo/90 py-1 flex items-center justify-center gap-1">
          <span className="text-marrom-dark">{Icons.fire}</span>
          <p className="text-center font-titulo text-xs text-marrom-dark uppercase tracking-wider">
            Lote atual
          </p>
        </div>
      )}

      {/* Badge Esgotado */}
      {esgotado && (
        <div className="absolute top-0 left-0 right-0 bg-off-white-soft/20 py-1">
          <p className="text-center font-titulo text-xs text-off-white-soft/70 uppercase tracking-wider">
            Esgotado
          </p>
        </div>
      )}

      {/* Conteúdo do card */}
      <div className={`flex items-center justify-between p-4 sm:p-5 ${(isHighlighted && isFirst) || esgotado ? 'pt-8' : ''}`}>
        {/* Info do ingresso */}
        <div className="flex-1">
          <p className={`font-titulo text-lg sm:text-xl ${esgotado ? 'text-off-white-soft/50' : 'text-cream'}`}>
            {lote.nome}
          </p>

          {lote.descricao && (
            <p className="font-texto text-xs text-off-white-soft/60 mt-0.5">
              {lote.descricao}
            </p>
          )}

          {!esgotado && lote.quantidade_disponivel <= 20 && (
            <p className="font-texto text-xs text-vermelho-light mt-0.5">
              Últimas {lote.quantidade_disponivel} unidades!
            </p>
          )}
        </div>

        {/* Preço e CTA */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right">
            <p className={`font-titulo text-2xl sm:text-3xl ${
              esgotado
                ? 'text-off-white-soft/30 line-through'
                : isHighlighted
                  ? 'text-amarelo'
                  : 'text-cream'
            }`}>
              R$ {lote.preco.toFixed(0)}
            </p>
          </div>

          <button
            onClick={onComprar}
            disabled={esgotado}
            className={`
              font-titulo text-sm uppercase tracking-wide px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg transition-all duration-300
              ${esgotado
                ? 'bg-off-white-soft/10 text-off-white-soft/30 cursor-not-allowed'
                : isHighlighted
                  ? 'bg-amarelo hover:bg-amarelo-light text-marrom-dark shadow-warm hover:shadow-glow'
                  : 'bg-transparent border border-amarelo/50 text-amarelo hover:bg-amarelo/10 hover:border-amarelo'
              }
            `}
          >
            {esgotado ? 'Esgotado' : 'Garantir'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
