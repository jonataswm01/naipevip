"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, AuthButton, InputField, PasswordInput } from "@/components/auth";

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

    // Validação do nome
    if (!name.trim()) {
      newErrors.name = "Nome é obrigatório";
    } else if (name.trim().length < 3) {
      newErrors.name = "Nome deve ter pelo menos 3 caracteres";
    }

    // Validação do email
    if (!email) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "E-mail inválido";
    }

    // Validação do telefone
    const phoneNumbers = phone.replace(/\D/g, "");
    if (!phone) {
      newErrors.phone = "Telefone é obrigatório";
    } else if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      newErrors.phone = "Telefone inválido";
    }

    // Validação da senha
    if (!password) {
      newErrors.password = "Senha é obrigatória";
    } else if (password.length < 8) {
      newErrors.password = "Senha deve ter pelo menos 8 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/cadastro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: name,
          email,
          telefone: phone,
          senha: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ form: data.error || "Erro ao criar conta" });
        return;
      }

      // Cadastro OK - fazer login automático
      setSuccessMessage("Conta criada! Entrando...");
      
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identificador: email,
          senha: password,
        }),
      });

      if (loginResponse.ok) {
        // Login automático bem sucedido - ir para dashboard
        router.push("/dashboard");
        router.refresh();
      } else {
        // Se falhar login automático, redirecionar para página de login
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setErrors({ form: "Erro de conexão. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Criar sua conta"
      subtitle="Preencha os detalhes para começar."
    >
      <form onSubmit={handleSubmit}>
        {/* Mensagem de erro geral */}
        {errors.form && (
          <div className="mb-4 p-3 bg-vermelho/20 border border-vermelho rounded-lg text-vermelho-light text-sm">
            {errors.form}
          </div>
        )}

        {/* Mensagem de sucesso */}
        {successMessage && (
          <div className="mb-4 p-3 bg-verde-musgo/20 border border-verde-musgo rounded-lg text-verde-musgo-light text-sm">
            {successMessage}
          </div>
        )}

        {/* Campo Nome */}
        <InputField
          label="Nome"
          type="text"
          icon="user"
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="name"
          autoFocus
        />

        {/* Campo E-mail */}
        <InputField
          label="E-mail"
          type="email"
          icon="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        {/* Campo Telefone */}
        <InputField
          label="Telefone"
          type="tel"
          icon="phone"
          placeholder="(00) 00000-0000"
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          error={errors.phone}
          autoComplete="tel"
        />

        {/* Senha */}
        <PasswordInput
          label="Senha"
          placeholder="Crie uma senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          showHint={!errors.password}
          autoComplete="new-password"
        />

        {/* Botão de Submit */}
        <div className="mt-6">
          <AuthButton type="submit" loading={loading}>
            Criar conta
          </AuthButton>
        </div>
      </form>

      {/* Link para login */}
      <p className="mt-6 text-center text-sm text-off-white-soft/80">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="text-amarelo hover:underline font-medium"
        >
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
