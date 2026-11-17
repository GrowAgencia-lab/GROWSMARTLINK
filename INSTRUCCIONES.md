# Smart Link · Grow Agencia Creativa — Instalación

## 1. Google Sheet + Apps Script
1. Creá un Google Sheet nuevo: **SmartLinks Grow**.
2. Extensiones → Apps Script → pegá **Code.gs** completo.
3. Cambiá `ADMIN_KEY` (tu clave del panel).
4. Elegí la función `setup` → Ejecutar → aceptá permisos (crea las hojas Tarjetas, QRs, Clics y la carpeta de imágenes en Drive).
5. Implementar → Nueva implementación → **App web** → Ejecutar como: **Yo** · Acceso: **Cualquier persona** → copiá la URL `/exec`.

## 2. GitHub Pages
1. Repo nuevo, por ej. `GrowAgencia-lab/smartlink` (público).
2. Subí: `index.html`, `admin.html`, `q.html`, `card.js`, `card.css`, `config.js`.
3. En **config.js** pegá la URL `/exec` en `API_URL`.
4. Settings → Pages → Branch `main` / root → Save.

## 3. Links
- Panel: `https://growagencia-lab.github.io/smartlink/admin.html`
- Tarjeta: `https://growagencia-lab.github.io/smartlink/?c=nombre-cliente`
- QR dinámico: `https://growagencia-lab.github.io/smartlink/q.html?c=nombre-qr`

## Notas
- Si cambiás Code.gs: Implementar → Gestionar implementaciones → editar → **Nueva versión** (así la URL no cambia).
- Tarjeta vencida o pausada → muestra "Tarjeta inactiva". Al renovar, cambiá la fecha y vuelve a funcionar con el mismo QR.
- Nunca cambies el link (slug) de una tarjeta ya impresa: el QR dejaría de funcionar.
