"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface PedidoDetalhado {
  id: string;
  numero: string;
  status: string;
  quantidade_total: number;
  valor_total: number;
  expires_at: string | null;
  created_at: string;
  expirado: boolean;
}

interface Evento {
  id: string;
  nome: string;
  data_evento: string;
  horario_inicio: string | null;
  local_nome: string | null;
  local_endereco: string | null;
  local_bairro: string | null;
  local_cidade: string | null;
}

interface Item {
  id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  lote: {
    id: string;
    nome: string;
    preco: number;
  };
}

interface Pagamento {
  id: string;
  status: string;
  metodo: string;
  valor: number;
  pix_qr_code: string | null;
  pix_qr_code_base64: string | null;
  pix_expiration: string | null;
  pago_em: string | null;
}

// Status badges
const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: {
    label: "Aguardando Pagamento",
    className: "bg-amarelo/20 text-amarelo border-amarelo/30",
  },
  processando: {
    label: "Processando",
    className: "bg-azul-petroleo/20 text-azul-petroleo-light border-azul-petroleo/30",
  },
  pago: {
    label: "Pago",
    className: "bg-verde-musgo/20 text-verde-musgo-light border-verde-musgo/30",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-vermelho/20 text-vermelho-light border-vermelho/30",
  },
  expirado: {
    label: "Expirado",
    className: "bg-marrom-light/20 text-marrom-light border-marrom-light/30",
  },
  reembolsado: {
    label: "Reembolsado",
    className: "bg-azul-petroleo/20 text-azul-petroleo-light border-azul-petroleo/30",
  },
};

const Icons = {
  back: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  location: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  ticket: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  receipt: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  creditCard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  copy: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
};

