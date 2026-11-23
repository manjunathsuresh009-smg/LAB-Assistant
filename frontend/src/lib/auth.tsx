import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken } from "./api";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    departmentId?: string;
  }) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    const data = await api.get<{ user: User }>("/auth/me");
    setUser(data.user);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (getToken()) {
          const data = await api.get<{ user: User }>("/auth/me");
          if (active) setUser(data.user);
        }
      } catch {
        setToken(null);
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener("campuslab:unauthorized", onUnauthorized);
    return () => window.removeEventListener("campuslab:unauthorized", onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>(
      "/auth/login",
      { email, password },
      false
    );
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; password: string; departmentId?: string }) => {
      const data = await api.post<{ token: string; user: User }>("/auth/register", input, false);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
