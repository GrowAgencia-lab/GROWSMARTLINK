/****************************************************
 * SMART LINK – Grow Agencia Creativa
 * Backend: Google Apps Script + Google Sheets
 * 1) Pegá este archivo en Extensiones > Apps Script
 * 2) Cambiá ADMIN_KEY
 * 3) Ejecutá setup() una vez (acepta permisos)
 * 4) Implementar > Nueva implementación > App web
 *    Ejecutar como: Yo | Acceso: Cualquier persona
 ****************************************************/

const ADMIN_KEY = 'grow2026';            // ← CAMBIÁ ESTA CLAVE (la misma que usás en el panel)
const SS_ID = '1D9nGvKNlnY9s1xYRmTOu_rzQJYQFDH_YAiqhUYcvGhg'; // Sheet GROW AGENCIA - SMART LINK / QRS DINAMICOS
const SH_CARDS  = 'Tarjetas';
const SH_QR     = 'QRs';
const SH_LOG    = 'Clics';
const FOLDER_NAME = 'SmartLinks Grow - Imagenes';

const CARD_COLS = ['slug','estado','vence','cliente','nombre','cargo','empresa',
  'telefono','whatsapp','email','web','direccion','foto','logo','fondo',
  'tema','color1','color2','color3','botones','mensajeWA',
  'creado','actualizado','visitas','extra'];

const QR_COLS = ['slug','nombre','destino','estado','vence',
  'creado','actualizado','escaneos'];

const LOG_COLS = ['fecha','tipo','slug','detalle'];

/* ---------- SETUP ---------- */
// Las hojas se crean solas. setup() es opcional (sirve para autorizar permisos).
function setup() {
  [SH_CARDS, SH_QR, SH_LOG].forEach(n => sheet_(n));
  getFolder_();
}

function ss_() { return SpreadsheetApp.openById(SS_ID); }

function sheet_(name) {
  const cols = name === SH_CARDS ? CARD_COLS : name === SH_QR ? QR_COLS : LOG_COLS;
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange('A:Z').setNumberFormat('@');
    sh.setFrozenRows(1);
  }
  const head = sh.getRange(1, 1, 1, cols.length);
  if (String(head.getValues()[0].join('|')) !== cols.join('|')) {
    head.setValues([cols]).setFontWeight('bold').setBackground('#111111').setFontColor('#ffffff');
  }
  return sh;
}

function parseJ_(v, def) { try { return v ? JSON.parse(v) : def; } catch (x) { return def; } }

