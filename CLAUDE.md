# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `fotografa-web/`:

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
npm run start    # Production server (after build)
```

No test framework is configured.

## Architecture

**FotosMony** is a Next.js 16 (App Router) photography e-commerce platform for a Chilean photographer. It has a public-facing site and a protected admin panel.

### Route structure

```
fotografa-web/app/
  (site)/           # Public routes: home, eventos, carrito, contacto, búsqueda, portafolio
    admin/          # Protected admin panel (metrics, events, photos, clients, messages, settings)
  (auth)/           # Login & register
  api/              # API Routes (checkout, admin/, contacto, search, watermark, upload)
```

### Key library modules (`fotografa-web/lib/`)

| File | Purpose |
|------|---------|
| `supabaseClient.ts` | Public Supabase instance (anon key) — for client-side use |
| `supabaseAdmin.ts` | Admin Supabase instance (service role key) — server only |
| `requireAdmin.ts` | Auth guard for API routes: validates Bearer JWT + checks `profiles.role = 'admin'` |
| `cart.ts` | Cart types and localStorage logic |
| `cloudinary.ts` | Cloudinary configuration |
| `email.ts` | Resend email templates (post-purchase download links) |
| `webpay.ts` | Webpay Plus (Transbank) REST client |

### Data & storage

- **Database & Auth**: Supabase (PostgreSQL + Supabase Auth)
- **Image storage**: Multi-provider — each photo has a `storage_provider` field (`"cloudinary"` | `"supabase"` | `"cloudflare"`). New uploads go to **Cloudflare R2** (via S3-compatible API); legacy photos remain on **Cloudinary**.
- **Email**: Resend — sends download links after payment; links use R2 or Cloudinary URLs depending on `storage_provider`.
- **Payments**: Webpay Plus (Transbank) — Chilean card processor. Checkout flow ends with a webhook confirming payment before email is sent.

### Admin authentication pattern

All admin API routes use `requireAdmin(req)` from `lib/requireAdmin.ts`. It validates the `Authorization: Bearer <token>` header against Supabase Auth, then verifies `profiles.role = 'admin'`. Returns `{ ok: true, userId }` on success or `{ ok: false, status, error }` on failure.

### Image URL generation

`next.config.ts` dynamically reads `NEXT_PUBLIC_R2_PUBLIC_URL` (or `CLOUDFLARE_R2_PUBLIC_URL` as fallback) to add the R2 hostname to Next.js `remotePatterns`. If neither env var is set, R2 images won't load through `<Image />`. The local `/api/watermark` path is also allowed.

### Cart

Managed via React Context (`components/context/`) with localStorage persistence. No server-side cart state.

## Environment variables

Copy `.env.example` → `.env.local`. Minimum required for development:

- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Cloudinary**: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (+ API key/secret if using gallery admin)
- **Cloudflare R2**: `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`, `NEXT_PUBLIC_R2_PUBLIC_URL`
- **App**: `NEXT_PUBLIC_APP_URL` (used in Webpay return_url and email links)

For payments: `WEBPAY_API_KEY_ID`, `WEBPAY_API_KEY_SECRET`, `WEBPAY_BASE_URL`.  
For email: `RESEND_API_KEY`, `RESEND_FROM`.

## Documentation

Technical docs are in `docs/`:
- `ENV-CHECKOUT-WEBPAY.md` — checkout and Webpay environment variables
- `TRANSBANK-COMO-EMPEZAR.md` — Webpay integration guide
- `MIGRACION-CLOUDINARY-A-R2.md` — Cloudinary → R2 migration
- SQL schemas for Supabase tables

## Notes

- Code and variable names are in English; most user-facing content, DB table/column names, and documentation are in Spanish (Chilean context).
- Deployment target is Vercel. No special build config needed beyond env vars.
- `scripts/` contains migration utilities (e.g., Cloudinary → R2 bulk migration).
