export interface User {
  id: string;
  nome: string;
  email: string;
  senha?: string; // Omit in public getter
  role: 'admin' | 'user';
  ativo: boolean;
  createdAt: string;
}

export interface Session {
  userId: string;
  role: 'admin' | 'user';
  loginAt: string;
}

const STORAGE_USERS_KEY = "avalia_users";
const STORAGE_SESSION_KEY = "avalia_session";

class AuthServiceImpl {
  constructor() {
    this.initializeDefaultUser();
  }

  private initializeDefaultUser() {
    const users = this.getUsersInternal();
    if (users.length === 0) {
      const defaultAdmin: User = {
        id: "admin-1",
        nome: "Administrador",
        email: "admin",
        senha: "admin123",
        role: "admin",
        ativo: true,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify([defaultAdmin]));
    }
  }

  private getUsersInternal(): User[] {
    const data = localStorage.getItem(STORAGE_USERS_KEY);
    return data ? JSON.parse(data) : [];
  }

  public getUsers(): Omit<User, 'senha'>[] {
    return this.getUsersInternal().map(u => {
      const { senha, ...rest } = u;
      return rest;
    });
  }

  public login(email: string, senha: string): { user: Omit<User, 'senha'> | null; error: string | null } {
    const users = this.getUsersInternal();
    const user = users.find(u => u.email === email && u.senha === senha);
    
    if (!user) {
      return { user: null, error: "Usuário ou senha incorretos." };
    }

    if (!user.ativo) {
      return { user: null, error: "Usuário inativo. Contate o administrador." };
    }

    const session: Session = {
      userId: user.id,
      role: user.role,
      loginAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));

    const { senha: _, ...safeUser } = user;
    return { user: safeUser, error: null };
  }

  public logout(): void {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  }

  public getSession(): Session | null {
    const data = localStorage.getItem(STORAGE_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  }

  public getCurrentUser(): Omit<User, 'senha'> | null {
    const session = this.getSession();
    if (!session) return null;
    const users = this.getUsersInternal();
    const user = users.find(u => u.id === session.userId);
    if (!user || !user.ativo) {
      if (user && !user.ativo) this.logout(); // If disabled while logged in
      return null;
    }
    const { senha, ...rest } = user;
    return rest;
  }

  public isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  public hasRole(role: 'admin' | 'user'): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  // Admin User Management
  public createUser(userData: Omit<User, 'id' | 'createdAt'>): { error: string | null } {
    const users = this.getUsersInternal();
    if (users.some(u => u.email === userData.email)) {
      return { error: "E-mail ou usuário já cadastrado." };
    }
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    return { error: null };
  }

  public updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): { error: string | null } {
    const users = this.getUsersInternal();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return { error: "Usuário não encontrado." };

    if (updates.email && users.some(u => u.email === updates.email && u.id !== id)) {
      return { error: "E-mail ou usuário já cadastrado por outra pessoa." };
    }

    users[index] = { ...users[index], ...updates };
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    return { error: null };
  }

  public deleteUser(id: string): { error: string | null } {
    const users = this.getUsersInternal();
    if (users.length === 1 && users[0].id === id) {
       return { error: "Não é possível excluir o único usuário do sistema." };
    }
    const updated = users.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));
    return { error: null };
  }
}

export const AuthService = new AuthServiceImpl();
