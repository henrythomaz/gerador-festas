import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteLayout, AuthShell, Field, TextInput } from "@/components/site-layout";
import { api, ApiError } from "@/lib/api";
import { celebrate } from "@/lib/confetti";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — Gerenciador de Festas" },
      { name: "description", content: "Crie sua conta gratuita no Gerenciador de Festas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignupPage,
});

interface Errors {
  nome?: string;
  email?: string;
  senha?: string;
  confirmarSenha?: string;
  form?: string;
}

function SignupPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<{ status: number; message: string } | null>(null);

  useEffect(() => {
    if (success) {
      celebrate();
    }
  }, [success]);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!nome.trim()) e.nome = "Informe seu nome.";
    if (!email.trim()) e.email = "Informe seu email.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Email inválido.";
    if (senha.length < 8) e.senha = "A senha deve ter ao menos 8 caracteres.";
    if (confirmarSenha !== senha) e.confirmarSenha = "As senhas não coincidem.";
    return e;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const eObj = validate();
    setErrors(eObj);
    if (Object.keys(eObj).length) return;

    setApiError(null);
    setLoading(true);
    try {
      await api("/usuarios", {
        method: "POST",
        body: { nome, email, senha, confirmarSenha },
      });
      setSuccess(true);
      toast.success("Conta criada! Verifique seu email para confirmar.");
    } catch (err) {
      let status = 500;
      let message = "Não foi possível criar a conta.";
      if (err instanceof ApiError) {
        status = err.status;
        message = err.message;
      }
      setApiError({ status, message });
      toast.error(`${status}: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const getErrorStyles = (status: number) => {
    if (status >= 500) {
      return "border-destructive/30 bg-destructive/10 text-destructive";
    }
    if (status === 404 || status === 409) {
      return "border-yellow-500/30 bg-yellow-50 text-yellow-700";
    }
    return "border-orange-500/30 bg-orange-50 text-orange-700";
  };

  if (success) {
    return (
      <SiteLayout>
        <AuthShell
          title="Conta criada! 🎉"
          subtitle="Enviamos um email para confirmar seu endereço."
          footer={
            <Link to="/login" className="font-medium text-foreground hover:underline">
              Ir para o login
            </Link>
          }
        >
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Verifique sua caixa de entrada em <strong className="text-foreground">{email}</strong> e
            clique no link de confirmação para ativar sua conta.
          </div>
          <Link to="/login" className="btn-brand mt-6 w-full">
            Ir para o login
          </Link>
        </AuthShell>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <AuthShell
        title="Criar conta"
        subtitle="É rápido: só precisamos de alguns dados."
        footer={
          <>
            Já tem conta?{" "}
            <Link to="/login" className="font-medium text-foreground hover:underline">
              Faça login
            </Link>
          </>
        }
      >
        <form onSubmit={onSubmit} noValidate>
          <Field label="Nome" htmlFor="nome" error={errors.nome}>
            <TextInput
              id="nome"
              autoComplete="name"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </Field>

          <Field label="Email" htmlFor="email" error={errors.email}>
            <TextInput
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Field label="Senha" htmlFor="senha" error={errors.senha}>
            <TextInput
              id="senha"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </Field>

          <Field label="Confirmar senha" htmlFor="confirmarSenha" error={errors.confirmarSenha}>
            <TextInput
              id="confirmarSenha"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
          </Field>

          {apiError && (
            <div
              className={`mb-4 rounded-xl border px-4 py-2.5 text-sm ${getErrorStyles(
                apiError.status,
              )}`}
            >
              <span className="font-medium">{apiError.status}</span>: {apiError.message}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-brand w-full">
            {loading ? "Criando conta…" : "Criar conta"}
          </button>
        </form>
      </AuthShell>
    </SiteLayout>
  );
}
