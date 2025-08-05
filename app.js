// app.js - Aurora Audit Platform with Blob Storage Integration
// Complete application with secure data persistence

// Import blob storage module
import BlobStorage from './blob-storage.js';

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

    // Initialize blob storage
    window.blobStorage = new BlobStorage();
    
    // Initialize with Netlify Identity or demo mode
    if (!window.netlifyIdentity) {
        console.warn('⚠️ Netlify Identity not found, using demo mode');
        window.state.user = { 
            email: 'demo@test.com',
            id: 'demo-user-001',
            user_metadata: { full_name: 'Demo User' } 
        };
        initializeApp();
    } else {
        initializeNetlifyAuth();
    }
});

// Initialize Netlify Identity
function initializeNetlifyAuth() {
    window.netlifyIdentity.on('init', user => {
        if (!user) {
            console.log('🔐 No user logged in');
            window.netlifyIdentity.open();
            window.netlifyIdentity.on('login', (user) => {
                window.state.user = user;
                initializeApp();
            });
        } else {
            window.state.user = user;
            initializeApp();
        }
    });
    
    window.netlifyIdentity.on('logout', () => {
        window.location.reload();
    });
    
    window.netlifyIdentity.init();
}

// Main initialization
async function initializeApp() {
    console.log('📱 Initializing application...');
    
    try {
        // Cache DOM elements
        cacheElements();
        
        // Setup event listeners
        setupAllEventListeners();
        
        // Initialize view
        initializeView();
        
        // Setup blob storage auto-sync
        window.blobStorage.setupAutoSync();
        
        // Load data
        await loadInitialData();
        
        // Update UI
        updateUserUI(window.state.user);
        await updateDashboardStats();
        
        // Setup periodic sync
        setupPeriodicSync();
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => console.log('✅ Service Worker registered'))
                .catch(err => console.error('❌ Service Worker registration failed:', err));
        }
        
        console.log('✅ App initialized successfully!');
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showNotification('Initialization error: ' + error.message, 'error');
    }
}

