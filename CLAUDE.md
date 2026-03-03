# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on port 8080
npm run build      # Production build
npm run build:dev  # Development build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

No test framework is configured in this project.

## Architecture Overview

This is a React + TypeScript SaaS subscription platform for RSData with a public-facing landing/checkout flow and a protected admin dashboard.

**Tech stack:** Vite + React 18 + TypeScript, Supabase (PostgreSQL + Edge Functions), MercadoPago payments, shadcn/ui + Tailwind CSS, TanStack Query v5, React Router v6.

### Application Flow

**Public flow:**
1. `/` — Landing page (`RSDataLanding.tsx`)
2. `/formulario-assinatura` — Subscription signup form (collects customer data, address, plan selection)
3. `/pagamento-confirmado` — Post-payment confirmation page

**Admin flow:**
1. `/admin/login` — Admin-only authentication
2. `/admin/*` — Protected dashboard (wrapped in `ProtectedRoute`)

### Provider Stack (App.tsx)

```
QueryClientProvider → AuthProvider → TooltipProvider → BrowserRouter
```

### Authentication (`src/contexts/AuthContext.tsx`)

Auth is exclusively for admin users. On load it:
- Restores session from Supabase
- Validates the user exists in the `admin_users` table with `is_active = true`
- Updates `last_login` on sign-in

`ProtectedRoute` checks `AuthContext` and redirects to `/admin/login` if unauthenticated.

### Database Layer (`src/lib/supabase-db.ts`)

All DB access goes through raw `fetch()` calls to the Supabase PostgREST API (not the Supabase JS client methods). The `supabase` client export is used only for auth.

Key functions and their deduplication logic:
- `findOrCreateCustomer` — deduplicates by `document` OR `email`, handles 409 race conditions
- `createOrUpdateAddress` — upserts via default address pattern (`is_default = true`)
- `getPlanByPlanId` — looks up by `plan_id` column (not the row `id`)
- `createSubscription` — creates with `status: 'pending'`
- `createPayment` — records payment with `external_reference` for MercadoPago tracking

### Payment Processing (`src/lib/mercadopago.ts`)

Payments are processed via two Supabase Edge Functions:
- `create-payment-preference` — generates a MercadoPago preference (redirect flow)
- `process-card-payment` — direct card tokenization flow

`MercadoPagoCheckout.tsx` supports both the Payment Brick UI and a direct card form. The checkout component handles subscription vs. one-time payment branching.

### Supabase Edge Functions (`supabase/functions/`)

Each subdirectory is a separate Deno-based Edge Function:
- `create-payment-preference` / `process-card-payment` / `create-authorized-subscription` — MercadoPago integration
- `mercadopago-webhook` — receives payment notifications and updates subscription/payment status
- `check-subscription-status` / `sync-subscriptions` — status sync utilities
- `manage-admin-users` — admin CRUD
- `send-email` — email notifications

### Admin Dashboard (`src/pages/admin/`)

All admin pages use TanStack Query for data fetching with named query keys (e.g., `"customers-list"`, `"payments-list"`). The `AdminLayout` component provides the sidebar navigation.

### UI Conventions

- All UI primitives are from shadcn/ui (`src/components/ui/`)
- The `cn()` utility from `src/lib/utils.ts` (combining `clsx` + `tailwind-merge`) is used for conditional className composition
- Toasts via `sonner` (imported from `@/components/ui/sonner`)
- Document validation (CPF/CNPJ) is in `src/lib/validators.ts`

### Path Aliases

`@/` maps to `src/` throughout the codebase.

### Environment Variables

```
VITE_SUPABASE_URL        # Supabase project URL
VITE_SUPABASE_ANON_KEY   # Supabase anon public key
VITE_MERCADOPAGO_PUBLIC_KEY  # MercadoPago public key
```

### Security Headers

CSP and security headers are configured in three places: `netlify.toml`, `public/_headers`, and `index.html`. Changes to allowed external domains (analytics, payment SDKs, external APIs) must be updated in all three.
