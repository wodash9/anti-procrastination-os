# Anti-Procrastination OS

Aplicación web para developers con demasiados proyectos abiertos. Convierte una landing anti-procrastinación en una sala de control con autenticación Keycloak-ready, WIP board, foco diario, ritual semanal, emergencia y métricas.

## Funcionalidades MVP

- Login mediante abstracción auth:
  - `VITE_AUTH_MODE=mock` para desarrollo local.
  - `VITE_AUTH_MODE=keycloak` para producción/Coolify.
- Inventario de proyectos con estado, tipo, próxima acción y puntuación.
- Matriz de decisión por impacto, tracción, coste inverso, energía y urgencia.
- WIP board: Inbox, Now, Next, Blocked, Waiting, Done, Killed.
- Límite WIP configurable.
- Foco diario.
- Protocolo de emergencia de 15 minutos.
- Ritual semanal con issues bloqueantes.
- Detector de proyectos zombis.
- Métricas y exportación JSON.

## Desarrollo local

```bash
npm install
cp .env.example .env
npm run dev
```

Por defecto usa mock auth local. El mock está bloqueado fuera de localhost/desarrollo.

## Keycloak / OIDC

Configurar en `.env` o en Coolify como variables de build:

```env
VITE_AUTH_MODE=keycloak
VITE_KEYCLOAK_URL=https://keycloak.example.com
VITE_KEYCLOAK_REALM=anti-procrastination
VITE_KEYCLOAK_CLIENT_ID=anti-procrastination-spa
```

Reglas de seguridad:

- Cliente Keycloak público.
- Authorization Code Flow + PKCE S256.
- Sin `client_secret` en frontend.
- Implicit Flow deshabilitado.
- Direct Access Grants deshabilitado.
- Redirect URIs:
  - `http://localhost:5173/*`
  - `https://TU-DOMINIO/*`

## Coolify

El repo incluye:

- `Dockerfile` multi-stage Node + Nginx.
- `ops/nginx/app.conf` para SPA routing.
- `.dockerignore`.
- `.nvmrc` con Node 22.

Coolify:

- Build pack: Dockerfile.
- Exposed port: `80`.
- Variables de build: las `VITE_*` anteriores.
- Producción debe usar `VITE_AUTH_MODE=keycloak`.

## Verificación

```bash
npm test
npm run typecheck
npm run build
```

## Limitaciones actuales

- Persistencia local en `localStorage`, aislada por user id. No hay backend todavía.
- Auth frontend no protege datos de servidor; cuando exista API, debe validar JWT de Keycloak.
- Login Keycloak real requiere configurar realm/cliente en una instancia real; sin credenciales no se puede validar end-to-end.
