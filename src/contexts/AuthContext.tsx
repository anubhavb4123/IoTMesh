import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserRole = 'admin' | 'guest';

interface AuthContextType {
  user: { name: string } | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [role, setRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockUser = localStorage.getItem("mock_user");

    if (mockUser) {
      const data = JSON.parse(mockUser);

      setUser({ name: data.name });
      setRole(data.role);
    }

    setLoading(false);
  }, []);

  const signOut = async () => {
    localStorage.removeItem("mock_user");
    setUser(null);
    setRole("guest");
  };

  return (
    <AuthContext.Provider value={{ user, role, setRole, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};