// ============================================================
// Social QR PWA — app.js
// ============================================================

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(console.error);
}

// ---------- State ----------
const state = {
  network: 'whatsapp',
  generatedLink: '',
  qrInstance: null,
  stylerQrInstance: null,
  sharedText: '',
  style: {
    dotsType: 'square',
    cornerSquareType: 'square',
    cornerDotType: 'square',
    dotsColor: '#6750A4',
    dotsColor2: '#9C27B0',
    dotsGradient: false,
    bgColor: '#FFFFFF',
    transparentBg: false,
    cornerColor: '#6750A4',
    logoKey: 'none',
    logoUrl: null,
    logoSize: 0.3,
    qrSize: 300,
    margin: 10,
  },
  history: JSON.parse(localStorage.getItem('qr_history') || '[]'),
};

// ---------- Network Configs ----------
const networks = {
  whatsapp: {
    label: 'WhatsApp',
    icon: 'chat',
    color: '#25D366',
    fields: [
      { id: 'phone', label: 'Número (com DDI, ex: 5511999999999)', type: 'tel', placeholder: '5511999999999' },
      { id: 'message', label: 'Mensagem pré-escrita', type: 'textarea', placeholder: 'Olá! Vi seu contato e gostaria de falar...' },
    ],
    buildLink: (f, shared) => {
      const msg = shared || f.message || '';
      return `https://wa.me/${f.phone.replace(/\D/g, '')}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
    },
  },
  telegram: {
    label: 'Telegram',
    icon: 'send',
    color: '#0088CC',
    fields: [
      { id: 'username', label: 'Username (sem @)', type: 'text', placeholder: 'seuusername' },
      { id: 'message', label: 'Mensagem pré-escrita', type: 'textarea', placeholder: 'Olá!' },
    ],
    buildLink: (f, shared) => {
      const msg = shared || f.message || '';
      return `https://t.me/${f.username}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
    },
  },
  instagram: {
    label: 'Instagram',
    icon: 'photo_camera',
    color: '#E1306C',
    fields: [
      { id: 'username', label: 'Username (sem @)', type: 'text', placeholder: 'seuusername' },
    ],
    buildLink: (f) => `https://instagram.com/${f.username}`,
  },
  facebook: {
    label: 'Facebook',
    icon: 'thumb_up',
    color: '#1877F2',
    fields: [
      { id: 'profile', label: 'Perfil ou Page ID / username', type: 'text', placeholder: 'seuperfil' },
    ],
    buildLink: (f) => `https://facebook.com/${f.profile}`,
  },
  messenger: {
    label: 'Messenger',
    icon: 'forum',
    color: '#0084FF',
    fields: [
      { id: 'profile', label: 'Username do Facebook', type: 'text', placeholder: 'seuperfil' },
      { id: 'message', label: 'Mensagem pré-escrita', type: 'textarea', placeholder: 'Olá!' },
    ],
    buildLink: (f, shared) => {
      const msg = shared || f.message || '';
      return `https://m.me/${f.profile}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
    },
  },
  x: {
    label: 'X (Twitter)',
    icon: 'tag',
    color: '#000000',
    fields: [
      { id: 'username', label: 'Username (sem @)', type: 'text', placeholder: 'seuusername' },
      { id: 'message', label: 'Mensagem / tweet pré-escrito', type: 'textarea', placeholder: 'Confira isso!' },
    ],
    buildLink: (f, shared) => {
      const msg = shared || f.message || '';
      return `https://x.com/intent/tweet?text=${encodeURIComponent(msg)}&via=${f.username}`;
    },
  },
  snapchat: {
    label: 'Snapchat',
    icon: 'ghost',
    color: '#FFFC00',
    fields: [
      { id: 'username', label: 'Username', type: 'text', placeholder: 'seuusername' },
    ],
    buildLink: (f) => `https://www.snapchat.com/add/${f.username}`,
  },
};

// ---------- Logo paths ----------
const logoDataURLs = {};
const logoPaths = {
  whatsapp: 'icons/whatsapp.svg',
  telegram: 'icons/telegram.svg',
  instagram: 'icons/instagram.svg',
  facebook: 'icons/facebook.svg',
  x: 'icons/x.svg',
};

