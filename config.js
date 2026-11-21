// ===== CONFIGURACIÓN SMART LINK – Grow Agencia Creativa =====
// Pegá acá la URL de tu App web de Apps Script (termina en /exec)
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbx0bn_KeW66A7Vp1BM-lA6BmV_Pul0he9gyShxctXFu7pH6Kp7T6LiX5pTi8xWiYLy8/exec',
  MARCA: 'Grow Agencia Creativa',
  MARCA_URL: 'https://instagram.com/keku1208',
  MARCA_WA: '595971393233'
};
// Carpeta base del sitio (se calcula sola)
CONFIG.BASE_URL = location.href.split('?')[0].split('#')[0].replace(/[^/]*$/, '');

// Consulta al servidor de forma compatible con todos los celulares (JSONP)
function slApi(params, timeoutMs){
  return new Promise((ok, ko) => {
    const cb = 'slcb_' + Date.now() + '_' + Math.floor(Math.random()*1e6);
    const sc = document.createElement('script');
    const t = setTimeout(() => { clean(); ko(new Error('El servidor tardó demasiado')); }, timeoutMs || 20000);
    function clean(){ clearTimeout(t); try{ delete window[cb]; }catch(e){ window[cb]=undefined; } sc.remove(); }
    window[cb] = (data) => { clean(); ok(data); };
    sc.onerror = () => { clean(); ko(new Error('No se pudo contactar al servidor')); };
    const q = new URLSearchParams(Object.assign({}, params, { callback: cb })).toString();
    sc.src = CONFIG.API_URL + '?' + q;
    document.head.appendChild(sc);
  });
}
