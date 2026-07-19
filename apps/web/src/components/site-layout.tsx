import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import IconeInvertido from "../../public/icone-invertido.png";

interface SiteLayoutProps {
  children: ReactNode;
}

// Ícone genérico de usuário (SVG simples)
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-8 w-8 text-muted-foreground"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export function SiteLayout({ children }: SiteLayoutProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
              <img
                src={IconeInvertido}
                alt="Gerenciador de Festas"
                className="h-7 w-7"
              />
            <span className="text-base font-semibold">
              Gerenciador <span className="text-gradient-brand">de Festas</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link to="/" className="hover:text-foreground transition">Início</Link>
            <Link to="/download" className="hover:text-foreground transition">Download</Link>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Avatar do usuário */}
                <div className="flex items-center gap-2">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.nome}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon />
                  )}
                  <span className="hidden text-sm text-muted-foreground sm:inline">
                    {user.nome.split(" ")[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted transition ml-auto"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted transition sm:inline-flex"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  className="btn-brand !px-4 !py-2 !text-sm"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-brand">
                <img
                  src={IconeInvertido}
                  alt="Gerenciador de Festas"
                  className="h-7 w-7"
                />
            </span>
            <span>© {new Date().getFullYear()} Gerenciador de Festas</span>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/" className="hover:text-foreground transition">Início</Link>
            <Link to="/download" className="hover:text-foreground transition">Baixar app</Link>
            <Link to="/login" className="hover:text-foreground transition">Entrar</Link>
            <Link to="/cadastro" className="hover:text-foreground transition">Cadastrar</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-brand-soft" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 -z-10 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #F472B6, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 -z-10 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #5B8DEF, transparent 70%)" }}
      />
      <div className="card-surface w-full max-w-md p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[color:var(--brand-blue)] " +
        (props.className ?? "")
      }
    />
  );
}