// Cache DOM elements
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
        previewModeBtn: document.getElementById('preview-mode-btn'),
        
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
        completedList: document.getElementById('completed-list'),
        questionsSection: document.getElementById('questions-section'),
        inspectionTitle: document.getElementById('inspection-title'),
        progressFill: document.getElementById('progress-fill'),
        progressStatus: document.getElementById('progress-status'),
        auditorName: document.getElementById('auditor-names'),
        inspectionDate: document.getElementById('inspection-date')
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
    if (window.elements.previewModeBtn) {
        window.elements.previewModeBtn.addEventListener('click', togglePreviewMode);
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
    
    // User menu
    if (window.elements.userMenu) {
        window.elements.userMenu.addEventListener('click', toggleUserMenu);
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
    
    // Listen for sync events
    window.addEventListener('blob-sync', handleSyncEvent);
    
    // Online/Offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    console.log('✅ Event listeners attached');
}

// Load initial data
async function loadInitialData() {
    try {
        // Load templates
        await loadTemplates();
        
        // Load user's inspections
        await loadUserInspections();
        
        // Load pending sync items
        await window.blobStorage.loadQueueFromLocal();
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        // Continue with offline data
    }
}

// Load templates from blob storage
async function loadTemplates() {
    try {
        const templates = await window.blobStorage.listTemplates();
        window.state.templates = templates.items || [];
        updateTemplateSelects();
    } catch (error) {
        console.error('Error loading templates:', error);
        // Use default templates
        loadDefaultTemplates();
    }
}

// Load user's inspections
async function loadUserInspections() {
    try {
        const result = await window.blobStorage.listInspections();
        window.state.inspections = result.items || [];
        
        // Update pending/completed counts
        updateInspectionCounts();
        
    } catch (error) {
        console.error('Error loading inspections:', error);
        // Load from local storage
        await loadLocalInspections();
    }
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
                if (!window.state.currentInspection) {
                    showInspectionOverview();
                } else {
                    renderInspectionForm();
                }
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
async function startNewInspection() {
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
        id: generateInspectionId(),
        location: location,
        type: type,
        date: new Date().toISOString(),
        auditor: window.state.user.email,
        auditorId: window.state.user.id,
        status: 'in-progress',
        responses: {},
        comments: {},
        startTime: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    // Save as draft
    await saveDraft(true);
    
    // Navigate to inspection form
    setActiveSection('inspections');
    renderInspectionForm();
}

// Render inspection form
async function renderInspectionForm() {
    const inspection = window.state.currentInspection;
    if (!inspection) return;
    
    // Update title
    if (window.elements.inspectionTitle) {
        const template = window.state.templates.find(t => t.id === inspection.type);
        window.elements.inspectionTitle.innerHTML = `
            <i class="fas fa-shield-check"></i>
            <span>${template?.name || inspection.type}</span>
        `;
    }
    
    // Set auditor name and date
    if (window.elements.auditorName) {
        window.elements.auditorName.value = inspection.auditor || window.state.user.email;
    }
    if (window.elements.inspectionDate) {
        window.elements.inspectionDate.value = inspection.date ? 
            new Date(inspection.date).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0];
    }
    
    // Load questions
    await loadQuestions(inspection.type);
    
    // Setup auto-save
    if (window.state.settings.autoSave) {
        setupAutoSave();
    }
}

// Load questions for inspection type
async function loadQuestions(templateId) {
    try {
        const template = await window.blobStorage.getTemplate(templateId);
        renderQuestions(template.questions || getDefaultQuestions());
    } catch (error) {
        console.error('Error loading template:', error);
        // Use default questions
        renderQuestions(getDefaultQuestions());
    }
}

// Render questions
function renderQuestions(questions) {
    const container = window.elements.questionsSection;
    if (!container) return;
    
    container.innerHTML = '';
    
    questions.forEach((question, index) => {
        const questionEl = createQuestionElement(question, index);
        container.appendChild(questionEl);
    });
    
    updateProgress();
}

// Create question element
function createQuestionElement(question, index) {
    const div = document.createElement('div');
    div.className = 'question-card';
    div.dataset.questionId = question.id;
    
    const response = window.state.currentInspection?.responses[question.id];
    const comment = window.state.currentInspection?.comments[question.id];
    
    div.innerHTML = `
        <div class="question-header">
            <div class="question-number">${index + 1}</div>
            <div class="question-text">
                ${question.text}
                ${question.required ? '<span class="question-required">*</span>' : ''}
            </div>
        </div>
        <div class="question-options">
            <button class="option-btn ${response === 'pass' ? 'selected pass' : ''}" 
                    onclick="handleQuestionResponse('${question.id}', 'pass')">
                <i class="fas fa-check"></i>
                Pass
            </button>
            <button class="option-btn ${response === 'fail' ? 'selected fail' : ''}" 
                    onclick="handleQuestionResponse('${question.id}', 'fail')">
                <i class="fas fa-times"></i>
                Fail
            </button>
            <button class="option-btn ${response === 'na' ? 'selected' : ''}" 
                    onclick="handleQuestionResponse('${question.id}', 'na')">
                <i class="fas fa-minus"></i>
                N/A
            </button>
        </div>
        <div class="comments-section">
            <textarea 
                class="comments-textarea" 
                placeholder="Add comments (required for failures)..."
                onchange="handleCommentChange('${question.id}', this.value)"
                ${response === 'fail' ? 'required' : ''}
            >${comment || ''}</textarea>
        </div>
    `;
    
    return div;
}

// Handle question response
window.handleQuestionResponse = async function(questionId, value) {
    if (!window.state.currentInspection) return;
    
    // Update response
    window.state.currentInspection.responses[questionId] = value;
    window.state.currentInspection.lastModified = new Date().toISOString();
    
    // Update UI
    const card = document.querySelector(`[data-question-id="${questionId}"]`);
    if (card) {
        // Update button states
        card.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected', 'pass', 'fail');
        });
        
        const selectedBtn = card.querySelector(`.option-btn:nth-child(${
            value === 'pass' ? 1 : value === 'fail' ? 2 : 3
        })`);
        
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
            if (value === 'pass') selectedBtn.classList.add('pass');
            if (value === 'fail') selectedBtn.classList.add('fail');
        }
        
        // Make comment required for failures
        const textarea = card.querySelector('.comments-textarea');
        if (textarea) {
            textarea.required = value === 'fail';
            if (value === 'fail' && !textarea.value) {
                textarea.focus();
            }
        }
    }
    
    // Update progress
    updateProgress();
    
    // Auto-save
    if (window.state.settings.autoSave) {
        await autoSave();
    }
};

