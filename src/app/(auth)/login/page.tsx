"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard, AuthButton, InputField, PasswordInput } from "@/components/auth";

type LoginMethod = "email" | "phone";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Formata telefone enquanto digita
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
    setPhone(formatPhone(value));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (loginMethod === "email") {
      if (!email) {
        newErrors.email = "E-mail é obrigatório";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = "E-mail inválido";
      }
    } else {
      const phoneNumbers = phone.replace(/\D/g, "");
      if (!phone) {
        newErrors.phone = "Telefone é obrigatório";
      } else if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
        newErrors.phone = "Telefone inválido";
      }
    }

    if (!password) {
      newErrors.password = "Senha é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const identificador = loginMethod === "email" ? email : phone;

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identificador,
          senha: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ form: data.error || "Erro ao fazer login" });
        return;
      }

      // Sucesso - redirecionar para destino (redirect param ou dashboard)
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      console.error("Erro no login:", error);
      setErrors({ form: "Erro de conexão. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Entrar na sua conta"
      subtitle="Bem-vindo de volta! Faça login para continuar."
    >
      <form onSubmit={handleSubmit}>
        {/* Mensagem de erro geral */}
        {errors.form && (
          <div className="mb-4 p-3 bg-vermelho/20 border border-vermelho rounded-lg text-vermelho-light text-sm">
            {errors.form}
          </div>
        )}

        {/* Toggle Email/Telefone */}
        <div className="flex mb-6 bg-marrom rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setLoginMethod("email");
              setErrors({});
            }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-texto transition-all ${
              loginMethod === "email"
                ? "bg-verde-musgo text-off-white"
                : "text-off-white-soft/70 hover:text-off-white"
            }`}
          >
            E-mail
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod("phone");
              setErrors({});
            }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-texto transition-all ${
              loginMethod === "phone"
                ? "bg-verde-musgo text-off-white"
                : "text-off-white-soft/70 hover:text-off-white"
            }`}
          >
            Telefone
          </button>
        </div>

        {/* Campo de identificação */}
        {loginMethod === "email" ? (
          <InputField
            label="E-mail"
            type="email"
            icon="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
            autoFocus
          />
        ) : (
          <InputField
            label="Telefone"
            type="tel"
            icon="phone"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            error={errors.phone}
            autoComplete="tel"
            autoFocus
          />
        )}

        {/* Senha */}
        <PasswordInput
          label="Senha"
          placeholder="Digite sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
        />

        {/* Botão de Submit */}
        <div className="mt-6">
          <AuthButton type="submit" loading={loading}>
            Entrar
          </AuthButton>
        </div>
      </form>

      {/* Link para cadastro */}
      <p className="mt-6 text-center text-sm text-off-white-soft/80">
        Não tem uma conta?{" "}
        <Link
          href="/cadastro"
          className="text-amarelo hover:underline font-medium"
        >
          Cadastre-se
        </Link>
      </p>
    </AuthCard>
  );
}
