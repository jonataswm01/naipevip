"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// =============================================
// TYPES
// =============================================

interface Evento {
  id: string;
  nome: string;
  data_evento: string;
  data_formatada: string;
  horario_inicio: string | null;
  local_bairro: string | null;
  local_cidade: string | null;
  classificacao: string;
}

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

interface CarrinhoData {
  eventoId: string;
  loteId: string;
  quantidade: number;
  timestamp: number;
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
  calendar: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  location: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  minus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  lock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  alert: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
// STORAGE KEYS
// =============================================

const CARRINHO_KEY = "naipevip_carrinho";
const CARRINHO_EXPIRATION = 30 * 60 * 1000; // 30 minutos

// =============================================
// MAIN COMPONENT
// =============================================

function CarrinhoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loteParam = searchParams.get("lote");

  // States
  const [evento, setEvento] = useState<Evento | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteSelecionado, setLoteSelecionado] = useState<string>("");
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dropdownAberto, setDropdownAberto] = useState(false);

  // Fetch lotes
  const fetchLotes = useCallback(async () => {
    try {
      const response = await fetch("/api/lotes");
      const data = await response.json();

      if (!response.ok) {
        setErro(data.error || "Erro ao carregar ingressos");
        return;
      }

      setEvento(data.evento);
      setLotes(data.lotes);

      // Verificar carrinho salvo
      const carrinhoSalvo = sessionStorage.getItem(CARRINHO_KEY);
      if (carrinhoSalvo) {
        const dados: CarrinhoData = JSON.parse(carrinhoSalvo);
        if (Date.now() - dados.timestamp < CARRINHO_EXPIRATION) {
          // Verificar se o lote ainda existe e está disponível
          const loteExiste = data.lotes.find(
            (l: Lote) => l.id === dados.loteId && l.disponivel
          );
          if (loteExiste) {
            setLoteSelecionado(dados.loteId);
            setQuantidade(Math.min(dados.quantidade, loteExiste.limite_por_usuario));
            return;
          }
        }
        sessionStorage.removeItem(CARRINHO_KEY);
      }

      // Se veio lote por URL
      if (loteParam) {
        const loteUrl = data.lotes.find(
          (l: Lote) => l.id === loteParam && l.disponivel
        );
        if (loteUrl) {
          setLoteSelecionado(loteParam);
          return;
        }
      }

      // Selecionar primeiro lote disponível
      const primeiroDisponivel = data.lotes.find((l: Lote) => l.disponivel);
      if (primeiroDisponivel) {
        setLoteSelecionado(primeiroDisponivel.id);
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [loteParam]);

  useEffect(() => {
    fetchLotes();
  }, [fetchLotes]);

  // Lote atual selecionado
  const loteAtual = lotes.find((l) => l.id === loteSelecionado);
  const limiteAtual = loteAtual?.limite_por_usuario || 4;
  const subtotal = loteAtual ? loteAtual.preco * quantidade : 0;

  // Handlers
  const handleQuantidadeChange = (delta: number) => {
    const novaQuantidade = quantidade + delta;
    if (novaQuantidade >= 1 && novaQuantidade <= limiteAtual) {
      setQuantidade(novaQuantidade);
    }
  };

  const handleLoteChange = (loteId: string) => {
    setLoteSelecionado(loteId);
    setDropdownAberto(false);
    // Reset quantidade se exceder limite do novo lote
    const novoLote = lotes.find((l) => l.id === loteId);
    if (novoLote && quantidade > novoLote.limite_por_usuario) {
      setQuantidade(novoLote.limite_por_usuario);
    }
  };

  const handleContinuar = async () => {
    if (!loteAtual || !evento) return;

    setProcessando(true);
    setErro(null);

    try {
      // Verificar autenticação
      const authResponse = await fetch("/api/auth/me");

      if (!authResponse.ok) {
        // Não logado - salvar carrinho e redirecionar
        sessionStorage.setItem(
          CARRINHO_KEY,
          JSON.stringify({
            eventoId: evento.id,
            loteId: loteSelecionado,
            quantidade,
            timestamp: Date.now(),
          })
        );

        router.push("/login?redirect=/compra/carrinho");
        return;
      }

      // Logado - criar pedido
      const compraResponse = await fetch("/api/comprar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loteId: loteSelecionado,
          quantidade,
        }),
      });

      const compraData = await compraResponse.json();

      if (!compraResponse.ok) {
        setErro(compraData.error || "Erro ao processar compra");
        setProcessando(false);
        return;
      }

      // Limpar carrinho e redirecionar para pagamento
      sessionStorage.removeItem(CARRINHO_KEY);
      router.push(`/compra/pix/${compraData.pedido.id}`);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
      setProcessando(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-amarelo border-t-transparent animate-spin" />
        <p className="text-off-white-soft/70 font-texto">Carregando ingressos...</p>
      </div>
    );
  }

  // Error state
  if (erro && !evento) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-vermelho/20 flex items-center justify-center text-vermelho">
          {Icons.alert}
        </div>
        <h2 className="font-titulo text-xl text-off-white">Ops!</h2>
        <p className="text-off-white-soft/70 font-texto">{erro}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-6 py-3 bg-amarelo text-marrom-dark font-titulo text-sm uppercase tracking-wide rounded-lg"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  // No lots available
  if (lotes.length === 0 || !lotes.some((l) => l.disponivel)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-amarelo/20 flex items-center justify-center text-amarelo">
          {Icons.ticket}
        </div>
        <h2 className="font-titulo text-xl text-off-white">Ingressos Esgotados</h2>
        <p className="text-off-white-soft/70 font-texto">
          Todos os ingressos foram vendidos. Fique de olho nas próximas edições!
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-6 py-3 bg-amarelo text-marrom-dark font-titulo text-sm uppercase tracking-wide rounded-lg"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Título */}
      <div className="text-center mb-6">
        <h1 className="font-titulo text-2xl text-off-white mb-1">Seu Carrinho</h1>
        <p className="font-texto text-sm text-off-white-soft/70">
          Selecione o ingresso e quantidade
        </p>
      </div>

      {/* Card do Evento */}
      <motion.div
        className="bg-marrom/50 border border-marrom rounded-xl p-4 mb-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-start gap-4">
          {/* Ícone decorativo */}
          <div className="w-12 h-12 rounded-lg bg-amarelo/20 flex items-center justify-center text-amarelo shrink-0">
            {Icons.ticket}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-titulo text-lg text-off-white truncate">
              {evento?.nome}
            </h2>

            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-off-white-soft/70">
                <span className="text-amarelo/70">{Icons.calendar}</span>
                <span className="font-texto text-sm">{evento?.data_formatada}</span>
              </div>

              <div className="flex items-center gap-2 text-off-white-soft/70">
                <span className="text-amarelo/70">{Icons.clock}</span>
                <span className="font-texto text-sm">A partir do pôr do sol</span>
              </div>

              {evento?.local_bairro && (
                <div className="flex items-center gap-2 text-off-white-soft/70">
                  <span className="text-amarelo/70">{Icons.location}</span>
                  <span className="font-texto text-sm">
                    {evento.local_bairro}
                    {evento.local_cidade ? `, ${evento.local_cidade}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Seleção de Lote */}
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block font-texto text-sm text-off-white-soft/70 mb-2">
          Tipo de Ingresso
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownAberto(!dropdownAberto)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-marrom/50 border border-marrom rounded-xl text-left transition-colors hover:border-amarelo/50 focus:outline-none focus:border-amarelo"
          >
            <div className="flex-1 min-w-0">
              {loteAtual ? (
                <>
                  <span className="block font-titulo text-off-white">
                    {loteAtual.nome}
                  </span>
                  <span className="block font-texto text-sm text-amarelo">
                    R$ {loteAtual.preco.toFixed(2).replace(".", ",")}
                  </span>
                </>
              ) : (
                <span className="text-off-white-soft/50">Selecione um lote</span>
              )}
            </div>
            <span
              className={`text-off-white-soft/50 transition-transform ${
                dropdownAberto ? "rotate-180" : ""
              }`}
            >
              {Icons.chevronDown}
            </span>
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {dropdownAberto && (
              <motion.div
                className="absolute top-full left-0 right-0 mt-2 bg-marrom-dark border border-marrom rounded-xl overflow-hidden shadow-lg z-20"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {lotes.map((lote) => (
                  <button
                    key={lote.id}
                    type="button"
                    disabled={!lote.disponivel}
                    onClick={() => handleLoteChange(lote.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                      lote.disponivel
                        ? "hover:bg-marrom/50"
                        : "opacity-50 cursor-not-allowed"
                    } ${lote.id === loteSelecionado ? "bg-amarelo/10" : ""}`}
                  >
                    <div className="flex-1">
                      <span
                        className={`block font-titulo ${
                          lote.id === loteSelecionado
                            ? "text-amarelo"
                            : "text-off-white"
                        }`}
                      >
                        {lote.nome}
                      </span>
                      <span className="block font-texto text-sm text-off-white-soft/70">
                        {lote.esgotado
                          ? "Esgotado"
                          : `R$ ${lote.preco.toFixed(2).replace(".", ",")}`}
                      </span>
                    </div>

                    {lote.id === loteSelecionado && (
                      <span className="text-amarelo">{Icons.check}</span>
                    )}

                    {lote.esgotado && (
                      <span className="px-2 py-0.5 bg-vermelho/20 text-vermelho-light text-xs font-texto rounded">
                        Esgotado
                      </span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Seleção de Quantidade */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label className="block font-texto text-sm text-off-white-soft/70 mb-2">
          Quantidade
        </label>

        <div className="flex items-center justify-between px-4 py-3 bg-marrom/50 border border-marrom rounded-xl">
          <button
            type="button"
            onClick={() => handleQuantidadeChange(-1)}
            disabled={quantidade <= 1}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              quantidade <= 1
                ? "text-off-white-soft/30 cursor-not-allowed"
                : "text-off-white hover:bg-marrom active:bg-amarelo/20"
            }`}
          >
            {Icons.minus}
          </button>

          <span className="font-titulo text-2xl text-off-white min-w-[3rem] text-center">
            {quantidade}
          </span>

          <button
            type="button"
            onClick={() => handleQuantidadeChange(1)}
            disabled={quantidade >= limiteAtual}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              quantidade >= limiteAtual
                ? "text-off-white-soft/30 cursor-not-allowed"
                : "text-off-white hover:bg-marrom active:bg-amarelo/20"
            }`}
          >
            {Icons.plus}
          </button>
        </div>

        <p className="mt-2 font-texto text-xs text-off-white-soft/50 flex items-center gap-1">
          {Icons.alert}
          <span>Limite de {limiteAtual} ingressos por pessoa</span>
        </p>
      </motion.div>

      {/* Resumo */}
      <motion.div
        className="bg-marrom/30 border border-marrom rounded-xl p-4 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="font-titulo text-sm text-off-white-soft/70 uppercase tracking-wide mb-3">
          Resumo
        </h3>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-texto text-off-white-soft">
              {quantidade}x {loteAtual?.nome}
            </span>
            <span className="font-texto text-off-white">
              R$ {subtotal.toFixed(2).replace(".", ",")}
            </span>
          </div>

          <div className="border-t border-marrom my-3" />

          <div className="flex justify-between items-center">
            <span className="font-titulo text-off-white">Total</span>
            <span className="font-titulo text-xl text-amarelo">
              R$ {subtotal.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Erro */}
      <AnimatePresence>
        {erro && (
          <motion.div
            className="mb-4 p-3 bg-vermelho/20 border border-vermelho/50 rounded-lg flex items-start gap-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <span className="text-vermelho-light shrink-0 mt-0.5">{Icons.alert}</span>
            <p className="font-texto text-sm text-vermelho-light">{erro}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão de Ação */}
      <motion.button
        type="button"
        onClick={handleContinuar}
        disabled={processando || !loteAtual}
        className={`w-full py-4 rounded-xl font-titulo text-base uppercase tracking-wide transition-all ${
          processando || !loteAtual
            ? "bg-off-white-soft/20 text-off-white-soft/50 cursor-not-allowed"
            : "bg-amarelo hover:bg-amarelo-light text-marrom-dark shadow-warm hover:shadow-glow"
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileTap={{ scale: processando ? 1 : 0.98 }}
      >
        {processando ? (
          <span className="flex items-center justify-center gap-2">
            {Icons.spinner}
            Processando...
          </span>
        ) : (
          "Continuar para pagamento"
        )}
      </motion.button>

      {/* Info de segurança */}
      <motion.div
        className="mt-4 flex items-center justify-center gap-2 text-off-white-soft/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <span className="text-verde-musgo-light">{Icons.lock}</span>
        <span className="font-texto text-xs">Pagamento seguro via PIX</span>
      </motion.div>
    </motion.div>
  );
}

// =============================================
// PAGE EXPORT WITH SUSPENSE
// =============================================

export default function CarrinhoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-amarelo border-t-transparent animate-spin" />
          <p className="text-off-white-soft/70 font-texto">Carregando...</p>
        </div>
      }
    >
      <CarrinhoContent />
    </Suspense>
  );
}