async function loadLogoDataURL(key) {
  if (logoDataURLs[key]) return logoDataURLs[key];
  try {
    const resp = await fetch(logoPaths[key]);
    const blob = await resp.blob();
    return new Promise((res) => {
      const reader = new FileReader();
      reader.onloadend = () => { logoDataURLs[key] = reader.result; res(reader.result); };
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

// ---------- PWA Install Check ----------
function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://');
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('install-btn').style.display = 'flex';
  document.getElementById('install-hint').style.display = 'none';
});

document.getElementById('install-btn').addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') showSnackbar('Instalando...');
    deferredPrompt = null;
  }
});

// ---------- Boot ----------
function boot() {
  if (isPWA()) {
    document.getElementById('install-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    initApp();
  } else {
    document.getElementById('install-screen').classList.remove('hidden');
    document.getElementById('app-screen').classList.add('hidden');
  }
}

window.addEventListener('load', boot);

// ---------- Init App ----------
function initApp() {
  initTheme();
  initDrawer();
  initNavigation();
  initNetworkChips();
  renderNetworkFields();
  initGenerateBtn();
  initStylerPage();
  renderHistory();
  handleSharedData();
}

// ---------- Theme ----------
function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#theme-toggle md-icon');
  if (icon) icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
}

// ---------- Drawer ----------
function initDrawer() {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawer-overlay');
  const toggle = document.getElementById('drawer-toggle');
  toggle.addEventListener('click', () => { drawer.classList.add('open'); overlay.classList.add('open'); });
  overlay.addEventListener('click', () => { drawer.classList.remove('open'); overlay.classList.remove('open'); });
}

// ---------- Navigation ----------
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      navigateTo(page);
      document.getElementById('drawer').classList.remove('open');
      document.getElementById('drawer-overlay').classList.remove('open');
    });
  });
}

function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
  document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
  const titles = { generator: 'Social QR', styler: 'Estilizar QR', history: 'Histórico' };
  document.getElementById('page-title').textContent = titles[pageId] || 'Social QR';
  if (pageId === 'styler') refreshStylerPreview();
  if (pageId === 'history') renderHistory();
}

// ---------- Network Chips ----------
function initNetworkChips() {
  document.querySelectorAll('.network-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.network-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.network = chip.dataset.network;
      renderNetworkFields();
    });
  });
}

// ---------- Render Fields ----------
function renderNetworkFields() {
  const container = document.getElementById('network-fields');
  const net = networks[state.network];
  container.innerHTML = `
    <div class="network-label">
      <span class="material-symbols-rounded" style="color:${net.color}">${net.icon}</span>
      <span class="field-label">${net.label}</span>
    </div>
    <div class="fields-grid" id="fields-inner"></div>`;
  const grid = document.getElementById('fields-inner');
  net.fields.forEach(f => {
    if (f.type === 'textarea') {
      grid.innerHTML += `
        <md-outlined-text-field
          id="field-${f.id}"
          label="${f.label}"
          type="textarea"
          rows="3"
          placeholder="${f.placeholder}"
          style="width:100%"
        >${state.sharedText && f.id === 'message' ? state.sharedText : ''}</md-outlined-text-field>`;
    } else {
      grid.innerHTML += `
        <md-outlined-text-field
          id="field-${f.id}"
          label="${f.label}"
          type="${f.type}"
          placeholder="${f.placeholder}"
          style="width:100%"
        ></md-outlined-text-field>`;
    }
  });
}

// ---------- Generate QR ----------
function initGenerateBtn() {
  document.getElementById('generate-btn').addEventListener('click', generateQR);
  document.getElementById('copy-link-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(state.generatedLink).then(() => showSnackbar('Link copiado!'));
  });
  document.getElementById('open-link-btn').addEventListener('click', () => {
    window.open(state.generatedLink, '_blank');
  });
  document.getElementById('export-btn').addEventListener('click', () => exportQR('png'));
  document.getElementById('export-svg-btn').addEventListener('click', () => exportQR('svg'));
  document.getElementById('style-qr-btn').addEventListener('click', () => navigateTo('styler'));
  document.getElementById('clear-shared').addEventListener('click', () => {
    state.sharedText = '';
    document.getElementById('shared-banner').classList.add('hidden');
    renderNetworkFields();
  });
}

function getFieldValues() {
  const values = {};
  networks[state.network].fields.forEach(f => {
    const el = document.getElementById('field-' + f.id);
    values[f.id] = el ? el.value : '';
  });
  return values;
}

