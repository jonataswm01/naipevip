"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { UsuarioPublico } from "@/types/database";

// Ícones SVG
const Icons = {
  home: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  ticket: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  receipt: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  user: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  logout: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  menu: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

const navItems = [
  { href: "/dashboard", label: "Início", labelShort: "Início", icon: Icons.home },
  { href: "/dashboard/meus-ingressos", label: "Meus Ingressos", labelShort: "Ingressos", icon: Icons.ticket },
  { href: "/dashboard/meus-pedidos", label: "Meus Pedidos", labelShort: "Pedidos", icon: Icons.receipt },
  { href: "/dashboard/meus-dados", label: "Meus Dados", labelShort: "Perfil", icon: Icons.user },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UsuarioPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.usuario);
      } else {
        // Não autenticado ou sessão inválida - redirecionar para login
        router.push("/login?redirect=" + encodeURIComponent(pathname));
        return;
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      // Erro de conexão - redirecionar para login por segurança
      router.push("/login");
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-marrom-dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amarelo border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-marrom-dark">
      {/* Header Mobile */}
      <header className="sticky top-0 z-50 bg-marrom-dark/95 backdrop-blur-sm border-b border-marrom">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amarelo flex items-center justify-center">
              <span className="text-marrom-dark font-bold text-sm">N</span>
            </div>
            <span className="font-titulo text-lg text-off-white font-semibold">
              Naipe VIP
            </span>
          </Link>

          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-off-white hover:bg-marrom rounded-lg transition-colors"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? Icons.close : Icons.menu}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="absolute top-full left-0 right-0 bg-marrom-dark border-b border-marrom shadow-lg">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-marrom">
              <p className="text-off-white font-medium">{user?.nome}</p>
              <p className="text-off-white-soft/60 text-sm">{user?.email}</p>
            </div>

            {/* Nav Items */}
            <nav className="py-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isActive(item.href)
                      ? "bg-verde-musgo/20 text-amarelo"
                      : "text-off-white hover:bg-marrom"
                  }`}
                >
                  {item.icon}
                  <span className="font-texto">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Logout */}
            <div className="border-t border-marrom py-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full text-vermelho-light hover:bg-marrom transition-colors"
              >
                {Icons.logout}
                <span className="font-texto">Sair</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">{children}</main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-marrom-dark/95 backdrop-blur-sm border-t border-marrom z-40">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.href)
                  ? "text-amarelo"
                  : "text-off-white-soft/60 hover:text-off-white"
              }`}
            >
              {item.icon}
              <span className="text-xs font-texto">{item.labelShort}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Spacer for bottom nav */}
      <div className="h-20" />
    </div>
  );
}
