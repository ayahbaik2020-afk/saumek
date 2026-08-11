# SAUMEK — Sistem Inventory & Peminjaman Barang

Aplikasi web untuk **Team Mekanik** untuk mengelola inventory barang, identifikasi barang
dengan **QR Code**, peminjaman, pengembalian, monitoring kondisi barang, dan histori
penggunaan barang.

**Live:** https://saumek.vercel.app

## Tech Stack

| Layer      | Teknologi                          |
| ---------- | ---------------------------------- |
| Frontend   | Next.js 16 · React 19 · TypeScript |
| Styling    | Tailwind CSS v4                    |
| Database   | Supabase (PostgreSQL)              |
| Auth       | Supabase Auth (email/password)     |
| Storage    | Supabase Storage (foto barang)     |
| QR         | `html5-qrcode` (scan) · `qrcode`   |
| Export     | `xlsx` (Excel) / CSV               |
| Deployment | Vercel                             |

## Fitur (MVP)

- Login & role-based access (Admin / Mechanic / Supervisor)
- Master barang, kategori, lokasi
- Generate & print QR Code
- Scan QR Code via kamera smartphone
- Peminjaman multi-item, pengembalian partial
- Status barang otomatis (AVAILABLE → BORROWED → AVAILABLE)
- Dashboard monitoring + deteksi overdue
- Histori barang & transaksi
- User management
- Audit trail
- Laporan export Excel/CSV
- Maintenance & stock opname (lanjutan)

## Persiapan Environment

1. Buat project di [Supabase](https://supabase.com).
2. Jalankan `supabase/schema.sql` pada **SQL Editor**.
3. Salin `.env.example` menjadi `.env.local` dan isi kredensial:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # server-only, jangan bocorkan ke client
NEXT_PUBLIC_COMPANY_NAME=PT SULFINDO ADIUSAHA
```

4. Buat admin pertama:

```bash
node --env-file=.env.local scripts/create-admin.mjs
# atau isi manual di Dashboard Supabase → Authentication → Add user,
# lalu set role=admin di tabel public.profiles
```

5. Jalankan:

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

## Struktur Folder

```
supabase/schema.sql          # skema database + RLS + seed
src/lib/                     # types, constants, actions, supabase clients
src/lib/actions.ts           # server actions (CRUD, transaksi, user)
src/components/              # UI komponen (shell, QR, form, dsb.)
src/app/(app)/               # halaman utama (dashboard, inventory, dll.)
src/app/login/               # halaman login
src/proxy.ts                 # proteksi rute & refresh session (middleware Next 16)
scripts/create-admin.mjs     # membuat admin awal
```

## Arsitektur

```
Smartphone/PC → Vercel (Next.js) → Supabase (PostgreSQL, Auth, Storage, RLS)
```

- **Reads** memakai Supabase client dengan session user (RLS aktif).
- **Writes / transaksi penting** dilakukan via Server Actions dengan service-role key
  di sisi server (tidak pernah dikirim ke browser).
- Nomor transaksi dibuat atomik di database via `generate_transaction_number()`.

## Deployment ke Vercel

1. Push repository ke GitHub.
2. Import project di Vercel (framework: Next.js).
3. Set environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_COMPANY_NAME`.
4. Deploy. Akses https://saumek.vercel.app.
