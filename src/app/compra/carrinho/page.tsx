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
// STORAGE
// =============================================

const CARRINHO_KEY = "naipevip_carrinho";
const CARRINHO_EXPIRATION = 30 * 60 * 1000; // 30 minutos

// =============================================
// CARRINHO CONTENT
// =============================================

function CarrinhoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loteParam = searchParams.get("lote");
  const qtdParam = searchParams.get("qtd");

  // Estados
  const [evento, setEvento] = useState<Evento | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteSelecionado, setLoteSelecionado] = useState<string>("");
  // Mapeia quantidade da URL para opções válidas (1, 2 ou 4)
  const getQuantidadeInicial = () => {
    if (!qtdParam) return 1;
    const qtd = parseInt(qtdParam);
    if (qtd >= 4) return 4;
    if (qtd >= 2) return 2;
    return 1;
  };
  const [quantidade, setQuantidade] = useState(getQuantidadeInicial());
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [mostrarTermos, setMostrarTermos] = useState(false);
  const [cpf, setCpf] = useState("");

  // Função para formatar CPF
  const formatarCpf = (valor: string) => {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);
    if (numeros.length <= 3) return numeros;
    if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
    if (numeros.length <= 9) return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatarCpf(e.target.value));
  };

  const cpfValido = cpf.replace(/\D/g, "").length === 11;

  // Buscar lotes
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

      // Verificar carrinho salvo no sessionStorage
      const carrinhoSalvo = sessionStorage.getItem(CARRINHO_KEY);
      if (carrinhoSalvo) {
        const dados: CarrinhoData = JSON.parse(carrinhoSalvo);
        if (Date.now() - dados.timestamp < CARRINHO_EXPIRATION) {
          const loteExiste = data.lotes.find(
            (l: Lote) => l.id === dados.loteId && l.disponivel
          );
          if (loteExiste) {
            setLoteSelecionado(dados.loteId);
            // Só usar quantidade do storage se não veio pela URL
            if (!qtdParam) {
              // Mapeia para opções válidas (1, 2 ou 4)
              const qtdSalva = dados.quantidade;
              if (qtdSalva >= 4) setQuantidade(4);
              else if (qtdSalva >= 2) setQuantidade(2);
              else setQuantidade(1);
            }
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
  }, [loteParam, qtdParam]);

  useEffect(() => {
    fetchLotes();
  }, [fetchLotes]);

  // Dados calculados
  const loteAtual = lotes.find((l) => l.id === loteSelecionado);
  
  // Preços fixos por quantidade (com desconto para pacotes)
  const precosFixos: Record<number, number> = {
    1: 20,  // R$ 20
    2: 35,  // R$ 35 (economia de R$ 5)
    4: 60,  // R$ 60 (economia de R$ 20)
  };
  
  const precoUnitario = precosFixos[1]; // R$ 20 por ingresso
  const subtotal = precosFixos[quantidade] || precoUnitario * quantidade;
  const economiaTotal = (precoUnitario * quantidade) - subtotal;

  // Opções de quantidade disponíveis
  const quantidadeOpcoes = [1, 2, 4];

  // Handler de quantidade
  const handleQuantidadeSelect = (qtd: number) => {
    setQuantidade(qtd);
  };

  const handleContinuar = async () => {
    if (!loteAtual || !evento || !aceitouTermos || !cpfValido) return;

    setProcessando(true);
    setErro(null);

    try {
      // Verificar autenticação
      const authResponse = await fetch("/api/auth/me");

      if (!authResponse.ok) {
        // Não logado - salvar carrinho e redirecionar para login
        sessionStorage.setItem(
          CARRINHO_KEY,
          JSON.stringify({
            eventoId: evento.id,
            loteId: loteSelecionado,
            quantidade,
            cpf: cpf.replace(/\D/g, ""),
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
          cpf: cpf.replace(/\D/g, ""),
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

  // =============================================
  // ESTADOS DE LOADING / ERRO / ESGOTADO
  // =============================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          className="w-16 h-16 rounded-full border-3 border-amarelo/30 border-t-amarelo"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-off-white-soft/70 font-texto text-sm">
          Carregando ingressos...
        </p>
      </div>
    );
  }

  if (erro && !evento) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 rounded-full bg-vermelho/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-vermelho" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h2 className="font-titulo text-2xl text-off-white mb-2">Ops!</h2>
          <p className="text-off-white-soft/70 font-texto">{erro}</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-8 py-3 bg-amarelo text-marrom-dark font-titulo text-sm uppercase tracking-wide rounded-xl hover:bg-amarelo-light transition-colors"
        >
          Voltar ao início
        </button>
      </motion.div>
    );
  }

  if (lotes.length === 0 || !lotes.some((l) => l.disponivel)) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 rounded-full bg-amarelo/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-amarelo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>
        <div>
          <h2 className="font-titulo text-2xl text-off-white mb-2">Ingressos Esgotados</h2>
          <p className="text-off-white-soft/70 font-texto max-w-xs">
            Todos os ingressos foram vendidos. Fique de olho nas próximas edições!
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-8 py-3 bg-amarelo text-marrom-dark font-titulo text-sm uppercase tracking-wide rounded-xl hover:bg-amarelo-light transition-colors"
        >
          Voltar ao início
        </button>
      </motion.div>
    );
  }

  // =============================================
  // RENDER PRINCIPAL
  // =============================================

  return (
    <motion.div
      className="max-w-md mx-auto pb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* ====== CARD DO EVENTO ====== */}
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-marrom/80 to-marrom-dark border border-marrom mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Textura decorativa */}
        <div className="absolute inset-0 opacity-5 bg-[url('/noise.png')] pointer-events-none" />
        
        <div className="relative p-5">
          {/* Header do evento */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-amarelo/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-amarelo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <h1 className="font-titulo text-xl text-off-white uppercase tracking-wide">
                Naipe VIP
              </h1>
              <p className="font-texto text-sm text-amarelo">
                Naipe VIP
              </p>
            </div>
          </div>

          {/* Informações do evento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-off-white-soft/80">
              <svg className="w-4 h-4 text-amarelo/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-texto text-sm">{evento?.data_formatada || "06 de Fevereiro"}</span>
            </div>

            <div className="flex items-center gap-2 text-off-white-soft/80">
              <svg className="w-4 h-4 text-amarelo/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-texto text-sm">A partir das 20h</span>
            </div>

            <div className="flex items-center gap-2 text-off-white-soft/80 col-span-2">
              <svg className="w-4 h-4 text-amarelo/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-texto text-sm">
                Centro Comunitário - Fernando Prestes, SP
              </span>
            </div>

            <div className="flex items-center gap-2 text-off-white-soft/80">
              <span className="w-4 h-4 rounded bg-vermelho/20 text-vermelho-light text-[10px] font-bold flex items-center justify-center shrink-0">
                18
              </span>
              <span className="font-texto text-sm">Classificação +18</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ====== SEÇÃO DE SELEÇÃO ====== */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-titulo text-sm text-off-white uppercase tracking-wider mb-4">
          Quantos ingressos?
        </h2>

        {/* Info do lote atual */}
        {loteAtual && (
          <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-amarelo/10 border border-amarelo/30 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-amarelo/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-amarelo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <span className="block font-titulo text-off-white text-sm">
                {loteAtual.nome}
              </span>
              <span className="block font-texto text-xs text-amarelo">
                A partir de R$ {precoUnitario.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        )}

        {/* Seletor de Quantidade - Cards */}
        <div className="grid grid-cols-3 gap-3">
          {quantidadeOpcoes.map((qtd) => {
            const precoOpcao = precosFixos[qtd];
            const economiaOpcao = (precoUnitario * qtd) - precoOpcao;
            
            return (
              <button
                key={qtd}
                type="button"
                onClick={() => handleQuantidadeSelect(qtd)}
                className={`relative flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${
                  quantidade === qtd
                    ? "bg-amarelo/10 border-amarelo text-amarelo"
                    : "bg-marrom/40 border-marrom hover:border-amarelo/40 text-off-white"
                }`}
              >
                {qtd === 2 && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amarelo text-marrom-dark text-[10px] font-titulo uppercase rounded-full whitespace-nowrap">
                    Mais escolhido
                  </span>
                )}
                <span className="font-titulo text-2xl">
                  {qtd}
                </span>
                <span className="font-texto text-[10px] opacity-70">
                  {qtd === 1 ? "ingresso" : "ingressos"}
                </span>
                <span className={`font-titulo text-sm mt-1 ${quantidade === qtd ? "text-amarelo" : "text-off-white"}`}>
                  R$ {precoOpcao}
                </span>
                {economiaOpcao > 0 && (
                  <span className="font-texto text-[10px] text-verde-musgo-light mt-0.5">
                    -R$ {economiaOpcao}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-3 font-texto text-xs text-off-white-soft/50 text-center">
          Máximo de 4 ingressos por pessoa
        </p>
      </motion.div>

      {/* ====== RESUMO DO PEDIDO ====== */}
      <motion.div
        className="bg-marrom/30 border border-marrom rounded-xl p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="font-titulo text-xs text-off-white-soft/60 uppercase tracking-wider mb-4">
          Resumo do Pedido
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-texto text-off-white-soft">
              {quantidade}x Ingresso {loteAtual?.nome}
            </span>
            <span className="font-texto text-off-white">
              R$ {subtotal.toFixed(2).replace(".", ",")}
            </span>
          </div>

          {economiaTotal > 0 && (
            <div className="flex justify-between items-center">
              <span className="font-texto text-verde-musgo-light text-sm">
                Economia no pacote
              </span>
              <span className="font-texto text-verde-musgo-light text-sm">
                -R$ {economiaTotal.toFixed(2).replace(".", ",")}
              </span>
            </div>
          )}

          <div className="border-t border-marrom/50" />

          <div className="flex justify-between items-center">
            <span className="font-titulo text-off-white uppercase text-sm">Total</span>
            <span className="font-titulo text-2xl text-amarelo">
              R$ {subtotal.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ====== CAMPO DE CPF ====== */}
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.33 }}
      >
        <label className="block font-titulo text-xs text-off-white-soft/60 uppercase tracking-wider mb-2">
          CPF do Comprador
        </label>
        <input
          type="text"
          value={cpf}
          onChange={handleCpfChange}
          placeholder="000.000.000-00"
          className={`w-full px-4 py-3 rounded-xl bg-marrom/50 border font-texto text-off-white placeholder:text-off-white-soft/30 focus:outline-none transition-colors ${
            cpf && !cpfValido 
              ? "border-vermelho/50 focus:border-vermelho" 
              : "border-marrom focus:border-amarelo/50"
          }`}
        />
        {cpf && !cpfValido && (
          <p className="mt-1 font-texto text-xs text-vermelho-light">
            CPF deve ter 11 dígitos
          </p>
        )}
        <p className="mt-1 font-texto text-[10px] text-off-white-soft/40">
          Necessário para emissão do PIX
        </p>
      </motion.div>

      {/* ====== CHECKBOX DE TERMOS ====== */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center gap-3">
          <label className="relative cursor-pointer group">
            <input
              type="checkbox"
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className="sr-only peer"
            />
            <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
              aceitouTermos 
                ? "bg-amarelo border-amarelo" 
                : "border-off-white-soft/40 group-hover:border-amarelo/60"
            }`}>
              {aceitouTermos && (
                <svg className="w-3 h-3 text-marrom-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </label>
          <span className="font-texto text-[11px] text-off-white-soft/70">
            Li e concordo com os{" "}
            <button
              type="button"
              onClick={() => setMostrarTermos(true)}
              className="text-amarelo underline hover:text-amarelo-light transition-colors"
            >
              termos de uso e política de privacidade
            </button>.
          </span>
        </div>
      </motion.div>

      {/* ====== MENSAGEM DE ERRO ====== */}
      <AnimatePresence>
        {erro && (
          <motion.div
            className="mb-4 p-4 bg-vermelho/10 border border-vermelho/30 rounded-xl flex items-start gap-3"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          >
            <svg className="w-5 h-5 text-vermelho-light shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-texto text-sm text-vermelho-light">{erro}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== BOTÃO CTA ====== */}
      <motion.button
        type="button"
        onClick={handleContinuar}
        disabled={processando || !loteAtual || !aceitouTermos || !cpfValido}
        className={`w-full py-4 rounded-xl font-titulo text-base uppercase tracking-wide transition-all ${
          processando || !loteAtual || !aceitouTermos || !cpfValido
            ? "bg-off-white-soft/10 text-off-white-soft/30 cursor-not-allowed"
            : "bg-amarelo hover:bg-amarelo-light text-marrom-dark shadow-warm hover:shadow-glow active:scale-[0.98]"
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {processando ? (
          <span className="flex items-center justify-center gap-3">
            <motion.span
              className="w-5 h-5 border-2 border-marrom-dark/30 border-t-marrom-dark rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Processando...
          </span>
        ) : (
          "Continuar para pagamento"
        )}
      </motion.button>

      {/* ====== INFO DE SEGURANÇA ====== */}
      <motion.div
        className="mt-5 flex items-center justify-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <svg className="w-4 h-4 text-verde-musgo-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="font-texto text-xs text-off-white-soft/50">
          Pagamento seguro via PIX
        </span>
      </motion.div>

      {/* ====== MODAL DE TERMOS ====== */}
      <AnimatePresence>
        {mostrarTermos && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMostrarTermos(false)}
            />

            {/* Modal */}
            <motion.div
              className="relative w-full max-w-lg max-h-[80vh] bg-marrom-dark border border-marrom rounded-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-marrom">
                <h3 className="font-titulo text-lg text-off-white uppercase tracking-wide">
                  Termos de Uso e Privacidade
                </h3>
                <button
                  type="button"
                  onClick={() => setMostrarTermos(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-marrom/50 text-off-white-soft hover:text-off-white hover:bg-marrom transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Conteúdo */}
              <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
                <div>
                  <h4 className="font-titulo text-sm text-amarelo uppercase mb-2">1. Ingressos</h4>
                  <p className="font-texto text-xs text-off-white-soft/80 leading-relaxed">
                    Os ingressos adquiridos são pessoais e intransferíveis. Cada ingresso é válido para 
                    uma única entrada no evento. A apresentação do QR Code do ingresso é obrigatória 
                    para acesso ao evento.
                  </p>
                </div>

                <div>
                  <h4 className="font-titulo text-sm text-amarelo uppercase mb-2">2. Política de Reembolso</h4>
                  <p className="font-texto text-xs text-off-white-soft/80 leading-relaxed">
                    Não haverá reembolso após a confirmação do pagamento, exceto em caso de cancelamento 
                    do evento por parte da organização. Em caso de cancelamento, o valor será devolvido 
                    integralmente através do mesmo método de pagamento utilizado na compra.
                  </p>
                </div>

                <div>
                  <h4 className="font-titulo text-sm text-amarelo uppercase mb-2">3. Classificação Etária</h4>
                  <p className="font-texto text-xs text-off-white-soft/80 leading-relaxed">
                    O evento é classificado para maiores de 18 anos. É obrigatória a apresentação de 
                    documento oficial com foto na entrada. Menores de idade não terão acesso ao evento, 
                    mesmo acompanhados de responsáveis.
                  </p>
                </div>

                <div>
                  <h4 className="font-titulo text-sm text-amarelo uppercase mb-2">4. Dados Pessoais</h4>
                  <p className="font-texto text-xs text-off-white-soft/80 leading-relaxed">
                    Os dados pessoais coletados (nome, CPF, e-mail e telefone) serão utilizados 
                    exclusivamente para fins de identificação, emissão de ingressos e comunicação 
                    sobre o evento. Seus dados não serão compartilhados com terceiros.
                  </p>
                </div>

                <div>
                  <h4 className="font-titulo text-sm text-amarelo uppercase mb-2">5. Responsabilidades</h4>
                  <p className="font-texto text-xs text-off-white-soft/80 leading-relaxed">
                    A organização não se responsabiliza por objetos perdidos ou roubados durante o evento. 
                    O participante é responsável por sua própria segurança e deve seguir as orientações 
                    da equipe de segurança. Comportamentos inadequados podem resultar na retirada do 
                    participante sem direito a reembolso.
                  </p>
                </div>

                <div>
                  <h4 className="font-titulo text-sm text-amarelo uppercase mb-2">6. Imagem e Som</h4>
                  <p className="font-texto text-xs text-off-white-soft/80 leading-relaxed">
                    Ao participar do evento, você autoriza o uso de sua imagem em fotos e vídeos para 
                    fins de divulgação do evento em redes sociais e materiais promocionais.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-marrom">
                <button
                  type="button"
                  onClick={() => {
                    setAceitouTermos(true);
                    setMostrarTermos(false);
                  }}
                  className="w-full py-3 bg-amarelo hover:bg-amarelo-light text-marrom-dark font-titulo text-sm uppercase tracking-wide rounded-xl transition-colors"
                >
                  Li e aceito os termos
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================
// PAGE EXPORT
// =============================================

export default function CarrinhoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <motion.div
            className="w-16 h-16 rounded-full border-3 border-amarelo/30 border-t-amarelo"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-off-white-soft/70 font-texto text-sm">Carregando...</p>
        </div>
      }
    >
      <CarrinhoContent />
    </Suspense>
  );
}