// Handle comment change
window.handleCommentChange = async function(questionId, value) {
    if (!window.state.currentInspection) return;
    
    window.state.currentInspection.comments[questionId] = value;
    window.state.currentInspection.lastModified = new Date().toISOString();
    
    // Auto-save
    if (window.state.settings.autoSave) {
        await autoSave();
    }
};

// Update progress
function updateProgress() {
    const inspection = window.state.currentInspection;
    if (!inspection) return;
    
    const totalQuestions = document.querySelectorAll('.question-card').length;
    const answeredQuestions = Object.keys(inspection.responses).length;
    
    const percentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    
    if (window.elements.progressFill) {
        window.elements.progressFill.style.width = `${percentage}%`;
    }
    
    if (window.elements.progressStatus) {
        window.elements.progressStatus.textContent = `${answeredQuestions} of ${totalQuestions} completed`;
    }
}

// Save draft
async function saveDraft(silent = false) {
    if (!window.state.currentInspection) return;
    
    try {
        if (!silent) showNotification('Saving draft...', 'info');
        
        // Update metadata
        window.state.currentInspection.lastModified = new Date().toISOString();
        window.state.currentInspection.status = 'draft';
        
        // Save to blob storage
        await window.blobStorage.saveInspection(window.state.currentInspection);
        
        // Update local storage
        await saveToLocalDB('inspections', window.state.currentInspection);
        
        if (!silent) showNotification('Draft saved', 'success');
        
        // Update sync indicator
        updateSyncIndicator('saved');
        
    } catch (error) {
        console.error('Error saving draft:', error);
        
        // Save locally if offline
        if (!navigator.onLine) {
            await saveToLocalDB('inspections', window.state.currentInspection);
            if (!silent) showNotification('Draft saved locally', 'warning');
            updateSyncIndicator('pending');
        } else {
            showNotification('Error saving draft', 'error');
        }
    }
}

// Auto-save functionality
let autoSaveTimer;
function autoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        saveDraft(true);
    }, 2000); // Save after 2 seconds of inactivity
}

function setupAutoSave() {
    // Save every 30 seconds
    setInterval(() => {
        if (window.state.currentInspection) {
            saveDraft(true);
        }
    }, 30000);
}

