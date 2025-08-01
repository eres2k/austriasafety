// app-fixed.js - Replace your app.js with this fixed version
// This version ensures proper initialization and event binding

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Aurora Audit Platform initializing...');
    
    // Global State Management
    window.state = {
        user: null,
        currentSection: 'dashboard',
        currentInspection: null,
        currentCategory: null,
        inspectionData: {},
        templates: [],
        pendingSync: [],
        settings: {
            autoSave: true,
            darkMode: true,
            notifications: true,
            syncInterval: 5000
        }
    };

    // Initialize immediately if no Netlify Identity
    if (!window.netlifyIdentity) {
        console.warn('⚠️ Netlify Identity not found, using demo mode');
        window.state.user = { 
            email: 'demo@test.com', 
            user_metadata: { full_name: 'Demo User' } 
        };
        initializeAppDirect();
    } else {
        // Initialize with Netlify Identity
        initAuthWithFallback();
    }
});

// Direct initialization function
function initializeAppDirect() {
    console.log('📱 Direct initialization starting...');
    
    // Cache DOM elements
    cacheElements();
    
    // Setup all event listeners
    setupAllEventListeners();
    
    // Initialize view
    initializeView();
    
    // Load templates
    loadDefaultTemplates();
    
    // Update UI
    updateUserUI(window.state.user);
    updateDashboardStats();
    
    console.log('✅ App initialized successfully!');
}

// Cache all DOM elements
function cacheElements() {
    window.elements = {
        // Navigation
        navDashboard: document.getElementById('nav-dashboard'),
        navInspections: document.getElementById('nav-inspections'),
        navReports: document.getElementById('nav-reports'),
        navAnalytics: document.getElementById('nav-analytics'),
        
        // Mobile navigation
        mobileNavItems: document.querySelectorAll('.mobile-nav-item[data-section]'),
        
        // Sidebar
        sidebar: document.getElementById('sidebar'),
        sidebarOverlay: document.getElementById('sidebar-overlay'),
        mobileMenuBtn: document.getElementById('mobile-menu-btn'),
        closeSidebarBtn: document.getElementById('close-sidebar-btn'),
        
        // Main buttons
        startInspectionBtn: document.getElementById('start-inspection-btn'),
        mobileNewInspectionBtn: document.getElementById('mobile-new-inspection'),
        
        // Form elements
        deliveryStationSelect: document.getElementById('delivery-station-select'),
        inspectionTypeSelect: document.getElementById('inspection-type-select'),
        
        // Form buttons
        saveDraftBtn: document.getElementById('save-draft-btn'),
        exportPdfBtn: document.getElementById('export-pdf-btn'),
        submitInspectionBtn: document.getElementById('submit-inspection-btn'),
        
        // Quick action buttons
        importQuestionsBtn: document.getElementById('import-questions-btn'),
        exportQuestionsBtn: document.getElementById('export-questions-btn'),
        exportReportsBtn: document.getElementById('export-reports-btn'),
        syncDataBtn: document.getElementById('sync-data-btn'),
        settingsBtn: document.getElementById('settings-btn'),
        helpBtn: document.getElementById('help-btn'),
        
        // Other elements
        userMenu: document.getElementById('user-menu'),
        actionSheet: document.getElementById('mobile-action-sheet'),
        pendingList: document.getElementById('pending-list'),
        completedList: document.getElementById('completed-list')
    };
    
    console.log('📦 Elements cached:', Object.keys(window.elements).length);
}

