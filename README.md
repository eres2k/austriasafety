# WHS SIFA Audit Platform (Advanced)

A state-of-the-art, serverless audit tool for Amazon Austria WHS SIFA inspections, covering DVI1, DVI2, DVI3, DAP5, and DAP8.

## Features

- React + Tailwind CSS UI (dark mode & light toggle)
- Modular React components: Sidebar, Audit Form, Dashboard, Template Builder
- Drag & drop checklist designer (`react-beautiful-dnd`)
- Voice-to-text inputs (Web Speech API)
- Offline support with IndexedDB sync
- PDF export via Netlify Functions + PDFKit
- Audit history, versioning, and analytics
- Deploy on Netlify (zero backend servers)

## Setup

```bash
npm install
npm run build:css
npm run dev
```

Open http://localhost:8888

## Deploy

Connect to Netlify and set build command to `npm run build && netlify deploy --prod` with publish directory `public`.
