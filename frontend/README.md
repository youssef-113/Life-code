# LifeCode Frontend

A full React + TypeScript + Vite frontend for the LifeCode emergency health identity
platform — patient dashboard, family/dependent management, wristband (QR + NFC)
management, and a public, unauthenticated **Emergency Scan** portal for first
responders. Includes a Three.js animated hero, Framer Motion micro‑interactions,
and a complete offline **demo data mode** with 3 seeded users so the whole app is
explorable without your backend running.

## 1. Requirements

- Node.js 18+ and npm
- Your LifeCode backend (only needed if you switch to "live" mode — see below)

## 2. Install & run

```bash
cd lifecode-frontend
npm install
cp .env.example .env
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

## 3. Demo mode vs. Live backend mode

The app ships in **mock/demo mode** by default (`VITE_API_MODE=mock` in `.env`).
In this mode, everything — auth, medical profile, contacts, family, wristbands,
scan history — runs against an in‑memory store seeded with 3 demo accounts and
persisted to `localStorage`, so you can freely edit data and it survives a
refresh. No network calls are made.

**Demo accounts (password for all: `DemoPass123`):**

| Name | Email | Highlights |
|---|---|---|
| Youssef Besso | `youssef@demo.lifecode.app` | Complete profile, Type 1 diabetic, active wristband |
| Sara Ahmed | `sara@demo.lifecode.app` | Partial profile, severe shellfish allergy, pending wristband |
| Omar Hassan | `omar@demo.lifecode.app` | Cardiac history, family account with a dependent in **Lost Child Mode** |

To point the app at your **real backend**, edit `.env`:

```bash
VITE_API_MODE=live
VITE_API_BASE_URL=https://your-backend-host/api/app
```

The live API client (`src/api/liveApi.ts`) is wired to match your documented
endpoints exactly (auth, `/medical/*`, `/emergency/*`, `/family`, `/wristband/*`,
`/scan/*`, `/user/*`), including JWT bearer auth and automatic refresh-token
retry on 401s. You'll need real accounts registered on your backend to sign in —
the seeded demo users only exist in mock mode.

## 4. Project structure

```
src/
  api/            # mock store, mock API, live API (axios), and the facade (index.ts)
  components/
    layout/       # Sidebar, Topbar, AppShell, ProtectedRoute
    three/        # Three.js / react-three-fiber hero scene
    ui/           # Button, Card, Input, Modal, Badge, ProgressBar, Toast, EmptyState
  hooks/          # useToast
  lib/            # demoData.ts (seeded users), format.ts (date/color helpers)
  pages/          # one file per route/screen
  store/          # zustand auth store (persisted to localStorage)
  types/          # TypeScript types mirroring the API's data model
```

## 5. Routes

| Path | Description | Auth |
|---|---|---|
| `/` | Marketing landing page with 3D hero | Public |
| `/login`, `/register` | Auth | Public |
| `/emergency-scan` | Responder scan portal — scan by QR or band/NFC ID | Public, no login |
| `/app` | Dashboard overview (profile completion, quick stats) | Protected |
| `/app/personal` | Personal info + photo | Protected |
| `/app/medical` | Blood type, conditions, allergies, medications, surgeries, instructions | Protected |
| `/app/contacts` | Emergency contacts CRUD | Protected |
| `/app/family` | Family/dependents + Lost Child Mode | Protected |
| `/app/wristband` | Register / activate / revoke LifeBands | Protected |
| `/app/scans` | Scan history timeline | Protected |
| `/app/settings` | Password, scan privacy preferences, sessions, delete account | Protected |

## 6. Notes on the API mapping

The backend's documentation didn't define a multi-role system (admin / nurse /
etc.) — it's a single authenticated user role plus a public, unauthenticated
scan surface for responders. This frontend mirrors that: the "roles" are
**Patient** (everything under `/app`) and **Responder / Public** (`/emergency-scan`,
no login required — matching your `/scan/qr`, `/scan/nfc`, `/scan/band` endpoints).

If your backend does add role-based access later, the cleanest extension point
is `src/store/authStore.ts` (add a `role` field to `AuthUser`) and
`src/components/layout/ProtectedRoute.tsx` (add a `role` prop to gate routes).

## 7. Building for production

```bash
npm run build
npm run preview
```

Output goes to `dist/` — deploy it to any static host (Vercel, Netlify, S3 + CloudFront, etc.).