// Submit inspection
async function submitInspection() {
    const inspection = window.state.currentInspection;
    if (!inspection) return;
    
    // Validate required fields
    const questions = document.querySelectorAll('.question-card');
    const requiredQuestions = Array.from(questions).filter(q => 
        q.querySelector('.question-required')
    );
    
    // Check if all required questions are answered
    for (const question of requiredQuestions) {
        const questionId = question.dataset.questionId;
        if (!inspection.responses[questionId]) {
            showNotification('Please answer all required questions', 'warning');
            question.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        
        // Check for required comments on failures
        if (inspection.responses[questionId] === 'fail' && 
            !inspection.comments[questionId]?.trim()) {
            showNotification('Please add comments for all failed items', 'warning');
            question.querySelector('.comments-textarea').focus();
            return;
        }
    }
    
    // Confirm submission
    if (!confirm('Submit this inspection? This action cannot be undone.')) {
        return;
    }
    
    try {
        showNotification('Submitting inspection...', 'info');
        
        // Update inspection status
        inspection.status = 'completed';
        inspection.completedAt = new Date().toISOString();
        inspection.submittedBy = window.state.user.email;
        
        // Calculate duration
        if (inspection.startTime) {
            const duration = Date.now() - new Date(inspection.startTime).getTime();
            inspection.duration = Math.round(duration / 1000); // seconds
        }
        
        // Save to blob storage
        await window.blobStorage.saveInspection(inspection);
        
        // Generate report
        const report = await generateReport(inspection);
        await window.blobStorage.saveReport(report);
        
        showNotification('Inspection submitted successfully!', 'success');
        
        // Clear current inspection
        window.state.currentInspection = null;
        
        // Navigate to dashboard
        setActiveSection('dashboard');
        
        // Refresh stats
        await updateDashboardStats();
        
    } catch (error) {
        console.error('Error submitting inspection:', error);
        showNotification('Error submitting inspection. Please try again.', 'error');
    }
}

// Generate report
async function generateReport(inspection) {
    const template = window.state.templates.find(t => t.id === inspection.type);
    
    // Calculate statistics
    const responses = Object.values(inspection.responses);
    const stats = {
        total: responses.length,
        passed: responses.filter(r => r === 'pass').length,
        failed: responses.filter(r => r === 'fail').length,
        na: responses.filter(r => r === 'na').length,
        passRate: 0
    };
    
    if (stats.total > 0) {
        stats.passRate = ((stats.passed / (stats.total - stats.na)) * 100).toFixed(1);
    }
    
    const report = {
        id: `report_${inspection.id}`,
        inspectionId: inspection.id,
        type: 'inspection-report',
        generatedAt: new Date().toISOString(),
        generatedBy: window.state.user.email,
        inspection: {
            id: inspection.id,
            type: inspection.type,
            templateName: template?.name || inspection.type,
            location: inspection.location,
            date: inspection.date,
            auditor: inspection.auditor,
            duration: inspection.duration
        },
        statistics: stats,
        findings: {
            failures: [],
            observations: []
        },
        recommendations: []
    };
    
    // Add failure details
    Object.entries(inspection.responses).forEach(([questionId, response]) => {
        if (response === 'fail') {
            const question = template?.questions?.find(q => q.id === questionId);
            report.findings.failures.push({
                questionId,
                question: question?.text || questionId,
                comment: inspection.comments[questionId] || 'No comment provided'
            });
        }
    });
    
    return report;
}

// Export to PDF
async function exportToPDF() {
    showNotification('PDF export coming soon...', 'info');
    // TODO: Implement PDF generation
}

// Toggle preview mode
function togglePreviewMode() {
    document.body.classList.toggle('preview-mode');
    const isPreview = document.body.classList.contains('preview-mode');
    
    // Disable form inputs in preview mode
    document.querySelectorAll('input, textarea, button.option-btn').forEach(el => {
        el.disabled = isPreview;
    });
    
    showNotification(isPreview ? 'Preview mode enabled' : 'Edit mode enabled', 'info');
}

// Data import/export
async function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate and import data
            if (data.templates) {
                for (const template of data.templates) {
                    await window.blobStorage.saveTemplate(template);
                }
                await loadTemplates();
                showNotification('Templates imported successfully', 'success');
            }
            
        } catch (error) {
            console.error('Import error:', error);
            showNotification('Error importing data', 'error');
        }
    };
    
    input.click();
}

