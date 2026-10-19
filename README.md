# Rudra FC — Football Attendance App

A mobile-first attendance and fee-tracking app for a football club, built with
**React + Vite**, backed by **Supabase**, and deployable to **Vercel** via **GitHub**.

## Features

- 📘 **Attendance calendar** — monthly view with present/total counts per day
- ✅ **Edit attendance** — per-player Present/Absent toggle, bulk "All Present / All Absent", search
- 💬 **Remarks** — add notes per player per session
- ₹ **Money tracking** — record fees per player per day, monthly totals on a money calendar
- 👥 **Players** — add, edit, and remove players (name, gender, reg no, photo)
- 📊 **Reports** — per-player attendance percentage, sessions, average attendance, money collected

> The app runs in **demo mode** using your browser's local storage when Supabase
> keys are not set, so you can try it immediately. Add Supabase keys to sync to the cloud.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the dashboard, open **SQL Editor** and run the contents of
   [`supabase/schema.sql`](supabase/schema.sql). This creates the `players`,
   `attendance`, and `fees` tables.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
4. Create a `.env` file in the project root (copy from `.env.example`):

   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

5. Restart `npm run dev`. The app now reads and writes to Supabase.

> **Security note:** the included RLS policies allow public access with the anon
> key so the app works without login. For production, add Supabase Auth and
> tighten the policies in `schema.sql` to authenticated users.

## 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Rudra FC attendance app"
git branch -M main
git remote add origin https://github.com/<your-username>/rudra-fc.git
git push -u origin main
```

## 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and **Add New → Project**.
2. Import your `rudra-fc` GitHub repository.
3. Vercel auto-detects Vite. Framework preset: **Vite**, build command `npm run build`, output `dist`.
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**. Every push to `main` will redeploy automatically.

## Project structure

```
src/
  components/      Header, BottomNav
  lib/             supabase client, data layer (db.js), date helpers
  pages/           Dashboard, AttendanceCalendar, EditAttendance,
                   MoneyCalendar, Players, Reports
  styles.css       All styling (purple theme, calendar, cards)
supabase/
  schema.sql       Database tables + RLS policies
```

## Database schema

| Table        | Columns |
|--------------|---------|
| `players`    | id, name, gender, reg_no, photo_url, created_at |
| `attendance` | id, player_id, date, status (present/absent), remarks |
| `fees`       | id, player_id, date, amount |
