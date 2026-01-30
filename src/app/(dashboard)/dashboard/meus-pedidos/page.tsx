"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getWhatsAppUrl } from "@/lib/whatsapp";

interface Pedido {
  id: string;
  numero: string;
  status: string;
  quantidade_total: number;
  valor_total: number;
  created_at: string;
  evento: {
    nome: string;
    slug: string;
    data_evento: string;
  };
  pagamento: {
    status: string;
    metodo: string;
    pago_em: string | null;
  } | null;
}

// Status badges
const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: {
    label: "Aguardando Pagamento",
    className: "bg-amarelo/20 text-amarelo",
  },
  processando: {
    label: "Processando",
    className: "bg-azul-petroleo/20 text-azul-petroleo-light",
  },
  pago: {
    label: "Pago",
    className: "bg-verde-musgo/20 text-verde-musgo-light",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-vermelho/20 text-vermelho-light",
  },
  expirado: {
    label: "Expirado",
    className: "bg-marrom-light/20 text-marrom-light",
  },
  reembolsado: {
    label: "Reembolsado",
    className: "bg-azul-petroleo/20 text-azul-petroleo-light",
  },
};

const Icons = {
  receipt: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

export default function MeusPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      const response = await fetch("/api/pedidos");
      if (response.ok) {
        const data = await response.json();
        setPedidos(data.pedidos);
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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
          Meus Pedidos
        </h1>
        <p className="text-off-white-soft/70 font-texto mt-1">
          Histórico de compras
        </p>
      </div>

      {/* Lista de Pedidos */}
      {pedidos.length === 0 ? (
        <div className="bg-marrom/60 border border-marrom rounded-xl p-8 text-center">
          <div className="text-off-white-soft/30 mb-4 flex justify-center">
            {Icons.receipt}
          </div>
          <h3 className="font-titulo text-lg text-off-white mb-2">
            Nenhum pedido encontrado
          </h3>
          <p className="text-off-white-soft/60 font-texto text-sm mb-4">
            Você ainda não fez nenhuma compra
          </p>
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-amarelo text-marrom-dark px-6 py-2 rounded-lg font-titulo font-semibold hover:bg-amarelo-light transition-colors"
          >
            Comprar Ingresso
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <Link
              key={pedido.id}
              href={`/dashboard/meus-pedidos/${pedido.id}`}
              className="block bg-marrom/60 border border-marrom rounded-xl p-4 hover:bg-marrom/80 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Número do pedido */}
                  <p className="text-off-white-soft/60 text-xs font-texto mb-1">
                    {pedido.numero}
                  </p>

                  {/* Nome do evento */}
                  <h3 className="font-titulo text-off-white font-medium truncate">
                    {pedido.evento.nome}
                  </h3>

                  {/* Detalhes */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-off-white-soft/70 font-texto">
                    <span>{pedido.quantidade_total} ingresso{pedido.quantidade_total > 1 ? "s" : ""}</span>
                    <span>{formatCurrency(pedido.valor_total)}</span>
                    <span>{formatDate(pedido.created_at)}</span>
                  </div>

                  {/* Status */}
                  <div className="mt-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-texto ${
                        statusConfig[pedido.status]?.className ?? "bg-marrom-light/20 text-marrom-light"
                      }`}
                    >
                      {statusConfig[pedido.status]?.label ?? pedido.status}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-off-white-soft/40">
                  {Icons.arrow}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
