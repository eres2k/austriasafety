#!/usr/bin/env node

/**
 * WHS Audit AR Platform - Automatic File Generator
 * Run this script to create all files automatically
 * Usage: node create-whs-audit.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Creating WHS Audit AR Platform...\n');

// Define all files and their content
const files = {
  'package.json': `{
  "name": "whs-audit-ar",
  "version": "2.0.0",
  "description": "Advanced WHS Digital Audit Platform with AR for Amazon Austria",
  "type": "module",
  "scripts": {
    "dev": "netlify dev",
    "build": "echo 'No build step required'",
    "deploy": "netlify deploy --prod",
    "start": "npx serve public"
  },
  "dependencies": {
    "@netlify/blobs": "^7.0.0",
    "@netlify/functions": "^2.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "netlify-cli": "^17.0.0"
  }
}`,

  '.gitignore': `node_modules/
.env
.netlify/
dist/
.DS_Store
*.log
coverage/`,

  'netlify.toml': `[build]
  publish = "public"
  functions = "netlify/functions"

[dev]
  port = 8888

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"`,

  '.env.example': `JWT_SECRET=your-secret-key-here
NETLIFY_SITE_ID=your-site-id
AR_API_KEY=your-ar-api-key`,

  'README.md': `# WHS Audit Platform AR

Advanced digital safety inspection platform with AR for Amazon Austria.

## Quick Start
\`\`\`bash
npm install
npm run dev
\`\`\`

## Deploy
\`\`\`bash
npm run deploy
\`\`\``,

  'public/index.html': `<!DOCTYPE html>
<html lang="de-AT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WHS Audit Platform AR</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="manifest" href="manifest.json">
</head>
<body>
    <div id="app">
        <div class="loading-screen" id="loadingScreen">
            <div class="loading-content">
                <svg class="logo" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#00d4ff" stroke-width="4"/>
                    <path d="M60 100 L85 125 L140 70" fill="none" stroke="#00d4ff" stroke-width="8"/>
                </svg>
                <h1>WHS Audit Platform</h1>
                <div class="loading-bar"><div class="loading-progress"></div></div>
            </div>
        </div>
        <nav class="navbar" id="navbar">
            <div class="nav-container">
                <div class="nav-brand">WHS Audit AR</div>
                <div class="nav-menu" id="navMenu"></div>
            </div>
        </nav>
        <main class="main-content" id="mainContent"></main>
        <button class="voice-button" id="voiceButton">🎙️</button>
        <button class="ar-button" id="arButton">🔍</button>
        <div class="ar-overlay" id="arOverlay">
            <video id="arVideo" autoplay playsinline></video>
            <canvas id="arCanvas"></canvas>
            <div class="ar-controls">
                <button id="arCapture">📸</button>
                <button id="arClose">✕</button>
            </div>
        </div>
    </div>
    <script type="module" src="app.js"></script>
</body>
</html>`,

  'public/styles.css': `:root {
    --bg-primary: #0a0a0a;
    --bg-secondary: #1a1a1a;
    --text-primary: #e0e0e0;
    --accent-primary: #00d4ff;
    --success: #00ff88;
    --danger: #ff3366;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
}

.loading-screen {
    position: fixed;
    inset: 0;
    background: var(--bg-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.logo {
    width: 120px;
    height: 120px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

.loading-bar {
    width: 200px;
    height: 4px;
    background: #333;
    margin: 20px auto;
    border-radius: 2px;
}

.loading-progress {
    height: 100%;
    background: var(--accent-primary);
    animation: loading 2s forwards;
}

@keyframes loading {
    to { width: 100%; }
}

.navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: var(--bg-secondary);
    padding: 1rem;
    z-index: 1000;
    transform: translateY(-100%);
    transition: transform 0.3s;
}

.navbar.active {
    transform: translateY(0);
}

.main-content {
    margin-top: 70px;
    padding: 2rem;
    min-height: calc(100vh - 70px);
}

.voice-button, .ar-button {
    position: fixed;
    bottom: 2rem;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    font-size: 24px;
    transition: all 0.3s;
}

.voice-button {
    right: 7rem;
    background: var(--accent-primary);
}

.ar-button {
    right: 2rem;
    background: #9d4edd;
}

.ar-overlay {
    position: fixed;
    inset: 0;
    background: black;
    display: none;
    z-index: 2000;
}

.ar-overlay.active {
    display: block;
}

#arVideo {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

#arCanvas {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.ar-controls {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 1rem;
}

.ar-controls button {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid white;
    font-size: 24px;
    cursor: pointer;
}`,

  'public/app.js': `// Main App
import { VoiceController } from './modules/voice.js';
import { ARController } from './modules/ar.js';

class WHSAuditApp {
    constructor() {
        this.voice = new VoiceController();
        this.ar = new ARController();
        this.init();
    }

    async init() {
        console.log('🚀 WHS Audit AR Platform starting...');
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('navbar').classList.add('active');
        }, 2000);

        // Initialize modules
        this.voice.init();
        this.ar.init();
        
        // Setup event listeners
        document.getElementById('voiceButton').addEventListener('click', () => {
            this.voice.toggle();
        });
        
        document.getElementById('arButton').addEventListener('click', () => {
            this.ar.start();
        });
        
        // Load dashboard
        document.getElementById('mainContent').innerHTML = \`
            <div class="dashboard">
                <h1>WHS Safety Dashboard</h1>
                <div class="stats-grid">
                    <div class="card">
                        <h3>Inspections Today</h3>
                        <p class="stat-value">12</p>
                    </div>
                    <div class="card">
                        <h3>Open Issues</h3>
                        <p class="stat-value">8</p>
                    </div>
                    <div class="card">
                        <h3>Compliance</h3>
                        <p class="stat-value">98%</p>
                    </div>
                </div>
                <button class="btn" onclick="alert('Starting new inspection...')">
                    New Inspection
                </button>
            </div>
        \`;

        // Add basic styles
        const style = document.createElement('style');
        style.textContent = \`
            .dashboard { text-align: center; }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin: 2rem 0;
            }
            .card {
                background: var(--bg-secondary);
                padding: 1.5rem;
                border-radius: 8px;
                border: 1px solid #333;
            }
            .stat-value {
                font-size: 2rem;
                font-weight: bold;
                color: var(--accent-primary);
            }
            .btn {
                background: var(--accent-primary);
                color: black;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                font-weight: bold;
            }
        \`;
        document.head.appendChild(style);
    }
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WHSAuditApp();
});`,

  'public/manifest.json': `{
    "name": "WHS Audit Platform AR",
    "short_name": "WHS AR",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0a0a0a",
    "theme_color": "#00d4ff",
    "icons": [
        {
            "src": "/icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        }
    ]
}`,

  'public/sw.js': `// Service Worker
const CACHE_NAME = 'whs-audit-v1';
const urlsToCache = ['/', '/index.html', '/styles.css', '/app.js'];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});`,

  'public/modules/voice.js': `// Voice Controller
export class VoiceController {
    constructor() {
        this.recognition = null;
        this.isListening = false;
    }

    init() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.lang = 'de-AT';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                console.log('Voice input:', transcript);
                this.handleCommand(transcript.toLowerCase());
            };
        }
    }

    handleCommand(command) {
        if (command.includes('neue inspektion')) {
            alert('Starting new inspection...');
        } else if (command.includes('foto')) {
            alert('Taking photo...');
        }
    }

    toggle() {
        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            document.getElementById('voiceButton').style.background = '#00d4ff';
        } else {
            this.recognition.start();
            this.isListening = true;
            document.getElementById('voiceButton').style.background = '#00ff88';
        }
    }
}`,

  'public/modules/ar.js': `// AR Controller
export class ARController {
    constructor() {
        this.stream = null;
        this.isActive = false;
    }

    init() {
        document.getElementById('arClose').addEventListener('click', () => this.stop());
        document.getElementById('arCapture').addEventListener('click', () => this.capture());
    }

    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            
            const video = document.getElementById('arVideo');
            video.srcObject = this.stream;
            
            document.getElementById('arOverlay').classList.add('active');
            this.isActive = true;
            
            console.log('AR mode activated');
        } catch (error) {
            console.error('Camera error:', error);
            alert('Camera access denied');
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        document.getElementById('arOverlay').classList.remove('active');
        this.isActive = false;
    }

    capture() {
        alert('Photo captured!');
    }
}`,

  'netlify/functions/health.js': `// Health Check Function
export default async (req) => {
    return new Response(JSON.stringify({ 
        status: 'ok',
        timestamp: new Date().toISOString()
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
};`,

  'netlify/functions/auth.js': `// Auth Function
export default async (req) => {
    const { method } = req;
    
    if (method === 'POST') {
        // Mock authentication
        return new Response(JSON.stringify({
            token: 'mock-jwt-token',
            user: {
                id: '1',
                name: 'Test User',
                email: 'test@amazon.com'
            }
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
    
    return new Response('Method not allowed', { status: 405 });
};`
};

// Create directories
const directories = [
  'public',
  'public/modules',
  'netlify',
  'netlify/functions'
];

console.log('📁 Creating directories...');
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`   ✓ Created ${dir}/`);
  }
});

// Create files
console.log('\n📄 Creating files...');
Object.entries(files).forEach(([filename, content]) => {
  fs.writeFileSync(filename, content.trim());
  console.log(`   ✓ Created ${filename}`);
});

// Create empty icon files referenced in manifest
fs.writeFileSync('public/icon-192.png', '');
console.log('   ✓ Created public/icon-192.png (placeholder)');

console.log('\n✅ WHS Audit AR Platform created successfully!\n');
console.log('Next steps:');
console.log('1. Run: npm install');
console.log('2. Run: npm run dev');
console.log('3. Open: http://localhost:8888');
console.log('\nTo deploy:');
console.log('1. Run: netlify login');
console.log('2. Run: netlify init');
console.log('3. Run: npm run deploy');
console.log('\n🚀 Happy auditing!\n');