// Setup all event listeners
function setupAllEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    // Desktop navigation
    if (window.elements.navDashboard) {
        window.elements.navDashboard.addEventListener('click', () => setActiveSection('dashboard'));
    }
    if (window.elements.navInspections) {
        window.elements.navInspections.addEventListener('click', () => setActiveSection('inspections'));
    }
    if (window.elements.navReports) {
        window.elements.navReports.addEventListener('click', () => setActiveSection('reports'));
    }
    if (window.elements.navAnalytics) {
        window.elements.navAnalytics.addEventListener('click', () => setActiveSection('analytics'));
    }
    
    // Mobile navigation
    window.elements.mobileNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const section = this.dataset.section;
            if (section) {
                setActiveSection(section);
                
                // Update active state
                window.elements.mobileNavItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // Mobile menu
    if (window.elements.mobileMenuBtn) {
        window.elements.mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    if (window.elements.closeSidebarBtn) {
        window.elements.closeSidebarBtn.addEventListener('click', closeMobileMenu);
    }
    if (window.elements.sidebarOverlay) {
        window.elements.sidebarOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // Main action buttons
    if (window.elements.startInspectionBtn) {
        window.elements.startInspectionBtn.addEventListener('click', startNewInspection);
    }
    if (window.elements.mobileNewInspectionBtn) {
        window.elements.mobileNewInspectionBtn.addEventListener('click', showActionSheet);
    }
    
    // Form action buttons
    if (window.elements.saveDraftBtn) {
        window.elements.saveDraftBtn.addEventListener('click', saveDraft);
    }
    if (window.elements.exportPdfBtn) {
        window.elements.exportPdfBtn.addEventListener('click', exportToPDF);
    }
    if (window.elements.submitInspectionBtn) {
        window.elements.submitInspectionBtn.addEventListener('click', submitInspection);
    }
    
    // Quick action buttons
    if (window.elements.importQuestionsBtn) {
        window.elements.importQuestionsBtn.addEventListener('click', importData);
    }
    if (window.elements.exportQuestionsBtn) {
        window.elements.exportQuestionsBtn.addEventListener('click', exportData);
    }
    if (window.elements.exportReportsBtn) {
        window.elements.exportReportsBtn.addEventListener('click', exportReports);
    }
    if (window.elements.syncDataBtn) {
        window.elements.syncDataBtn.addEventListener('click', syncData);
    }
    if (window.elements.settingsBtn) {
        window.elements.settingsBtn.addEventListener('click', () => setActiveSection('settings'));
    }
    if (window.elements.helpBtn) {
        window.elements.helpBtn.addEventListener('click', showHelp);
    }
    
    // Action sheet
    const actionSheetBackdrop = document.querySelector('.action-sheet-backdrop');
    const actionSheetCancel = document.querySelector('.action-sheet-cancel');
    
    if (actionSheetBackdrop) {
        actionSheetBackdrop.addEventListener('click', hideActionSheet);
    }
    if (actionSheetCancel) {
        actionSheetCancel.addEventListener('click', hideActionSheet);
    }
    
    // Action sheet options
    document.querySelectorAll('.action-sheet-option').forEach(option => {
        option.addEventListener('click', function(e) {
            const action = this.dataset.action;
            handleActionSheetOption(action);
            hideActionSheet();
        });
    });
    
    console.log('✅ Event listeners attached');
}

// Initialize view
function initializeView() {
    // Hide all sections
    document.querySelectorAll('[data-section]').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    
    // Show dashboard
    setActiveSection('dashboard');
}

// Section management
function setActiveSection(section) {
    console.log('📍 Navigating to:', section);
    
    // Hide all sections
    document.querySelectorAll('[data-section]').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    
    // Show selected section
    const sectionEl = document.querySelector(`[data-section="${section}"]`);
    if (sectionEl) {
        sectionEl.style.display = 'block';
        sectionEl.classList.add('active');
        
        // Update navigation active states
        updateNavigation(section);
        
        // Close mobile menu if open
        if (window.innerWidth <= 1024) {
            closeMobileMenu();
        }
        
        // Load section-specific content
        switch (section) {
            case 'dashboard':
                updateDashboardStats();
                break;
            case 'inspections':
                showInspectionOverview();
                break;
            case 'reports':
                renderReports();
                break;
            case 'analytics':
                renderAnalytics();
                break;
            case 'settings':
                renderSettings();
                break;
        }
        
        window.state.currentSection = section;
    }
}

// Update navigation active states
function updateNavigation(section) {
    // Desktop nav
    const navItems = {
        dashboard: window.elements.navDashboard,
        inspections: window.elements.navInspections,
        reports: window.elements.navReports,
        analytics: window.elements.navAnalytics
    };
    
    Object.entries(navItems).forEach(([key, element]) => {
        if (element) {
            element.classList.toggle('active', key === section);
        }
    });
    
    // Mobile nav
    window.elements.mobileNavItems.forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });
}

// Mobile menu functions
function toggleMobileMenu() {
    window.elements.sidebar?.classList.toggle('active');
    window.elements.sidebarOverlay?.classList.toggle('active');
    window.elements.mobileMenuBtn?.classList.toggle('active');
}

function closeMobileMenu() {
    window.elements.sidebar?.classList.remove('active');
    window.elements.sidebarOverlay?.classList.remove('active');
    window.elements.mobileMenuBtn?.classList.remove('active');
}

// Action sheet functions
function showActionSheet() {
    window.elements.actionSheet?.classList.add('active');
}

function hideActionSheet() {
    window.elements.actionSheet?.classList.remove('active');
}

function handleActionSheetOption(action) {
    switch (action) {
        case 'new-inspection':
            startNewInspection();
            break;
        case 'import':
            importData();
            break;
        case 'export':
            exportData();
            break;
        case 'sync':
            syncData();
            break;
    }
}