export default function PedidoDetalhadoPage() {
  const params = useParams();
  const id = params.id as string;
  const [pedido, setPedido] = useState<PedidoDetalhado | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [pagamento, setPagamento] = useState<Pagamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPedido();
    }
  }, [id]);

  const fetchPedido = async () => {
    try {
      const response = await fetch(`/api/pedidos/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPedido(data.pedido);
        setEvento(data.evento);
        setItens(data.itens);
        setPagamento(data.pagamento);
      } else {
        setError("Pedido não encontrado");
      }
    } catch (err) {
      console.error("Erro ao buscar pedido:", err);
      setError("Erro ao carregar pedido");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "A partir das 20h";
    return timeString.slice(0, 5);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const copyPixCode = async () => {
    if (pagamento?.pix_qr_code) {
      await navigator.clipboard.writeText(pagamento.pix_qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-amarelo border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !pedido || !evento) {
    return (
      <div className="text-center py-12">
        <p className="text-vermelho-light mb-4">{error || "Pedido não encontrado"}</p>
        <Link
          href="/dashboard/meus-pedidos"
          className="text-amarelo hover:underline"
        >
          Voltar para Meus Pedidos
        </Link>
      </div>
    );
  }

  const status = statusConfig[pedido.status] ?? statusConfig.pendente;
  const isPendente = pedido.status === "pendente" && !pedido.expirado;
  const isPago = pedido.status === "pago";

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <Link
        href="/dashboard/meus-pedidos"
        className="inline-flex items-center gap-2 text-off-white-soft/70 hover:text-off-white transition-colors"
      >
        {Icons.back}
        <span className="font-texto">Voltar</span>
      </Link>

      {/* Pedido Card */}
      <div className="bg-marrom/60 border border-marrom rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-terracota to-terracota-dark p-4">
          <div className="text-center">
            <p className="text-off-white/60 text-xs font-texto mb-1">
              Pedido
            </p>
            <h1 className="font-titulo text-xl text-off-white font-semibold">
              {pedido.numero}
            </h1>
          </div>
        </div>

        {/* Status */}
        <div className="p-4 border-b border-marrom flex justify-center">
          <span
            className={`px-4 py-2 rounded-full text-sm font-texto border ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        {/* PIX QR Code - Mostrar apenas se pendente */}
        {isPendente && pagamento?.pix_qr_code_base64 && (
          <div className="p-6 border-b border-marrom">
            <p className="text-center text-off-white-soft/70 text-sm font-texto mb-4">
              Escaneie o QR Code para pagar
            </p>
            <div className="flex justify-center bg-off-white rounded-lg p-4 mx-auto max-w-[240px]">
              <Image
                src={pagamento.pix_qr_code_base64}
                alt="QR Code PIX"
                width={200}
                height={200}
                className="rounded"
              />
            </div>
            {pagamento.pix_qr_code && (
              <div className="mt-4">
                <p className="text-center text-off-white-soft/60 text-xs font-texto mb-2">
                  Ou copie o código PIX
                </p>
                <button
                  onClick={copyPixCode}
                  className="w-full flex items-center justify-center gap-2 bg-marrom hover:bg-marrom-dark px-4 py-3 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <span className="text-verde-musgo-light">{Icons.check}</span>
                      <span className="text-verde-musgo-light font-texto text-sm">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <span className="text-amarelo">{Icons.copy}</span>
                      <span className="text-off-white font-texto text-sm">Copiar código PIX</span>
                    </>
                  )}
                </button>
              </div>
            )}
            {pagamento.pix_expiration && (
              <p className="text-center text-off-white-soft/50 text-xs font-texto mt-3">
                Expira em: {formatDateTime(pagamento.pix_expiration)}
              </p>
            )}
          </div>
        )}

        {/* Evento Info */}
        <div className="p-4 space-y-4 border-b border-marrom">
          <h2 className="font-titulo text-off-white font-medium">
            Evento
          </h2>

          {/* Nome do Evento */}
          <div className="flex items-center gap-3">
            <div className="text-amarelo">{Icons.ticket}</div>
            <div>
              <p className="text-off-white-soft/60 text-xs font-texto">Evento</p>
              <p className="text-off-white font-texto">{evento.nome}</p>
            </div>
          </div>

          {/* Data */}
          <div className="flex items-center gap-3">
            <div className="text-amarelo">{Icons.calendar}</div>
            <div>
              <p className="text-off-white-soft/60 text-xs font-texto">Data</p>
              <p className="text-off-white font-texto capitalize">
                {formatDate(evento.data_evento)}
              </p>
            </div>
          </div>

          {/* Horário */}
          <div className="flex items-center gap-3">
            <div className="text-amarelo">{Icons.clock}</div>
            <div>
              <p className="text-off-white-soft/60 text-xs font-texto">Horário</p>
              <p className="text-off-white font-texto">
                {formatTime(evento.horario_inicio)}
              </p>
            </div>
          </div>

          {/* Local */}
          {evento.local_nome && (
            <div className="flex items-center gap-3">
              <div className="text-amarelo">{Icons.location}</div>
              <div>
                <p className="text-off-white-soft/60 text-xs font-texto">Local</p>
                <p className="text-off-white font-texto">{evento.local_nome}</p>
                {evento.local_endereco && (
                  <p className="text-off-white-soft/80 text-sm font-texto">
                    {evento.local_endereco}
                  </p>
                )}
                {evento.local_bairro && (
                  <p className="text-off-white-soft/60 text-sm font-texto">
                    {evento.local_bairro} - {evento.local_cidade}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Itens do Pedido */}
        <div className="p-4 space-y-4 border-b border-marrom">
          <h2 className="font-titulo text-off-white font-medium">
            Itens do Pedido
          </h2>

          <div className="space-y-3">
            {itens.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-marrom/40 rounded-lg p-3"
              >
                <div>
                  <p className="text-off-white font-texto">
                    {item.lote.nome}
                  </p>
                  <p className="text-off-white-soft/60 text-sm font-texto">
                    {item.quantidade}x {formatCurrency(item.preco_unitario)}
                  </p>
                </div>
                <p className="text-amarelo font-titulo font-semibold">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-3 border-t border-marrom">
            <p className="text-off-white font-texto font-medium">Total</p>
            <p className="text-amarelo font-titulo text-xl font-bold">
              {formatCurrency(pedido.valor_total)}
            </p>
          </div>
        </div>

        {/* Pagamento Info */}
        <div className="p-4 space-y-4">
          <h2 className="font-titulo text-off-white font-medium">
            Pagamento
          </h2>

          <div className="flex items-center gap-3">
            <div className="text-amarelo">{Icons.creditCard}</div>
            <div>
              <p className="text-off-white-soft/60 text-xs font-texto">Método</p>
              <p className="text-off-white font-texto capitalize">
                {pagamento?.metodo || "PIX"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-amarelo">{Icons.receipt}</div>
            <div>
              <p className="text-off-white-soft/60 text-xs font-texto">Data do Pedido</p>
              <p className="text-off-white font-texto">
                {formatDateTime(pedido.created_at)}
              </p>
            </div>
          </div>

          {pagamento?.pago_em && (
            <div className="flex items-center gap-3">
              <div className="text-verde-musgo-light">{Icons.check}</div>
              <div>
                <p className="text-off-white-soft/60 text-xs font-texto">Pago em</p>
                <p className="text-off-white font-texto">
                  {formatDateTime(pagamento.pago_em)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ações */}
      {isPago && (
        <Link
          href="/dashboard/meus-ingressos"
          className="block w-full bg-amarelo text-marrom-dark text-center px-6 py-3 rounded-xl font-titulo font-semibold hover:bg-amarelo-light transition-colors"
        >
          Ver Meus Ingressos
        </Link>
      )}

      {isPendente && (
        <div className="bg-marrom/40 border border-amarelo/30 rounded-xl p-4">
          <h3 className="font-titulo text-amarelo font-medium mb-2">
            Aguardando Pagamento
          </h3>
          <p className="text-off-white-soft/70 text-sm font-texto">
            Escaneie o QR Code acima ou copie o código PIX para realizar o pagamento.
            Após a confirmação, seus ingressos serão liberados automaticamente.
          </p>
        </div>
      )}
    </div>
  );
}
