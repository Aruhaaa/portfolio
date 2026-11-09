# Putting this site on Vercel

This is the TypeScript version of the portfolio: Next.js + a Postgres database that Vercel creates for you (Neon).
No Docker, no separate database host.

## 1. Push the code

The repository has two folders: `laravel-app/` (the old PHP version, not used any more) and `next-app/` (this one).
Commit and push as usual.

## 2. Create the Vercel project

1. Vercel dashboard > **Add New > Project** > pick the repository.
2. **Root Directory: `next-app`** (click Edit next to it). Framework Preset shows **Next.js**; leave the rest alone.
3. Open **Environment Variables** and add the three below (before pressing Deploy):

| Name | Value |
| --- | --- |
| `ADMIN_EMAIL` | the email you will type to sign in |
| `ADMIN_PASSWORD_HASH_B64` | from the command below |
| `AUTH_SECRET` | from the command below |

Make the last two on your PC, inside the `next-app` folder:

```bash
npm run hash -- "your-admin-password"
```

It prints the `ADMIN_PASSWORD_HASH_B64=...` and `AUTH_SECRET=...` lines. Paste only the part after `=`, with no quotes.
Your password itself is never stored anywhere.

4. Press **Deploy**. (The first deploy builds fine, but the pages need the database from step 3 before they work.)

## 3. Add the database

1. In the project: **Storage** tab > **Create Database** > **Neon** (Postgres) > connect it to this project.
2. Pick a region next to your Vercel Functions region (the default is Washington, `iad1`, so choose US East). Same region means fast queries.
3. This adds `DATABASE_URL` automatically. Then go to **Deployments > the latest one > Redeploy**.

The tables are created by the site itself the first time it runs. There is nothing to migrate.

## 4. Fill in the content

Open the site, scroll to the footer, click **Admin sign in** and use the email and password from step 2.
Everything (personal info, skills, experience, projects, screenshots, hero projects) is edited from the dashboard.

### Optional: bring over what you already entered in Laragon

Start Laragon (MySQL running), then in the `next-app` folder:

```bash
php scripts/export-mysql.php export.json
```

Create `next-app/.env.local` containing `DATABASE_URL=` followed by the connection string from Vercel
(Storage > your database > **.env.local** tab), then:

```bash
npm run import -- export.json
```

This only works on an empty database, so it can never overwrite content you typed in the dashboard.
Delete `export.json` afterwards; it is your data and must not be committed.

## Running it on your PC

```bash
npm install
cp .env.example .env.local     # fill in the values; for plain http also add COOKIE_SECURE=false
npm run dev
```

## Good to know

- **First visit after a quiet period can take a second or two longer.** Neon's free database goes to sleep when idle and
  wakes on the next request. After that it is fast.
- **Screenshots** are stored in the database as WebP (shrunk to 1400 px wide). Up to 3 MB per upload.
- **Sign-in is limited**: 5 wrong passwords per email and address per minute, then a one-minute wait.
- **Forgot the password?** Run `npm run hash` again, replace `ADMIN_PASSWORD_HASH_B64` in Vercel, and redeploy.
