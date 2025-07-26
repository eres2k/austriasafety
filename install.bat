@echo off
setlocal enabledelayedexpansion

:: Create directories
mkdir netlify\functions

:: Write netlify.toml
(
echo [build]
echo   publish = "."
echo   functions = "netlify/functions"
echo.
echo [[redirects]]
echo   from = "/api/*"
echo   to = "/.netlify/functions/:splat"
echo   status = 200
) > netlify.toml

:: Write index.html
(
echo ^<!DOCTYPE html^>
echo ^<html lang="en"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>Audit Hub^</title^>
echo     ^<link rel="stylesheet" href="styles.css"^>
echo     ^<link rel="manifest" href="manifest.json"^>
echo     ^<script type="text/javascript" src="https://identity.netlify.com/v1/netlify-identity-widget.js"^>^</script^>
echo     ^<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"^>^</script^>
echo     ^<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"^>^</script^>
echo     ^<script src="https://cdn.jsdelivr.net/npm/uuid@9.0.1/dist/umd/uuidv4.min.js"^>^</script^>
echo     ^<script defer src="app.js"^>^</script^>
echo ^</head^>
echo ^<body^>
echo     ^<div data-netlify-identity-button^>Login with Netlify Identity^</div^>
echo     ^<header^>
echo         ^<h1^>Audit Hub^</h1^>
echo         ^<h2^>WHS SIFA Inspections^</h2^>
echo     ^</header^>
echo     ^<section^>
echo         ^<div^>
echo             ^<label^>Delivery Station^</label^>
echo             ^<select id="location"^>
echo                 ^<option^>DVI1^</option^>
echo                 ^<option^>DVI2^</option^>
echo                 ^<option^>DVI3^</option^>
echo                 ^<option^>DAP5^</option^>
echo                 ^<option^>DAP8^</option^>
echo             ^</select^>
echo         ^</div^>
echo         ^<div^>
echo             ^<label^>Inspection Type^</label^>
echo             ^<select id="inspection-type"^>
echo                 ^<option^>Select type...^</option^>
echo                 ^<!-- Templates loaded dynamically --^>
echo             ^</select^>
echo         ^</div^>
echo         ^<button id="start-inspection"^>Start New Inspection^</button^>
echo         ^<button id="edit-templates"^>Edit Templates^</button^>
echo     ^</section^>
echo     ^<section^>
echo         ^<div^>Pending: ^<span id="pending-count"^>0^</span^>^</div^>
echo         ^<div^>Completed: ^<span id="completed-count"^>0^</span^>^</div^>
echo     ^</section^>
echo     ^<section^>
echo         ^<button id="export-all"^>Export All^</button^>
echo         ^<button id="sync-all"^>Sync All^</button^>
echo         ^<button id="generate-qr"^>Generate QR Code^</button^>
echo         ^<button id="bulk-actions"^>Bulk Actions^</button^>
echo     ^</section^>
echo     ^<section id="inspection-form" style="display:none;"^>
echo         ^<h3^>Inspection Form^</h3^>
echo         ^<div^>
echo             ^<span^>Auto-save: ON^</span^>
echo             ^<button^>Viewer Mode^</button^>
echo             ^<button id="save-draft"^>Save Draft^</button^>
echo             ^<button id="export-pdf"^>Export PDF^</button^>
echo             ^<button id="submit-sync"^>Submit ^& Sync^</button^>
echo         ^</div^>
echo         ^<form id="audit-form"^>
echo             ^<label^>Auditor Name(s) *^</label^>
echo             ^<input type="text" id="auditor-name" required^>
echo             ^<label^>Inspection Date *^</label^>
echo             ^<input type="date" id="inspection-date" required^>
echo             ^<!-- Dynamic fields from template --^>
echo         ^</form^>
echo     ^</section^>
echo     ^<div id="qr-modal" style="display:none;"^>
echo         ^<div id="qr-code"^>^</div^>
echo         ^<button^>Close^</button^>
echo         ^<button^>Download^</button^>
echo     ^</div^>
echo ^</body^>
echo ^</html^>
) > index.html

:: Write styles.css
(
echo body { font-family: Arial, sans-serif; margin: 20px; }
echo header { text-align: center; }
echo section { margin: 20px 0; }
echo button { padding: 10px; margin: 5px; cursor: pointer; }
echo #qr-modal { position: fixed; top: 50%%; left: 50%%; transform: translate(-50%%, -50%%); background: white; padding: 20px; border: 1px solid black; }
) > styles.css

