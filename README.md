# বেক আর্ট স্টাইল 🎂

হোমমেড কেক বিক্রির ওয়েব অ্যাপ — React + Vite + TypeScript + Supabase

## Quick Start

```bash
npm install
cp .env.example .env   # .env ফাইলে Supabase keys দিন
npm run dev
```

## Setup

### Supabase
1. [supabase.com](https://supabase.com) এ project তৈরি করুন
2. `supabase-schema.sql` চালান SQL Editor-এ
3. Project URL ও anon key `.env` ফাইলে দিন

### .env
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> **Supabase ছাড়াও চলবে** — localStorage fallback আছে।

## Deploy (Vercel)

1. GitHub-এ push করুন
2. [vercel.com](https://vercel.com) এ import করুন
3. Environment variables দিন
4. Auto deploy হবে প্রতিটি push-এ

### GitHub Secrets (CI/CD এর জন্য)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

## Admin Panel
Logo-তে ৫ বার tap করুন → PIN দিন (default: `1234`)

## Project Structure
```
src/
├── components/    ← UI components (Navbar, Hero, Menu, Cart, etc.)
├── pages/         ← HomePage, AdminPanel
├── hooks/         ← useProducts, useOrders, useAuth
├── lib/           ← supabase client, store (Zustand), utils, data
└── types/         ← TypeScript types
```
