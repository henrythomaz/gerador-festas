import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteLayout, AuthShell, Field, TextInput } from "@/components/site-layout";
import { api, ApiError, type AuthUser } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { celebrate } from "@/lib/confetti";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Gerenciador de Festas" },
      { name: "description", content: "Acesse sua conta no Gerenciador de Festas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !senha) {
      setError({ status: 400, message: "Preencha email e senha." });
      return;
    }

    setLoading(true);
    try {
      const data = await api<{ user: AuthUser; token: string }>("/login", {
        method: "POST",
        body: { email, senha },
      });
      login(data.token, data.user);
      toast.success(`Bem-vindo(a), ${data.user.nome.split(" ")[0]}!`);
      celebrate();
      navigate({ to: "/" });
    } catch (err) {
      let status = 500;
      let message = "Não foi possível entrar.";
      if (err instanceof ApiError) {
        status = err.status;
        message = err.message;
      }
      setError({ status, message });
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

  return (
    <SiteLayout>
      <AuthShell
        title="Entrar"
        subtitle="Acesse sua conta para gerenciar seus contratos."
        footer={
          <>
            Não tem conta?{" "}
            <Link to="/cadastro" className="font-medium text-foreground hover:underline">
              Cadastre-se
            </Link>
          </>
        }
      >
        <form onSubmit={onSubmit} noValidate>
          <Field label="Email" htmlFor="email">
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

          <Field label="Senha" htmlFor="senha">
            <TextInput
              id="senha"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </Field>

          {error && (
            <div
              className={`mb-4 rounded-xl border px-4 py-2.5 text-sm ${getErrorStyles(
                error.status,
              )}`}
            >
              <span className="font-medium">{error.status}</span>: {error.message}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-brand w-full">
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <div className="mt-4 text-center text-sm">
            <Link
              to="/esqueci-senha"
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
        </form>
      </AuthShell>
    </SiteLayout>
  );
}
