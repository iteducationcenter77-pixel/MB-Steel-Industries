# Maa Baba Steel Industries — Website

## 📁 Folder Structure

```
MaaBabaSteel/
├── index.html          ← Main website (open this in browser)
├── css/
│   ├── style.css       ← Shop frontend styles
│   └── admin.css       ← Admin panel styles
├── js/
│   ├── db.js           ← Database helpers & seed data
│   ├── main.js         ← Shop frontend logic
│   └── admin.js        ← Admin panel logic
└── admin/
    ├── login.html      ← Admin login page
    └── panel.html      ← Admin panel dashboard
```

## 🚀 How to Open

1. Extract the ZIP file
2. Double-click **index.html** to open the website in your browser
3. That's it! No server needed — works fully offline.

---

## 🔐 Admin Panel

- Go to the website footer → click **"Admin"** button, OR
- Open `admin/login.html` directly in your browser

**Default Password:** `Admin@MaaBaba123`

> ⚠️ Change this password immediately after first login!
> Go to Admin → Settings → Change Admin Password

---

## 📦 How to Add Products (Admin)

1. Login to admin panel
2. Click **"📦 Products"** tab
3. Click **"＋ Add Product"**
4. Fill in:
   - Product Name
   - Category (Wooden / Steel)
   - Color / Finish
   - Original Price (₹)
   - Offer Price (₹) — leave 0 for no discount (% calculated automatically)
   - WhatsApp Number for this product (leave blank to use default)
   - Image URL (Google Drive link — see below)
   - Description
5. Click **"Add Product"**

---

## 🖼️ Hero Slides (Admin)

1. Login → click **"🖼️ Hero Slides"** tab
2. Paste a Google Drive image link
3. Click **"Add Slide"**
4. Images rotate every 5 seconds on the homepage

---

## 📸 Google Drive Images — Step by Step

1. Upload your image to **Google Drive**
2. Right-click the image → **Share**
3. Change to **"Anyone with the link"** → **Copy link**
4. The link looks like: `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
5. Paste it into any Image URL field — it is **automatically converted** ✓

---

## ⚙️ Settings (Admin)

From Admin → Settings tab you can update:
- Store name, tagline, address
- Phone & email
- Default WhatsApp number (used when a product has no specific number)
- Admin password

---

## 📱 WhatsApp Orders

When a customer clicks "Order on WhatsApp":
- It opens WhatsApp with a **pre-written message** containing product name, color, and price
- Goes to the **product-specific WhatsApp number** (set per product in admin)
- If no product number is set, uses the **default WhatsApp number** from Settings

---

## 🔒 Security Notes

- Admin password is stored as **SHA-256 hash** — never in plain text
- Admin session expires when the browser tab is closed
- The admin panel has `noindex, nofollow` so search engines won't index it
- All data is stored in your browser's localStorage

---

## 💡 To publish online

Upload the entire `MaaBabaSteel` folder to any web hosting service:
- **Free options:** Netlify, GitHub Pages, Vercel
- **Paid options:** Any shared hosting (GoDaddy, Hostinger, etc.)

Just upload all files keeping the same folder structure and open your domain!
