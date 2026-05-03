import Keycloak from 'keycloak-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createAuthConfig, getMockUser, isMockAllowed, type PublicUser } from './authConfig';

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: PublicUser | null;
  error?: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthState | null>(null);

function userFromKeycloak(keycloak: Keycloak): PublicUser {
  const parsed = keycloak.tokenParsed as { sub?: string; email?: string; name?: string; preferred_username?: string; realm_access?: { roles?: string[] } } | undefined;
  return {
    id: parsed?.sub || parsed?.preferred_username || 'keycloak-user',
    email: parsed?.email,
    name: parsed?.name || parsed?.preferred_username || parsed?.email || 'Keycloak user',
    roles: parsed?.realm_access?.roles || ['user'],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, 'login' | 'logout' | 'getAccessToken'>>({ isAuthenticated: false, isLoading: true, user: null });
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const configResult = useMemo(() => {
    try {
      return { config: createAuthConfig(import.meta.env as Record<string, string | undefined>), error: null as string | null };
    } catch (error) {
      return { config: null, error: error instanceof Error ? error.message : String(error) };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        if (configResult.error || !configResult.config) {
          throw new Error(configResult.error || 'Auth config missing');
        }
        const config = configResult.config;
        if (config.mode === 'mock') {
          if (!isMockAllowed({ mode: import.meta.env.MODE, hostname: window.location.hostname })) {
            throw new Error('Mock auth is blocked outside local development. Use VITE_AUTH_MODE=keycloak.');
          }
          if (!cancelled) setState({ isAuthenticated: true, isLoading: false, user: getMockUser() });
          return;
        }

        const client = new Keycloak({ url: config.url, realm: config.realm, clientId: config.clientId });
        const authenticated = await client.init({ onLoad: 'check-sso', pkceMethod: 'S256', checkLoginIframe: false });
        if (cancelled) return;
        setKeycloak(client);
        setState({ isAuthenticated: authenticated, isLoading: false, user: authenticated ? userFromKeycloak(client) : null });
      } catch (error) {
        if (!cancelled) setState({ isAuthenticated: false, isLoading: false, user: null, error: error instanceof Error ? error.message : String(error) });
      }
    }
    boot();
    return () => { cancelled = true; };
  }, [configResult]);

  const value = useMemo<AuthState>(() => {
    const config = configResult.config;
    return ({
      ...state,
      async login() {
        if (!config) return;
        if (config.mode === 'mock') {
          setState({ isAuthenticated: true, isLoading: false, user: getMockUser() });
          return;
        }
        await keycloak?.login();
      },
      async logout() {
        if (!config) return;
        if (config.mode === 'mock') {
          setState({ isAuthenticated: false, isLoading: false, user: null });
          return;
        }
        await keycloak?.logout({ redirectUri: window.location.origin });
      },
      async getAccessToken() {
        if (!config || config.mode === 'mock') return null;
        if (!keycloak?.token) return null;
        await keycloak.updateToken(30);
        return keycloak.token || null;
      },
    });
  }, [configResult.config, keycloak, state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}
