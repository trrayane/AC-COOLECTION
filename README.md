# AC Collection

A bilingual (English / Arabic, full RTL) **e-commerce store for custom-printed clothing**, built for the Algerian market — prices in DZD, 58 wilayas, **Cash on Delivery**. Minimal black & white design.

## Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express + Sequelize
- **Database:** PostgreSQL
- **Images:** local folder by default, or Cloudinary (free) when keys are set

```
AC-COOLECTION/
├── backend/    # API (Node/Express/Sequelize/PostgreSQL)
└── frontend/   # website (React/Vite)
```

## Features

- 🛍️ Storefront: home, catalog (filters, search, dynamic colour filter), product detail
- 🎨 **Customization studio**: upload a design, place it front/back, resize/rotate, layers panel, center-snap guides, live **Preview**
- 🧾 Cash-on-Delivery checkout (wilaya/commune, auto delivery fees, order confirmation)
- 🛠️ Admin dashboard: secure login (brute-force protected), overview, orders (with the customer's design + note per side), product CRUD with free colour picker + front/back photo upload, inventory
- 🌍 Bilingual EN/AR with RTL, mobile-first responsive

## Quick start

See **[SETUP.md](SETUP.md)** for full instructions. In short:

```bash
# Database: create a PostgreSQL database "ac_collection" (see SETUP.md)

# Backend
cd backend && npm install
npm run seed          # demo products + orders + admin user
npm run seed:photos   # attach product photos
npm run dev           # http://localhost:4000

# Frontend (second terminal)
cd frontend && npm install
npm run dev           # http://localhost:5173
```

Admin: the profile icon in the header → default login `admin` / `admin123` (change before going live).

> ⚠️ Real secrets live in `backend/.env` (git-ignored). Copy `backend/.env.example` to `backend/.env` and fill it in.
