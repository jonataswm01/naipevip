"use client";

import { useState, useEffect } from "react";
import type { UsuarioPublico } from "@/types/database";

const Icons = {
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  email: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  phone: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
};

export default function MeusDadosPage() {
  const [user, setUser] = useState<UsuarioPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form states
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.usuario);
        setNome(data.usuario.nome);
        setEmail(data.usuario.email);
        setTelefone(formatPhone(data.usuario.telefone));
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (value: string) => {
    setTelefone(formatPhone(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setSaving(true);

    try {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          email,
          telefone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error });
        return;
      }

      setUser(data.usuario);
      setMessage({ type: "success", text: "Dados atualizados com sucesso!" });
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      setMessage({ type: "error", text: "Erro de conexão. Tente novamente." });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!user) return false;
    return (
      nome !== user.nome ||
      email !== user.email ||
      telefone.replace(/\D/g, "") !== user.telefone
    );
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
      {/* Header */}
      <div>
        <h1 className="font-titulo text-2xl text-off-white font-semibold">
          Meus Dados
        </h1>
        <p className="text-off-white-soft/70 font-texto mt-1">
          Gerencie suas informações pessoais
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mensagens */}
        {message.text && (
          <div
            className={`p-4 rounded-lg ${
              message.type === "error"
                ? "bg-vermelho/20 border border-vermelho text-vermelho-light"
                : "bg-verde-musgo/20 border border-verde-musgo text-verde-musgo-light"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" && Icons.check}
              <span className="font-texto text-sm">{message.text}</span>
            </div>
          </div>
        )}

        {/* Nome */}
        <div className="bg-marrom/60 border border-marrom rounded-xl p-4">
          <label
            htmlFor="nome"
            className="flex items-center gap-2 text-off-white-soft/60 text-sm font-texto mb-2"
          >
            {Icons.user}
            Nome Completo
          </label>
          <input
            type="text"
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full bg-marrom-dark border border-marrom rounded-lg px-4 py-3 text-off-white font-texto focus:outline-none focus:border-amarelo transition-colors"
            placeholder="Seu nome completo"
          />
        </div>

        {/* Email */}
        <div className="bg-marrom/60 border border-marrom rounded-xl p-4">
          <label
            htmlFor="email"
            className="flex items-center gap-2 text-off-white-soft/60 text-sm font-texto mb-2"
          >
            {Icons.email}
            E-mail
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-marrom-dark border border-marrom rounded-lg px-4 py-3 text-off-white font-texto focus:outline-none focus:border-amarelo transition-colors"
            placeholder="seu@email.com"
          />
        </div>

        {/* Telefone */}
        <div className="bg-marrom/60 border border-marrom rounded-xl p-4">
          <label
            htmlFor="telefone"
            className="flex items-center gap-2 text-off-white-soft/60 text-sm font-texto mb-2"
          >
            {Icons.phone}
            Telefone
          </label>
          <input
            type="tel"
            id="telefone"
            value={telefone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className="w-full bg-marrom-dark border border-marrom rounded-lg px-4 py-3 text-off-white font-texto focus:outline-none focus:border-amarelo transition-colors"
            placeholder="(00) 00000-0000"
          />
        </div>

        {/* Info da conta */}
        <div className="bg-marrom/40 border border-marrom rounded-xl p-4">
          <p className="text-off-white-soft/60 text-xs font-texto">
            Conta criada em{" "}
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "..."}
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving || !hasChanges()}
          className="w-full bg-verde-musgo text-off-white py-4 rounded-xl font-titulo font-semibold hover:bg-verde-musgo-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-off-white border-t-transparent rounded-full" />
              Salvando...
            </>
          ) : (
            "Salvar Alterações"
          )}
        </button>
      </form>
    </div>
  );
}
