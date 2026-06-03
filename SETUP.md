# AC Collection — Setup Guide

A bilingual (English / Arabic) e-commerce store for custom-printed clothing, built for
Algeria (DZD prices, 58 wilayas, **Cash on Delivery**).

- **Frontend:** React + Vite
- **Backend:** Node.js + Express + Sequelize
- **Database:** PostgreSQL
- **Images:** local folder by default, or Cloudinary (free) when you add keys

```
AC-COOLECTION/
├── backend/     ← API (Node/Express/Sequelize)
└── frontend/    ← website (React/Vite)
```

---

## 1. Prerequisites

- **Node.js 18+** — check with `node --version`
- **PostgreSQL 14+** — must be installed and running

---

## 2. Database (one-time)

Create the database and (if needed) a user. Open **psql** (or pgAdmin) as the
`postgres` superuser and run:

```sql
-- create a login user for the app (skip if you'll use the postgres user)
CREATE USER rayane WITH PASSWORD 'admin123';

-- create the database owned by that user
CREATE DATABASE ac_collection OWNER rayane;
```

> On Windows, open **SQL Shell (psql)** from the Start menu, or run:
> `psql -U postgres` and paste the two commands above.

Then tell the backend how to connect — edit **`backend/.env`** so these match what you created:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ac_collection
DB_USER=rayane
DB_PASSWORD=admin123
```

---

## 3. Backend

```bash
cd backend
npm install
npm run seed         # creates tables + demo products (one per colour) + demo orders + admin login
npm run seed:photos  # attaches real apparel photos to every product (uploads to Cloudinary if configured)
npm run dev          # starts the API on http://localhost:4000
```

> Note: each colour is its own product (e.g. "Essential Cotton Tee — Cream", "… — Black"),
> so you can give every colour its own photo via **Admin → Products**.
> If you re-run `npm run seed` (full reset), run `npm run seed:photos` again after it.

`npm run seed` prints the admin login it created (default **admin / admin123** — change
`ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env` before seeding to use your own).

> ⚠️ `npm run seed` **resets** the tables. Run it once at the start; afterwards just `npm run dev`.

---

## 4. Frontend

In a **second terminal**:

```bash
cd frontend
npm install
npm run dev      # starts the site on http://localhost:5173
```

Open **http://localhost:5173**. The admin dashboard is the **person icon** in the header
(or go to it and sign in with the admin login from step 3).

---

## 5. Images — using Cloudinary later (optional)

By default, uploaded designs and product photos are saved in `backend/uploads/`. That
works on one machine. To make images load fast everywhere and never get lost, switch to
**Cloudinary** (free tier, no credit card):

1. Create a free account at https://cloudinary.com
2. From your dashboard, copy **Cloud name**, **API Key**, **API Secret**
3. Paste them into `backend/.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-key
   CLOUDINARY_API_SECRET=your-secret
   ```
4. Restart the backend (`npm run dev`). Nothing else to change — new uploads go to Cloudinary.

---

## 6. Going live (later)

- **Frontend:** `cd frontend && npm run build` → deploy the `dist/` folder (Vercel, Netlify…).
  Set `VITE_API_URL` to your deployed backend URL.
- **Backend:** deploy to any Node host (Railway, Render, a VPS…). Set the same `.env`
  variables there, point `DB_*` at a managed PostgreSQL, set `CLIENT_URL` to your site URL,
  and use a long random `JWT_SECRET`.

---

## Common issues

| Problem | Fix |
|--------|-----|
| `password authentication failed` | `DB_USER` / `DB_PASSWORD` in `backend/.env` don't match your PostgreSQL user. |
| `database "ac_collection" does not exist` | Run the `CREATE DATABASE` command in step 2. |
| Site loads but no products / "Could not reach the server" | The backend isn't running, or `VITE_API_URL` is wrong. Start the backend (step 3). |
| Admin login fails | Run `npm run seed`, then use the printed username/password. |
