import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getSession, setSession, clearSession, AuthUser, fetchUserProfile } from "./api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const session = getSession();
      if (session.token && session.user) {
        setToken(session.token);
        setUser(session.user);
        try {
          const fullUser = await fetchUserProfile(session.user.id);
          setUser(fullUser);
          setSession(session.token, fullUser);
        } catch (err) {
          console.error("Erro ao buscar perfil:", err);
        }
      }
      setIsLoading(false);
    }
    loadSession();
  }, []);

  const login = async (newToken: string, newUser: AuthUser) => {
    setSession(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
    try {
      const fullUser = await fetchUserProfile(newUser.id);
      setUser(fullUser);
      setSession(newToken, fullUser);
    } catch (err) {
      console.error("Erro ao buscar perfil após login:", err);
    }
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook seguro – NUNCA lança erro
export function useSafeAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Retorna um objeto vazio sem quebrar
    return {
      user: null,
      token: null,
      login: () => {},
      logout: () => {},
      isLoading: false,
    };
  }
  return context;
}

// Mantido para compatibilidade (mas não recomendado)
export function useAuth(): AuthContextType {
  return useSafeAuth();
}
