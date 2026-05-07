// ── main.js — Shop Frontend ───────────────────────────────────

let products = [];
let heroes   = [];
let settings = {};
let heroIdx  = 0;
let heroTimer = null;
let currentCat = 'all';

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await initDB();
  products = DB.get('products', []);
  heroes   = DB.get('heroes',   []);
  settings = DB.get('settings', {});

  applySettings();
  initHero();
  renderProducts();

  // Sticky nav
  window.addEventListener('scroll', () => {
    document.querySelector('.navbar').classList.toggle('scrolled', window.scrollY > 60);
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCat = btn.dataset.cat;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts();
    });
  });

  // Admin button in footer
  document.getElementById('adminBtn').addEventListener('click', () => {
    window.location.href = 'admin/login.html';
  });

  // Wholesale WA button
  const waBtn = document.getElementById('wholesaleWa');
  if (waBtn) waBtn.href = waUrl(settings.defaultWa, "Hello! I'm interested in a wholesale/bulk order enquiry.");
});

// ── Apply settings to DOM ─────────────────────────────────────
function applySettings() {
  document.title = settings.storeName + ' — Premium Furniture';
  setTxt('storeName1', settings.storeName);
  setTxt('storeName2', settings.storeName);
  setTxt('storeName3', settings.storeName);
  setTxt('tagline1', settings.tagline);
  setTxt('address1', settings.address);
  setTxt('phone1', settings.phone);
  setTxt('email1', settings.email);
  const tel = document.getElementById('telLink');
  if (tel) tel.href = 'tel:' + settings.phone;
  const mailLink = document.getElementById('mailLink');
  if (mailLink) mailLink.href = 'mailto:' + settings.email;
  const navWa = document.getElementById('navWa');
  if (navWa) navWa.href = 'https://wa.me/' + settings.defaultWa;
}
function setTxt(id, val) { const el = document.getElementById(id); if (el) el.textContent = val || ''; }

// ── Hero Slider ───────────────────────────────────────────────
function initHero() {
  const container = document.getElementById('heroSlides');
  const dotsWrap  = document.getElementById('heroDots');
  if (!container || !dotsWrap || !heroes.length) return;

  container.innerHTML = '';
  dotsWrap.innerHTML  = '';

  heroes.forEach((h, i) => {
    const slide = document.createElement('div');
    slide.className = 'hero-slide' + (i === 0 ? ' active' : '');
    slide.style.backgroundImage = `url(${gdImg(h.url)})`;
    container.appendChild(slide);

    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goSlide(i));
    dotsWrap.appendChild(dot);
  });

  if (heroes.length > 1) {
    heroTimer = setInterval(() => goSlide((heroIdx + 1) % heroes.length), 5000);
  }
}

function goSlide(idx) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.dot');
  slides[heroIdx].classList.remove('active');
  dots[heroIdx].classList.remove('active');
  heroIdx = idx;
  slides[heroIdx].classList.add('active');
  dots[heroIdx].classList.add('active');
}

// ── Product Rendering ─────────────────────────────────────────
function renderProducts() {
  const grid = document.getElementById('productGrid');
  const countEl = document.getElementById('productCount');
  if (!grid) return;

  const filtered = currentCat === 'all'
    ? products
    : products.filter(p => p.cat === currentCat);

  if (countEl) countEl.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

  if (!filtered.length) {
    grid.innerHTML = `<div class="no-products" style="grid-column:1/-1"><div class="np-icon">🪑</div><p>No products in this category yet.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => productCard(p)).join('');
}

function productCard(p) {
  const disc  = discPct(p.orig, p.offer);
  const price = (p.offer && p.offer < p.orig) ? p.offer : p.orig;
  const imgSrc = p.img ? gdImg(p.img) : '';

  const imgHTML = imgSrc
    ? `<img src="${esc(imgSrc)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none'">`
    : `<div class="product-placeholder">
         <span class="picon">${p.cat === 'wooden' ? '🪵' : '🔩'}</span>
         <span class="plabel" style="color:${p.cat === 'wooden' ? '#a07848' : '#5070a0'}">No Image</span>
       </div>`;

  const priceHTML = (p.offer && p.offer < p.orig)
    ? `<span class="price-offer">${inr(p.offer)}</span><span class="price-orig">${inr(p.orig)}</span>`
    : `<span class="price-offer">${inr(p.orig)}</span>`;

  const wa  = (p.wa || settings.defaultWa).replace(/\D/g,'');
  const msg = `Hello! 👋\n\nI'm interested in purchasing:\n*${p.name}*\nColor: ${p.color}\nPrice: ${inr(price)}\n\nPlease share availability and details. Thank you!`;

  return `
  <div class="product-card">
    <div class="product-img-wrap" style="background:${p.cat==='wooden'?'linear-gradient(135deg,#e8dcc8,#d4b890)':'linear-gradient(135deg,#d0dce8,#b0c4d8)'}">
      ${imgHTML}
      <span class="badge-cat ${p.cat}">${p.cat === 'wooden' ? 'Wooden' : 'Steel'}</span>
      ${disc > 0 ? `<span class="badge-disc">${disc}% OFF</span>` : ''}
    </div>
    <div class="product-body">
      <div class="product-color">Color: <strong>${esc(p.color)}</strong></div>
      <h3 class="product-name">${esc(p.name)}</h3>
      ${p.desc ? `<p class="product-desc">${esc(p.desc)}</p>` : ''}
      <div class="product-price-row">
        <div>${priceHTML}</div>
        <div class="price-note">Wholesale &amp; Retail available</div>
      </div>
      <button class="btn-order" onclick="orderWa('${wa}','${encodeURIComponent(msg)}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Order on WhatsApp
      </button>
    </div>
  </div>`;
}

function orderWa(num, encodedMsg) {
  window.open(`https://wa.me/${num}?text=${encodedMsg}`, '_blank');
}

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
