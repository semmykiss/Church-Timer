import React, { createContext, useContext, useState, useCallback } from 'react';

// Default operator credentials (change via localStorage override if needed)
const DEFAULT_USERNAME = 'jesusembassy';
const DEFAULT_PASSWORD = 'admin@lp87';

const AUTH_STORAGE_KEY = 'sanctuary_operator_session';

interface AuthContextValue {
  isAuthenticated: boolean;
  operatorName: string;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  operatorName: '',
  login: async () => ({ ok: false, error: 'Auth not initialised' }),
  logout: () => {},
});

function readStoredSession(): { username: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.username) return { username: parsed.username };
  } catch {
    // Corrupt session — fall through to logged-out state
  }
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<{ username: string } | null>(() => readStoredSession());

  const login = useCallback(async (username: string, password: string) => {
    const user = username.trim().toLowerCase();

    // Small delay so the loading state feels intentional rather than instant
    await new Promise((r) => setTimeout(r, 450));

    if (user === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
      const sess = { username: user };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sess));
      setSession(sess);
      return { ok: true };
    }
    return { ok: false, error: 'Incorrect username or password. Please try again.' };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(session),
        operatorName: session?.username || '',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