function generateQR() {
  const fields = getFieldValues();
  const net = networks[state.network];
  const link = net.buildLink(fields, state.sharedText);
  if (!link || link.includes('undefined') || link.endsWith('/')) {
    showSnackbar('Preencha os campos obrigatórios');
    return;
  }
  state.generatedLink = link;
  document.getElementById('qr-link-text').textContent = link;
  document.getElementById('qr-result').classList.remove('hidden');
  const container = document.getElementById('qr-canvas-container');
  container.innerHTML = '';
  generateQRInstance(link, state.style.qrSize).then(qr => {
    state.qrInstance = qr;
    qr.append(container);
  });
  saveHistory(net.label, link, net.icon);
}

async function generateQRInstance(data, size) {
  const s = state.style;
  let imageUrl = null;
  if (s.logoKey !== 'none') {
    imageUrl = s.logoUrl || (logoPaths[s.logoKey] ? await loadLogoDataURL(s.logoKey) : null);
  }
  return new QRCodeStyling({
    width: size, height: size, data,
    margin: s.margin,
    dotsOptions: {
      type: s.dotsType,
      color: s.dotsGradient ? undefined : s.dotsColor,
      gradient: s.dotsGradient ? {
        type: 'linear', rotation: 45,
        colorStops: [{ offset: 0, color: s.dotsColor }, { offset: 1, color: s.dotsColor2 }],
      } : undefined,
    },
    backgroundOptions: { color: s.transparentBg ? 'transparent' : s.bgColor },
    cornersSquareOptions: { type: s.cornerSquareType, color: s.cornerColor },
    cornersDotOptions: { type: s.cornerDotType, color: s.cornerColor },
    image: imageUrl,
    imageOptions: { crossOrigin: 'anonymous', margin: 4, imageSize: s.logoSize },
  });
}

function exportQR(ext) {
  if (!state.qrInstance) { showSnackbar('Gere um QR Code primeiro'); return; }
  state.qrInstance.download({ name: 'social-qr', extension: ext });
}

// ---------- Styler Page ----------
function initStylerPage() {
  document.querySelectorAll('[data-dots]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-dots]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.style.dotsType = btn.dataset.dots;
      refreshStylerPreview();
    });
  });
  document.querySelectorAll('[data-corner-square]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-corner-square]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.style.cornerSquareType = btn.dataset.cornerSquare;
      refreshStylerPreview();
    });
  });
  document.querySelectorAll('[data-corner-dot]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-corner-dot]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.style.cornerDotType = btn.dataset.cornerDot;
      refreshStylerPreview();
    });
  });
  document.getElementById('dots-color').addEventListener('input', e => { state.style.dotsColor = e.target.value; refreshStylerPreview(); });
  document.getElementById('dots-color2').addEventListener('input', e => { state.style.dotsColor2 = e.target.value; refreshStylerPreview(); });
  document.getElementById('dots-gradient-toggle').addEventListener('change', e => { state.style.dotsGradient = e.target.checked; refreshStylerPreview(); });
  document.getElementById('bg-color').addEventListener('input', e => { state.style.bgColor = e.target.value; refreshStylerPreview(); });
  document.getElementById('transparent-bg').addEventListener('change', e => { state.style.transparentBg = e.target.checked; refreshStylerPreview(); });
  document.getElementById('corner-color').addEventListener('input', e => { state.style.cornerColor = e.target.value; refreshStylerPreview(); });
  document.querySelectorAll('[data-logo]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-logo]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.style.logoKey = btn.dataset.logo;
      state.style.logoUrl = null;
      refreshStylerPreview();
    });
  });
  document.getElementById('logo-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      state.style.logoUrl = reader.result;
      state.style.logoKey = 'custom';
      document.querySelectorAll('[data-logo]').forEach(b => b.classList.remove('active'));
      refreshStylerPreview();
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('logo-size').addEventListener('input', e => {
    state.style.logoSize = parseInt(e.target.value) / 100;
    document.getElementById('logo-size-val').textContent = e.target.value;
    refreshStylerPreview();
  });
  document.getElementById('qr-size').addEventListener('input', e => {
    state.style.qrSize = parseInt(e.target.value);
    document.getElementById('qr-size-val').textContent = e.target.value;
    refreshStylerPreview();
  });
  document.getElementById('qr-margin').addEventListener('input', e => {
    state.style.margin = parseInt(e.target.value);
    document.getElementById('margin-val').textContent = e.target.value;
    refreshStylerPreview();
  });
  document.getElementById('apply-style-btn').addEventListener('click', () => {
    if (state.generatedLink) generateQR();
    showSnackbar('Estilo aplicado!');
  });
  document.getElementById('reset-style-btn').addEventListener('click', resetStyle);
  document.getElementById('export-styled-btn').addEventListener('click', exportStyled);
  document.getElementById('export-styled-svg-btn').addEventListener('click', exportStyledSVG);
}

