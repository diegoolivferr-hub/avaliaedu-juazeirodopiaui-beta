import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthService, User } from "@/lib/AuthService";

interface AuthContextType {
  user: Omit<User, 'senha'> | null;
  loading: boolean;
  login: (email: string, senha: string) => { error: string | null };
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'senha'> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state (Login desativado por enquanto)
    // const currentUser = AuthService.getCurrentUser();
    // setUser(currentUser);
    const fakeAdmin = {
      id: "admin-fake",
      nome: "Administrador (Desativado)",
      email: "admin@localhost",
      role: "admin" as const,
      ativo: true,
      createdAt: new Date().toISOString()
    };
    setUser(fakeAdmin);
    setLoading(false);
  }, []);

  const login = (email: string, senha: string) => {
    const { user, error } = AuthService.login(email, senha);
    if (user) {
      setUser(user);
    }
    return { error };
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
