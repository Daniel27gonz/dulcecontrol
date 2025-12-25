import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipos de usuario
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'dessert_calc_auth';
const USERS_STORAGE_KEY = 'dessert_calc_users';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar sesión al iniciar
  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      try {
        const parsedUser = JSON.parse(storedAuth);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Obtener usuarios registrados
  const getStoredUsers = (): StoredUser[] => {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  };

  // Guardar usuarios
  const saveUsers = (users: StoredUser[]) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  // Registro de usuario
  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    const users = getStoredUsers();
    
    // Verificar si el email ya existe
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Este correo ya está registrado' };
    }

    // Validaciones básicas
    if (password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    if (!email.includes('@')) {
      return { success: false, error: 'Ingresa un correo válido' };
    }

    // Crear nuevo usuario
    const newUser: StoredUser = {
      id: Date.now().toString(),
      email: email.toLowerCase(),
      name,
      password, // En producción real se hashearía
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    // Iniciar sesión automáticamente
    const userSession: User = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      createdAt: newUser.createdAt,
    };
    
    setUser(userSession);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userSession));

    return { success: true };
  };

  // Inicio de sesión
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const users = getStoredUsers();
    
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!foundUser) {
      return { success: false, error: 'Correo o contraseña incorrectos' };
    }

    const userSession: User = {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      createdAt: foundUser.createdAt,
    };

    setUser(userSession);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userSession));

    return { success: true };
  };

  // Cerrar sesión
  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
