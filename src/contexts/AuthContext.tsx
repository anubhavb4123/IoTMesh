import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'guest';

export interface StoredUser {
  name: string;
  role: UserRole;
  remember?: boolean;
  timestamp?: number;
}

interface AuthContextType {
  user: { name: string } | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  loading: boolean;
  login: (name: string, role: UserRole, remember?: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};

const getInitialStoredUser = (): StoredUser | null => {
  try {
    const stored = localStorage.getItem("mock_user");
    if (!stored) return null;
    const data = JSON.parse(stored);
    if (data && typeof data.name === "string") {
      return data;
    }
  } catch {
    localStorage.removeItem("mock_user");
  }
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const initialUser = getInitialStoredUser();
  const [user, setUser] = useState<{ name: string } | null>(
    initialUser ? { name: initialUser.name } : null
  );
  const [role, setRole] = useState<UserRole>(initialUser?.role || 'guest');
  const [loading, setLoading] = useState(false);

  const login = (name: string, newRole: UserRole, remember: boolean = true) => {
    const userData: StoredUser = {
      name,
      role: newRole,
      remember,
      timestamp: Date.now(),
    };
    localStorage.setItem("mock_user", JSON.stringify(userData));
    setUser({ name });
    setRole(newRole);
  };

  const signOut = async () => {
    localStorage.removeItem("mock_user");
    setUser(null);
    setRole("guest");
  };

  return (
    <AuthContext.Provider value={{ user, role, setRole, loading, login, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};