import { describe, expect, it } from 'vitest';
import { hasOidcCallback } from './AuthProvider';

describe('hasOidcCallback', () => {
  it('detects Keycloak fragment callbacks only when state is present', () => {
    expect(hasOidcCallback('https://focus.etharlia.com/#state=abc&code=def')).toBe(true);
    expect(hasOidcCallback('https://focus.etharlia.com/#state=abc&error=access_denied')).toBe(true);
  });

  it('does not treat unrelated URLs or query params as OIDC callbacks', () => {
    expect(hasOidcCallback('https://focus.etharlia.com/?project_code=abc')).toBe(false);
    expect(hasOidcCallback('https://focus.etharlia.com/?state=abc&code=def')).toBe(false);
    expect(hasOidcCallback('https://focus.etharlia.com/#code=abc')).toBe(false);
    expect(hasOidcCallback('https://focus.etharlia.com/?error=boom')).toBe(false);
  });
});
