# NovaCart — Advanced E-Commerce Website

A complete, production-ready full-stack e-commerce platform built with **Next.js 14 (App Router)**, **Prisma**, and **SQLite**. It includes a customer storefront, an admin panel, authentication, orders, coupons, reviews, inventory, and multiple payment gateways (Razorpay, Stripe, Cash on Delivery, and a built-in TEST mode).

## Features

- **Customer storefront** — product catalog, category tree, search, filters, sort, wishlist, reviews, cart, checkout, order tracking, account dashboard, and more.
- **Admin panel** at `/admin` — dashboard with stats & sales chart, product/category/brand CRUD, order management, customers, coupons, review moderation, inventory, messages, and store settings.
- **Authentication** — register, login, JWT (httpOnly cookie), password reset via email, avatar upload.
- **Payments** — Razorpay, Stripe (Payment Element modal), Cash on Delivery, and TEST mode (always succeeds instantly). Payment gateway availability is served from `/api/payments/config` based on configured keys.
- **SEO** — per-page metadata, sitemap, robots.txt.
- **Responsive** UI built with Tailwind CSS and lucide-react icons.

## Tech Stack

| Area        | Technology                                    |
| ----------- | --------------------------------------------- |
| Framework   | Next.js 14 (App Router, React 18, TypeScript) |
| Database    | Prisma + SQLite (zero-setup; Postgres-ready)  |
| Auth        | bcryptjs + jose (JWT in httpOnly cookie)      |
| Validation  | zod                                            |
| Payments    | razorpay, @stripe/stripe-js, @stripe/react-stripe-js |
| Email       | nodemailer (optional SMTP; logs when unset)   |
| UI          | Tailwind CSS, lucide-react                    |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values (see [Environment Variables](#environment-variables) below). The defaults already work for a local run with the built-in TEST payment mode.

### 3. Set up the database

```bash
# Create the SQLite database and apply the schema
npx prisma db push

# Seed the database with demo data (23 products, categories, brands, coupons, admin account, etc.)
npm run seed
```

> The seed is idempotent — you can run it again safely.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

For a production-style run:

```bash
npm run build
npm start
```

## Demo Accounts (seeded)

| Role     | Email               | Password    |
| -------- | ------------------- | ----------- |
| Admin    | `admin@novacart.in` | `Admin@123` |
| Customer | `customer@example.com` | `Customer@123` |

## Environment Variables

All variables are documented in `.env.example`. Key ones:

| Variable | Description |
| -------- | ----------- |
| `DATABASE_URL` | Prisma connection string. Defaults to the local SQLite file. |
| `JWT_SECRET` | Secret used to sign auth tokens. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d`. |
| `NEXT_PUBLIC_APP_URL` | Public base URL of the app (used in emails and redirects). |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Razorpay sandbox keys. Leave empty to hide Razorpay from checkout. |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe test keys. Leave empty to hide Stripe from checkout. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | Optional SMTP. Without it, emails are written to the server log. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Optional Cloudinary uploads; otherwise uploads go to `/public/uploads`. |

## Scripts

| Script              | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the dev server with hot reload.        |
| `npm run build`     | Production build (lint + type-safe compile). |
| `npm start`         | Run the production build.                    |
| `npm run lint`      | Run ESLint.                                  |
| `npm run seed`      | Seed/reset demo data (idempotent).           |

## Payments

- **TEST** — always available; clicking place order instantly marks the order `PAID`. Great for trying the full flow.
- **Cash on Delivery (COD)** — creates the order as `PENDING`.
- **Razorpay** — opens the Razorpay checkout; server verifies the payment signature before marking the order paid.
- **Stripe** — opens a Stripe Payment Element modal (uses `STRIPE_PUBLISHABLE_KEY` on the client); the server confirms the PaymentIntent and marks the order paid.

The checkout page only shows a gateway if it is configured. All totals are recomputed server-side at checkout and stock is validated transactionally.

## Project Structure

```
app/
  (shop)/          Customer pages: home, shop, category, product, search,
                   offers, cart, checkout (+ success), auth, account/*, static pages
  admin/           Admin panel: dashboard, products, categories, brands,
                   orders, customers, coupons, reviews, inventory, messages, settings
  api/             REST API (auth, products, cart, checkout, payments, account, admin/*)
components/
  product/         ProductCard, ProductGrid, BuyBox, Gallery, Reviews
  shop/            Filters, SortSelect, Pagination
  account/         AddressFormModal and other account UI
  payment/         StripePaymentModal
  admin/           Admin UI (ProductForm, ui primitives)
lib/               Core logic: prisma, auth, jwt, api helpers, validations,
                   pricing, payments, settings, store queries, mail
prisma/            Schema + seed
middleware.ts      Protects /admin routes via JWT role check
```

## Architecture Notes

- Money is stored as **integer paise** (e.g. `299900` = ₹2,999.00) to avoid float rounding errors.
- All money amounts are the final, canonical prices used for cart, coupons, shipping, taxes and order totals.
- Order/payment statuses are plain strings (no DB enums), keeping the schema portable across SQLite, PostgreSQL, and MySQL.
- Admin-created products appear immediately on the customer site; inactive products are hidden from public listing and product pages.
- Checkout recomputes every price from the database, validates stock inside a transaction, and clears the cart only after success.