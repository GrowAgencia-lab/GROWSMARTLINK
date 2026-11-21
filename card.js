// ===== Render de tarjeta Smart Link (usado por index.html y admin.html) =====
const SL_TIPOS = {
  whatsapp:  { n:'WhatsApp',   i:'fa-brands fa-whatsapp',  col:'#25D366' },
  telefono:  { n:'Llamar',     i:'fa-solid fa-phone',      col:'#1c1c1e' },
  email:     { n:'Email',      i:'fa-regular fa-envelope', col:'#1c1c1e' },
  web:       { n:'Sitio Web',  i:'fa-solid fa-globe',      col:'#1c1c1e' },
  maps:      { n:'Ubicación',  i:'fa-solid fa-map-location-dot', col:'#EA4335' },
  instagram: { n:'Instagram',  i:'fa-brands fa-instagram', col:'#E1306C' },
  facebook:  { n:'Facebook',   i:'fa-brands fa-facebook-f',col:'#1877F2' },
  linkedin:  { n:'LinkedIn',   i:'fa-brands fa-linkedin-in',col:'#0A66C2' },
  tiktok:    { n:'TikTok',     i:'fa-brands fa-tiktok',    col:'#000000' },
  youtube:   { n:'YouTube',    i:'fa-brands fa-youtube',   col:'#FF0000' },
  x:         { n:'X',          i:'fa-brands fa-x-twitter', col:'#000000' },
  telegram:  { n:'Telegram',   i:'fa-brands fa-telegram',  col:'#229ED9' },
  pdf:       { n:'Catálogo',   i:'fa-solid fa-file-pdf',   col:'#D93025' },
  link:      { n:'Enlace',     i:'fa-solid fa-link',       col:'#1c1c1e' }
};

function slEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function slNum(n){
  let d = String(n||'').replace(/\D/g,'');
  if (d.startsWith('0')) d = '595' + d.slice(1);       // Paraguay: 0981... → 595981...
  return d;
}
function slUrl(u){
  u = String(u||'').trim();
  if (!u) return '';
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  return 'https://' + u;
}

function slHref(b, c){
  const v = String(b.valor||'').trim();
  switch (b.tipo){
    case 'whatsapp': {
      const num = slNum(v || c.whatsapp || c.telefono);
      const msg = c.mensajeWA ? '?text=' + encodeURIComponent(c.mensajeWA) : '';
      return 'https://wa.me/' + num + msg;
    }
    case 'telefono': return 'tel:+' + slNum(v || c.telefono);
    case 'email':    return 'mailto:' + (v || c.email);
    case 'maps':     return /^https?:/i.test(v) || /^(www\.|maps\.|goo\.gl)/i.test(v) ? slUrl(v)
                       : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(v || c.direccion);
    case 'instagram':return /[./]/.test(v) ? slUrl(v) : 'https://instagram.com/' + v.replace('@','');
    case 'tiktok':   return /[./]/.test(v) ? slUrl(v) : 'https://tiktok.com/@' + v.replace('@','');
    case 'x':        return /[./]/.test(v) ? slUrl(v) : 'https://x.com/' + v.replace('@','');
    case 'telegram': return /[./]/.test(v) ? slUrl(v) : 'https://t.me/' + v.replace('@','');
    default:         return slUrl(v || (b.tipo==='web' ? c.web : ''));
  }
}

function slVCard(c){
  const L = ['BEGIN:VCARD','VERSION:3.0'];
  const parts = String(c.nombre||'').trim().split(/\s+/);
  const ape = parts.length>1 ? parts.slice(-1)[0] : '';
  const nom = parts.length>1 ? parts.slice(0,-1).join(' ') : parts[0]||'';
  L.push('N:' + ape + ';' + nom + ';;;');
  L.push('FN:' + (c.nombre||''));
  if (c.empresa) L.push('ORG:' + c.empresa);
  if (c.cargo)   L.push('TITLE:' + c.cargo);
  if (c.telefono)L.push('TEL;TYPE=CELL:+' + slNum(c.telefono));
  if (c.whatsapp && slNum(c.whatsapp)!==slNum(c.telefono)) L.push('TEL;TYPE=WORK:+' + slNum(c.whatsapp));
  if (c.email)   L.push('EMAIL;TYPE=INTERNET:' + c.email);
  if (c.web)     L.push('URL:' + slUrl(c.web));
  if (c.direccion) L.push('ADR;TYPE=WORK:;;' + c.direccion.replace(/[;,]/g,' ') + ';;;;');
  L.push('NOTE:Tarjeta digital: ' + (CONFIG.BASE_URL + '?c=' + c.slug));
  L.push('END:VCARD');
  return L.join('\r\n');
}

