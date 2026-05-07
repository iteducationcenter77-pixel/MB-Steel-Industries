const crypto = require('crypto');

const STORE_KEY = 'mbs:data';
const DEFAULT_PASSWORD_HASH = '418be4df9a0235015c20d106877d26facce8f509d3c0fda0b374824925083b943';

const seedData = {
  products: [
    { id:'p1', name:'Royal Wooden Bed Frame', cat:'wooden', color:'Mahogany', orig:35000, offer:28999, img:'', wa:'', desc:'Premium solid teak wood bed frame with fine polish finish and strong joints.' },
    { id:'p2', name:'Steel 3-Door Almirah', cat:'steel', color:'Silver Grey', orig:18000, offer:14500, img:'', wa:'', desc:'Heavy-duty steel almirah with anti-rust powder coating and secure locking system.' },
    { id:'p3', name:'Wooden Dining Table 6-Seater', cat:'wooden', color:'Walnut Brown', orig:22000, offer:17999, img:'', wa:'', desc:'Solid wood dining table with premium finish. Seats 6 comfortably.' },
    { id:'p4', name:'Steel Office Rack', cat:'steel', color:'Powder Black', orig:8500, offer:0, img:'', wa:'', desc:'Industrial-grade steel rack ideal for offices and warehouses.' },
    { id:'p5', name:'Wooden 4-Door Wardrobe', cat:'wooden', color:'Teak', orig:45000, offer:38000, img:'', wa:'', desc:'Spacious 4-door wardrobe with mirror, multiple shelves and hanging space.' },
    { id:'p6', name:'Steel 6-Compartment Locker', cat:'steel', color:'Cream White', orig:15000, offer:12500, img:'', wa:'', desc:'Secure steel locker perfect for offices, gyms and institutions.' }
  ],
  heroes: [
    { id:'h1', url:'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&q=80', label:'Premium Furniture' },
    { id:'h2', url:'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1600&q=80', label:'Wooden Collection' },
    { id:'h3', url:'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=1600&q=80', label:'Modern Living' }
  ],
  settings: {
    storeName: 'Maa Baba Steel Industries',
    tagline: 'Premium Wooden & Steel Furniture',
    address: 'Near Police Station, Howly, Barpeta, Assam',
    defaultWa: '919999999999',
    phone: '+91 99999 99999',
    email: 'maababasteels@gmail.com'
  },
  pwdHash: DEFAULT_PASSWORD_HASH
};

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (!redisConfigured()) {
    return send(res, 200, { configured: false, data: publicData(seedData) });
  }

  try {
    const { data, initialized } = await getStore();

    if (req.method === 'GET') {
      return send(res, 200, { configured: true, initialized, data: publicData(data) });
    }

    if (req.method !== 'POST') {
      return send(res, 405, { error: 'Method not allowed' });
    }

    const body = await readBody(req);

    if (body.action === 'login') {
      if (body.passwordHash !== data.pwdHash) {
        return send(res, 401, { error: 'Invalid password' });
      }
      return send(res, 200, { token: signToken() });
    }

    if (!verifyAuth(req)) {
      return send(res, 401, { error: 'Admin login required' });
    }

    if (body.action === 'save') {
      if (!['products', 'heroes', 'settings'].includes(body.key)) {
        return send(res, 400, { error: 'Invalid save key' });
      }
      data[body.key] = body.value;
      await setStore(data);
      return send(res, 200, { ok: true });
    }

    if (body.action === 'changePassword') {
      if (body.oldHash !== data.pwdHash) {
        return send(res, 401, { error: 'Current password is incorrect' });
      }
      if (!/^[a-f0-9]{64}$/i.test(body.newHash || '')) {
        return send(res, 400, { error: 'Invalid password hash' });
      }
      data.pwdHash = body.newHash;
      await setStore(data);
      return send(res, 200, { ok: true });
    }

    return send(res, 400, { error: 'Unknown action' });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: 'Server data error' });
  }
};

async function getStore() {
  const stored = await redisCommand(['GET', STORE_KEY]);
  if (!stored) {
    await setStore(seedData);
    return { data: { ...seedData }, initialized: false };
  }
  return { data: JSON.parse(stored), initialized: true };
}

async function setStore(data) {
  await redisCommand(['SET', STORE_KEY, JSON.stringify(data)]);
}

async function redisCommand(command) {
  const response = await fetch(redisUrl(), {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + redisToken(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });

  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error || response.statusText);
  }
  return payload.result;
}

function redisConfigured() {
  return Boolean(redisUrl() && redisToken());
}

function redisUrl() {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
}

function redisToken() {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
}

function publicData(data) {
  return {
    products: data.products || [],
    heroes: data.heroes || [],
    settings: data.settings || {}
  };
}

function signToken() {
  const payload = {
    exp: Date.now() + 1000 * 60 * 60 * 12,
    nonce: crypto.randomBytes(8).toString('hex')
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = hmac(body);
  return `${body}.${sig}`;
}

function verifyAuth(req) {
  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/i, '');
  const [body, sig] = token.split('.');
  if (!body || !sig || hmac(body) !== sig) return false;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload.exp > Date.now();
  } catch (e) {
    return false;
  }
}

function hmac(value) {
  return crypto.createHmac('sha256', tokenSecret()).update(value).digest('hex');
}

function tokenSecret() {
  return process.env.ADMIN_TOKEN_SECRET || redisToken() || 'mbs-local-secret';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function send(res, status, body) {
  res.statusCode = status;
  res.end(JSON.stringify(body));
}
