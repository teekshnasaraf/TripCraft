import { createContext, type PropsWithChildren } from "react";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: PropsWithChildren) {
  const value: AuthContextValue = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    async login(_email, _password) {
      throw new Error("Authentication is not connected yet.");
    },
    async logout() {
      throw new Error("Authentication is not connected yet.");
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