function slSaveContact(c){
  const blob = new Blob([slVCard(c)], {type:'text/vcard;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (c.nombre||'contacto').replace(/[^\wáéíóúñÁÉÍÓÚÑ ]/g,'').trim() + '.vcf';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
}

function slTrack(slug, det){
  try{ if (CONFIG.API_URL && !/PEGAR/.test(CONFIG.API_URL))
    fetch(CONFIG.API_URL+'?action=hit&s='+encodeURIComponent(slug)+'&d='+encodeURIComponent(det),{mode:'no-cors',keepalive:true});
  }catch(e){}
}

// Tipografías disponibles (Google Fonts) con sus pesos
const SL_FUENTES = {
  'Nunito':'400;600;800;900', 'Montserrat':'400;600;700;800;900', 'Poppins':'400;600;700;800;900',
  'Raleway':'400;600;700;800;900', 'Lato':'400;700;900', 'Roboto':'400;500;700;900',
  'Quicksand':'400;600;700', 'Josefin Sans':'400;600;700', 'Oswald':'400;500;600;700',
  'Bebas Neue':'400', 'Archivo Black':'400', 'Playfair Display':'400;600;700;800;900',
  'Cormorant Garamond':'400;600;700', 'Dancing Script':'400;600;700', 'Great Vibes':'400'
};
const _slFontsLoaded = {};
function _slLink(href){ const l=document.createElement('link'); l.rel='stylesheet'; l.href=href; document.head.appendChild(l); }
/**
 * Carga una fuente. Si no está en la lista:
 *  - con archivo (url) → la carga desde ese archivo (.woff2 / .woff / .ttf / .otf)
 *  - sin archivo → la busca en Google Fonts por su nombre
 */
function slLoadFont(f, url){
  if (!f) return;
  const key = f + '|' + (url||'');
  if (_slFontsLoaded[key]) return;
  _slFontsLoaded[key] = 1;
  const fam = f.replace(/ /g,'+');
  if (SL_FUENTES[f] && !url) return _slLink('https://fonts.googleapis.com/css2?family=' + fam + ':wght@' + SL_FUENTES[f] + '&display=swap');
  if (url && url.indexOf('drive:') === 0){
    // fuente propia guardada en el Drive de Grow (se pide al Apps Script)
    slApi({ action:'font', id:url.slice(6) }, 30000).then(r => {
        if (!r.ok) return;
        const bin = atob(r.base64), buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        const ff = new FontFace(f, buf.buffer);
        return ff.load().then(x => document.fonts.add(x));
      }).catch(() => {});
    return;
  }
  if (url){
    const fmt = /\.woff2(\?|$)/i.test(url) ? 'woff2' : /\.woff(\?|$)/i.test(url) ? 'woff' : /\.otf(\?|$)/i.test(url) ? 'opentype' : 'truetype';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'${f.replace(/'/g,'')}';src:url('${url.replace(/'/g,'%27')}') format('${fmt}');font-display:swap}`;
    document.head.appendChild(st);
    return;
  }
  // Google Fonts por nombre: versión normal + negrita (si la fuente no tiene negrita, se ignora)
  _slLink('https://fonts.googleapis.com/css2?family=' + fam + '&display=swap');
  _slLink('https://fonts.googleapis.com/css2?family=' + fam + ':wght@700&display=swap');
}

/** Valores por defecto del diseño (extra) */
function slX(c){
  const x = Object.assign({
    fuenteTitulo:'Nunito', fuenteTexto:'Nunito',
    logoSize:150, fotoSize:118, iconSize:40, btnScale:100,
    iconPos:'abajo', fondoModo: c.fondo ? 'imagen' : 'formas', overlay:45,
    galeria:[], galeriaTitulo:'', galeriaCols:2, fuentesPropias:[]
  }, (c.extra && typeof c.extra === 'object') ? c.extra : {});
  if (!Array.isArray(x.galeria)) x.galeria = [];
  return x;
}

/**
 * Dibuja la tarjeta.
 * @param {HTMLElement} el contenedor
 * @param {Object} c datos de la tarjeta
 * @param {Object} opt {preview:true} desactiva el registro de clics
 */
function renderCard(el, c, opt){
  opt = opt || {};
  const x = slX(c);
  const fps = Array.isArray(x.fuentesPropias) ? x.fuentesPropias : [];
  [x.fuenteTitulo, x.fuenteTexto].forEach(f => { const p = fps.find(z => z.nombre === f); slLoadFont(f, p && p.url); });
  const btns = Array.isArray(c.botones) ? c.botones : [];
  const iconos = btns.filter(b => b.modo === 'icono');
  const grandes = btns.filter(b => b.modo !== 'icono');
  const ini = String(c.nombre||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const vars = [
    '--c1:'+(c.color1||'#f5c400'), '--c2:'+(c.color2||'#e0e0e0'), '--c3:'+(c.color3||(c.tema==='claro'?'#ffffff':'#1c1c1e')),
    "--ft:'"+x.fuenteTitulo+"'", "--fb:'"+x.fuenteTexto+"'",
    '--logo:'+(+x.logoSize||150)+'px', '--foto:'+(+x.fotoSize||118)+'px', '--ic:'+(+x.iconSize||40)+'px',
    '--bs:'+((+x.btnScale||100)/100), '--ov:'+((+x.overlay||0)/100), '--gc:'+(+x.galeriaCols||2)
  ].join(';');

  let iconsH = '';
  if (iconos.length){
    iconsH += `<div class="sl-icons">`;
    iconos.forEach((b,i) => {
      const t = SL_TIPOS[b.tipo] || SL_TIPOS.link;
      iconsH += `<a class="sl-ic" data-k="i${i}" href="${slEsc(slHref(b,c))}" target="_blank" rel="noopener" title="${slEsc(b.etiqueta||t.n)}" style="color:${t.col}"><i class="${t.i}"></i></a>`;
    });
    iconsH += `</div>`;
  }

  let h = `<div class="sl-card ${c.tema==='claro'?'claro':''}" style="${slEsc(vars)}">`;
  if (x.fondoModo === 'imagen' && c.fondo) {
    h += `<div class="sl-bgimg" style="background-image:url('${slEsc(c.fondo)}')"></div><div class="sl-bgov"></div>`;
  } else if (x.fondoModo !== 'liso') {
    h += `<div class="sl-shape sl-glow"></div><div class="sl-shape sl-s1"></div><div class="sl-shape sl-s2"></div><div class="sl-shape sl-s3"></div><div class="sl-shape sl-s4"></div>`;
  }
  h += `<div class="sl-body">`;
  if (c.logo) h += `<img class="sl-logo" src="${slEsc(c.logo)}" alt="">`;
  if (c.foto) h += `<img class="sl-avatar" src="${slEsc(c.foto)}" alt="">`;
  else if (!c.logo) h += `<div class="sl-initials">${slEsc(ini)}</div>`;
  h += `<h1 class="sl-name">${slEsc(c.nombre||'Nombre')}</h1>`;
  if (c.cargo)   h += `<p class="sl-role">${slEsc(c.cargo)}</p>`;
  if (c.empresa) h += `<p class="sl-company">${slEsc(c.empresa)}</p>`;
  if (x.iconPos === 'arriba') h += iconsH;

  h += `<div class="sl-btns">`;
  h += `<button class="sl-btn p" data-k="vcf"><i class="fa-solid fa-address-book"></i> Guardar Contacto</button>`;
  grandes.forEach((b,i) => {
    const t = SL_TIPOS[b.tipo] || SL_TIPOS.link;
    h += `<a class="sl-btn ${b.estilo==='principal'?'p':'s'}" data-k="b${i}" href="${slEsc(slHref(b,c))}" target="_blank" rel="noopener"><i class="${t.i}"></i> ${slEsc(b.etiqueta||t.n)}</a>`;
  });
  h += `</div>`;
  if (x.iconPos !== 'arriba') h += iconsH;

  const gal = x.galeria.filter(g => g && g.url);
  if (gal.length){
    h += `<div class="sl-gal">${x.galeriaTitulo?`<h2>${slEsc(x.galeriaTitulo)}</h2>`:''}<div class="sl-grid">`;
    gal.forEach((g,i) => h += `<img src="${slEsc(g.url)}" data-g="${i}" alt="" loading="lazy">`);
    h += `</div></div>`;
  }
  h += `</div>`;
  h += `<div class="sl-foot">Tarjeta digital por <a href="${slEsc(CONFIG.MARCA_URL)}" target="_blank" rel="noopener">${slEsc(CONFIG.MARCA)}</a></div>`;
  h += `</div>`;
  el.innerHTML = h;

  el.querySelector('[data-k="vcf"]').onclick = () => { if(!opt.preview) slTrack(c.slug,'guardar'); slSaveContact(c); };
  el.querySelectorAll('[data-g]').forEach(img => img.onclick = () => {
    const lb = document.createElement('div'); lb.className = 'sl-lb';
    lb.innerHTML = `<b>&times;</b><img src="${slEsc(gal[+img.dataset.g].url)}">`;
    lb.onclick = () => lb.remove(); document.body.appendChild(lb);
  });
  if (!opt.preview){
    el.querySelectorAll('a[data-k]').forEach(a => {
      const k = a.dataset.k, list = k[0]==='i' ? iconos : grandes, b = list[+k.slice(1)];
      a.addEventListener('click', () => slTrack(c.slug, b ? b.tipo : 'link'));
    });
  }
}
