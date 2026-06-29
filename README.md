# nomore2percent — Next.js Rebuild

A full-stack rebuild of the nomore2percent real estate marketplace using **Next.js, Supabase (PostgreSQL), and Pusher** for real-time chat — deployed on **Vercel**.

---

## What this replaces

| Old (PHP/GoDaddy) | New (this project) |
|---|---|
| `marketplace.html` (static, hardcoded data) | Next.js pages, fetch live data |
| `submit-lead.php` | `/api/leads` route |
| `get-properties.php` | `/api/properties` route |
| `add-property.php` | `/admin/properties/new` page + `/api/properties` POST |
| `admin.php` + `login.php` | `/admin` + `/admin/login` pages |
| MySQL on GoDaddy | PostgreSQL on Supabase |
| WhatsApp-only contact | WhatsApp **+** real-time on-site live chat (new!) |

The **live chat** is the main reason for this rebuild — PHP on shared hosting can't hold real-time connections. This stack uses Pusher (WebSockets-as-a-service) so visitor messages appear instantly for Sumanth, and his replies appear instantly for the visitor — no refreshing, no polling.

---

## STEP 1 — Create a Supabase project (free)

1. Go to **supabase.com** → Sign up → **New Project**
2. Name it `nomore2percent`, choose a region close to India (Singapore is closest)
3. Set a database password and save it somewhere safe
4. Wait ~2 minutes for the project to provision

### Run the database schema
1. In your Supabase project, go to **SQL Editor** → **New Query**
2. Open `supabase-schema.sql` from this project, copy everything
3. Paste into the SQL editor → click **Run**
4. This creates all tables (`leads`, `properties`, `property_images`, `chat_conversations`, `chat_messages`) plus one sample property

### Get your API keys
1. Go to **Settings → API** in Supabase
2. Copy these three values — you'll need them in Step 4:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click "Reveal") → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

---

## STEP 2 — Create a Pusher app (free)

1. Go to **pusher.com** → Sign up → **Channels** product → **Create app**
2. Name it `nomore2percent`, choose a cluster close to India (`ap2` = Mumbai)
3. Go to **App Keys** tab — copy all 4 values:
   - `app_id` → `PUSHER_APP_ID`
   - `key` → `NEXT_PUBLIC_PUSHER_KEY`
   - `secret` → `PUSHER_SECRET`
   - `cluster` → `NEXT_PUBLIC_PUSHER_CLUSTER` (e.g. `ap2`)

---

## STEP 3 — Push this code to GitHub

1. Create a new repository on **github.com** (e.g. `nomore2percent-app`)
2. In this project folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/nomore2percent-app.git
   git push -u origin main
   ```

---

## STEP 4 — Deploy to Vercel (free)

1. Go to **vercel.com** → Sign up with GitHub → **Add New Project**
2. Import the `nomore2percent-app` repository
3. Before clicking Deploy, expand **Environment Variables** and add all of these (from Steps 1 & 2):

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   PUSHER_APP_ID=...
   NEXT_PUBLIC_PUSHER_KEY=...
   PUSHER_SECRET=...
   NEXT_PUBLIC_PUSHER_CLUSTER=ap2
   NEXT_PUBLIC_WHATSAPP_NUMBER=917013224895
   ADMIN_USERNAME=sumanth
   ADMIN_PASSWORD=choose-a-strong-password-here
   ```

4. Click **Deploy** — takes about 60-90 seconds
5. You'll get a live URL like `nomore2percent-app.vercel.app`

### Connect your real domain (optional)
In Vercel → your project → **Settings → Domains** → add your domain (e.g. `nomore2percent.in`) and follow the DNS instructions shown (usually just adding a CNAME record at GoDaddy).

---

## STEP 5 — Test it

1. Visit your Vercel URL → you should see the homepage with the sample property
2. Visit `/admin/login` → log in with the username/password you set in env vars
3. Add a real property via **+ Add Property**
4. Open the site in two browser tabs (or your phone + laptop):
   - Tab A: the homepage — click the chat bubble, send a message
   - Tab B: `/admin` → **Live Chat** tab — the message should appear within 1 second, no refresh

---

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```
Visit `http://localhost:3000`

---

## Project structure

```
src/
  app/
    page.tsx                    → Homepage
    properties/page.tsx         → Listings with filters
    properties/[id]/page.tsx    → Property detail
    admin/page.tsx              → Admin dashboard (leads, properties, live chat)
    admin/login/page.tsx        → Admin login
    admin/properties/new/       → Add property form
    api/
      leads/                    → Lead capture + admin list/update/delete
      properties/               → Public listing fetch + admin create/edit/delete
      chat/                     → Conversations, messages, send (+ Pusher broadcast)
      admin/login/               → Session cookie auth
  components/
    Header.tsx                  → Site navigation
    PropertyCard.tsx             → Reusable listing card
    LiveChatWidget.tsx           → Floating real-time chat bubble
  lib/
    supabase.ts                  → Browser client (respects RLS)
    supabase-admin.ts            → Server-only client (bypasses RLS, for API routes)
    pusher-server.ts             → Server-only, broadcasts events
    pusher-client.ts             → Browser-only, subscribes to events
  proxy.ts                       → Protects /admin routes (Next.js 16's renamed middleware)
```

---

## What's NOT migrated yet from the old PHP site

These existed in `marketplace.html` as client-side-only features and were intentionally left out of this first rebuild to keep it focused on the core real-time chat goal. They can be added incrementally:

- Market Research screen (price trends, area comparisons)
- Loan Eligibility Calculator
- Investor Portfolio Tracker
- Commercial Leasing Marketplace
- AI Advisory chat assistant
- Wishlist / Compare properties
- Blog page (`nomore2percent-blog.html` can stay as-is on GoDaddy, or be migrated too)

Ask Claude to port any of these into this Next.js project when you're ready — the patterns (API route + React page) are now established, so each one is a contained addition.
