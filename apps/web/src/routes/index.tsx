import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gerenciador de Festas — Plataforma completa para gestão de contratos" },
      {
        name: "description",
        content:
          "Controle contratos de festas, vencimentos e clientes em um só lugar. Web + app desktop integrados.",
      },
    ],
  }),
  component: Index,
});

function Feature({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="card-surface p-6">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-lg text-white shadow-brand">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Index() {
  const { user } = useAuth();
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-brand-soft" />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-[-10%] -z-10 h-96 w-96 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, #F472B6, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-[-10%] -z-10 h-96 w-96 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, #5B8DEF, transparent 70%)" }}
        />

        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:py-8">
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient-brand">Gerenciador de Festas</span>
            <br />
            simples, rápido e organizado.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Controle contratos, prazos e clientes em um só lugar. Receba alertas automáticos quando
            um contrato atrasar e resolva com um clique.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/cadastro" className="btn-brand">
              Começar agora
            </Link>
            <Link
              to="/download"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-6 py-3 text-sm font-semibold hover:bg-muted transition"
            >
              Baixar app desktop
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-medium text-foreground hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </section>

      {/* Features */}
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold">Tudo que você precisa para não perder um contrato</h2>
        <p className="mt-3 text-muted-foreground">
        Da criação ao arquivamento, com notificações automáticas quando algo precisa da sua
        atenção.
        </p>
      </div>
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon="📋"
            title="Contratos organizados"
            description="Todos os contratos em uma tela, com filtros por status, cliente e datas."
          />
          <Feature
            icon="⏰"
            title="Alertas de vencimento"
            description="Contratos vencidos viram LATE automaticamente e você recebe um email com as ações disponíveis."
          />
          <Feature
            icon="⚡"
            title="Ações rápidas"
            description="Cancele, arquive ou mantenha como atrasado direto pelo painel — um clique."
          />
          <Feature
            icon="🔒"
            title="Autenticação segura"
            description="Login com JWT, confirmação de email e recuperação de senha por token."
          />
          <Feature
            icon="🖥️"
            title="App desktop"
            description="Trabalhe offline pelo aplicativo desktop e sincronize com o servidor."
          />
          <Feature
            icon="🔗"
            title="API poderosa"
            description="API REST completa em Node.js/Express com filas Bull e Redis por trás."
          />
        </div>
      </section>

      {/* CTA Download */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div className="card-surface relative overflow-hidden p-8 sm:p-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-brand-soft" />
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Vamos trabalhar juntos?</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Baixe o aplicativo para Windows, macOS ou Linux e tenha o Gerenciador de Festas
                sempre à mão, mesmo offline.
              </p>
            </div>
            <Link to="/download" className="btn-brand justify-self-start sm:justify-self-end">
              Ir para downloads
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
