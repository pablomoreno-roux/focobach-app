# FocoBach

Cuaderno de estudio personal para primero de Bachillerato Internacional. Permite llevar el seguimiento de asignaturas, CAS, Monografía, TdC, apuntes, diario y plazos, con una cuenta propia y los datos guardados en una base de datos real (ya no en el propio dispositivo).

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19 + TanStack Router) sobre Vite
- [Netlify Identity](https://docs.netlify.com/manage/security/secure-access-to-sites/identity/) para registro/inicio de sesión
- [Netlify Database](https://docs.netlify.com/build/data-and-storage/netlify-db/) (Postgres) + [Drizzle ORM](https://orm.drizzle.team/) para la persistencia
- TypeScript (modo estricto) y CSS en línea (sin librería de estilos)

## Cómo funciona

- Cada usuario se autentica con Netlify Identity (`src/routes/login.tsx`, `src/lib/identity-context.tsx`). La ruta `/` (`src/routes/index.tsx`) redirige a `/login` si no hay sesión.
- Toda la información de la app (asignaturas, notas, diario, plazos, CAS, Monografía, TdC…) se guarda como pares clave/valor en la tabla `app_data` de Postgres, aislados por `userId` (`db/schema.ts`, `src/lib/data.ts`).
- `src/lib/store.ts` expone `usePersistedStore()`, un hook que sustituye al antiguo almacenamiento local del prototipo original y llama a los server functions de `src/lib/data.ts`.
- La interfaz de la app (`src/components/FocoBach.jsx`) es la migración del prototipo original, con el logo corregido (ahora "FB") y sin el bloqueo por PIN.

## Desarrollo local

```bash
pnpm install
pnpm dev
```

> **Importante:** Netlify Identity no funciona en `localhost` / `netlify dev` porque depende de la cookie de sesión (`nf_jwt`) emitida por el backend real de Netlify. El registro e inicio de sesión solo se pueden probar en un sitio ya desplegado en Netlify (producción o una vista previa de rama).

## Migraciones de base de datos

Si se modifica `db/schema.ts`, hay que generar una nueva migración antes de desplegar:

```bash
npx drizzle-kit generate --name <nombre_descriptivo>
```
