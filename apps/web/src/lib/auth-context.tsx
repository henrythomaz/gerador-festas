import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSession, setSession, clearSession, AuthUser, fetchUserProfile } from './api';

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
    const session = getSession();
    if (session.token && session.user) {
      setToken(session.token);
      // Define o usuário básico primeiro
      setUser(session.user);
      // Busca o perfil completo para obter o avatar
      fetchUserProfile(session.user.id)
        .then(fullUser => {
          setUser(fullUser);
          // Atualiza o localStorage com o perfil completo (opcional)
          setSession(session.token!, fullUser);
        })
        .catch(err => {
          console.error("Erro ao buscar perfil do usuário:", err);
          // Em caso de erro, mantém o usuário básico
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: AuthUser) => {
    setSession(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
    // Busca o perfil completo após login
    fetchUserProfile(newUser.id)
      .then(fullUser => {
        setUser(fullUser);
        // Atualiza o localStorage com o perfil completo
        setSession(newToken, fullUser);
      })
      .catch(err => {
        console.error("Erro ao buscar perfil após login:", err);
        // Mantém o usuário básico
      });
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
