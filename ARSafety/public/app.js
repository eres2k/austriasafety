// Main App
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
        document.getElementById('mainContent').innerHTML = `
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
        `;

        // Add basic styles
        const style = document.createElement('style');
        style.textContent = `
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
        `;
        document.head.appendChild(style);
    }
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WHSAuditApp();
});