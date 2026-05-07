// Shared data layer. Uses Vercel /api/store when configured, with localStorage as fallback.
const DB_PREFIX = 'mbs_';

const DB = {
  data: {},
  remote: false,
  needsMigration: false,

  async init() {
    try {
      const res = await fetch('/api/store', { cache: 'no-store' });
      if (res.ok) {
        const payload = await res.json();
        if (payload && payload.configured) {
          const remoteData = payload.data || {};
          const localData = localPublicData();
          if (hasLocalData(localData) && !samePublicData(localData, remoteData)) {
            this.data = { ...remoteData, ...localData };
            this.needsMigration = true;
          } else {
            this.data = remoteData;
          }
          this.remote = true;
          this.cacheAll();
          return;
        }
      }
    } catch (e) {
      console.warn('Remote DB unavailable, using local fallback.', e);
    }

    this.remote = false;
    this.data = {
      products: readLocal('products', SEED_PRODUCTS),
      heroes: readLocal('heroes', SEED_HEROES),
      settings: readLocal('settings', SEED_SETTINGS),
      pwdHash: readLocal('pwdHash', await sha256('Admin@MaaBaba123'))
    };
    this.cacheAll();
  },

  get(key, fallback = null) {
    return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : fallback;
  },

  async set(key, value) {
    this.data[key] = value;
    writeLocal(key, value);

    if (!this.remote) {
      if (isHostedSite()) throw new Error('Shared storage is not configured.');
      return true;
    }

    const res = await fetch('/api/store', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action: 'save', key, value })
    });

    if (!res.ok) throw new Error(await responseMessage(res));
    return true;
  },

  async login(passwordHash) {
    if (!this.remote) {
      return passwordHash === this.get('pwdHash', '');
    }

    const res = await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', passwordHash })
    });

    if (!res.ok) return false;
    const payload = await res.json();
    if (payload.token) sessionStorage.setItem('mbs_token', payload.token);
    if (this.needsMigration) await this.migrateLocalData();
    return true;
  },

  async changePassword(oldHash, newHash) {
    if (!this.remote) {
      if (oldHash !== this.get('pwdHash', '')) return false;
      await this.set('pwdHash', newHash);
      return true;
    }

    const res = await fetch('/api/store', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action: 'changePassword', oldHash, newHash })
    });

    if (!res.ok) return false;
    this.data.pwdHash = newHash;
    writeLocal('pwdHash', newHash);
    return true;
  },

  cacheAll() {
    Object.keys(this.data).forEach(key => writeLocal(key, this.data[key]));
  },

  async migrateLocalData() {
    const keys = ['products', 'heroes', 'settings'];
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(this.data, key)) {
        await this.set(key, this.data[key]);
      }
    }
    this.needsMigration = false;
  },

  remove(key) {
    delete this.data[key];
    localStorage.removeItem(DB_PREFIX + key);
  }
};

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = sessionStorage.getItem('mbs_token');
  if (token) headers.Authorization = 'Bearer ' + token;
  return headers;
}

async function responseMessage(res) {
  try {
    const payload = await res.json();
    return payload.error || res.statusText;
  } catch (e) {
    return res.statusText;
  }
}

function readLocal(key, fallback = null) {
  try {
    const v = localStorage.getItem(DB_PREFIX + key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(DB_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Local cache write error', e);
  }
}

function isHostedSite() {
  const host = window.location.hostname;
  return host && host !== 'localhost' && host !== '127.0.0.1';
}

function localPublicData() {
  return {
    products: readLocal('products', null),
    heroes: readLocal('heroes', null),
    settings: readLocal('settings', null)
  };
}

function hasLocalData(data) {
  return Boolean(data.products || data.heroes || data.settings);
}

function samePublicData(a, b) {
  return JSON.stringify(a.products || []) === JSON.stringify(b.products || [])
    && JSON.stringify(a.heroes || []) === JSON.stringify(b.heroes || [])
    && JSON.stringify(a.settings || {}) === JSON.stringify(b.settings || {});
}

// Seed data
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

async function initDB() {
  await DB.init();
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2,'0')).join('');
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function discPct(orig, offer) {
  if (!offer || offer <= 0 || offer >= orig) return 0;
  return Math.round((orig - offer) / orig * 100);
}

function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

function gdImg(url) {
  if (!url) return '';
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? `https://drive.google.com/uc?export=view&id=${m[1]}` : url;
}

function waUrl(number, message) {
  const num = String(number || '').replace(/\D/g, '');
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}
