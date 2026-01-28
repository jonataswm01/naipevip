"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Ingresso {
  id: string;
  codigo: string;
  nome_titular: string;
  status: string;
  created_at: string;
  evento: {
    nome: string;
    slug: string;
    data_evento: string;
    horario_inicio: string | null;
    local_bairro: string | null;
  };
  lote: {
    nome: string;
    preco: number;
  };
}

// Status badges
const statusConfig: Record<string, { label: string; className: string }> = {
  ativo: {
    label: "Válido",
    className: "bg-verde-musgo/20 text-verde-musgo-light",
  },
  utilizado: {
    label: "Utilizado",
    className: "bg-marrom-light/20 text-marrom-light",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-vermelho/20 text-vermelho-light",
  },
  transferido: {
    label: "Transferido",
    className: "bg-azul-petroleo/20 text-azul-petroleo-light",
  },
};

const Icons = {
  ticket: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  qrcode: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  ),
  calendar: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  location: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export default function MeusIngressosPage() {
  const [ingressos, setIngressos] = useState<Ingresso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIngressos();
  }, []);

  const fetchIngressos = async () => {
    try {
      const response = await fetch("/api/meus-ingressos");
      if (response.ok) {
        const data = await response.json();
        setIngressos(data.ingressos);
      }
    } catch (error) {
      console.error("Erro ao buscar ingressos:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-amarelo border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-titulo text-2xl text-off-white font-semibold">
          Meus Ingressos
        </h1>
        <p className="text-off-white-soft/70 font-texto mt-1">
          Seus ingressos comprados
        </p>
      </div>

      {/* Lista de Ingressos */}
      {ingressos.length === 0 ? (
        <div className="bg-marrom/60 border border-marrom rounded-xl p-8 text-center">
          <div className="text-off-white-soft/30 mb-4 flex justify-center">
            {Icons.ticket}
          </div>
          <h3 className="font-titulo text-lg text-off-white mb-2">
            Nenhum ingresso encontrado
          </h3>
          <p className="text-off-white-soft/60 font-texto text-sm mb-4">
            Você ainda não tem ingressos
          </p>
          <Link
            href="/#ingressos"
            className="inline-block bg-amarelo text-marrom-dark px-6 py-2 rounded-lg font-titulo font-semibold hover:bg-amarelo-light transition-colors"
          >
            Comprar Ingresso
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {ingressos.map((ingresso) => (
            <Link
              key={ingresso.id}
              href={`/dashboard/meus-ingressos/${ingresso.codigo}`}
              className="block bg-marrom/60 border border-marrom rounded-xl overflow-hidden hover:bg-marrom/80 transition-colors"
            >
              {/* Card Header com código */}
              <div className="bg-marrom px-4 py-2 flex items-center justify-between">
                <span className="text-off-white-soft/60 text-xs font-texto font-mono">
                  #{ingresso.codigo}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-texto ${
                    statusConfig[ingresso.status]?.className ?? "bg-marrom-light/20 text-marrom-light"
                  }`}
                >
                  {statusConfig[ingresso.status]?.label ?? ingresso.status}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <div className="flex gap-4">
                  {/* QR Code Preview */}
                  <div className="flex-shrink-0 w-16 h-16 bg-off-white rounded-lg flex items-center justify-center">
                    <div className="text-marrom-dark">{Icons.qrcode}</div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-titulo text-off-white font-medium truncate">
                      {ingresso.evento.nome}
                    </h3>
                    <p className="text-amarelo text-sm font-texto mt-0.5">
                      {ingresso.lote.nome}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-off-white-soft/60 font-texto">
                      <span className="flex items-center gap-1">
                        {Icons.calendar}
                        {formatDate(ingresso.evento.data_evento)}
                      </span>
                      {ingresso.evento.local_bairro && (
                        <span className="flex items-center gap-1">
                          {Icons.location}
                          {ingresso.evento.local_bairro}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Titular */}
                <div className="mt-3 pt-3 border-t border-marrom">
                  <p className="text-off-white-soft/60 text-xs font-texto">
                    Titular: <span className="text-off-white">{ingresso.nome_titular}</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
