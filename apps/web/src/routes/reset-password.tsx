import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteLayout, AuthShell, Field, TextInput } from "@/components/site-layout";
import { api, ApiError } from "@/lib/api";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Redefinir senha — Gerenciador de Festas" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const { token } = Route.useSearch();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Token ausente na URL.");
      return;
    }
    if (senha.length < 8) {
      setError("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await api(`/password/reset?token=${encodeURIComponent(token)}`, {
        method: "POST",
        body: { senha },
      });
      setDone(true);
      toast.success("Senha redefinida com sucesso!");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Não foi possível redefinir a senha.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <SiteLayout>
        <AuthShell title="Senha redefinida 🎉" subtitle="Faça login com sua nova senha.">
          <Link to="/login" className="btn-brand w-full">
            Ir para o login
          </Link>
        </AuthShell>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <AuthShell title="Redefinir senha" subtitle="Escolha uma nova senha para sua conta.">
        <form onSubmit={onSubmit} noValidate>
          <Field label="Nova senha" htmlFor="senha">
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

          <Field label="Confirmar nova senha" htmlFor="confirmar">
            <TextInput
              id="confirmar"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a senha"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
            />
          </Field>

          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !token} className="btn-brand w-full">
            {loading ? "Redefinindo…" : "Redefinir senha"}
          </button>

          {!token && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Link inválido. Solicite um novo em{" "}
              <Link to="/esqueci-senha" className="underline">Esqueci minha senha</Link>.
            </p>
          )}
        </form>
      </AuthShell>
    </SiteLayout>
  );
}

