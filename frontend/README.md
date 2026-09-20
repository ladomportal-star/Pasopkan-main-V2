# Pasopkan frontend

React 19 + Vite + Tailwind CSS v4 SPA. Talks to the backend API over
HTTP; the dev server proxies `/api/*` to `http://localhost:3000`.

```bash
npm install
npm run dev        # http://localhost:5173  (no .env needed)
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Type-check (`tsc --noEmit`) |

## Layout

```
index.html            entry HTML → /src/main.tsx
vite.config.ts        build + dev proxy (/api → :3000)
public/               static files served as-is (bank logos, …)
src/
├── main.tsx          React entry
├── App.tsx           router + shell
├── index.css         Tailwind + globals
├── assets/           images imported from code
├── components/       reusable UI
├── pages/            route views
├── context/          AuthContext · LanguageContext · ThemeContext
├── lib/              firebase client, stores, helpers
├── data/             static / seed data
├── utils/            small pure helpers
├── config/           firebase-applet-config.json (public client keys)
└── types/            shared TypeScript types (index.ts)
```

## Environment

No `.env` is required — every option has a default. Create `frontend/.env`
only to override one (documented at the top of `vite.config.ts`):
`VITE_API_PROXY_TARGET`, `GEMINI_API_KEY`, `DISABLE_HMR`.
