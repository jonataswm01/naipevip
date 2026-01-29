"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Confetti from "react-confetti";

// =============================================
// TYPES
// =============================================

interface PedidoData {
  pedido: {
    id: string;
    numero: string;
    status: string;
    quantidade_total: number;
    valor_total: number;
  };
  evento: {
    id: string;
    nome: string;
    data_evento: string;
    local_nome: string | null;
    local_endereco: string | null;
    local_bairro: string | null;
    local_cidade: string | null;
  };
  itens: Array<{
    id: string;
    quantidade: number;
    lote: {
      nome: string;
    };
  }>;
}

interface LocalEvento {
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  mapsUrl: string;
}

// =============================================
// ICONS
// =============================================

const Icons = {
  check: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  ticket: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  location: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  map: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  whatsapp: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  home: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
};

// =============================================
// MAIN COMPONENT
// =============================================

export default function ComprasSucesso({
  params,
}: {
  params: Promise<{ pedidoId: string }>;
}) {
  const { pedidoId } = use(params);
  const router = useRouter();

  // States
  const [pedidoData, setPedidoData] = useState<PedidoData | null>(null);
  const [localEvento, setLocalEvento] = useState<LocalEvento | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Get window size for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Fetch pedido e local
  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar pedido
        const pedidoResponse = await fetch(`/api/pedidos/${pedidoId}`);
        const pedidoJson = await pedidoResponse.json();

        if (!pedidoResponse.ok) {
          router.push("/dashboard/meus-pedidos");
          return;
        }

        // Verificar se está pago
        if (pedidoJson.pedido.status !== "pago") {
          // Se não pago, redirecionar para pagamento
          router.push(`/compra/pix/${pedidoId}`);
          return;
        }

        setPedidoData(pedidoJson);

        // Buscar local completo
        const localResponse = await fetch("/api/eventos/local");
        if (localResponse.ok) {
          const localJson = await localResponse.json();
          setLocalEvento(localJson);
        }
      } catch {
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [pedidoId, router]);

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-amarelo border-t-transparent animate-spin" />
        <p className="text-off-white-soft/70 font-texto">Carregando...</p>
      </div>
    );
  }

  if (!pedidoData) {
    return null;
  }

  const { pedido, evento, itens } = pedidoData;

  // Formatar data corretamente (evitando problemas de timezone)
  const dataEventoStr = evento.data_evento.split("T")[0]; // Pega apenas a data (YYYY-MM-DD)
  const [ano, mes, dia] = dataEventoStr.split("-").map(Number);
  const dataEvento = new Date(ano, mes - 1, dia); // mes - 1 porque Date usa 0-11
  
  const dataFormatada = dataEvento.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  
  // Capitalizar primeira letra
  const dataFormatadaCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

  // Formatar nome do ingresso de forma mais clara
  const formatarIngresso = (nomeLote: string, quantidade: number): string => {
    // Remove "º", "ª", "lote", "Lote" e espaços extras, e simplifica
    const nomeLimpo = nomeLote
      .replace(/[ºª]/g, "")
      .replace(/\b(lote|Lote)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    
    // Se o nome limpo estiver vazio ou só tiver números, usa apenas "Ingresso"
    if (!nomeLimpo || /^\d+$/.test(nomeLimpo)) {
      return quantidade > 1 ? `${quantidade}x Ingresso` : "Ingresso";
    }
    
    // Se já tem "Ingresso" no nome, mantém; senão, adiciona
    if (nomeLimpo.toLowerCase().includes("ingresso")) {
      return quantidade > 1 ? `${quantidade}x ${nomeLimpo}` : nomeLimpo;
    }
    return quantidade > 1 ? `${quantidade}x ${nomeLimpo} - Ingresso` : `${nomeLimpo} - Ingresso`;
  };

  // Determinar se deve usar local do evento ou localEvento
  // Prioriza os dados do evento se disponíveis
  const localParaExibir = 
    evento.local_nome && evento.local_endereco
      ? {
          nome: evento.local_nome,
          endereco: evento.local_endereco,
          bairro: evento.local_bairro || "",
          cidade: evento.local_cidade || "",
          mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${evento.local_endereco}, ${evento.local_bairro || ""}, ${evento.local_cidade || ""}`
          )}`,
        }
      : localEvento
      ? localEvento
      : null;

  return (
    <>
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          colors={["#D4A84B", "#C9983D", "#8B5E3C", "#4A7C59", "#F5EDE0"]}
        />
      )}

      <motion.div
        className="max-w-md mx-auto text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Ícone de Sucesso */}
        <motion.div
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-verde-musgo/20 flex items-center justify-center text-verde-musgo-light"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          {Icons.check}
        </motion.div>

        {/* Título */}
        <motion.h1
          className="font-titulo text-2xl text-off-white mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Compra Confirmada!
        </motion.h1>

        <motion.p
          className="font-texto text-off-white-soft/70 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Seus ingressos foram gerados com sucesso
        </motion.p>

        {/* Card do Pedido */}
        <motion.div
          className="bg-marrom/50 border border-marrom rounded-xl p-5 mb-6 text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amarelo/20 flex items-center justify-center text-amarelo">
              {Icons.ticket}
            </div>
            <div>
              <p className="font-titulo text-off-white">{evento.nome}</p>
              <p className="font-texto text-sm text-off-white-soft/70">
                Pedido #{pedido.numero}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-off-white-soft/70">
              <span className="text-amarelo/70">{Icons.calendar}</span>
              <span className="font-texto">{dataFormatadaCapitalizada}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-t border-marrom">
              <span className="font-texto text-off-white-soft">
                {itens.map((i) => formatarIngresso(i.lote.nome, i.quantidade)).join(", ")}
              </span>
              <span className="font-titulo text-amarelo">
                R$ {pedido.valor_total.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Local do Evento */}
        {localParaExibir && (
          <motion.div
            className="bg-verde-musgo/20 border border-verde-musgo/50 rounded-xl p-5 mb-6 text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-3 text-verde-musgo-light">
              {Icons.location}
              <span className="font-titulo text-sm uppercase tracking-wide">
                Local do Evento
              </span>
            </div>

            <p className="font-titulo text-off-white mb-1">{localParaExibir.nome}</p>
            <p className="font-texto text-sm text-off-white-soft/70 mb-3">
              {localParaExibir.endereco}
              {localParaExibir.bairro && (
                <>
                  <br />
                  {localParaExibir.bairro} - {localParaExibir.cidade}
                </>
              )}
            </p>

            <a
              href={localParaExibir.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-verde-musgo text-white font-texto text-sm rounded-lg hover:bg-verde-musgo-light transition-colors"
            >
              {Icons.map}
              Abrir no Maps
            </a>
          </motion.div>
        )}

        {/* Ações */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Link
            href="/dashboard/meus-ingressos"
            className="w-full flex items-center justify-center gap-2 py-4 bg-amarelo text-marrom-dark font-titulo uppercase tracking-wide rounded-xl hover:bg-amarelo-light transition-colors"
          >
            {Icons.ticket}
            Ver Meus Ingressos
          </Link>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3 bg-transparent border border-marrom text-off-white font-texto rounded-xl hover:bg-marrom/50 transition-colors"
          >
            {Icons.home}
            Voltar ao Início
          </Link>
        </motion.div>

        {/* Aviso de confirmação */}
        <motion.p
          className="mt-6 font-texto text-xs text-off-white-soft/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Uma confirmação foi enviada para seu WhatsApp/e-mail
        </motion.p>
      </motion.div>
    </>
  );
}
