# Putting the portfolio online (Vercel + TiDB)

The site runs on **Vercel** (as a container, see `Dockerfile`, `Caddyfile`, `vercel.json`) and keeps all
its data in a **TiDB Cloud** database (MySQL compatible). The PHP code is unchanged. Screenshots are stored
in the database too, because Vercel's disk is not permanent.

## 1. Create the database (TiDB Cloud)

1. Create a **Starter** cluster in TiDB Cloud (pick the region closest to your visitors).
2. In its SQL editor run: `CREATE DATABASE portfolio;`
3. Open **Connect** and note the host, port (4000), user and password. Use a strong password.
   TiDB lets any address connect by default, which is what Vercel needs (its addresses change).

## 2. Fill the database from your PC (one time)

Windows has no built-in certificate list for MySQL, so download the TiDB certificate once:
`https://letsencrypt.org/certs/isrgrootx1.pem` (save it anywhere, for example `C:\certs\isrgrootx1.pem`).

In PowerShell, inside the `laravel-app` folder (these settings last only for this window, nothing is saved in `.env`):

```powershell
$env:DB_CONNECTION = "mysql"
$env:DB_HOST = "<host from TiDB>"
$env:DB_PORT = "4000"
$env:DB_DATABASE = "portfolio"
$env:DB_USERNAME = "<user from TiDB>"
$env:DB_PASSWORD = "<password from TiDB>"
$env:MYSQL_ATTR_SSL_CA = "C:\certs\isrgrootx1.pem"

php artisan migrate --force      # creates the tables
php artisan portfolio:admin      # asks for your email and a password (12+ characters)
```

Do **not** run `php artisan db:seed` against the real database. It now does nothing on purpose.

**Bring your current content across (optional).** Otherwise just type it into the admin page later.

```powershell
mysqldump -uroot --no-create-info --complete-insert --skip-triggers portfolio personal_info skills experiences projects project_images > portfolio-data.sql
mysql --host=<host> --port=4000 --user=<user> --password --ssl-ca=C:\certs\isrgrootx1.pem portfolio < portfolio-data.sql
```

(The `users` table is left out on purpose, so your new admin login stays.)

## 3. Deploy on Vercel

1. Push this repo to GitHub, then **Add New → Project** in Vercel and import it.
2. Set **Root Directory** to `laravel-app`. Vercel finds `vercel.json` there and builds the container.
3. Add these **Environment Variables** (get the key with `php artisan key:generate --show`):

| Name | Value |
| --- | --- |
| `APP_KEY` | `base64:...` from the command above |
| `DB_CONNECTION` | `mysql` |
| `DB_HOST` | host from TiDB |
| `DB_PORT` | `4000` |
| `DB_DATABASE` | `portfolio` |
| `DB_USERNAME` | user from TiDB |
| `DB_PASSWORD` | password from TiDB |

   The image already sets safe defaults for everything else: production mode, errors off, logs to
   Vercel's log page, cookie sessions, the TiDB certificate path.
4. Deploy. Open the site, use **Admin sign in** in the footer, and fill in your details.

## Try the container on your PC first (needs Docker Desktop running)

```powershell
docker build -t portfolio .
$key = (php artisan key:generate --show).Trim()
docker run -d --name portfolio-test -p 8080:80 -e APP_KEY=$key -e DB_CONNECTION=sqlite -e DB_DATABASE=/tmp/test.sqlite -e SESSION_SECURE_COOKIE=false portfolio
docker exec portfolio-test sh -c "touch /tmp/test.sqlite && php artisan migrate --force"
```

Then open http://localhost:8080 . The test database lives inside the container and disappears with it.
Stop and remove it with `docker rm -f portfolio-test` (and `docker rmi portfolio` to free about 1 GB).
`SESSION_SECURE_COOKIE=false` is only for this plain-http test; on Vercel (https) leave the default.

## Good to know

- Vercel's container runtime is in **beta**. The same `Dockerfile` also works on Render and similar hosts.
- Vercel's free **Hobby** plan is for personal, non-commercial use. A portfolio is usually fine; check Vercel's terms
  if you use the site to win paid work.
- Vercel stops an idle container after 5 minutes without visitors, so the first visit after a quiet period is slower
  while it starts up again.
- Every deploy stores a copy of the image (about 230 MB compressed). Vercel's Hobby plan keeps up to 50 images per
  repository, and image storage is billed at $0.10 per GB. Delete old images now and then.
- Screenshots: JPG, PNG or WebP up to 3 MB. They are scaled down to 1400 px wide and saved as WebP when possible.
- Five wrong passwords in a minute locks the login for that minute. Counts are kept in the database.
- If you ever change `APP_KEY`, everyone (you) gets signed out. Nothing else is lost.
- A blank 502 page usually means the web server did not start. Look at the deployment logs in Vercel.
