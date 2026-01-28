import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-terracota-dark flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amarelo flex items-center justify-center">
          <span className="text-marrom-dark font-bold text-lg">N</span>
        </div>
        <span className="font-titulo text-xl text-off-white font-semibold tracking-wide">
          Naipe VIP
        </span>
      </Link>

      {/* Card de Autenticação */}
      {children}

      {/* Footer */}
      <footer className="mt-8 text-center text-sm text-off-white-soft/70">
        <p>
          Ao continuar, você concorda com nossos{" "}
          <Link href="/termos" className="text-amarelo hover:underline">
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link href="/privacidade" className="text-amarelo hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
