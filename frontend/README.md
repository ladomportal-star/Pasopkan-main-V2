# Pasopkan frontend

React 19 + Vite + Tailwind CSS v4. Business data uses the backend /api endpoints. Supabase Auth handles Google sign-in.

## Setup

Run npm ci, copy .env.example to .env, and configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for the same project as the backend. Only public credentials belong in frontend configuration.

Run npm run dev. Vite proxies /api to localhost:3000; VITE_API_PROXY_TARGET overrides that development target. Configure production routing separately.

## Commands

- npm run lint: TypeScript checking.
- npm run build: production output in dist.
- npm run preview: local build preview.

## Integration status

Phone login and paid checkout are disabled pending verified backend provider adapters. Never embed gateway credentials or Supabase service-role keys in browser code. Admin review UI and Supabase Storage form integration still require work. See [implementation status](../docs/prisma-implementation-status.md).