:: Write manifest.json
(
echo {
echo   "short_name": "Audit Hub",
echo   "name": "Audit Hub PWA",
echo   "icons": [
echo     {
echo       "src": "icon-192.png",
echo       "type": "image/png",
echo       "sizes": "192x192"
echo     },
echo     {
echo       "src": "icon-512.png",
echo       "type": "image/png",
echo       "sizes": "512x512"
echo     }
echo   ],
echo   "start_url": "/",
echo   "background_color": "#ffffff",
echo   "theme_color": "#000000",
echo   "display": "standalone"
echo }
) > manifest.json

:: Write service-worker.js
(
echo const CACHE_NAME = 'audit-hub-cache-v1';
echo const urlsToCache = [
echo   '/',
echo   '/index.html',
echo   '/styles.css',
echo   '/app.js',
echo   // Add other assets
echo ];
echo.
echo self.addEventListener('install', (event) => {
echo   event.waitUntil(
echo     caches.open(CACHE_NAME)
echo       .then((cache) => {
echo         return cache.addAll(urlsToCache);
echo       })
echo   );
echo });
echo.
echo self.addEventListener('fetch', (event) => {
echo   event.respondWith(
echo     caches.match(event.request)
echo       .then((response) => {
echo         return response || fetch(event.request);
echo       })
echo   );
echo });
echo.
echo self.addEventListener('sync', (event) => {
echo   if (event.tag === 'sync-inspections') {
echo     event.waitUntil(syncPendingInspections());
echo   }
echo });
echo.
echo async function syncPendingInspections() {
echo   // Logic to sync from IndexedDB to server
echo   const db = await openDB();
echo   const pending = await db.getAll('pending');
echo   for (const inspection of pending) {
echo     await fetch('/api/sync', { method: 'POST', body: JSON.stringify(inspection) });
echo     await db.delete('pending', inspection.id);
echo   }
echo }
) > service-worker.js