// Main functions
function startNewInspection() {
    console.log('🆕 Starting new inspection...');
    
    const location = window.elements.deliveryStationSelect?.value;
    const type = window.elements.inspectionTypeSelect?.value;
    
    if (!type || type === 'Select inspection type...') {
        showNotification('Please select an inspection type', 'warning');
        return;
    }
    
    showNotification('Starting new inspection...', 'info');
    
    // Create inspection object
    window.state.currentInspection = {
        id: generateUUID(),
        location: location,
        type: type,
        date: new Date().toISOString(),
        auditor: window.state.user.email,
        status: 'pending',
        responses: {},
        comments: {}
    };
    
    // Navigate to inspection form
    setActiveSection('inspections');
}

// Placeholder functions
function saveDraft() {
    showNotification('Draft saved', 'success');
}

function exportToPDF() {
    showNotification('Generating PDF...', 'info');
}

function submitInspection() {
    showNotification('Submitting inspection...', 'info');
}

function importData() {
    showNotification('Import feature coming soon', 'info');
}

function exportData() {
    showNotification('Export feature coming soon', 'info');
}

function exportReports() {
    showNotification('Exporting reports...', 'info');
}

function syncData() {
    showNotification('Syncing data...', 'info');
}

function showHelp() {
    showNotification('Help section coming soon', 'info');
}

function showInspectionOverview() {
    const questionsSection = document.getElementById('questions-section');
    if (questionsSection) {
        questionsSection.innerHTML = '<p style="padding: 20px;">Select an inspection type to begin.</p>';
    }
}

function renderReports() {
    const container = document.getElementById('reports-container');
    if (container) {
        container.innerHTML = '<p style="padding: 20px;">No reports available yet.</p>';
    }
}

function renderAnalytics() {
    // Analytics implementation
}

function renderSettings() {
    const section = document.querySelector('[data-section="settings"]');
    if (section) {
        section.innerHTML = `
            <div class="content-card">
                <div class="content-header">
                    <h2 class="content-title">
                        <i class="fas fa-cog"></i>
                        Settings
                    </h2>
                </div>
                <div style="padding: 20px;">
                    <p>Settings page coming soon...</p>
                </div>
            </div>
        `;
    }
}

// Update functions
function updateUserUI(user) {
    const initials = user.user_metadata?.full_name
        ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
        : user.email.substring(0, 2).toUpperCase();
    
    document.querySelectorAll('.user-avatar, .user-avatar-large').forEach(el => {
        el.textContent = initials;
    });
}

function updateDashboardStats() {
    console.log('📊 Updating dashboard stats...');
    // Update with dummy data for now
    loadPendingInspections();
    loadCompletedInspections();
}

function loadPendingInspections() {
    const list = window.elements.pendingList;
    if (list) {
        list.innerHTML = '<li class="list-item">No pending inspections</li>';
    }
}

function loadCompletedInspections() {
    const list = window.elements.completedList;
    if (list) {
        list.innerHTML = '<li class="list-item">No completed inspections yet</li>';
    }
}

// Load default templates
function loadDefaultTemplates() {
    window.state.templates = [
        { id: 'general-safety', name: 'General Safety Inspection' },
        { id: 'fire-safety', name: 'Fire Safety Audit' },
        { id: 'equipment-check', name: 'Equipment Check' },
        { id: 'emergency-procedures', name: 'Emergency Procedures' },
        { id: 'environmental-compliance', name: 'Environmental Compliance' }
    ];
    
    updateTemplateSelects();
}

function updateTemplateSelects() {
    const select = window.elements.inspectionTypeSelect;
    if (select) {
        select.innerHTML = '<option>Select inspection type...</option>';
        window.state.templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            select.appendChild(option);
        });
    }
}

// Utility functions
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `notification notification-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Auth initialization with fallback
function initAuthWithFallback() {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on('init', user => {
            if (!user) {
                console.log('🔐 No user logged in, opening login...');
                window.netlifyIdentity.on('login', () => {
                    document.location.reload();
                });
                // Don't force login for testing
                // window.netlifyIdentity.open();
                
                // Use demo mode instead
                window.state.user = { 
                    email: 'demo@test.com', 
                    user_metadata: { full_name: 'Demo User' } 
                };
                initializeAppDirect();
            } else {
                window.state.user = user;
                initializeAppDirect();
            }
        });
        
        window.netlifyIdentity.init();
    }
}

// Global function exposure
window.setActiveSection = setActiveSection;
window.startNewInspection = startNewInspection;
window.showNotification = showNotification;
window.handleQuestionResponse = () => showNotification('Question response handler', 'info');
window.handleCommentChange = () => showNotification('Comment change handler', 'info');
window.showCategoryQuestions = () => showNotification('Category questions', 'info');
window.showInspectionOverview = showInspectionOverview;

// Add required animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('✅ App script loaded and ready');