async function exportData() {
    try {
        // Gather all data
        const exportData = {
            exportDate: new Date().toISOString(),
            exportedBy: window.state.user.email,
            templates: window.state.templates,
            inspections: await window.blobStorage.listInspections()
        };
        
        // Create download
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aurora-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showNotification('Data exported successfully', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Error exporting data', 'error');
    }
}

async function exportReports() {
    showNotification('Generating reports...', 'info');
    // TODO: Implement batch report export
}

// Sync functionality
async function syncData() {
    try {
        showNotification('Syncing data...', 'info');
        
        // Trigger manual sync
        await window.blobStorage.processSyncQueue();
        
        // Reload data
        await loadUserInspections();
        await updateDashboardStats();
        
        showNotification('Sync completed', 'success');
        
    } catch (error) {
        console.error('Sync error:', error);
        showNotification('Sync failed', 'error');
    }
}

// Handle sync events
function handleSyncEvent(event) {
    const { status, item } = event.detail;
    
    if (status === 'success') {
        console.log('✅ Synced:', item.path);
        updateSyncIndicator('synced');
    } else if (status === 'failed') {
        console.error('❌ Sync failed:', item.path);
        updateSyncIndicator('error');
    }
}

// Handle online/offline
function handleOnline() {
    showNotification('Back online - syncing data...', 'info');
    updateConnectionStatus(true);
    window.blobStorage.processSyncQueue();
}

function handleOffline() {
    showNotification('Working offline - data will sync when connected', 'warning');
    updateConnectionStatus(false);
}

// Update connection status
function updateConnectionStatus(online) {
    document.body.classList.toggle('offline', !online);
    
    // Update UI indicators
    const indicator = document.querySelector('.connection-status');
    if (indicator) {
        indicator.textContent = online ? 'Online' : 'Offline';
        indicator.className = `connection-status ${online ? 'online' : 'offline'}`;
    }
}

// Update sync indicator
function updateSyncIndicator(status) {
    const indicator = document.querySelector('.mobile-save-indicator');
    if (!indicator) return;
    
    const icon = indicator.querySelector('i');
    const text = indicator.querySelector('span');
    
    switch (status) {
        case 'saved':
            icon.className = 'fas fa-cloud-upload-alt';
            text.textContent = 'Auto-saved';
            indicator.style.color = 'var(--success)';
            break;
        case 'pending':
            icon.className = 'fas fa-clock';
            text.textContent = 'Pending sync';
            indicator.style.color = 'var(--warning)';
            break;
        case 'synced':
            icon.className = 'fas fa-check-circle';
            text.textContent = 'Synced';
            indicator.style.color = 'var(--success)';
            break;
        case 'error':
            icon.className = 'fas fa-exclamation-triangle';
            text.textContent = 'Sync error';
            indicator.style.color = 'var(--danger)';
            break;
    }
}

// Settings page
function renderSettings() {
    const section = document.querySelector('[data-section="settings"]');
    if (!section) return;
    
    section.innerHTML = `
        <div class="content-card">
            <div class="content-header">
                <h2 class="content-title">
                    <i class="fas fa-cog"></i>
                    Settings
                </h2>
            </div>
            <div class="settings-content" style="padding: 20px;">
                <div class="form-section">
                    <h3 class="form-section-title">General Settings</h3>
                    
                    <div class="form-group">
                        <label class="toggle-label">
                            <input type="checkbox" id="auto-save-toggle" 
                                   ${window.state.settings.autoSave ? 'checked' : ''}
                                   onchange="updateSetting('autoSave', this.checked)">
                            <span>Auto-save inspections</span>
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label class="toggle-label">
                            <input type="checkbox" id="notifications-toggle" 
                                   ${window.state.settings.notifications ? 'checked' : ''}
                                   onchange="updateSetting('notifications', this.checked)">
                            <span>Enable notifications</span>
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Sync Interval</label>
                        <select class="form-control" onchange="updateSetting('syncInterval', this.value)">
                            <option value="5000" ${window.state.settings.syncInterval === 5000 ? 'selected' : ''}>5 seconds</option>
                            <option value="30000" ${window.state.settings.syncInterval === 30000 ? 'selected' : ''}>30 seconds</option>
                            <option value="60000" ${window.state.settings.syncInterval === 60000 ? 'selected' : ''}>1 minute</option>
                            <option value="300000" ${window.state.settings.syncInterval === 300000 ? 'selected' : ''}>5 minutes</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3 class="form-section-title">Account</h3>
                    <p>Logged in as: <strong>${window.state.user.email}</strong></p>
                    <button class="btn btn-secondary" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        Logout
                    </button>
                </div>
                
                <div class="form-section">
                    <h3 class="form-section-title">Storage</h3>
                    <p>Pending sync items: <strong id="pending-sync-count">0</strong></p>
                    <button class="btn btn-secondary" onclick="clearLocalData()">
                        <i class="fas fa-trash"></i>
                        Clear Local Data
                    </button>
                </div>
                
                <div class="form-section">
                    <h3 class="form-section-title">About</h3>
                    <p>Aurora Audit Platform v1.0.0</p>
                    <p>© 2024 Amazon Austria</p>
                </div>
            </div>
        </div>
    `;
    
    // Update pending sync count
    updatePendingSyncCount();
}

// Update setting
window.updateSetting = function(key, value) {
    window.state.settings[key] = value;
    saveSettings();
    showNotification('Settings updated', 'success');
    
    // Apply setting changes
    if (key === 'syncInterval') {
        window.blobStorage.setupAutoSync(parseInt(value));
    }
};

// Save settings to local storage
function saveSettings() {
    localStorage.setItem('aurora-settings', JSON.stringify(window.state.settings));
}

// Load settings from local storage
function loadSettings() {
    const saved = localStorage.getItem('aurora-settings');
    if (saved) {
        window.state.settings = { ...window.state.settings, ...JSON.parse(saved) };
    }
}

// Help function
function showHelp() {
    const helpContent = `
        <div class="content-card">
            <div class="content-header">
                <h2 class="content-title">
                    <i class="fas fa-question-circle"></i>
                    Help & Support
                </h2>
            </div>
            <div style="padding: 20px;">
                <h3>Quick Start Guide</h3>
                <ol>
                    <li>Select your delivery station and inspection type</li>
                    <li>Click "Start New Inspection"</li>
                    <li>Answer all questions (Pass/Fail/N/A)</li>
                    <li>Add comments for any failed items</li>
                    <li>Submit the inspection when complete</li>
                </ol>
                
                <h3>Offline Mode</h3>
                <p>The app works offline. Your data will automatically sync when you're back online.</p>
                
                <h3>Contact Support</h3>
                <p>Email: whs-support@amazon.at</p>
                <p>Phone: +43 1 234 5678</p>
            </div>
        </div>
    `;
    
    const section = document.querySelector('[data-section="settings"]');
    if (section) {
        section.innerHTML = helpContent;
        setActiveSection('settings');
    }
}

// Dashboard functions
async function updateDashboardStats() {
    try {
        // Get all inspections
        const result = await window.blobStorage.listInspections();
        const inspections = result.items || [];
        
        // Calculate stats
        const stats = {
            total: inspections.length,
            thisMonth: 0,
            pending: 0,
            completed: 0,
            complianceRate: 100
        };
        
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        
        inspections.forEach(inspection => {
            const date = new Date(inspection.date);
            if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
                stats.thisMonth++;
            }
            
            if (inspection.status === 'completed') {
                stats.completed++;
            } else {
                stats.pending++;
            }
        });
        
        // Update UI
        updateStatCards(stats);
        updateRecentActivity(inspections.slice(0, 5));
        
        // Update lists
        updatePendingList(inspections.filter(i => i.status !== 'completed'));
        updateCompletedList(inspections.filter(i => i.status === 'completed'));
        
    } catch (error) {
        console.error('Error updating dashboard:', error);
        // Use local data
        await updateDashboardFromLocal();
    }
}