/* ---------- ENTRADAS ---------- */
function doGet(e) {
  const p = e.parameter || {};
  let res;
  try {
    switch (p.action) {
      case 'card': res = getCard_(p.s); break;   // ojo: Google reserva el parámetro 'c'
      case 'qr':   res = getQr_(p.s); break;
      case 'hit':  logHit_('clic', p.s, p.d); res = { ok: true }; break;
      case 'font': res = getFont_(p.id); break;
      default:
        if (p.key !== ADMIN_KEY) res = { ok: false, error: 'Clave incorrecta' };
        else if (p.action === 'list') res = listAll_();
        else if (p.action === 'ping') res = { ok: true };
        else res = { ok: false, error: 'Acción desconocida' };
    }
  } catch (err) {
    res = { ok: false, error: String(err) };
  }
  // JSONP: funciona en todos los navegadores de celular (cámara, Instagram, WhatsApp…)
  if (p.callback && /^[A-Za-z0-9_.]+$/.test(p.callback)) {
    return ContentService.createTextOutput(p.callback + '(' + JSON.stringify(res) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(res);
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.key !== ADMIN_KEY) return json_({ ok: false, error: 'Clave incorrecta' });
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      switch (d.action) {
        case 'saveCard': return json_(upsert_(SH_CARDS, CARD_COLS, d.data, d.oldSlug));
        case 'deleteCard': return json_(remove_(SH_CARDS, d.slug));
        case 'saveQr':   return json_(upsert_(SH_QR, QR_COLS, d.data, d.oldSlug));
        case 'deleteQr': return json_(remove_(SH_QR, d.slug));
        case 'upload':   return json_(upload_(d));
        case 'uploadFont': return json_(uploadFont_(d));
      }
      return json_({ ok: false, error: 'Acción desconocida' });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ---------- PÚBLICO ---------- */
function getCard_(slug) {
  const r = find_(SH_CARDS, CARD_COLS, slug);
  if (!r) return { ok: false, error: 'No existe' };
  if (!isActive_(r.obj)) return { ok: true, inactiva: true };
  bump_(SH_CARDS, CARD_COLS, r.row, 'visitas');
  const c = r.obj;
  c.botones = parseJ_(c.botones, []);
  c.extra = parseJ_(c.extra, {});
  delete c.cliente; delete c.creado; delete c.actualizado; delete c.visitas;
  return { ok: true, card: c };
}

function getQr_(slug) {
  const r = find_(SH_QR, QR_COLS, slug);
  if (!r) return { ok: false, error: 'No existe' };
  if (!isActive_(r.obj)) return { ok: true, inactivo: true };
  bump_(SH_QR, QR_COLS, r.row, 'escaneos');
  return { ok: true, destino: r.obj.destino };
}

function logHit_(tipo, slug, detalle) {
  const sh = sheet_(SH_LOG);
  sh.appendRow([now_(), tipo, slug || '', detalle || '']);
}

/* ---------- ADMIN ---------- */
function listAll_() {
  const cards = readAll_(SH_CARDS, CARD_COLS).map(c => {
    c.botones = parseJ_(c.botones, []);
    c.extra = parseJ_(c.extra, {});
    return c;
  });
  const qrs = readAll_(SH_QR, QR_COLS);
  // clics por tarjeta
  const log = readAll_(SH_LOG, LOG_COLS);
  const clics = {};
  log.forEach(l => { clics[l.slug] = (clics[l.slug] || 0) + 1; });
  cards.forEach(c => c.clics = clics[c.slug] || 0);
  return { ok: true, cards, qrs };
}

function upsert_(name, cols, data, oldSlug) {
  data = data || {};
  const slug = cleanSlug_(data.slug);
  if (!slug) return { ok: false, error: 'Falta el link (slug)' };
  data.slug = slug;
  ['visitas','escaneos','creado','actualizado','clics','_edit'].forEach(k => delete data[k]);
  if (Array.isArray(data.botones)) data.botones = JSON.stringify(data.botones);
  if (data.extra && typeof data.extra === 'object') data.extra = JSON.stringify(data.extra);

  const sh = sheet_(name);
  const existing = find_(name, cols, oldSlug || slug);
  // evitar duplicados al renombrar
  if (oldSlug && oldSlug !== slug && find_(name, cols, slug))
    return { ok: false, error: 'Ese link ya está en uso' };
  if (!oldSlug && existing)
    return { ok: false, error: 'Ese link ya está en uso' };

  const t = now_();
  if (existing) {
    const merged = Object.assign({}, existing.obj, data, { actualizado: t });
    sh.getRange(existing.row, 1, 1, cols.length).setValues([cols.map(k => str_(merged[k]))]);
  } else {
    const obj = Object.assign({ estado: 'activo' }, data, { creado: t, actualizado: t });
    if (name === SH_CARDS) obj.visitas = 0;
    if (name === SH_QR) obj.escaneos = 0;
    sh.appendRow(cols.map(k => str_(obj[k])));
  }
  return { ok: true, slug };
}

function remove_(name, slug) {
  const cols = name === SH_CARDS ? CARD_COLS : QR_COLS;
  const r = find_(name, cols, slug);
  if (!r) return { ok: false, error: 'No existe' };
  sheet_(name).deleteRow(r.row);
  return { ok: true };
}

function upload_(d) {
  const bytes = Utilities.base64Decode(d.base64);
  const blob = Utilities.newBlob(bytes, d.mime || 'image/png', d.name || ('img_' + Date.now()));
  const file = getFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { ok: true, url: 'https://lh3.googleusercontent.com/d/' + file.getId() };
}

function uploadFont_(d) {
  const bytes = Utilities.base64Decode(d.base64);
  const name = String(d.name || ('fuente_' + Date.now()));
  const file = getFontFolder_().createFile(Utilities.newBlob(bytes, 'application/octet-stream', name));
  return { ok: true, url: 'drive:' + file.getId() };
}

// Entrega una fuente subida (solo de la carpeta de fuentes de la app)
function getFont_(id) {
  const file = DriveApp.getFileById(id);
  const fid = getFontFolder_().getId();
  const parents = file.getParents();
  let ok = false;
  while (parents.hasNext()) if (parents.next().getId() === fid) ok = true;
  if (!ok) return { ok: false, error: 'No permitido' };
  return { ok: true, base64: Utilities.base64Encode(file.getBlob().getBytes()) };
}

function getFontFolder_() {
  const root = getFolder_();
  const it = root.getFoldersByName('Fuentes');
  return it.hasNext() ? it.next() : root.createFolder('Fuentes');
}

/* ---------- UTILIDADES ---------- */
function readAll_(name, cols) {
  const sh = sheet_(name);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, cols.length).getValues()
    .filter(r => r[0] !== '')
    .map(r => toObj_(cols, r));
}

function find_(name, cols, slug) {
  slug = cleanSlug_(slug);
  if (!slug) return null;
  const sh = sheet_(name);
  const last = sh.getLastRow();
  if (last < 2) return null;
  const vals = sh.getRange(2, 1, last - 1, cols.length).getValues();
  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).toLowerCase() === slug) return { row: i + 2, obj: toObj_(cols, vals[i]) };
  }
  return null;
}

function toObj_(cols, r) {
  const o = {};
  cols.forEach((k, i) => o[k] = str_(r[i]));
  return o;
}

function bump_(name, cols, row, field) {
  const sh = sheet_(name);
  const cell = sh.getRange(row, cols.indexOf(field) + 1);
  cell.setValue(String((parseInt(cell.getValue(), 10) || 0) + 1));
}

function isActive_(o) {
  if (String(o.estado).toLowerCase() !== 'activo') return false;
  if (o.vence) {
    const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (o.vence < hoy) return false;
  }
  return true;
}

function cleanSlug_(s) {
  return String(s || '').toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
}

function str_(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v);
}

function now_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
}

function getFolder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
