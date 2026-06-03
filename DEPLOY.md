# Deploying AC Collection to Vercel

You'll create **two Vercel projects from the same GitHub repo** + one **Vercel Postgres** database:

| Project | Root directory | What it is |
|---------|---------------|------------|
| Backend API | `backend` | Express, runs as a serverless function |
| Frontend site | `frontend` | React/Vite static site |

> The code is already prepared for this (serverless entry `backend/api/index.js`, `vercel.json`, cloud-DB support). You just do the dashboard clicks below.

---

## 0. Before you start
- Repo is pushed: https://github.com/trrayane/AC-COOLECTION
- Create a free Vercel account at https://vercel.com → **Continue with GitHub**.
- Have your **Cloudinary** keys ready (Cloud name, API key, API secret).

---

## 1. Create the database (Vercel Postgres)
1. Vercel dashboard → **Storage** → **Create Database** → **Postgres**.
2. Name it `ac-collection-db` → **Create**.
3. Leave it; we'll connect it to the backend in step 2.

---

## 2. Deploy the BACKEND
1. Dashboard → **Add New → Project** → **Import** `AC-COOLECTION`.
2. **Root Directory** → click *Edit* → choose **`backend`**.  ← important
3. Before deploying, open **Settings → Environment Variables** and add:
   - `JWT_SECRET` = a long random string (e.g. mash your keyboard)
   - `ADMIN_USERNAME` = `admin`
   - `ADMIN_PASSWORD` = a strong password of your choice
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` = your Cloudinary values
   - `CLIENT_URL` = `*` (we'll tighten it in step 5)
4. Connect the database: **Storage** → your `ac-collection-db` → **Connect Project** → pick this backend project. This auto-adds `POSTGRES_URL` / `DATABASE_URL`.
5. **Deploy**. Copy the backend URL, e.g. `https://ac-collection-api.vercel.app`.
6. Test it: open `https://<backend-url>/api/health` → you should see `{"ok":true,...}`.

---

## 3. Seed the cloud database (one time, from your PC)
The cloud DB starts empty. Point the seed scripts at it:

1. Vercel → your Postgres → **`.env.local`** tab → copy the **`POSTGRES_URL`** value (starts with `postgres://...sslmode=require`).
2. In a terminal inside the `backend/` folder (PowerShell):
   ```powershell
   $env:DATABASE_URL = "postgres://....paste-it...."
   npm run seed
   npm run seed:tee-photos
   ```
   This creates the tables, demo products/orders, the admin user, and uploads photos to Cloudinary.

---

## 4. Deploy the FRONTEND
1. Dashboard → **Add New → Project** → **Import** the **same** `AC-COOLECTION` repo again.
2. **Root Directory** → **`frontend`**. Framework: **Vite** (auto-detected).
3. **Environment Variables** → add:
   - `VITE_API_URL` = your backend URL from step 2 (e.g. `https://ac-collection-api.vercel.app`)
4. **Deploy**. Copy the site URL, e.g. `https://ac-collection.vercel.app`.

---

## 5. Link them (CORS)
1. Open the **backend** project → Settings → Environment Variables → set `CLIENT_URL` = your **frontend URL** → **Redeploy** the backend.
2. Open the frontend URL → the shop loads with products; configurator, checkout and admin all work.

Admin: profile icon (top-right) → log in with `admin` / your `ADMIN_PASSWORD`.

---

## Updating later
Just `git push` to `main` — both Vercel projects redeploy automatically.

## Troubleshooting
| Problem | Fix |
|--------|-----|
| Site loads but no products / "Could not reach the server" | `VITE_API_URL` wrong, or backend down. Check `/api/health`. |
| Backend 500 / DB errors | DB not connected (step 2.4) or not seeded (step 3). |
| Login fails | Make sure step 3 ran (creates the admin user) and use your `ADMIN_PASSWORD`. |
| Images don't upload | Cloudinary env vars missing on the backend project. |
