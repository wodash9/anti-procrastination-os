import { describe, expect, it } from 'vitest';
import { createAuthConfig, getMockUser, isMockAllowed } from './authConfig';

describe('auth config', () => {
  it('allows mock auth only for local development hosts', () => {
    expect(isMockAllowed({ mode: 'development', hostname: 'localhost' })).toBe(true);
    expect(isMockAllowed({ mode: 'development', hostname: '127.0.0.1' })).toBe(true);
    expect(isMockAllowed({ mode: 'production', hostname: 'app.example.com' })).toBe(false);
  });

  it('rejects keycloak mode with missing public configuration', () => {
    expect(() => createAuthConfig({ VITE_AUTH_MODE: 'keycloak' })).toThrow(/VITE_KEYCLOAK_URL/);
  });

  it('creates keycloak config without secrets', () => {
    const config = createAuthConfig({
      VITE_AUTH_MODE: 'keycloak',
      VITE_KEYCLOAK_URL: 'https://sso.example.com',
      VITE_KEYCLOAK_REALM: 'anti-os',
      VITE_KEYCLOAK_CLIENT_ID: 'anti-os-spa',
    });
    expect(config).toEqual({ mode: 'keycloak', url: 'https://sso.example.com', realm: 'anti-os', clientId: 'anti-os-spa' });
    expect(JSON.stringify(config)).not.toMatch(/secret/i);
  });

  it('provides a deterministic mock user for local QA', () => {
    expect(getMockUser()).toMatchObject({ id: 'local-dev-user', email: 'dev@localhost', roles: ['user'] });
  });
});
