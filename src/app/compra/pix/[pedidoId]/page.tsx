"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

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
    expires_at: string;
    expirado: boolean;
  };
  evento: {
    id: string;
    nome: string;
    data_evento: string;
  };
  itens: Array<{
    id: string;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
    lote: {
      id: string;
      nome: string;
      preco: number;
    };
  }>;
  pagamento: {
    id: string;
    status: string;
    metodo: string;
    valor: number;
    pix_qr_code: string;
    pix_qr_code_base64: string;
    pix_expiration: string;
    pago_em: string | null;
  } | null;
}

// =============================================
// ICONS
// =============================================

const Icons = {
  copy: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  alert: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  refresh: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  ticket: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  success: (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// =============================================
// MAIN COMPONENT
// =============================================

export default function PagamentoPix({
  params,
}: {
  params: Promise<{ pedidoId: string }>;
}) {
  const { pedidoId } = use(params);
  const router = useRouter();

  // States
  const [pedidoData, setPedidoData] = useState<PedidoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState<number>(0);

  // Fetch pedido
  const fetchPedido = useCallback(async () => {
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}`);
      const data = await response.json();

      if (!response.ok) {
        setErro(data.error || "Pedido não encontrado");
        return null;
      }

      setPedidoData(data);

      // Debug: Log dos dados recebidos
      console.log("=== DEBUG PÁGINA PIX ===");
      console.log("Pagamento existe:", !!data.pagamento);
      if (data.pagamento) {
        console.log("pix_qr_code:", data.pagamento.pix_qr_code ? `${data.pagamento.pix_qr_code.substring(0, 50)}...` : "NULL/VAZIO");
        console.log("pix_qr_code_base64:", data.pagamento.pix_qr_code_base64 ? `${data.pagamento.pix_qr_code_base64.substring(0, 50)}...` : "NULL/VAZIO");
      }

      // Se pago, redirecionar para sucesso
      if (data.pedido.status === "pago" || data.pagamento?.status === "approved") {
        router.push(`/compra/sucesso/${pedidoId}`);
        return data;
      }

      // Calcular tempo restante
      if (data.pedido.expires_at) {
        const expiration = new Date(data.pedido.expires_at).getTime();
        const agora = Date.now();
        const restante = Math.max(0, Math.floor((expiration - agora) / 1000));
        setTempoRestante(restante);
      }

      return data;
    } catch {
      setErro("Erro de conexão");
      return null;
    } finally {
      setLoading(false);
    }
  }, [pedidoId, router]);

  // Initial fetch
  useEffect(() => {
    fetchPedido();
  }, [fetchPedido]);

  // Polling para verificar status (a cada 5 segundos)
  useEffect(() => {
    if (!pedidoData || pedidoData.pedido.status !== "pendente") return;

    const interval = setInterval(async () => {
      const data = await fetchPedido();
      if (data?.pedido.status === "pago" || data?.pagamento?.status === "approved") {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pedidoData, fetchPedido]);

  // Countdown timer
  useEffect(() => {
    if (tempoRestante <= 0) return;

    const interval = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          // Expirou
          fetchPedido();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tempoRestante, fetchPedido]);

  // Copiar código PIX
  const handleCopiar = async () => {
    if (!pedidoData?.pagamento?.pix_qr_code) return;

    try {
      await navigator.clipboard.writeText(pedidoData.pagamento.pix_qr_code);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      // Fallback para navegadores antigos
      const textarea = document.createElement("textarea");
      textarea.value = pedidoData.pagamento.pix_qr_code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  // Formatar tempo
  const formatarTempo = (segundos: number): string => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-amarelo border-t-transparent animate-spin" />
        <p className="text-off-white-soft/70 font-texto">Carregando pagamento...</p>
      </div>
    );
  }

  // Erro
  if (erro || !pedidoData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-vermelho/20 flex items-center justify-center text-vermelho">
          {Icons.alert}
        </div>
        <h2 className="font-titulo text-xl text-off-white">Ops!</h2>
        <p className="text-off-white-soft/70 font-texto">{erro}</p>
        <button
          onClick={() => router.push("/compra/carrinho")}
          className="mt-4 px-6 py-3 bg-amarelo text-marrom-dark font-titulo text-sm uppercase tracking-wide rounded-lg"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Expirado
  if (pedidoData.pedido.expirado || pedidoData.pedido.status === "expirado" || tempoRestante === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="w-16 h-16 rounded-full bg-vermelho/20 flex items-center justify-center text-vermelho">
          {Icons.clock}
        </div>
        <h2 className="font-titulo text-xl text-off-white">Tempo Esgotado</h2>
        <p className="text-off-white-soft/70 font-texto max-w-xs">
          O tempo para pagamento expirou. Não se preocupe, você pode tentar novamente.
        </p>
        <button
          onClick={() => router.push("/compra/carrinho")}
          className="mt-4 px-6 py-3 bg-amarelo text-marrom-dark font-titulo text-sm uppercase tracking-wide rounded-lg hover:bg-amarelo-light transition-colors"
        >
          Comprar novamente
        </button>
      </motion.div>
    );
  }

  const { pedido, pagamento, itens } = pedidoData;

  return (
    <motion.div
      className="max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="font-titulo text-2xl text-off-white mb-1">Pagamento PIX</h1>
        <p className="font-texto text-sm text-off-white-soft/70">
          Pedido #{pedido.numero}
        </p>
      </div>

      {/* Timer */}
      <motion.div
        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl mb-6 ${
          tempoRestante < 60 ? "bg-vermelho/20 text-vermelho-light" : "bg-amarelo/10 text-amarelo"
        }`}
        animate={tempoRestante < 60 ? { scale: [1, 1.02, 1] } : {}}
        transition={{ repeat: tempoRestante < 60 ? Infinity : 0, duration: 1 }}
      >
        {Icons.clock}
        <span className="font-titulo text-lg">
          Pague em até: {formatarTempo(tempoRestante)}
        </span>
      </motion.div>

      {/* QR Code */}
      <motion.div
        className="bg-white rounded-2xl p-6 mb-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {pagamento?.pix_qr_code_base64 && (
          <div className="relative w-full aspect-square max-w-[250px] mx-auto mb-4">
            <Image
              src={pagamento.pix_qr_code_base64}
              alt="QR Code PIX"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        )}

        <p className="text-center text-marrom-dark/70 font-texto text-sm">
          Escaneie o QR Code com o app do seu banco
        </p>
      </motion.div>

      {/* Código Copia e Cola */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block font-texto text-sm text-off-white-soft/70 mb-2">
          Ou copie o código PIX:
        </label>

        <div className="relative">
          <div className="bg-marrom/50 border border-marrom rounded-xl p-4 pr-16">
            <p className="font-mono text-xs text-off-white-soft break-all line-clamp-2">
              {pagamento?.pix_qr_code}
            </p>
          </div>

          <button
            onClick={handleCopiar}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-lg transition-all ${
              copiado
                ? "bg-verde-musgo text-white"
                : "bg-amarelo text-marrom-dark hover:bg-amarelo-light"
            }`}
          >
            {copiado ? Icons.check : Icons.copy}
          </button>
        </div>

        <AnimatePresence>
          {copiado && (
            <motion.p
              className="mt-2 text-center text-verde-musgo-light font-texto text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Código copiado!
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Resumo do Pedido */}
      <motion.div
        className="bg-marrom/30 border border-marrom rounded-xl p-4 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="font-titulo text-sm text-off-white-soft/70 uppercase tracking-wide mb-3">
          Resumo do Pedido
        </h3>

        <div className="space-y-2">
          {itens.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <span className="font-texto text-off-white-soft">
                {item.quantidade}x {item.lote.nome}
              </span>
              <span className="font-texto text-off-white">
                R$ {item.subtotal.toFixed(2).replace(".", ",")}
              </span>
            </div>
          ))}

          <div className="border-t border-marrom my-3" />

          <div className="flex justify-between items-center">
            <span className="font-titulo text-off-white">Total</span>
            <span className="font-titulo text-xl text-amarelo">
              R$ {pedido.valor_total.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Instruções */}
      <motion.div
        className="space-y-3 text-off-white-soft/70 font-texto text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-amarelo/20 text-amarelo flex items-center justify-center text-xs font-bold shrink-0">
            1
          </span>
          <p>Abra o app do seu banco e escolha pagar via PIX</p>
        </div>

        <div className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-amarelo/20 text-amarelo flex items-center justify-center text-xs font-bold shrink-0">
            2
          </span>
          <p>Escaneie o QR Code ou cole o código PIX</p>
        </div>

        <div className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-amarelo/20 text-amarelo flex items-center justify-center text-xs font-bold shrink-0">
            3
          </span>
          <p>Confirme o pagamento e aguarde a confirmação automática</p>
        </div>
      </motion.div>

      {/* Status de verificação */}
      <motion.div
        className="mt-6 flex items-center justify-center gap-2 text-off-white-soft/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="animate-spin">{Icons.refresh}</span>
        <span className="font-texto text-xs">Verificando pagamento automaticamente...</span>
      </motion.div>

      {/* Botão de Simular Pagamento (apenas em desenvolvimento) */}
      {process.env.NODE_ENV !== "production" && (
        <motion.div
          className="mt-8 pt-6 border-t border-marrom/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-center text-off-white-soft/50 font-texto text-xs mb-3">
            Ambiente de Teste
          </p>
          <SimularPagamentoButton pedidoId={pedidoId} onSuccess={fetchPedido} />
        </motion.div>
      )}
    </motion.div>
  );
}

// Componente para simular pagamento
function SimularPagamentoButton({ 
  pedidoId, 
  onSuccess 
}: { 
  pedidoId: string; 
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSimular = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}/simular-pagamento`, {
        method: "POST",
      });

      if (response.ok) {
        // Aguardar um pouco e redirecionar
        setTimeout(() => {
          router.push(`/compra/sucesso/${pedidoId}`);
        }, 500);
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao simular pagamento");
      }
    } catch {
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSimular}
      disabled={loading}
      className="w-full py-3 bg-verde-musgo/80 hover:bg-verde-musgo text-white font-titulo text-sm uppercase tracking-wide rounded-lg transition-colors disabled:opacity-50"
    >
      {loading ? "Processando..." : "Simular Pagamento Aprovado"}
    </button>
  );
}
