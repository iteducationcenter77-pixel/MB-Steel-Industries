# Maa Baba Steel Industries Website

Static WhatsApp redirect ecommerce website for Maa Baba Steel Industries.

## Deploy

This project is ready for static hosting.

- Entry file: `index.html`
- Main styles: `css/style.css`
- Main scripts: `js/db.js`, `js/main.js`
- Admin panel: `admin/login.html`
- Shared data API: `api/store.js`

## Shared Product And Settings Data

The admin panel now saves products, hero slides, contact details, and settings through `/api/store`.

For Vercel, connect an Upstash Redis storage/database to the project:

1. Open the Vercel project dashboard.
2. Go to **Storage** or **Marketplace**.
3. Add **Upstash for Redis** to this project.
4. Redeploy the project after the environment variables are added.

The API reads either of these Vercel/Upstash environment variable pairs:

- `KV_REST_API_URL` and `KV_REST_API_TOKEN`
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

Optional but recommended: add an environment variable named `ADMIN_TOKEN_SECRET` with any long random value, then redeploy.

Without Redis environment variables, the website falls back to browser localStorage, so changes will still be device-only.

## GitHub Pages

1. Open the repository settings on GitHub.
2. Go to **Pages**.
3. Set source to **Deploy from a branch**.
4. Choose branch `main` and folder `/root`.
5. Save.

The site should publish from the root `index.html`.

## Admin

Open `admin/login.html` or use the Admin link in the footer.

Change the default admin password after first login.
