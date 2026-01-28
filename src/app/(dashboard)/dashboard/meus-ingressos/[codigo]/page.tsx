"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface IngressoDetalhado {
  id: string;
  codigo: string;
  nome_titular: string;
  status: string;
  created_at: string;
  qr_code_image: string;
  evento: {
    nome: string;
    slug: string;
    data_evento: string;
    horario_inicio: string | null;
    local_nome: string | null;
    local_endereco: string | null;
    local_bairro: string | null;
    local_cidade: string | null;
    classificacao: string;
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
    className: "bg-verde-musgo/20 text-verde-musgo-light border-verde-musgo/30",
  },
  utilizado: {
    label: "Utilizado",
    className: "bg-marrom-light/20 text-marrom-light border-marrom-light/30",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-vermelho/20 text-vermelho-light border-vermelho/30",
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
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  ticket: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
};

export default function IngressoDetalhadoPage() {
  const params = useParams();
  const codigo = params.codigo as string;
  const [ingresso, setIngresso] = useState<IngressoDetalhado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (codigo) {
      fetchIngresso();
    }
  }, [codigo]);

  const fetchIngresso = async () => {
    try {
      const response = await fetch(`/api/meus-ingressos/${codigo}`);
      if (response.ok) {
        const data = await response.json();
        setIngresso(data.ingresso);
      } else {
        setError("Ingresso não encontrado");
      }
    } catch (err) {
      console.error("Erro ao buscar ingresso:", err);
      setError("Erro ao carregar ingresso");
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

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "A partir do pôr do sol";
    return timeString.slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-amarelo border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !ingresso) {
    return (
      <div className="text-center py-12">
        <p className="text-vermelho-light mb-4">{error || "Ingresso não encontrado"}</p>
        <Link
          href="/dashboard/meus-ingressos"
          className="text-amarelo hover:underline"
        >
          Voltar para Meus Ingressos
        </Link>
      </div>
    );
  }

  const status = statusConfig[ingresso.status] ?? statusConfig.ativo;

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <Link
        href="/dashboard/meus-ingressos"
        className="inline-flex items-center gap-2 text-off-white-soft/70 hover:text-off-white transition-colors"
      >
        {Icons.back}
        <span className="font-texto">Voltar</span>
      </Link>

      {/* Ingresso Card */}
      <div className="bg-marrom/60 border border-marrom rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-terracota to-terracota-dark p-4 text-center">
          <h1 className="font-titulo text-xl text-off-white font-semibold">
            {ingresso.evento.nome}
          </h1>
          <p className="text-amarelo font-texto mt-1">{ingresso.lote.nome}</p>
        </div>

        {/* QR Code */}
        <div className="p-6 flex justify-center bg-off-white">
          <div className="relative">
            <Image
              src={ingresso.qr_code_image}
              alt="QR Code do Ingresso"
              width={200}
              height={200}
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Código */}
        <div className="bg-marrom px-4 py-3 text-center">
          <p className="text-off-white-soft/60 text-xs font-texto mb-1">
            Código do Ingresso
          </p>
          <p className="text-off-white font-titulo text-2xl font-bold tracking-wider">
            {ingresso.codigo}
          </p>
        </div>

        {/* Status */}
        <div className="p-4 border-t border-marrom flex justify-center">
          <span
            className={`px-4 py-2 rounded-full text-sm font-texto border ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        {/* Detalhes */}
        <div className="p-4 space-y-4 border-t border-marrom">
          {/* Data */}
          <div className="flex items-center gap-3">
            <div className="text-amarelo">{Icons.calendar}</div>
            <div>
              <p className="text-off-white-soft/60 text-xs font-texto">Data</p>
              <p className="text-off-white font-texto capitalize">
                {formatDate(ingresso.evento.data_evento)}
              </p>
            </div>
          </div>

          {/* Horário */}
          <div className="flex items-center gap-3">
            <div className="text-amarelo">{Icons.clock}</div>
            <div>
              <p className="text-off-white-soft/60 text-xs font-texto">Horário</p>
              <p className="text-off-white font-texto">
                {formatTime(ingresso.evento.horario_inicio)}
              </p>
            </div>
          </div>

          {/* Local */}
          <div className="flex items-center gap-3">
            <div className="text-amarelo">{Icons.location}</div>
            <div>
              <p className="text-off-white-soft/60 text-xs font-texto">Local</p>
              {ingresso.status === "ativo" && ingresso.evento.local_endereco ? (
                <>
                  <p className="text-off-white font-texto">
                    {ingresso.evento.local_nome}
                  </p>
                  <p className="text-off-white-soft/80 text-sm font-texto">
                    {ingresso.evento.local_endereco}
                  </p>
                  <p className="text-off-white-soft/60 text-sm font-texto">
                    {ingresso.evento.local_bairro} - {ingresso.evento.local_cidade}
                  </p>
                </>
              ) : (
                <p className="text-off-white font-texto">
                  {ingresso.evento.local_bairro} - {ingresso.evento.local_cidade}
                </p>
              )}
            </div>
          </div>

          {/* Titular */}
          <div className="flex items-center gap-3">
            <div className="text-amarelo">{Icons.user}</div>
            <div>
              <p className="text-off-white-soft/60 text-xs font-texto">Titular</p>
              <p className="text-off-white font-texto">{ingresso.nome_titular}</p>
            </div>
          </div>

          {/* Tipo */}
          <div className="flex items-center gap-3">
            <div className="text-amarelo">{Icons.ticket}</div>
            <div>
              <p className="text-off-white-soft/60 text-xs font-texto">Tipo</p>
              <p className="text-off-white font-texto">{ingresso.lote.nome}</p>
            </div>
          </div>
        </div>

        {/* Classificação */}
        <div className="p-4 border-t border-marrom text-center">
          <p className="text-off-white-soft/60 text-xs font-texto">
            Classificação: {ingresso.evento.classificacao}
          </p>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-marrom/40 border border-marrom rounded-xl p-4">
        <h3 className="font-titulo text-off-white font-medium mb-2">
          Apresente na entrada
        </h3>
        <p className="text-off-white-soft/70 text-sm font-texto">
          Mostre o QR Code acima na entrada do evento. 
          Você também pode apresentar o código alfanumérico caso necessário.
        </p>
      </div>
    </div>
  );
}
