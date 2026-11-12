import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);
const STORAGE_KEY = "workflow.token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!token) {
        setUser(null);
        setReady(true);
        return;
      }
      try {
        const data = await api("/api/users/me", { token });
        if (!cancelled) setUser(data.user);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    setReady(false);
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      async register(payload) {
        const data = await api("/api/auth/register", { method: "POST", body: payload });
        localStorage.setItem(STORAGE_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
      },
      async login(payload) {
        const data = await api("/api/auth/login", { method: "POST", body: payload });
        localStorage.setItem(STORAGE_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
      },
      async logout() {
        try {
          if (token) await api("/api/auth/logout", { method: "POST", token });
        } catch {
          // Clear the local session even if the server token is already expired.
        }
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
      },
      async updateProfile(name) {
        const data = await api("/api/users/me", { method: "PATCH", token, body: { name } });
        setUser(data.user);
      },
    }),
    [token, user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
