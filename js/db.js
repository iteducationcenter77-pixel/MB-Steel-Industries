// ── db.js — localStorage-based database ──────────────────────
const DB = {
  set(key, value) {
    try { localStorage.setItem('mbs_' + key, JSON.stringify(value)); return true; }
    catch(e) { console.error('DB set error', e); return false; }
  },
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem('mbs_' + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch(e) { return fallback; }
  },
  remove(key) { localStorage.removeItem('mbs_' + key); }
};

// ── Seed data ─────────────────────────────────────────────────
const SEED_PRODUCTS = [
  { id:'p1', name:'Royal Wooden Bed Frame', cat:'wooden', color:'Mahogany', orig:35000, offer:28999, img:'', wa:'', desc:'Premium solid teak wood bed frame with fine polish finish and strong joints.' },
  { id:'p2', name:'Steel 3-Door Almirah', cat:'steel', color:'Silver Grey', orig:18000, offer:14500, img:'', wa:'', desc:'Heavy-duty steel almirah with anti-rust powder coating and secure locking system.' },
  { id:'p3', name:'Wooden Dining Table 6-Seater', cat:'wooden', color:'Walnut Brown', orig:22000, offer:17999, img:'', wa:'', desc:'Solid wood dining table with premium finish. Seats 6 comfortably.' },
  { id:'p4', name:'Steel Office Rack', cat:'steel', color:'Powder Black', orig:8500, offer:0, img:'', wa:'', desc:'Industrial-grade steel rack ideal for offices and warehouses.' },
  { id:'p5', name:'Wooden 4-Door Wardrobe', cat:'wooden', color:'Teak', orig:45000, offer:38000, img:'', wa:'', desc:'Spacious 4-door wardrobe with mirror, multiple shelves and hanging space.' },
  { id:'p6', name:'Steel 6-Compartment Locker', cat:'steel', color:'Cream White', orig:15000, offer:12500, img:'', wa:'', desc:'Secure steel locker perfect for offices, gyms and institutions.' }
];

const SEED_HEROES = [
  { id:'h1', url:'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&q=80', label:'Premium Furniture' },
  { id:'h2', url:'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1600&q=80', label:'Wooden Collection' },
  { id:'h3', url:'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=1600&q=80', label:'Modern Living' }
];

const SEED_SETTINGS = {
  storeName: 'Maa Baba Steel Industries',
  tagline: 'Premium Wooden & Steel Furniture',
  address: 'Near Police Station, Howly, Barpeta, Assam',
  defaultWa: '919999999999',
  phone: '+91 99999 99999',
  email: 'maababasteels@gmail.com'
};

// ── Initialize ────────────────────────────────────────────────
async function initDB() {
  if (!DB.get('products')) DB.set('products', SEED_PRODUCTS);
  if (!DB.get('heroes'))   DB.set('heroes',   SEED_HEROES);
  if (!DB.get('settings')) DB.set('settings', SEED_SETTINGS);
  if (!DB.get('pwdHash'))  DB.set('pwdHash', await sha256('Admin@MaaBaba123'));
}

// ── SHA-256 helper ────────────────────────────────────────────
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2,'0')).join('');
}

// ── Helpers ───────────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function discPct(orig, offer) {
  if (!offer || offer <= 0 || offer >= orig) return 0;
  return Math.round((orig - offer) / orig * 100);
}

function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

// Convert Google Drive share link → direct embed URL
function gdImg(url) {
  if (!url) return '';
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? `https://drive.google.com/uc?export=view&id=${m[1]}` : url;
}

function waUrl(number, message) {
  const num = number.replace(/\D/g, '');
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}
