"use client";
import { createContext, useContext, useState, type ReactNode } from 'react';
import { mockUsers, type User, type Role } from './mock-data';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; role?: Role; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, login: () => ({ success: false }), logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, _password: string) => {
    // Mock login - match by email or username
    const found = mockUsers.find((u: User) => u.email === email || u.username === email);
    if (found) {
      setUser(found);
      return { success: true, role: found.role };
    }
    // Default demo accounts
    if (email.includes('student')) {
      setUser(mockUsers[0]);
      return { success: true, role: 'student' as Role };
    }
    if (email.includes('prof')) {
      setUser(mockUsers[1]);
      return { success: true, role: 'professor' as Role };
    }
    if (email.includes('admin')) {
      setUser(mockUsers[2]);
      return { success: true, role: 'admin' as Role };
    }
    // Any email works for demo
    setUser(mockUsers[0]);
    return { success: true, role: 'student' as Role };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
