"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { UsuarioPublico } from "@/types/database";
import { getWhatsAppUrl } from "@/lib/whatsapp";

// Ícones
const Icons = {
  ticket: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  receipt: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  user: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  location: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  lock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  map: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
};

interface DashboardStats {
  totalPedidos: number;
  totalIngressos: number;
  temIngressoAtivo: boolean;
}

interface LocalEvento {
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  mapsUrl?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UsuarioPublico | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalPedidos: 0,
    totalIngressos: 0,
    temIngressoAtivo: false,
  });
  const [local, setLocal] = useState<LocalEvento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Buscar dados do usuário
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.usuario);
      }

      // Buscar estatísticas
      const statsRes = await fetch("/api/dashboard/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Buscar local do evento (público)
      const lotesRes = await fetch("/api/lotes");
      if (lotesRes.ok) {
        const lotesData = await lotesRes.json();
        if (lotesData.evento?.local_nome && lotesData.evento?.local_endereco) {
          const enderecoCompleto = `${lotesData.evento.local_endereco}, ${lotesData.evento.local_bairro}, ${lotesData.evento.local_cidade}`;
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto)}`;
          
          setLocal({
            nome: lotesData.evento.local_nome,
            endereco: lotesData.evento.local_endereco,
            bairro: lotesData.evento.local_bairro || "",
            cidade: lotesData.evento.local_cidade || "",
            mapsUrl,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getFirstName = () => {
    if (!user?.nome) return "";
    return user.nome.split(" ")[0];
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
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-titulo text-2xl text-off-white font-semibold">
          {getGreeting()}, {getFirstName()}!
        </h1>
        <p className="text-off-white-soft/70 font-texto mt-1">
          Bem-vindo à sua área
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Ingressos */}
        <Link
          href="/dashboard/meus-ingressos"
          className="bg-marrom/60 border border-marrom rounded-xl p-4 hover:bg-marrom/80 transition-colors group"
        >
          <div className="text-amarelo mb-3">{Icons.ticket}</div>
          <p className="font-titulo text-2xl text-off-white font-semibold">
            {stats.totalIngressos}
          </p>
          <p className="text-off-white-soft/70 text-sm font-texto">
            {stats.totalIngressos === 1 ? "Ingresso" : "Ingressos"}
          </p>
          <div className="flex items-center gap-1 mt-2 text-amarelo/70 group-hover:text-amarelo transition-colors">
            <span className="text-xs font-texto">Ver todos</span>
            {Icons.arrow}
          </div>
        </Link>

        {/* Pedidos */}
        <Link
          href="/dashboard/meus-pedidos"
          className="bg-marrom/60 border border-marrom rounded-xl p-4 hover:bg-marrom/80 transition-colors group"
        >
          <div className="text-verde-musgo-light mb-3">{Icons.receipt}</div>
          <p className="font-titulo text-2xl text-off-white font-semibold">
            {stats.totalPedidos}
          </p>
          <p className="text-off-white-soft/70 text-sm font-texto">
            {stats.totalPedidos === 1 ? "Pedido" : "Pedidos"}
          </p>
          <div className="flex items-center gap-1 mt-2 text-amarelo/70 group-hover:text-amarelo transition-colors">
            <span className="text-xs font-texto">Ver todos</span>
            {Icons.arrow}
          </div>
        </Link>
      </div>

      {/* Meus Dados Quick Link */}
      <Link
        href="/dashboard/meus-dados"
        className="flex items-center justify-between bg-marrom/60 border border-marrom rounded-xl p-4 hover:bg-marrom/80 transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className="text-off-white-soft">{Icons.user}</div>
          <div>
            <p className="font-titulo text-off-white font-medium">Meus Dados</p>
            <p className="text-off-white-soft/60 text-sm font-texto">
              {user?.email}
            </p>
          </div>
        </div>
        <div className="text-amarelo/70 group-hover:text-amarelo transition-colors">
          {Icons.arrow}
        </div>
      </Link>

      {/* Local do Evento */}
      <div className="bg-marrom/60 border border-marrom rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-marrom">
          <div className="text-amarelo">{Icons.location}</div>
          <h2 className="font-titulo text-lg text-off-white font-semibold">
            Local do Evento
          </h2>
        </div>

        {local ? (
          <div className="p-4 space-y-3">
            <div>
              <p className="text-off-white font-medium font-texto">
                {local.nome}
              </p>
              <p className="text-off-white-soft/80 text-sm font-texto mt-1">
                {local.endereco}
              </p>
              <p className="text-off-white-soft/60 text-sm font-texto">
                {local.bairro} - {local.cidade}
              </p>
            </div>

            {local.mapsUrl && (
              <a
                href={local.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-verde-musgo text-off-white px-4 py-2 rounded-lg font-texto text-sm hover:bg-verde-musgo-light transition-colors"
              >
                {Icons.map}
                Ver no Mapa
              </a>
            )}
          </div>
        ) : (
          <div className="p-4 flex items-center gap-4">
            <div className="text-off-white-soft/40">{Icons.location}</div>
            <div>
              <p className="text-off-white-soft/80 font-texto text-sm">
                Centro Comunitário - Fernando Prestes, São Paulo
              </p>
              {stats.totalIngressos === 0 && (
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-amarelo font-texto text-sm hover:underline"
                >
                  Comprar ingresso
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CTA se não tem ingresso */}
      {stats.totalIngressos === 0 && (
        <div className="bg-gradient-to-r from-terracota to-terracota-dark border border-terracota-light/30 rounded-xl p-6 text-center">
          <h3 className="font-titulo text-xl text-off-white font-semibold mb-2">
            Garanta seu ingresso!
          </h3>
          <p className="text-off-white-soft/80 font-texto text-sm mb-4">
            Não fique de fora do Naipe VIP
          </p>
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-amarelo text-marrom-dark px-6 py-3 rounded-lg font-titulo font-semibold hover:bg-amarelo-light transition-colors"
          >
            Comprar Ingresso
          </a>
        </div>
      )}
    </div>
  );
}
