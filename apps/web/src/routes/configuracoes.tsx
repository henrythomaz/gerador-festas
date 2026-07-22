// configuracoes.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const navigate = useNavigate();
  const search = Route.useSearch<{ sync?: string }>();

  useEffect(() => {
    if (search.sync === "connected") {
      toast.success("Conta do Google conectada com sucesso!");
      navigate({ to: "/", replace: true });
    }
  }, [search, navigate]);

  return (
    <SiteLayout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Configurações (em desenvolvimento)</p>
      </div>
    </SiteLayout>
  );
}
