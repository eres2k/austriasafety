# Amazon Austria WHS SIFA Audit Platform

A modern, serverless digital audit platform for Workplace Health & Safety (WHS) SIFA site inspections at Amazon Austria delivery stations.

## Features

- 🏢 Multi-location support (DVI1, DVI2, DVI3, DAP5, DAP8)
- 👥 Multi-auditor collaboration
- 📱 Mobile-first PWA with offline support
- 🎙️ Voice input capabilities
- 📷 Media capture and AI analysis
- 📊 Real-time analytics dashboard
- 🎮 Gamification elements
- 📄 PDF report generation
- 🔒 GDPR compliant

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Tailwind CSS
- **Backend**: Netlify Functions (Serverless)
- **Storage**: Netlify Blobs
- **PWA**: Service Workers + IndexedDB

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/amazon-whs-audit-platform.git
   cd amazon-whs-audit-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Deploy to Netlify:
   ```bash
   netlify deploy --prod
   ```

## License

This project is proprietary and confidential.

## Support

For support, contact the WHS team at whs-tech@amazon.at