async function refreshStylerPreview() {
  const preview = document.getElementById('styler-preview');
  preview.innerHTML = '';
  const data = state.generatedLink || 'https://socialqr.app/preview';
  const qr = await generateQRInstance(data, 260);
  qr.append(preview);
  state.stylerQrInstance = qr;
}

function resetStyle() {
  state.style = {
    dotsType: 'square', cornerSquareType: 'square', cornerDotType: 'square',
    dotsColor: '#6750A4', dotsColor2: '#9C27B0', dotsGradient: false,
    bgColor: '#FFFFFF', transparentBg: false, cornerColor: '#6750A4',
    logoKey: 'none', logoUrl: null, logoSize: 0.3, qrSize: 300, margin: 10,
  };
  document.getElementById('dots-color').value = '#6750A4';
  document.getElementById('dots-color2').value = '#9C27B0';
  document.getElementById('bg-color').value = '#FFFFFF';
  document.getElementById('corner-color').value = '#6750A4';
  document.getElementById('logo-size').value = 30;
  document.getElementById('qr-size').value = 300;
  document.getElementById('qr-margin').value = 10;
  document.getElementById('logo-size-val').textContent = '30';
  document.getElementById('qr-size-val').textContent = '300';
  document.getElementById('margin-val').textContent = '10';
  document.getElementById('dots-gradient-toggle').checked = false;
  document.getElementById('transparent-bg').checked = false;
  refreshStylerPreview();
  showSnackbar('Estilo resetado');
}

function exportStyled() {
  if (!state.stylerQrInstance) { showSnackbar('Abra o styler primeiro'); return; }
  state.stylerQrInstance.download({ name: 'social-qr-styled', extension: 'png' });
}
function exportStyledSVG() {
  if (!state.stylerQrInstance) { showSnackbar('Abra o styler primeiro'); return; }
  state.stylerQrInstance.download({ name: 'social-qr-styled', extension: 'svg' });
}

// ---------- History ----------
function saveHistory(network, link, icon) {
  const entry = { network, link, icon, date: new Date().toLocaleString('pt-BR') };
  state.history.unshift(entry);
  if (state.history.length > 50) state.history.pop();
  localStorage.setItem('qr_history', JSON.stringify(state.history));
}

function renderHistory() {
  const list = document.getElementById('history-list');
  if (!state.history.length) {
    list.innerHTML = `
      <div class="history-empty">
        <span class="material-symbols-rounded" style="font-size:48px;opacity:0.3">history</span>
        <p>Nenhum QR Code gerado ainda.</p>
      </div>`;
    return;
  }
  list.innerHTML = state.history.map((h, i) => `
    <div class="history-item" data-index="${i}">
      <span class="history-item-icon material-symbols-rounded">${h.icon}</span>
      <div class="history-item-info">
        <strong>${h.network}</strong>
        <span>${h.link}</span>
        <span style="font-size:11px;opacity:0.6">${h.date}</span>
      </div>
      <span class="material-symbols-rounded history-copy-icon">content_copy</span>
    </div>
  `).join('');
  list.querySelectorAll('.history-item').forEach(el => {
    el.addEventListener('click', () => {
      const h = state.history[el.dataset.index];
      navigator.clipboard.writeText(h.link).then(() => showSnackbar('Link copiado!'));
    });
  });
  document.getElementById('clear-history-btn').addEventListener('click', () => {
    state.history = [];
    localStorage.removeItem('qr_history');
    renderHistory();
    showSnackbar('Histórico limpo');
  });
}

// ---------- Web Share Target ----------
function handleSharedData() {
  const params = new URLSearchParams(window.location.search);
  const text = params.get('text') || params.get('url') || params.get('title') || '';
  if (text) {
    state.sharedText = text;
    document.getElementById('shared-text-preview').textContent = text.slice(0, 60) + (text.length > 60 ? '...' : '');
    document.getElementById('shared-banner').classList.remove('hidden');
    renderNetworkFields();
    history.replaceState({}, '', window.location.pathname);
  }
}

// ---------- Snackbar ----------
function showSnackbar(msg) {
  const sb = document.getElementById('snackbar');
  sb.textContent = msg;
  sb.classList.add('show');
  setTimeout(() => sb.classList.remove('show'), 3000);
}
