import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Credenciais do Doppler (simuladas para desenvolvimento)
  const ADMIN_EMAIL = import.meta.env.VITE_LOGIN_EMAIL || 'admin@hub-automation.com';
  const ADMIN_PASSWORD = import.meta.env.VITE_LOGIN_PASSWORD || 'HubAuto2024!';

  const isAuthenticated = !!user;

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simular delay de autenticação
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar credenciais contra as variáveis do Doppler
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const userData: User = {
          id: '1',
          email: email,
          name: 'Administrador',
          role: 'admin'
        };
        
        setUser(userData);
        
        // Salvar no localStorage para persistência
        localStorage.setItem('auth_user', JSON.stringify(userData));
        localStorage.setItem('auth_token', 'hub-automation-token-' + Date.now());
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  };

  const checkAuth = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      const savedUser = localStorage.getItem('auth_user');
      const savedToken = localStorage.getItem('auth_token');
      
      if (savedUser && savedToken) {
        // Verificar se o token ainda é válido (simples verificação de tempo)
        const tokenTime = parseInt(savedToken.split('-').pop() || '0');
        const currentTime = Date.now();
        const tokenAge = currentTime - tokenTime;
        
        // Token válido por 24 horas (86400000 ms)
        if (tokenAge < 86400000) {
          setUser(JSON.parse(savedUser));
        } else {
          // Token expirado, fazer logout
          logout();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};