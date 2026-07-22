import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { SiteLayout, AuthShell } from "@/components/site-layout";
import { API_BASE_URL } from "@/lib/api";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/confirmar-email")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Confirmar email — Gerenciador de Festas" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmEmailPage,
});

type Status = "loading" | "success" | "error";

function ConfirmEmailPage() {
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Confirmando seu email…");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de confirmação ausente na URL.");
      setErrorStatus(400);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const url = `${API_BASE_URL}/confirmar-email?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json", "ngrok-skip-browser-warning": "true" },
          redirect: "follow",
        });
        if (cancelled) return;
        if (res.ok || res.redirected) {
          setStatus("success");
          setMessage("Email confirmado com sucesso! Você já pode entrar.");
          setErrorStatus(null);
        } else {
          let text = await res.text().catch(() => "");
          // Tenta extrair a mensagem do JSON, se existir
          try {
            const json = JSON.parse(text);
            text = json.erro || json.message || json.error || text;
          } catch {}
          setStatus("error");
          setMessage(text || "Não foi possível confirmar o email. O link pode ter expirado.");
          setErrorStatus(res.status);
        }
      } catch {
        if (cancelled) return;
        setStatus("error");
        setMessage("Falha ao confirmar o email. Tente novamente mais tarde.");
        setErrorStatus(500);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const getErrorStyles = (status: number | null) => {
    if (!status) return "border-border bg-muted/40 text-muted-foreground";
    if (status >= 500) return "border-destructive/30 bg-destructive/10 text-destructive";
    if (status === 404 || status === 409)
      return "border-yellow-500/30 bg-yellow-50 text-yellow-700";
    return "border-orange-500/30 bg-orange-50 text-orange-700";
  };

  let cardClass = "rounded-xl border px-4 py-3 text-sm ";
  if (status === "success") {
    cardClass += "border-emerald-200 bg-emerald-50 text-emerald-800";
  } else if (status === "error") {
    cardClass += getErrorStyles(errorStatus);
  } else {
    cardClass += "border-border bg-muted/40 text-muted-foreground";
  }

  return (
    <SiteLayout>
      <AuthShell
        title={
          status === "loading"
            ? "Confirmando email…"
            : status === "success"
              ? "Email confirmado 🎉"
              : "Não foi possível confirmar"
        }
        subtitle={status === "loading" ? "Só um instante." : undefined}
      >
        <div className={cardClass}>
          {errorStatus !== null && status === "error" && (
            <span className="font-medium">{errorStatus}: </span>
          )}
          {message}
        </div>

        <div className="mt-6 grid gap-2">
          <Link to="/login" className="btn-brand w-full">
            Ir para o login
          </Link>
          {status === "error" && (
            <Link
              to="/cadastro"
              className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium hover:bg-muted transition"
            >
              Voltar ao cadastro
            </Link>
          )}
        </div>
      </AuthShell>
    </SiteLayout>
  );
}