:: Write app.js
(
echo if ('serviceWorker' in navigator) {
echo   navigator.serviceWorker.register('/service-worker.js');
echo }
echo.
echo netlifyIdentity.on('init', user => {
echo   if (!user) {
echo     netlifyIdentity.open(); // Force login if not logged in
echo   }
echo });
echo.
echo netlifyIdentity.on('login', () => {
echo   loadApp();
echo });
echo.
echo function loadApp() {
echo   // Load templates from Blobs via function
echo   fetch('/api/templates')
echo     .then(res => res.json())
echo     .then(templates => {
echo       const select = document.getElementById('inspection-type');
echo       templates.forEach(t => {
echo         const option = document.createElement('option');
echo         option.text = t.name;
echo         select.add(option);
echo       });
echo     });
echo.
echo   // Stats
echo   updateStats();
echo.
echo   // Event listeners
echo   document.getElementById('start-inspection').addEventListener('click', startInspection);
echo   document.getElementById('edit-templates').addEventListener('click', editTemplates);
echo   document.getElementById('sync-all').addEventListener('click', syncAll);
echo   document.getElementById('export-pdf').addEventListener('click', exportPDF);
echo   document.getElementById('generate-qr').addEventListener('click', generateQR);
echo   document.getElementById('submit-sync').addEventListener('click', submitAndSync);
echo }
echo.
echo // IndexedDB setup
echo let db;
echo async function openDB() {
echo   if (!db) {
echo     db = await new Promise((resolve, reject) => {
echo       const request = indexedDB.open('AuditDB', 1);
echo       request.onupgradeneeded = (e) => {
echo         const db = e.target.result;
echo         db.createObjectStore('pending', { keyPath: 'id' });
echo         db.createObjectStore('completed', { keyPath: 'id' });
echo       };
echo       request.onsuccess = (e) => resolve(e.target.result);
echo       request.onerror = reject;
echo     });
echo   }
echo   return db;
echo }
echo.
echo async function updateStats() {
echo   const db = await openDB();
echo   const pendingCount = await db.count('pending');
echo   const completedCount = await db.count('completed');
echo   document.getElementById('pending-count').textContent = pendingCount;
echo   document.getElementById('completed-count').textContent = completedCount + await fetchCompletedCountFromServer();
echo }
echo.
echo async function fetchCompletedCountFromServer() {
echo   const res = await fetch('/api/fetch-inspections?status=completed');
echo   const data = await res.json();
echo   return data.length;
echo }
echo.
echo function startInspection() {
echo   const type = document.getElementById('inspection-type').value;
echo   if (type === 'Select type...') return;
echo   // Load template fields dynamically
echo   fetch(\`/api/templates?type=\${type}\`)
echo     .then(res => res.json())
echo     .then(template => {
echo       const form = document.getElementById('audit-form');
echo       form.innerHTML = ''; // Clear
echo       // Add default fields
echo       form.innerHTML += \`<label>Auditor Name(s) *</label><input type="text" id="auditor-name" required>\`;
echo       form.innerHTML += \`<label>Inspection Date *</label><input type="date" id="inspection-date" required>\`;
echo       // Add template fields
echo       template.fields.forEach(field => {
echo         form.innerHTML += \`<label>\${field.label}</label><input type="\${field.type}" name="\${field.name}">\`;
echo       });
echo       document.getElementById('inspection-form').style.display = 'block';
echo     });
echo   // Auto-save every 5s
echo   setInterval(autoSave, 5000);
echo }
echo.
echo function autoSave() {
echo   // Collect form data, save to IndexedDB as draft
echo }
echo.
echo function submitAndSync() {
echo   const data = collectFormData();
echo   saveToLocal('completed', data);
echo   if (navigator.onLine) {
echo     syncToServer(data);
echo   } else {
echo     navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-inspections'));
echo   }
echo }
echo.
echo async function syncToServer(data) {
echo   await fetch('/api/sync', {
echo     method: 'POST',
echo     headers: { 'Content-Type': 'application/json' },
echo     body: JSON.stringify(data)
echo   });
echo }
echo.
echo function collectFormData() {
echo   const id = uuid.v4();
echo   return {
echo     id,
echo     location: document.getElementById('location').value,
echo     type: document.getElementById('inspection-type').value,
echo     auditor: document.getElementById('auditor-name').value,
echo     date: document.getElementById('inspection-date').value,
echo     // Other fields
echo   };
echo }
echo.
echo async function saveToLocal(store, data) {
echo   const db = await openDB();
echo   const tx = db.transaction(store, 'readwrite');
echo   tx.objectStore(store).add(data);
echo   await tx.done;
echo   updateStats();
echo }
echo.
echo function exportPDF() {
echo   const { jsPDF } = window.jspdf;
echo   const doc = new jsPDF();
echo   doc.html(document.getElementById('audit-form'), {
echo     callback: function (doc) {
echo       doc.save('inspection.pdf');
echo     },
echo     x: 10,
echo     y: 10
echo   });
echo }
echo.
echo function generateQR() {
echo   const url = window.location.href;
echo   QRCode.toCanvas(document.getElementById('qr-code'), url, (err) => {
echo     if (err) console.error(err);
echo   });
echo   document.getElementById('qr-modal').style.display = 'block';
echo   // Close and download logic
echo }
echo.
echo function syncAll() {
echo   // Sync all pending
echo }
echo.
echo function editTemplates() {
echo   // UI to edit and save templates to Blobs via function
echo }
echo.
echo // More functions as needed
) > app.js

:: Write netlify/functions/sync.js
(
echo const { getStore } = require('@netlify/blobs');
echo.
echo exports.handler = async (event) => {
echo   if (event.httpMethod !== 'POST') return { statusCode: 405 };
echo   const data = JSON.parse(event.body);
echo   const store = getStore('inspections');
echo   await store.setJSON(data.id, data);
echo   return { statusCode: 200, body: 'Synced' };
echo };
) > netlify\functions\sync.js

:: Write netlify/functions/fetch-inspections.js
(
echo const { getStore } = require('@netlify/blobs');
echo.
echo exports.handler = async (event) => {
echo   const store = getStore('inspections');
echo   const { keys } = await store.list();
echo   const inspections = await Promise.all(keys.map(async (key) => await store.get(key, { type: 'json' })));
echo   return { statusCode: 200, body: JSON.stringify(inspections) };
echo };
) > netlify\functions\fetch-inspections.js

:: Write netlify/functions/templates.js
(
echo const { getStore } = require('@netlify/blobs');
echo.
echo exports.handler = async (event) => {
echo   // Handle GET for listing, POST for saving templates
echo   const store = getStore('templates');
echo   if (event.httpMethod === 'GET') {
echo     const { keys } = await store.list();
echo     const templates = await Promise.all(keys.map(async (key) => await store.get(key, { type: 'json' })));
echo     return { statusCode: 200, body: JSON.stringify(templates) };
echo   } else if (event.httpMethod === 'POST') {
echo     const data = JSON.parse(event.body);
echo     await store.setJSON(data.name, data);
echo     return { statusCode: 200, body: 'Template saved' };
echo   }
echo   return { statusCode: 405 };
echo };
) > netlify\functions\templates.js

:: Write package.json
(
echo {
echo   "name": "audit-hub",
echo   "version": "1.0.0",
echo   "dependencies": {
echo     "@netlify/blobs": "^7.0.0",
echo     "@netlify/functions": "^2.0.0"
echo   }
echo }
) > package.json

echo Project files created successfully. Now install Node.js as previously instructed, then run "npm install" to install dependencies.