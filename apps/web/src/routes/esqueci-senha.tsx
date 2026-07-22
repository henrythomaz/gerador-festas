import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SiteLayout, AuthShell, Field, TextInput } from "@/components/site-layout";
import { api, ApiError } from "@/lib/api";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Gerenciador de Festas" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Email inválido.");
      return;
    }
    setLoading(true);
    try {
      await api("/password/forgot", { method: "POST", body: { email } });
      setSent(true);
      toast.success("Email enviado com as instruções.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Não foi possível enviar o email.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SiteLayout>
        <AuthShell
          title="Verifique seu email"
          subtitle="Se existir uma conta com esse email, você receberá instruções para redefinir a senha."
          footer={
            <Link to="/login" className="font-medium text-foreground hover:underline">
              Voltar ao login
            </Link>
          }
        >
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Enviamos um link de redefinição para <strong>{email}</strong>.
          </div>
        </AuthShell>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <AuthShell
        title="Esqueci minha senha"
        subtitle="Informe seu email para receber um link de redefinição."
        footer={
          <Link to="/login" className="font-medium text-foreground hover:underline">
            Voltar ao login
          </Link>
        }
      >
        <form onSubmit={onSubmit} noValidate>
          <Field label="Email" htmlFor="email" error={error ?? undefined}>
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

          <button type="submit" disabled={loading} className="btn-brand w-full">
            {loading ? "Enviando…" : "Enviar link de redefinição"}
          </button>
        </form>
      </AuthShell>
    </SiteLayout>
  );
}
