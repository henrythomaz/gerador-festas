import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Baixar app desktop — Gerenciador de Festas" },
      { name: "description", content: "Baixe o aplicativo desktop do Gerenciador de Festas para Windows, macOS e Linux." },
    ],
  }),
  component: DownloadPage,
});

const APP_VERSION = "1.0.0";

interface Platform {
  os: "Windows" | "macOS" | "Linux";
  icon: string;
  file: string;
  size: string;
  url: string | null;
}

const platforms: Platform[] = [
  { os: "Windows", icon: "🪟", file: "GerenciadorFestas-Setup.exe", size: "~85 MB", url: null },
  { os: "macOS", icon: "", file: "GerenciadorFestas.dmg", size: "~92 MB", url: null },
  { os: "Linux", icon: "🐧", file: "GerenciadorFestas.AppImage", size: "~88 MB", url: null },
];

function DownloadCard({ p }: { p: Platform }) {
  const disabled = !p.url;
  return (
    <div className="card-surface flex flex-col p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand-soft text-2xl">
          {p.icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{p.os}</h3>
          <p className="text-xs text-muted-foreground">Versão {APP_VERSION} · {p.size}</p>
        </div>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Instalador oficial para {p.os}. Arquivo: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{p.file}</code>
      </p>
      <a
        href={p.url ?? "#"}
        aria-disabled={disabled}
        onClick={(e) => { if (disabled) e.preventDefault(); }}
        className={
          disabled
            ? "mt-auto inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-border bg-muted/60 px-5 py-3 text-sm font-medium text-muted-foreground"
            : "mt-auto btn-brand"
        }
      >
        {disabled ? "Em breve" : `Baixar para ${p.os}`}
      </a>
    </div>
  );
}

function DownloadPage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-brand-soft" />
        <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            App Desktop · Versão {APP_VERSION}
          </span>
          <h1 className="mt-6 text-4xl font-extrabold sm:text-5xl">
            Baixe o <span className="text-gradient-brand">Gerenciador de Festas</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            O aplicativo desktop se conecta ao mesmo servidor da versão web, com performance nativa
            e uso offline nas próximas versões. Escolha seu sistema abaixo.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {platforms.map((p) => <DownloadCard key={p.os} p={p} />)}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="card-surface p-6">
            <h2 className="text-lg font-semibold">Requisitos de sistema</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Windows 10 ou superior (64 bits)</li>
              <li>• macOS 11 (Big Sur) ou superior</li>
              <li>• Distribuições Linux modernas com suporte a AppImage</li>
              <li>• 4 GB de RAM · 500 MB de espaço em disco</li>
              <li>• Conexão com o servidor da API</li>
            </ul>
          </div>
          <div className="card-surface p-6">
            <h2 className="text-lg font-semibold">Como instalar</h2>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>1. Baixe o instalador correspondente ao seu sistema.</li>
              <li>2. Execute o arquivo e siga as instruções da tela.</li>
              <li>3. Abra o app e faça login com sua conta.</li>
              <li>4. Comece a gerenciar seus contratos.</li>
            </ol>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Os instaladores serão disponibilizados em breve. Enquanto isso, use a versão web.
        </p>
      </section>
    </SiteLayout>
  );
}

