// ===== CONFIGURACIÓN SMART LINK – Grow Agencia Creativa =====
// Pegá acá la URL de tu App web de Apps Script (termina en /exec)
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbzsLEf2kxvQpEOx7auA9uJb7kPwK961gkGiJwfDPI2bp3GQUfcJDoxaLS3L-7MmlOmr/exec',
  MARCA: 'Grow Agencia Creativa',
  MARCA_URL: 'https://instagram.com/keku1208',
  MARCA_WA: '595971393233'
};
// Carpeta base del sitio (se calcula sola)
CONFIG.BASE_URL = location.href.split('?')[0].split('#')[0].replace(/[^/]*$/, '');
