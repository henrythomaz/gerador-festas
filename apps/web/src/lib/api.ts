export const API_BASE_URL = "api";

export const TOKEN_KEY = "gf.token";
export const USER_KEY = "gf.user";

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  avatar?: string | null;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AuthUser) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}

export function getSession() {
  return {
    token: getToken(),
    user: getStoredUser(),
  };
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function extractMessage(data: unknown, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    const d = data as Record<string, unknown>;
    // Verifica os campos mais comuns, incluindo "erro" (português)
    if (typeof d.message === "string") return d.message;
    if (typeof d.error === "string") return d.error;
    if (typeof d.erro === "string") return d.erro; // <-- ADICIONADO
    if (Array.isArray(d.errors) && d.errors.length && typeof d.errors[0] === "string") {
      return d.errors[0] as string;
    }
  }
  return fallback;
}

export interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, auth = false, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(headers as Record<string, string> | undefined),
  };
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  let data: unknown = null;
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    const text = await res.text().catch(() => "");
    data = text || null;
  }

  if (!res.ok) {
    throw new ApiError(extractMessage(data, `Erro ${res.status}`), res.status, data);
  }
  return data as T;
}

export async function fetchUserProfile(userId: number): Promise<AuthUser> {
  try {
    const data = await api<any>(`/usuarios/${userId}`, { auth: true });
    let avatarUrl: string | null = null;
    if (data.avatar && typeof data.avatar === "object" && data.avatar.caminho) {
      avatarUrl = `${API_BASE_URL}/files/${data.avatar.caminho}`;
    }
    return {
      id: data.id,
      nome: data.nome,
      email: data.email,
      avatar: avatarUrl,
    };
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    throw error;
  }
}