// Update stat cards
function updateStatCards(stats) {
    const elements = {
        total: document.querySelector('.stat-card:nth-child(1) .stat-value'),
        thisMonth: document.querySelector('.stat-card:nth-child(2) .stat-value'),
        pending: document.querySelector('.stat-card:nth-child(3) .stat-value'),
        compliance: document.querySelector('.stat-card:nth-child(4) .stat-value')
    };
    
    if (elements.total) elements.total.textContent = stats.total;
    if (elements.thisMonth) elements.thisMonth.textContent = stats.thisMonth;
    if (elements.pending) elements.pending.textContent = stats.pending;
    if (elements.compliance) elements.compliance.textContent = `${stats.complianceRate}%`;
}

// Update recent activity
function updateRecentActivity(inspections) {
    const container = document.querySelector('.mobile-activity-list');
    if (!container) return;
    
    container.innerHTML = inspections.map(inspection => {
        const template = window.state.templates.find(t => t.id === inspection.type);
        const timeAgo = getTimeAgo(new Date(inspection.lastModified || inspection.date));
        
        return `
            <div class="list-item mobile-list-item touchable" 
                 onclick="viewInspection('${inspection.id}')">
                <div class="list-item-header">
                    <div class="list-item-title">
                        ${inspection.location} - ${template?.name || inspection.type}
                    </div>
                    <div class="status-indicator status-${inspection.status === 'completed' ? 'completed' : 'pending'}">
                        <i class="fas fa-${inspection.status === 'completed' ? 'check' : 'clock'}"></i>
                        <span class="mobile-hide">${inspection.status}</span>
                    </div>
                </div>
                <div class="list-item-meta">
                    <i class="fas fa-user"></i> ${inspection.auditor} • ${timeAgo}
                </div>
            </div>
        `;
    }).join('') || '<p style="padding: 20px;">No recent activity</p>';
}

