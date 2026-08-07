# ☁️ DualCore Store Builder

A complete **store builder SaaS** — create a beautiful e-commerce storefront with a drag-and-drop visual builder, 30 themes, Shopify-like dashboard, and one-click publishing. Pure **HTML5 / CSS3 / ES6 modules** — no frameworks. Backend: **Supabase** (auth, Postgres + RLS, Storage). Hosting: **Vercel**.

---

## 🚀 Quick Start

### 1. Create scripts

| Script | Where |
|---|---|
| `index.html`, `pricing.html`, `features.html`, `about.html`, `contact.html` | Landing pages |
| `login.html`, `signup.html`, `forgot-password.html` | Auth pages |
| `dashboard.html`, `builder.html`, `templates.html` | App — manage store & build storefront |
| `products.html`, `orders.html`, `customers.html`, `analytics.html` | Store operations |
| `billing.html`, `settings.html`, `publish.html`, `domains.html` | Plan, settings & deployment |
| `store.html` | Live generated storefront viewer (by `?s=<slug>`) |

### 2. Configure Supabase (required for cloud mode)

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run in order:
   - `database/schema.sql`
   - `database/storage.sql`
   - `database/policies.sql`
3. Paste your credentials into **`assets/js/config.js`**:

```js
APP_CONFIG: {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-ANON-KEY",
  STORAGE_BUCKET: "storefronts"
}
```

4. Enable **Google** and **GitHub** OAuth (optional) under Authentication → Providers.

> **No keys? No problem.** The app detects it and runs in **demo mode** on `localStorage` — every feature works end-to-end with seeded data.

### 3. Run / Deploy

```bash
# Serve locally (any static server works)
npx serve .

# Deploy to Vercel
vercel --prod
```

`vercel.json` provides SPA rewrites + immutable caching for `/assets`.

---

## ✨ Features

- **Auth** — Email/password, Google & GitHub OAuth, password reset. `Auth.*` in `assets/js/auth.js`.
- **Dashboard** — Revenue/orders charts (SVG, custom), traffic donut, top products, activity, trial countdown.
- **Store Builder** — section library (hero, products, categories, testimonials, gallery, video, faq, newsletter, contact), drag to add/reorder, select-edit fields, duplicate/hide/delete, **undo/redo** (⌘/Ctrl+Z), device preview, theme picker, autosave.
- **30 Themes** — `assets/js/storefront.js` (`Storefront.THEMES`).
- **Products** — CRUD, variants (price/SKU/stock), featured/digital, categories, CSV export.
- **Orders & Customers** — status updates, printable invoices, CSV export, detail modals.
- **Analytics** — date-range reports, conversion funnel, export.
- **Billing** — Free trial (3 days) → Basic (Rs 300/mo) → Premium (Rs 1000/mo), upgrade/cancel, invoice list.
- **Publish** — serverless static-builds a multi-page storefront (index/products/collections/cart/checkout/blog/about/contact/privacy/legals) + `robots.txt` + `sitemap.xml`, uploads to Supabase Storage bucket `storefronts`, returns a live public URL (`storefronts/<uid>/<slug>/`).
- **Domains** — customer subdomain + custom-domain connection (plan-gated) with DNS instructions.

---

## 🧱 Architecture

```
DUALCORE STORE BUILDERS
├── *.html                 # 20 pages (landing, auth, dashboard, storefront)
├── assets/
│   ├── css/               # design system, dashboard, builder, pricing, animations, responsive
│   └── js/                # ES modules (config, utils, auth, components, charts, storefront, generator, publish, per-page scripts)
│       └── components/    # navbar
├── database/
│   ├── schema.sql         # full Postgres schema + triggers
│   ├── storage.sql        # storage buckets
│   └── policies.sql       # RLS + storage policies (owner-only)
└── vercel.json
```

**Key design decisions:**
- Every data write goes through `Utils.db` → teleports **automatically** between Supabase (cloud) and `localStorage` (demo). No feature is unusable offline.
- Storefronts are static files, generated client-side (`assets/js/generator.js`) — cheap on Supabase Storage edge, no server needed.
- RLS: every table namespaced by `user_id`; users only ever touch their own rows.

---

## 🗄️ Database Structure

- `profiles`, `stores`, `subscriptions`
- `products`, `categories`, `collections(_products)`, `customers`, `orders`, `reviews`
- `pages`, `posts`, `media`, `analytics`, `notifications`, `activity_logs`
- `cart`, `wishlist`, `discounts`, `shipping`, `taxes`, `payments`, `domains`, `settings`, `staff`, `emails`

Triggers: new-signup → auto `profiles` + `stores` row; store `slug` auto-uniquified (via `safe_slug`).

---

## 📄 License

Built as a **functional project**, dual-licensed — free to learn from, modify, and deploy.