// ── admin.js — Admin Panel Logic ──────────────────────────────

let products = [];
let heroes   = [];
let settings = {};
let editingId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initDB();
  products = DB.get('products', []);
  heroes   = DB.get('heroes',   []);
  settings = DB.get('settings', {});

  const page = document.body.dataset.page;

  if (page === 'login') {
    initLogin();
  } else if (page === 'admin') {
    if (!sessionStorage.getItem('mbs_auth')) {
      window.location.href = 'login.html'; return;
    }
    initAdmin();
  }
});

// ── LOGIN ─────────────────────────────────────────────────────
function initLogin() {
  const form    = document.getElementById('loginForm');
  const pwdInput = document.getElementById('pwdInput');
  const errEl   = document.getElementById('loginErr');
  const toggleBtn = document.getElementById('togglePwd');

  toggleBtn.addEventListener('click', () => {
    pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
    toggleBtn.textContent = pwdInput.type === 'password' ? '👁️' : '🙈';
  });

  document.getElementById('loginBtn').addEventListener('click', doLogin);
  pwdInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  async function doLogin() {
    const pwd = pwdInput.value.trim();
    if (!pwd) return;
    const btn = document.getElementById('loginBtn');
    btn.textContent = 'Verifying...'; btn.disabled = true;
    const h = await sha256(pwd);
    const ok = await DB.login(h);
    if (ok) {
      sessionStorage.setItem('mbs_auth', '1');
      window.location.href = 'panel.html';
    } else {
      errEl.textContent = '⚠️ Incorrect password. Please try again.';
      btn.textContent = 'Login →'; btn.disabled = false;
      pwdInput.value = '';
    }
  }
}

// ── ADMIN PANEL ───────────────────────────────────────────────
function initAdmin() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('mbs_auth');
    window.location.href = 'login.html';
  });

  // Tabs
  document.querySelectorAll('.atab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.atab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(x => x.style.display = 'none');
      t.classList.add('active');
      document.getElementById('pane-' + t.dataset.tab).style.display = 'block';
    });
  });

  renderProductTab();
  renderHeroTab();
  renderSettingsTab();
}