// Update lists
function updatePendingList(inspections) {
    const list = window.elements.pendingList;
    if (!list) return;
    
    list.innerHTML = inspections.map(inspection => `
        <li class="list-item" onclick="viewInspection('${inspection.id}')">
            ${inspection.location} - ${inspection.type}
        </li>
    `).join('') || '<li class="list-item">No pending inspections</li>';
    
    // Update count
    const badge = document.querySelector('.section-header .section-badge');
    if (badge) badge.textContent = inspections.length;
}

function updateCompletedList(inspections) {
    const list = window.elements.completedList;
    if (!list) return;
    
    const recent = inspections.slice(0, 10);
    
    list.innerHTML = recent.map(inspection => `
        <li class="list-item" onclick="viewInspection('${inspection.id}')">
            ${inspection.location} - ${inspection.type}
        </li>
    `).join('') || '<li class="list-item">No completed inspections</li>';
}

// View inspection
window.viewInspection = async function(inspectionId) {
    try {
        const inspection = await window.blobStorage.getInspection(inspectionId);
        window.state.currentInspection = inspection;
        setActiveSection('inspections');
        renderInspectionForm();
    } catch (error) {
        console.error('Error loading inspection:', error);
        showNotification('Error loading inspection', 'error');
    }
};

// Reports section
async function renderReports() {
    const container = document.getElementById('reports-container');
    if (!container) return;
    
    try {
        const reports = await window.blobStorage.listReports();
        
        container.innerHTML = reports.items.map(report => `
            <div class="report-item" onclick="viewReport('${report.id}')">
                <h4>${report.inspection.templateName}</h4>
                <p>${report.inspection.location} - ${new Date(report.inspection.date).toLocaleDateString()}</p>
                <p>Pass Rate: ${report.statistics.passRate}%</p>
            </div>
        `).join('') || '<p style="padding: 20px;">No reports available yet.</p>';
        
    } catch (error) {
        console.error('Error loading reports:', error);
        container.innerHTML = '<p style="padding: 20px;">Error loading reports.</p>';
    }
}

// Analytics section
function renderAnalytics() {
    const canvas = document.getElementById('analytics-chart');
    if (!canvas) return;
    
    // TODO: Implement analytics charts using Chart.js
    showNotification('Analytics coming soon...', 'info');
}

// Utility functions
function generateInspectionId() {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const location = window.state.currentInspection?.location || 'UNK';
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `INSP_${date}_${location}_${random}`;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }
    
    return 'just now';
}

// Local database functions
async function getLocalDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AuroraAuditDB', 2);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            
            if (!db.objectStoreNames.contains('inspections')) {
                db.createObjectStore('inspections', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('templates')) {
                db.createObjectStore('templates', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('reports')) {
                db.createObjectStore('reports', { keyPath: 'id' });
            }
        };
        
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = reject;
    });
}

async function saveToLocalDB(store, data) {
    const db = await getLocalDB();
    const tx = db.transaction(store, 'readwrite');
    await tx.objectStore(store).put(data);
}

async function loadFromLocalDB(store) {
    const db = await getLocalDB();
    const tx = db.transaction(store, 'readonly');
    return await tx.objectStore(store).getAll();
}

// Default templates and questions
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

