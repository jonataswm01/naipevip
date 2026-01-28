import Link from "next/link";

export default function CompraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-marrom-dark flex flex-col">
      {/* Header simples */}
      <header className="sticky top-0 z-50 bg-marrom-dark/95 backdrop-blur-sm border-b border-marrom">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amarelo flex items-center justify-center">
              <span className="text-marrom-dark font-bold text-sm">N</span>
            </div>
            <span className="font-titulo text-lg text-off-white font-semibold">
              Naipe VIP
            </span>
          </Link>

          <Link
            href="/"
            className="text-off-white-soft/70 hover:text-off-white transition-colors text-sm font-texto"
          >
            Voltar
          </Link>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 px-4 py-6">{children}</main>

      {/* Footer mínimo */}
      <footer className="px-4 py-4 border-t border-marrom/50">
        <p className="text-center text-xs text-off-white-soft/50 font-texto">
          Compra segura • Pagamento via PIX
        </p>
      </footer>
    </div>
  );
}