// ══ PRODUCTS TAB ══════════════════════════════════════════════
function renderProductTab() {
  const pane = document.getElementById('pane-products');

  pane.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div>
        <h2 class="adm-section-title">Products</h2>
        <p class="adm-section-sub" id="prodCount"></p>
      </div>
      <button class="btn-primary" id="addProdBtn">＋ Add Product</button>
    </div>
    <div id="addProdForm" style="display:none"></div>
    <div id="prodList"></div>`;

  updateProdCount();

  document.getElementById('addProdBtn').addEventListener('click', () => {
    const wrap = document.getElementById('addProdForm');
    if (wrap.style.display === 'none') {
      wrap.style.display = 'block';
      wrap.innerHTML = buildProdForm(null, 'addProdBtn', null);
      bindProdForm(wrap, null);
    } else {
      wrap.style.display = 'none';
    }
  });

  renderProdList();
}

function updateProdCount() {
  const el = document.getElementById('prodCount');
  if (el) el.textContent = `${products.length} product${products.length !== 1 ? 's' : ''} total`;
}

function renderProdList() {
  const list = document.getElementById('prodList');
  if (!list) return;

  if (!products.length) {
    list.innerHTML = `<div class="empty-state"><div class="eicon">📦</div><p>No products yet. Click "+ Add Product" to start.</p></div>`;
    return;
  }

  list.innerHTML = products.map(p => {
    const disc = discPct(p.orig, p.offer);
    const thumb = p.img
      ? `<img src="${gdImg(p.img)}" alt="" onerror="this.style.display='none'">`
      : (p.cat === 'wooden' ? '🪵' : '🔩');
    return `
    <div class="adm-row" id="row-${p.id}">
      <div class="adm-row-header">
        <div class="adm-thumb ${p.cat}">${thumb}</div>
        <div class="adm-row-info">
          <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-bottom:4px">
            <span class="badge ${p.cat}">${p.cat}</span>
            <span class="adm-row-name">${esc(p.name)}</span>
          </div>
          <div class="adm-row-meta">
            <span>Color: <strong>${esc(p.color)}</strong></span>
            <span>MRP: <strong>${inr(p.orig)}</strong></span>
            ${disc > 0 ? `<span class="off">Offer: ${inr(p.offer)} (${disc}% OFF)</span>` : ''}
            ${p.wa ? `<span>WA: ${p.wa}</span>` : ''}
          </div>
        </div>
        <div class="adm-row-actions">
          <button class="btn-edit" onclick="toggleEdit('${p.id}')">Edit</button>
          <button class="btn-delete" onclick="deleteProd('${p.id}')">Delete</button>
        </div>
      </div>
      <div class="adm-edit-area" id="edit-${p.id}" style="display:none"></div>
    </div>`;
  }).join('');
}

function toggleEdit(id) {
  const area = document.getElementById('edit-' + id);
  if (!area) return;
  if (area.style.display === 'none') {
    const p = products.find(x => x.id === id);
    area.innerHTML = buildProdForm(p, 'edit', id);
    area.style.display = 'block';
    bindProdForm(area, id);
  } else {
    area.style.display = 'none';
  }
}

function buildProdForm(p, mode, id) {
  const d = p || { name:'', cat:'wooden', color:'', orig:'', offer:'0', img:'', wa:'', desc:'' };
  const disc = discPct(Number(d.orig), Number(d.offer));
  const discBadge = disc > 0 ? `<span class="disc-badge">${disc}% off</span>` : '';
  const previewHtml = d.img ? `<div class="img-preview" id="imgPreview-${mode}"><img src="${gdImg(d.img)}" onerror="this.parentElement.style.display='none'"></div>` : `<div class="img-preview" id="imgPreview-${mode}" style="display:none"><img></div>`;

  return `
  <div class="form-grid">
    <div class="ig full"><label>Product Name *</label><input id="f-name" value="${esc(d.name)}" placeholder="e.g. Royal Wooden Bed Frame"></div>
    <div class="ig"><label>Category *</label>
      <select id="f-cat">
        <option value="wooden" ${d.cat==='wooden'?'selected':''}>Wooden Furniture</option>
        <option value="steel"  ${d.cat==='steel' ?'selected':''}>Steel Furniture</option>
      </select>
    </div>
    <div class="ig"><label>Color / Finish</label><input id="f-color" value="${esc(d.color)}" placeholder="e.g. Mahogany, Silver Grey"></div>
    <div class="ig"><label>Original Price (₹) *</label><input type="number" id="f-orig" value="${d.orig}" placeholder="e.g. 25000"></div>
    <div class="ig"><label>Offer Price (₹) — leave 0 for no offer</label>
      <div class="input-wrap">${discBadge}<input type="number" id="f-offer" value="${d.offer||0}" placeholder="0" style="padding-right:${disc>0?'68px':'13px'}"></div>
    </div>
    <div class="ig full"><label>WhatsApp Number for this product (e.g. 919876543210) — blank = use default</label>
      <input id="f-wa" value="${esc(d.wa)}" placeholder="Leave blank to use default number">
    </div>
    <div class="ig full"><label>Image URL (Google Drive public link or direct image URL)</label>
      <input id="f-img" value="${esc(d.img)}" placeholder="https://drive.google.com/file/d/FILE_ID/view">
    </div>
    ${previewHtml}
    <div class="ig full"><label>Description</label>
      <textarea id="f-desc" rows="2" placeholder="Brief product description..." style="resize:vertical">${esc(d.desc)}</textarea>
    </div>
  </div>
  <div class="btn-save-row">
    <button class="btn-primary" id="f-save">${mode === 'edit' ? 'Save Changes' : 'Add Product'}</button>
    <button class="btn-secondary" id="f-cancel">Cancel</button>
  </div>`;
}

function bindProdForm(container, editId) {
  // Live discount badge
  const origInp  = container.querySelector('#f-orig');
  const offerInp = container.querySelector('#f-offer');
  function updateDisc() {
    const disc = discPct(Number(origInp.value), Number(offerInp.value));
    const wrap = offerInp.parentElement;
    let badge = wrap.querySelector('.disc-badge');
    if (disc > 0) {
      if (!badge) { badge = document.createElement('span'); badge.className = 'disc-badge'; wrap.appendChild(badge); }
      badge.textContent = disc + '% off';
      offerInp.style.paddingRight = '68px';
    } else {
      if (badge) badge.remove();
      offerInp.style.paddingRight = '13px';
    }
  }
  origInp.addEventListener('input', updateDisc);
  offerInp.addEventListener('input', updateDisc);

  // Live image preview
  const imgInp = container.querySelector('#f-img');
  const preview = container.querySelector('[id^="imgPreview-"]');
  imgInp.addEventListener('input', () => {
    const url = gdImg(imgInp.value);
    if (url && preview) {
      preview.style.display = 'block';
      const img = preview.querySelector('img');
      img.src = url;
      img.onerror = () => { preview.style.display = 'none'; };
    } else if (preview) {
      preview.style.display = 'none';
    }
  });

  // Save
  container.querySelector('#f-save').addEventListener('click', async () => {
    const name = container.querySelector('#f-name').value.trim();
    const orig = Number(container.querySelector('#f-orig').value);
    if (!name || !orig) { alert('Product name and original price are required.'); return; }
    const saveBtn = container.querySelector('#f-save');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    const prod = {
      id:    editId || uid(),
      name,
      cat:   container.querySelector('#f-cat').value,
      color: container.querySelector('#f-color').value.trim(),
      orig,
      offer: Number(container.querySelector('#f-offer').value) || 0,
      wa:    container.querySelector('#f-wa').value.trim(),
      img:   container.querySelector('#f-img').value.trim(),
      desc:  container.querySelector('#f-desc').value.trim()
    };
    if (editId) {
      products = products.map(p => p.id === editId ? prod : p);
    } else {
      products.push(prod);
    }
    try {
      await DB.set('products', products);
      showToast(editId ? '✓ Product updated!' : '✓ Product added!');
      // Close add form if adding
      if (!editId) {
        document.getElementById('addProdForm').style.display = 'none';
      }
      updateProdCount();
      renderProdList();
    } catch (error) {
      alert('Could not save product. Please connect Vercel Redis storage and login again.');
      console.error(error);
      saveBtn.disabled = false;
      saveBtn.textContent = editId ? 'Save Changes' : 'Add Product';
    }
  });

  // Cancel
  container.querySelector('#f-cancel').addEventListener('click', () => {
    if (editId) {
      const area = document.getElementById('edit-' + editId);
      if (area) area.style.display = 'none';
    } else {
      document.getElementById('addProdForm').style.display = 'none';
    }
  });
}

async function deleteProd(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  products = products.filter(p => p.id !== id);
  try {
    await DB.set('products', products);
    updateProdCount();
    renderProdList();
    showToast('Product deleted.');
  } catch (error) {
    alert('Could not delete product. Please connect Vercel Redis storage and login again.');
    console.error(error);
  }
}

// ══ HEROES TAB ════════════════════════════════════════════════
function renderHeroTab() {
  const pane = document.getElementById('pane-heroes');
  pane.style.display = 'none';

  pane.innerHTML = `
    <h2 class="adm-section-title">Hero Slides</h2>
    <p class="adm-section-sub">These images auto-rotate every 5 seconds on the homepage. Upload images to Google Drive, share publicly, paste link here.</p>
    <div class="adm-card">
      <h3 class="adm-card-title">Add New Slide</h3>
      <div class="ig"><label>Image URL (Google Drive or direct URL)</label>
        <input id="newHUrl" placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing">
      </div>
      <div id="newHPreview" style="display:none;border-radius:8px;overflow:hidden;height:120px;margin-bottom:12px;background:#f0e8d8">
        <img id="newHImg" style="width:100%;height:100%;object-fit:cover">
      </div>
      <div class="ig"><label>Label (optional, for your reference only)</label>
        <input id="newHLabel" placeholder="e.g. Premium Collection">
      </div>
      <button class="btn-primary" id="addHeroBtn">Add Slide</button>
    </div>
    <div id="heroList"></div>`;

  document.getElementById('newHUrl').addEventListener('input', function() {
    const url = gdImg(this.value);
    const preview = document.getElementById('newHPreview');
    const img = document.getElementById('newHImg');
    if (url) { preview.style.display = 'block'; img.src = url; img.onerror = ()=>{ preview.style.display='none'; }; }
    else { preview.style.display = 'none'; }
  });

  document.getElementById('addHeroBtn').addEventListener('click', async () => {
    const url = document.getElementById('newHUrl').value.trim();
    const label = document.getElementById('newHLabel').value.trim();
    if (!url) { alert('Image URL is required.'); return; }
    const btn = document.getElementById('addHeroBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    heroes.push({ id: uid(), url, label });
    try {
      await DB.set('heroes', heroes);
      document.getElementById('newHUrl').value = '';
      document.getElementById('newHLabel').value = '';
      document.getElementById('newHPreview').style.display = 'none';
      showToast('Slide added!');
      renderHeroList();
    } catch (error) {
      alert('Could not save slide. Please connect Vercel Redis storage and login again.');
      console.error(error);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Add Slide';
    }
  });

  renderHeroList();
}

function renderHeroList() {
  const list = document.getElementById('heroList');
  if (!list) return;
  if (!heroes.length) {
    list.innerHTML = '<div class="empty-state"><p>No slides yet. Add one above.</p></div>';
    return;
  }
  list.innerHTML = heroes.map((h, i) => `
    <div class="adm-row hero-slide-row">
      <div class="hero-slide-thumb"><img src="${gdImg(h.url)}" onerror="this.src=''"></div>
      <div class="hero-slide-info">
        <div>
          <div style="font-weight:600;font-size:14px">Slide ${i+1}${h.label ? ' — ' + esc(h.label) : ''}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px">${h.url.length > 60 ? h.url.slice(0,60)+'...' : h.url}</div>
        </div>
        <button class="btn-delete" onclick="deleteHero('${h.id}')">Remove</button>
      </div>
    </div>`).join('');
}

async function deleteHero(id) {
  if (!confirm('Remove this hero slide?')) return;
  heroes = heroes.filter(h => h.id !== id);
  try {
    await DB.set('heroes', heroes);
    renderHeroList();
    showToast('Slide removed.');
  } catch (error) {
    alert('Could not remove slide. Please connect Vercel Redis storage and login again.');
    console.error(error);
  }
}

// ══ SETTINGS TAB ══════════════════════════════════════════════
function renderSettingsTab() {
  const pane = document.getElementById('pane-settings');
  pane.style.display = 'none';

  pane.innerHTML = `
    <h2 class="adm-section-title">Settings</h2>
    <div class="adm-card">
      <h3 class="adm-card-title">Store Information</h3>
      <div class="form-grid">
        <div class="ig"><label>Store Name</label><input id="s-name" value="${esc(settings.storeName)}"></div>
        <div class="ig"><label>Tagline</label><input id="s-tag" value="${esc(settings.tagline)}"></div>
        <div class="ig"><label>Phone Number</label><input id="s-phone" value="${esc(settings.phone)}"></div>
        <div class="ig"><label>Email Address</label><input id="s-email" value="${esc(settings.email)}"></div>
        <div class="ig full"><label>Default WhatsApp Number (country code + number, no + or spaces — e.g. 919876543210)</label>
          <input id="s-wa" value="${esc(settings.defaultWa)}" placeholder="919876543210">
          <small style="color:var(--muted);font-size:11px;margin-top:4px;display:block">Used for products that have no specific WhatsApp number set.</small>
        </div>
        <div class="ig full"><label>Address</label><textarea id="s-addr" rows="2" style="resize:vertical">${esc(settings.address)}</textarea></div>
      </div>
      <button class="btn-primary" id="saveSettingsBtn">Save Settings</button>
    </div>

    <div class="adm-card">
      <h3 class="adm-card-title">Change Admin Password</h3>
      <div class="ig"><label>Current Password</label><input type="password" id="p-old"></div>
      <div class="ig"><label>New Password (minimum 8 characters)</label><input type="password" id="p-new"></div>
      <div class="ig"><label>Confirm New Password</label><input type="password" id="p-conf"></div>
      <div id="pwdMsg"></div>
      <button class="btn-primary" id="changePwdBtn">Update Password</button>
    </div>

    <div class="guide-box">
      <h4>💡 How to use Google Drive Images</h4>
      <ol>
        <li>Upload your image to Google Drive</li>
        <li>Right-click the image → <strong>Share</strong> → change to <strong>"Anyone with the link"</strong></li>
        <li>Click <strong>Copy link</strong> — looks like: <code>drive.google.com/file/d/<strong>FILE_ID</strong>/view...</code></li>
        <li>Paste that link into any Image URL field — it's auto-converted ✓</li>
      </ol>
    </div>`;

  document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
    settings = {
      storeName: document.getElementById('s-name').value.trim(),
      tagline:   document.getElementById('s-tag').value.trim(),
      phone:     document.getElementById('s-phone').value.trim(),
      email:     document.getElementById('s-email').value.trim(),
      defaultWa: document.getElementById('s-wa').value.replace(/\D/g,''),
      address:   document.getElementById('s-addr').value.trim()
    };
    const btn = document.getElementById('saveSettingsBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    try {
      await DB.set('settings', settings);
      showToast('Settings saved!');
    } catch (error) {
      alert('Could not save settings. Please connect Vercel Redis storage and login again.');
      console.error(error);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Settings';
    }
  });

  document.getElementById('changePwdBtn').addEventListener('click', async () => {
    const old  = document.getElementById('p-old').value;
    const nw   = document.getElementById('p-new').value;
    const conf = document.getElementById('p-conf').value;
    const msgEl = document.getElementById('pwdMsg');
    const show = (txt, ok) => msgEl.innerHTML = `<div class="msg ${ok?'ok':'err'}">${txt}</div>`;

    if (!old || !nw || !conf)   { show('Please fill all fields.'); return; }
    if (nw !== conf)            { show('New passwords do not match.'); return; }
    if (nw.length < 8)          { show('Password must be at least 8 characters.'); return; }

    const oldHash = await sha256(old);
    const newHash = await sha256(nw);
    const changed = await DB.changePassword(oldHash, newHash);
    if (!changed) { show('Current password is incorrect or storage is not connected.'); return; }
    document.getElementById('p-old').value = '';
    document.getElementById('p-new').value = '';
    document.getElementById('p-conf').value = '';
    show('✓ Password changed successfully!', true);
  });
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3000);
}

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