function getDefaultQuestions() {
    return [
        {
            id: 'q1',
            text: 'Are all emergency exits clearly marked and unobstructed?',
            category: 'Safety',
            required: true
        },
        {
            id: 'q2',
            text: 'Are fire extinguishers present and properly maintained?',
            category: 'Fire Safety',
            required: true
        },
        {
            id: 'q3',
            text: 'Is personal protective equipment (PPE) available and in good condition?',
            category: 'Safety Equipment',
            required: true
        },
        {
            id: 'q4',
            text: 'Are walkways and work areas free from hazards?',
            category: 'General Safety',
            required: true
        },
        {
            id: 'q5',
            text: 'Are safety signs and warnings properly displayed?',
            category: 'Signage',
            required: false
        }
    ];
}

// User functions
function updateUserUI(user) {
    if (!user) return;
    
    const name = user.user_metadata?.full_name || user.email;
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substr(0, 2);
    
    // Update all user avatars
    document.querySelectorAll('.user-avatar, .user-avatar-large').forEach(el => {
        el.textContent = initials;
    });
    
    // Update user text
    document.querySelectorAll('.user-text').forEach(el => {
        el.textContent = name;
    });
    
    // Update user details
    const userDetails = document.querySelector('.user-details');
    if (userDetails) {
        userDetails.innerHTML = `
            <h3>${name}</h3>
            <p>${user.email}</p>
        `;
    }
}

// Toggle user menu
function toggleUserMenu() {
    // TODO: Implement user menu dropdown
}

// Logout
window.logout = function() {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.logout();
    } else {
        // Clear local data and reload
        localStorage.clear();
        window.location.reload();
    }
};

// Clear local data
window.clearLocalData = async function() {
    if (!confirm('This will clear all local data. Are you sure?')) return;
    
    try {
        // Clear IndexedDB
        const databases = ['AuroraAuditDB', 'AuroraBlobSync'];
        for (const db of databases) {
            await indexedDB.deleteDatabase(db);
        }
        
        // Clear localStorage
        localStorage.clear();
        
        showNotification('Local data cleared', 'success');
        
        // Reload
        setTimeout(() => window.location.reload(), 1000);
        
    } catch (error) {
        console.error('Error clearing data:', error);
        showNotification('Error clearing data', 'error');
    }
};

// Update pending sync count
async function updatePendingSyncCount() {
    const count = window.blobStorage?.syncQueue?.length || 0;
    const element = document.getElementById('pending-sync-count');
    if (element) {
        element.textContent = count;
    }
}

// Setup periodic sync
function setupPeriodicSync() {
    // Update stats every minute
    setInterval(() => {
        if (window.state.currentSection === 'dashboard') {
            updateDashboardStats();
        }
    }, 60000);
    
    // Update sync count
    setInterval(() => {
        updatePendingSyncCount();
    }, 5000);
}

// Notification system
function showNotification(message, type = 'info') {
    if (!window.state.settings.notifications) return;
    
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `notification notification-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${
            type === 'success' ? 'check-circle' : 
            type === 'error' ? 'exclamation-circle' : 
            type === 'warning' ? 'exclamation-triangle' : 
            'info-circle'
        }"></i>
        <span>${message}</span>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 16px 24px;
        background: ${
            type === 'success' ? 'var(--success)' : 
            type === 'error' ? 'var(--danger)' : 
            type === 'warning' ? 'var(--warning)' : 
            'var(--info)'
        };
        color: white;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease-out;
        max-width: 90vw;
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

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
    
    .toggle-label {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
    }
    
    .toggle-label input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
    }
    
    .preview-mode input:disabled,
    .preview-mode textarea:disabled,
    .preview-mode button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    
    .report-item {
        padding: 16px;
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        margin-bottom: 12px;
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    
    .report-item:hover {
        background: var(--bg-hover);
        transform: translateX(4px);
    }
    
    .connection-status {
        padding: 4px 12px;
        border-radius: var(--radius-full);
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .connection-status.online {
        background: rgba(16, 185, 129, 0.1);
        color: var(--success);
    }
    
    .connection-status.offline {
        background: rgba(245, 158, 11, 0.1);
        color: var(--warning);
    }
`;
document.head.appendChild(style);

// Initialize on load
loadSettings();

console.log('✅ Aurora Audit Platform ready');
