// Aurora Audit Platform - Complete Application Logic
// WHS SIFA Inspection System for Amazon Austria

// Global State Management
const state = {
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

// DOM Elements Cache
const elements = {
    navItems: {
        dashboard: document.getElementById('nav-dashboard'),
        inspections: document.getElementById('nav-inspections'),
        reports: document.getElementById('nav-reports'),
        analytics: document.getElementById('nav-analytics')
    },
    mobileNavItems: document.querySelectorAll('.mobile-nav-item[data-section]'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    closeSidebarBtn: document.getElementById('close-sidebar-btn'),
    userMenu: document.getElementById('user-menu'),
    startInspectionBtn: document.getElementById('start-inspection-btn'),
    mobileNewInspectionBtn: document.getElementById('mobile-new-inspection'),
    deliveryStationSelect: document.getElementById('delivery-station-select'),
    inspectionTypeSelect: document.getElementById('inspection-type-select'),
    actionSheet: document.getElementById('mobile-action-sheet'),
    mainContent: document.querySelector('.main-content'),
    pendingList: document.getElementById('pending-list'),
    completedList: document.getElementById('completed-list')
};

// IndexedDB Configuration
const DB_NAME = 'AuroraAuditDB';
const DB_VERSION = 1;
let db;

// Initialize Database
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            // Create object stores
            if (!db.objectStoreNames.contains('inspections')) {
                const inspectionStore = db.createObjectStore('inspections', { keyPath: 'id' });
                inspectionStore.createIndex('status', 'status', { unique: false });
                inspectionStore.createIndex('location', 'location', { unique: false });
                inspectionStore.createIndex('type', 'type', { unique: false });
                inspectionStore.createIndex('date', 'date', { unique: false });
            }

            if (!db.objectStoreNames.contains('templates')) {
                const templateStore = db.createObjectStore('templates', { keyPath: 'id' });
                templateStore.createIndex('type', 'type', { unique: false });
            }

            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }

            if (!db.objectStoreNames.contains('pendingSync')) {
                db.createObjectStore('pendingSync', { keyPath: 'id' });
            }
        };
    });
}

// Database Operations
const dbOperations = {
    async save(storeName, data) {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return store.put(data);
    },

    async get(storeName, id) {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getAll(storeName, indexName, value) {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            let request;
            if (indexName && value) {
                const index = store.index(indexName);
                request = index.getAll(value);
            } else {
                request = store.getAll();
            }
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async delete(storeName, id) {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return store.delete(id);
    },

    async count(storeName, indexName, value) {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            let request;
            if (indexName && value) {
                const index = store.index(indexName);
                request = index.count(value);
            } else {
                request = store.count();
            }
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
};

// Authentication with Netlify Identity
function initAuth() {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on('init', user => {
            if (!user) {
                window.netlifyIdentity.on('login', () => {
                    document.location.reload();
                });
                window.netlifyIdentity.open();
            } else {
                state.user = user;
                updateUserUI(user);
                initializeApp();
            }
        });

        window.netlifyIdentity.on('logout', () => {
            state.user = null;
            document.location.reload();
        });

        window.netlifyIdentity.init();
    } else {
        console.error('Netlify Identity not loaded');
        // Fallback for development
        state.user = { email: 'dev@test.com', user_metadata: { full_name: 'Dev User' } };
        updateUserUI(state.user);
        initializeApp();
    }
}

function updateUserUI(user) {
    const initials = user.user_metadata?.full_name
        ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
        : user.email.substring(0, 2).toUpperCase();
    
    document.querySelectorAll('.user-avatar, .user-avatar-large').forEach(el => {
        el.textContent = initials;
    });
    
    document.querySelectorAll('.user-text').forEach(el => {
        el.textContent = user.user_metadata?.full_name || user.email.split('@')[0];
    });
    
    document.querySelectorAll('.user-details h3').forEach(el => {
        el.textContent = user.user_metadata?.full_name || 'User';
    });
    
    document.querySelectorAll('.user-details p').forEach(el => {
        el.textContent = user.email;
    });
}

// Template Management
const defaultTemplates = [
    {
        id: 'general-safety',
        name: 'General Safety Inspection',
        type: 'general',
        version: '1.0',
        categories: [
            {
                id: 'workplace-conditions',
                name: 'Workplace Conditions',
                icon: 'fas fa-building',
                questions: [
                    {
                        id: 'q1',
                        text: 'Are all walkways and passages clear of obstructions?',
                        type: 'passfail',
                        required: true,
                        category: 'workplace-conditions'
                    },
                    {
                        id: 'q2',
                        text: 'Is the lighting adequate in all work areas?',
                        type: 'passfail',
                        required: true,
                        category: 'workplace-conditions'
                    },
                    {
                        id: 'q3',
                        text: 'Are emergency exits clearly marked and unobstructed?',
                        type: 'passfail',
                        required: true,
                        category: 'workplace-conditions'
                    }
                ]
            },
            {
                id: 'equipment-safety',
                name: 'Equipment Safety',
                icon: 'fas fa-tools',
                questions: [
                    {
                        id: 'q4',
                        text: 'Are all safety guards in place on machinery?',
                        type: 'passfail',
                        required: true,
                        category: 'equipment-safety'
                    },
                    {
                        id: 'q5',
                        text: 'Are equipment inspection tags current?',
                        type: 'passfail',
                        required: true,
                        category: 'equipment-safety'
                    }
                ]
            },
            {
                id: 'ppe-compliance',
                name: 'PPE Compliance',
                icon: 'fas fa-hard-hat',
                questions: [
                    {
                        id: 'q6',
                        text: 'Are all employees wearing required PPE?',
                        type: 'passfail',
                        required: true,
                        category: 'ppe-compliance'
                    },
                    {
                        id: 'q7',
                        text: 'Is PPE in good condition and properly maintained?',
                        type: 'passfail',
                        required: true,
                        category: 'ppe-compliance'
                    }
                ]
            }
        ]
    },
    {
        id: 'fire-safety',
        name: 'Fire Safety Audit',
        type: 'fire',
        version: '1.0',
        categories: [
            {
                id: 'fire-equipment',
                name: 'Fire Equipment',
                icon: 'fas fa-fire-extinguisher',
                questions: [
                    {
                        id: 'f1',
                        text: 'Are fire extinguishers properly mounted and accessible?',
                        type: 'passfail',
                        required: true,
                        category: 'fire-equipment'
                    },
                    {
                        id: 'f2',
                        text: 'Are fire extinguisher inspection tags current?',
                        type: 'passfail',
                        required: true,
                        category: 'fire-equipment'
                    }
                ]
            }
        ]
    }
];

async function loadTemplates() {
    try {
        // First try to load from server
        const token = await state.user?.jwt?.();
        if (token) {
            const response = await fetch('/.netlify/functions/blob?path=templates/&list=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.blobs && data.blobs.length > 0) {
                    // Load each template
                    for (const blob of data.blobs) {
                        const templateResponse = await fetch(`/.netlify/functions/blob?path=${blob.path}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (templateResponse.ok) {
                            const template = await templateResponse.json();
                            await dbOperations.save('templates', template);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading templates from server:', error);
    }

    // Load from IndexedDB
    let templates = await dbOperations.getAll('templates');
    
    // If no templates, use defaults
    if (!templates || templates.length === 0) {
        for (const template of defaultTemplates) {
            await dbOperations.save('templates', template);
        }
        templates = defaultTemplates;
    }
    
    state.templates = templates;
    updateTemplateSelects();
}

function updateTemplateSelects() {
    const select = elements.inspectionTypeSelect;
    select.innerHTML = '<option value="">Select inspection type...</option>';
    
    state.templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        select.appendChild(option);
    });
}

// Initialize Application
async function initializeApp() {
    try {
        await initDB();
        await loadSettings();
        await loadTemplates();
        await updateDashboardStats();
        await loadPendingInspections();
        await loadCompletedInspections();
        
        setupEventListeners();
        setupServiceWorker();
        initializeView();
        
        // Start auto-sync if enabled
        if (state.settings.autoSync) {
            startAutoSync();
        }
        
        console.log('Aurora Audit Platform initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Error initializing application', 'error');
    }
}

// Settings Management
async function loadSettings() {
    const savedSettings = await dbOperations.get('settings', 'userSettings');
    if (savedSettings) {
        state.settings = { ...state.settings, ...savedSettings.value };
    }
}

async function saveSettings() {
    await dbOperations.save('settings', {
        key: 'userSettings',
        value: state.settings
    });
}

// Dashboard Statistics
async function updateDashboardStats() {
    const totalInspections = await dbOperations.count('inspections');
    const pendingCount = await dbOperations.count('inspections', 'status', 'pending');
    const completedCount = await dbOperations.count('inspections', 'status', 'completed');
    
    // Update UI
    document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = totalInspections;
    document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = pendingCount;
    
    // Update sidebar badges
    document.querySelector('.section-header:has(.fa-clock) .section-badge').textContent = pendingCount;
    document.querySelector('.section-header:has(.fa-check-circle) .section-badge').textContent = completedCount;
    
    // Calculate this month's inspections
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const allInspections = await dbOperations.getAll('inspections');
    const thisMonthCount = allInspections.filter(i => new Date(i.date) >= monthStart).length;
    document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = thisMonthCount;
    
    // Calculate compliance rate
    const completedInspections = allInspections.filter(i => i.status === 'completed');
    let totalQuestions = 0;
    let passedQuestions = 0;
    
    completedInspections.forEach(inspection => {
        if (inspection.responses) {
            Object.values(inspection.responses).forEach(response => {
                if (response.type === 'passfail') {
                    totalQuestions++;
                    if (response.value === 'pass') passedQuestions++;
                }
            });
        }
    });
    
    const complianceRate = totalQuestions > 0 ? Math.round((passedQuestions / totalQuestions) * 100) : 100;
    document.querySelector('.stat-card:nth-child(4) .stat-value').textContent = `${complianceRate}%`;
}

// Inspection Management
async function startNewInspection() {
    const location = elements.deliveryStationSelect.value;
    const templateId = elements.inspectionTypeSelect.value;
    
    if (!templateId) {
        showNotification('Please select an inspection type', 'warning');
        return;
    }
    
    const template = state.templates.find(t => t.id === templateId);
    if (!template) {
        showNotification('Template not found', 'error');
        return;
    }
    
    // Create new inspection
    const inspection = {
        id: generateUUID(),
        templateId: template.id,
        templateName: template.name,
        location: location,
        status: 'pending',
        auditor: state.user.email,
        auditorName: state.user.user_metadata?.full_name || state.user.email,
        date: new Date().toISOString(),
        startTime: new Date().toISOString(),
        responses: {},
        comments: {},
        photos: {},
        signatures: {}
    };
    
    state.currentInspection = inspection;
    await dbOperations.save('inspections', inspection);
    
    // Navigate to inspection form
    setActiveSection('inspections');
    showInspectionForm(template);
}

function showInspectionForm(template) {
    const title = document.getElementById('inspection-title');
    title.innerHTML = `<i class="fas fa-shield-check"></i> ${template.name}`;
    
    // Update form metadata
    document.getElementById('auditor-names').value = state.currentInspection.auditorName;
    document.getElementById('inspection-date').value = new Date(state.currentInspection.date).toISOString().split('T')[0];
    
    // Show category overview
    showInspectionOverview();
}

function showInspectionOverview() {
    const questionsSection = document.getElementById('questions-section');
    const template = state.templates.find(t => t.id === state.currentInspection.templateId);
    
    if (!template || !template.categories) return;
    
    let html = '<div class="category-grid">';
    
    template.categories.forEach(category => {
        const totalQuestions = category.questions.length;
        const answeredQuestions = category.questions.filter(q => 
            state.currentInspection.responses[q.id]
        ).length;
        
        const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
        
        html += `
            <div class="category-card" onclick="showCategoryQuestions('${category.id}')">
                <div class="category-icon">
                    <i class="${category.icon}"></i>
                </div>
                <h4 class="category-name">${category.name}</h4>
                <div class="category-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${answeredQuestions}/${totalQuestions} completed</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    questionsSection.innerHTML = html;
    updateInspectionProgress();
}

function showCategoryQuestions(categoryId) {
    const template = state.templates.find(t => t.id === state.currentInspection.templateId);
    const category = template.categories.find(c => c.id === categoryId);
    
    if (!category) return;
    
    state.currentCategory = categoryId;
    
    const questionsSection = document.getElementById('questions-section');
    let html = `
        <div class="category-header">
            <button class="btn btn-secondary" onclick="showInspectionOverview()">
                <i class="fas fa-arrow-left"></i> Back to Overview
            </button>
            <h3>${category.name}</h3>
        </div>
    `;
    
    category.questions.forEach((question, index) => {
        html += generateQuestionHTML(question, index + 1);
    });
    
    questionsSection.innerHTML = html;
    
    // Restore saved responses
    category.questions.forEach(question => {
        const response = state.currentInspection.responses[question.id];
        if (response) {
            if (response.type === 'passfail') {
                const btn = document.querySelector(`button[data-question="${question.id}"][data-value="${response.value}"]`);
                if (btn) {
                    btn.classList.add('selected', response.value);
                }
            }
            
            const comment = state.currentInspection.comments[question.id];
            if (comment) {
                const textarea = document.querySelector(`textarea[data-question="${question.id}"]`);
                if (textarea) textarea.value = comment;
            }
        }
    });
    
    updateInspectionProgress();
}

function generateQuestionHTML(question, number) {
    const response = state.currentInspection.responses[question.id];
    const comment = state.currentInspection.comments[question.id];
    
    return `
        <div class="question-card" data-question-id="${question.id}">
            <div class="question-header">
                <div class="question-number">${number}</div>
                <div class="question-text">
                    ${question.text}
                    ${question.required ? '<span class="question-required">*</span>' : ''}
                </div>
            </div>
            
            ${question.type === 'passfail' ? `
                <div class="question-options">
                    <button class="option-btn ${response?.value === 'pass' ? 'selected pass' : ''}" 
                            data-question="${question.id}" 
                            data-value="pass"
                            onclick="handleQuestionResponse('${question.id}', 'pass', 'passfail')">
                        <i class="fas fa-check-circle"></i>
                        Pass
                    </button>
                    <button class="option-btn ${response?.value === 'fail' ? 'selected fail' : ''}" 
                            data-question="${question.id}" 
                            data-value="fail"
                            onclick="handleQuestionResponse('${question.id}', 'fail', 'passfail')">
                        <i class="fas fa-times-circle"></i>
                        Fail
                    </button>
                    <button class="option-btn ${response?.value === 'na' ? 'selected' : ''}" 
                            data-question="${question.id}" 
                            data-value="na"
                            onclick="handleQuestionResponse('${question.id}', 'na', 'passfail')">
                        <i class="fas fa-minus-circle"></i>
                        N/A
                    </button>
                </div>
            ` : ''}
            
            <div class="comments-section">
                <label class="form-label">
                    <i class="fas fa-comment"></i> Comments
                </label>
                <textarea class="comments-textarea" 
                          data-question="${question.id}"
                          placeholder="Add any additional observations..."
                          onchange="handleCommentChange('${question.id}', this.value)">${comment || ''}</textarea>
            </div>
            
            <div class="question-actions">
                <button class="btn-icon" onclick="addPhoto('${question.id}')" title="Add Photo">
                    <i class="fas fa-camera"></i>
                </button>
                <button class="btn-icon" onclick="addVoiceNote('${question.id}')" title="Add Voice Note">
                    <i class="fas fa-microphone"></i>
                </button>
            </div>
        </div>
    `;
}

async function handleQuestionResponse(questionId, value, type) {
    // Update UI
    const buttons = document.querySelectorAll(`button[data-question="${questionId}"]`);
    buttons.forEach(btn => {
        btn.classList.remove('selected', 'pass', 'fail');
    });
    
    const selectedBtn = document.querySelector(`button[data-question="${questionId}"][data-value="${value}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
        if (value === 'pass') selectedBtn.classList.add('pass');
        if (value === 'fail') selectedBtn.classList.add('fail');
    }
    
    // Save response
    state.currentInspection.responses[questionId] = {
        type: type,
        value: value,
        timestamp: new Date().toISOString()
    };
    
    await saveInspection();
    updateInspectionProgress();
}

async function handleCommentChange(questionId, value) {
    if (value.trim()) {
        state.currentInspection.comments[questionId] = value;
    } else {
        delete state.currentInspection.comments[questionId];
    }
    
    await saveInspection();
}

async function saveInspection() {
    if (!state.currentInspection) return;
    
    state.currentInspection.lastModified = new Date().toISOString();
    await dbOperations.save('inspections', state.currentInspection);
    
    // Show save indicator
    const saveIndicator = document.querySelector('.mobile-save-indicator');
    if (saveIndicator) {
        saveIndicator.style.opacity = '1';
        setTimeout(() => {
            saveIndicator.style.opacity = '0.5';
        }, 1000);
    }
}

function updateInspectionProgress() {
    if (!state.currentInspection) return;
    
    const template = state.templates.find(t => t.id === state.currentInspection.templateId);
    if (!template) return;
    
    let totalQuestions = 0;
    let answeredQuestions = 0;
    
    template.categories.forEach(category => {
        category.questions.forEach(question => {
            if (question.required) {
                totalQuestions++;
                if (state.currentInspection.responses[question.id]) {
                    answeredQuestions++;
                }
            }
        });
    });
    
    const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('progress-status').textContent = `${answeredQuestions} of ${totalQuestions} completed`;
}

// Load Inspections Lists
async function loadPendingInspections() {
    const pending = await dbOperations.getAll('inspections', 'status', 'pending');
    const pendingList = elements.pendingList;
    
    pendingList.innerHTML = '';
    
    if (pending.length === 0) {
        pendingList.innerHTML = '<li class="list-item">No pending inspections</li>';
        return;
    }
    
    pending.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    pending.forEach(inspection => {
        const li = document.createElement('li');
        li.className = 'list-item mobile-list-item touchable';
        li.innerHTML = `
            <div class="list-item-header">
                <div class="list-item-title">${inspection.location} - ${inspection.templateName}</div>
                <div class="status-indicator status-pending">
                    <i class="fas fa-clock"></i>
                </div>
            </div>
            <div class="list-item-meta">
                <i class="fas fa-user"></i> ${inspection.auditorName} • ${formatDate(inspection.date)}
            </div>
        `;
        li.onclick = () => resumeInspection(inspection.id);
        pendingList.appendChild(li);
    });
}

async function loadCompletedInspections() {
    const completed = await dbOperations.getAll('inspections', 'status', 'completed');
    const completedList = elements.completedList;
    
    completedList.innerHTML = '';
    
    if (completed.length === 0) {
        completedList.innerHTML = '<li class="list-item">No completed inspections</li>';
        return;
    }
    
    completed.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Show only recent 5
    completed.slice(0, 5).forEach(inspection => {
        const li = document.createElement('li');
        li.className = 'list-item mobile-list-item touchable';
        li.innerHTML = `
            <div class="list-item-header">
                <div class="list-item-title">${inspection.location} - ${inspection.templateName}</div>
                <div class="status-indicator status-completed">
                    <i class="fas fa-check"></i>
                </div>
            </div>
            <div class="list-item-meta">
                <i class="fas fa-user"></i> ${inspection.auditorName} • ${formatDate(inspection.date)}
            </div>
        `;
        li.onclick = () => viewInspection(inspection.id);
        completedList.appendChild(li);
    });
}

async function resumeInspection(inspectionId) {
    const inspection = await dbOperations.get('inspections', inspectionId);
    if (!inspection) return;
    
    state.currentInspection = inspection;
    const template = state.templates.find(t => t.id === inspection.templateId);
    
    setActiveSection('inspections');
    showInspectionForm(template);
}

async function viewInspection(inspectionId) {
    const inspection = await dbOperations.get('inspections', inspectionId);
    if (!inspection) return;
    
    // TODO: Implement read-only view
    showNotification('Opening inspection report...', 'info');
}

// PDF Export
async function exportToPDF() {
    if (!state.currentInspection) return;
    
    try {
        // Load jsPDF if not already loaded
        if (!window.jspdf) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.text('Safety Inspection Report', 20, 20);
        
        // Metadata
        doc.setFontSize(12);
        doc.text(`Location: ${state.currentInspection.location}`, 20, 35);
        doc.text(`Type: ${state.currentInspection.templateName}`, 20, 42);
        doc.text(`Auditor: ${state.currentInspection.auditorName}`, 20, 49);
        doc.text(`Date: ${formatDate(state.currentInspection.date)}`, 20, 56);
        
        // Get template
        const template = state.templates.find(t => t.id === state.currentInspection.templateId);
        
        let yPosition = 70;
        
        // Questions and responses
        template.categories.forEach(category => {
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(category.name, 20, yPosition);
            yPosition += 10;
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(11);
            
            category.questions.forEach((question, index) => {
                const response = state.currentInspection.responses[question.id];
                const comment = state.currentInspection.comments[question.id];
                
                // Check if we need a new page
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.text(`${index + 1}. ${question.text}`, 20, yPosition);
                yPosition += 7;
                
                if (response) {
                    const status = response.value === 'pass' ? '✓ Pass' : response.value === 'fail' ? '✗ Fail' : '- N/A';
                    doc.text(`   Status: ${status}`, 25, yPosition);
                    yPosition += 7;
                }
                
                if (comment) {
                    const lines = doc.splitTextToSize(`   Comments: ${comment}`, 165);
                    lines.forEach(line => {
                        doc.text(line, 25, yPosition);
                        yPosition += 7;
                    });
                }
                
                yPosition += 5;
            });
            
            yPosition += 10;
        });
        
        // Save the PDF
        const filename = `inspection_${state.currentInspection.location}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        
        showNotification('PDF exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showNotification('Error exporting PDF', 'error');
    }
}

// Submit and Sync
async function submitInspection() {
    if (!state.currentInspection) return;
    
    // Validate required questions
    const template = state.templates.find(t => t.id === state.currentInspection.templateId);
    let allRequiredAnswered = true;
    
    template.categories.forEach(category => {
        category.questions.forEach(question => {
            if (question.required && !state.currentInspection.responses[question.id]) {
                allRequiredAnswered = false;
            }
        });
    });
    
    if (!allRequiredAnswered) {
        showNotification('Please answer all required questions', 'warning');
        return;
    }
    
    // Update inspection status
    state.currentInspection.status = 'completed';
    state.currentInspection.completedTime = new Date().toISOString();
    
    await dbOperations.save('inspections', state.currentInspection);
    
    // Sync to server
    await syncInspection(state.currentInspection);
    
    // Reset current inspection
    state.currentInspection = null;
    
    // Update UI
    await updateDashboardStats();
    await loadPendingInspections();
    await loadCompletedInspections();
    
    showNotification('Inspection submitted successfully', 'success');
    setActiveSection('dashboard');
}

// Sync Operations
async function syncInspection(inspection) {
    if (!navigator.onLine) {
        await dbOperations.save('pendingSync', inspection);
        showNotification('Saved offline. Will sync when online.', 'info');
        return;
    }
    
    try {
        const token = await state.user?.jwt?.();
        if (!token) return;
        
        const response = await fetch(`/.netlify/functions/blob?path=inspections/${inspection.id}.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(inspection)
        });
        
        if (response.ok) {
            // Remove from pending sync if exists
            await dbOperations.delete('pendingSync', inspection.id);
        } else {
            throw new Error('Sync failed');
        }
    } catch (error) {
        console.error('Sync error:', error);
        await dbOperations.save('pendingSync', inspection);
        showNotification('Sync failed. Will retry later.', 'warning');
    }
}

async function syncAllPending() {
    const pending = await dbOperations.getAll('pendingSync');
    
    if (pending.length === 0) {
        showNotification('No pending items to sync', 'info');
        return;
    }
    
    let synced = 0;
    for (const item of pending) {
        try {
            await syncInspection(item);
            synced++;
        } catch (error) {
            console.error('Error syncing item:', error);
        }
    }
    
    showNotification(`Synced ${synced} of ${pending.length} items`, 'success');
    await updateDashboardStats();
}

// Reports Section
async function renderReports() {
    const container = document.getElementById('reports-container');
    const inspections = await dbOperations.getAll('inspections', 'status', 'completed');
    
    if (inspections.length === 0) {
        container.innerHTML = '<p class="text-center">No completed inspections yet</p>';
        return;
    }
    
    inspections.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '';
    inspections.forEach(inspection => {
        html += `
            <div class="list-item mobile-list-item touchable" onclick="generateReport('${inspection.id}')">
                <div class="list-item-header">
                    <div class="list-item-title">${inspection.location} - ${inspection.templateName}</div>
                    <div class="report-actions">
                        <button class="btn-icon" onclick="event.stopPropagation(); exportReportPDF('${inspection.id}')" title="Export PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <button class="btn-icon" onclick="event.stopPropagation(); shareReport('${inspection.id}')" title="Share">
                            <i class="fas fa-share"></i>
                        </button>
                    </div>
                </div>
                <div class="list-item-content">
                    Completed by ${inspection.auditorName}
                </div>
                <div class="list-item-meta">
                    <i class="fas fa-calendar"></i> ${formatDate(inspection.date)}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function generateReport(inspectionId) {
    const inspection = await dbOperations.get('inspections', inspectionId);
    if (!inspection) return;
    
    // TODO: Implement detailed report view
    showNotification('Loading report...', 'info');
}

async function exportReportPDF(inspectionId) {
    const inspection = await dbOperations.get('inspections', inspectionId);
    if (!inspection) return;
    
    state.currentInspection = inspection;
    await exportToPDF();
}

async function shareReport(inspectionId) {
    const inspection = await dbOperations.get('inspections', inspectionId);
    if (!inspection) return;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: `Inspection Report - ${inspection.location}`,
                text: `Safety inspection completed at ${inspection.location} on ${formatDate(inspection.date)}`,
                url: window.location.href
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    } else {
        showNotification('Sharing not supported on this device', 'warning');
    }
}

// Analytics Section
async function renderAnalytics() {
    const inspections = await dbOperations.getAll('inspections');
    
    // Calculate metrics
    const locationStats = {};
    const typeStats = {};
    const monthlyStats = {};
    
    inspections.forEach(inspection => {
        // Location stats
        locationStats[inspection.location] = (locationStats[inspection.location] || 0) + 1;
        
        // Type stats
        typeStats[inspection.templateName] = (typeStats[inspection.templateName] || 0) + 1;
        
        // Monthly stats
        const month = new Date(inspection.date).toISOString().substring(0, 7);
        monthlyStats[month] = (monthlyStats[month] || 0) + 1;
    });
    
    // Render chart
    const ctx = document.getElementById('analytics-chart');
    if (ctx && window.Chart) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(locationStats),
                datasets: [{
                    label: 'Inspections by Location',
                    data: Object.values(locationStats),
                    backgroundColor: '#6366f1',
                    borderColor: '#5558e3',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#f1f5f9'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: '#334155'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: '#334155'
                        }
                    }
                }
            }
        });
    }
}

// Settings Section
function renderSettings() {
    const section = document.querySelector('[data-section="settings"]');
    
    section.innerHTML = `
        <div class="content-card mobile-card">
            <div class="content-header mobile-content-header">
                <h2 class="content-title mobile-title">
                    <i class="fas fa-cog"></i>
                    Settings
                </h2>
            </div>
            
            <div class="settings-content">
                <div class="form-section">
                    <h3 class="form-section-title">
                        <i class="fas fa-user"></i>
                        Account
                    </h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-label">Email</div>
                            <div class="setting-value">${state.user?.email || 'Not logged in'}</div>
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        Log Out
                    </button>
                </div>
                
                <div class="form-section">
                    <h3 class="form-section-title">
                        <i class="fas fa-bell"></i>
                        Notifications
                    </h3>
                    <div class="setting-item">
                        <label class="setting-toggle">
                            <input type="checkbox" ${state.settings.notifications ? 'checked' : ''} 
                                   onchange="toggleSetting('notifications', this.checked)">
                            <span class="toggle-label">Enable Notifications</span>
                        </label>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3 class="form-section-title">
                        <i class="fas fa-sync"></i>
                        Sync Settings
                    </h3>
                    <div class="setting-item">
                        <label class="setting-toggle">
                            <input type="checkbox" ${state.settings.autoSave ? 'checked' : ''} 
                                   onchange="toggleSetting('autoSave', this.checked)">
                            <span class="toggle-label">Auto-save</span>
                        </label>
                    </div>
                    <button class="btn btn-primary" onclick="syncAllPending()">
                        <i class="fas fa-sync-alt"></i>
                        Sync Now
                    </button>
                </div>
                
                <div class="form-section">
                    <h3 class="form-section-title">
                        <i class="fas fa-database"></i>
                        Data Management
                    </h3>
                    <button class="btn btn-secondary" onclick="exportAllData()">
                        <i class="fas fa-download"></i>
                        Export All Data
                    </button>
                    <button class="btn btn-secondary" onclick="importData()">
                        <i class="fas fa-upload"></i>
                        Import Data
                    </button>
                </div>
                
                <div class="form-section">
                    <h3 class="form-section-title">
                        <i class="fas fa-info-circle"></i>
                        About
                    </h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-label">Version</div>
                            <div class="setting-value">1.0.0</div>
                        </div>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-label">Build Date</div>
                            <div class="setting-value">${new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function toggleSetting(key, value) {
    state.settings[key] = value;
    await saveSettings();
    showNotification('Settings updated', 'success');
}

function logout() {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.logout();
    }
}

// Data Export/Import
async function exportAllData() {
    try {
        const data = {
            inspections: await dbOperations.getAll('inspections'),
            templates: await dbOperations.getAll('templates'),
            settings: state.settings,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aurora-audit-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification('Data exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Error exporting data', 'error');
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate data structure
            if (!data.version || !data.inspections) {
                throw new Error('Invalid data format');
            }
            
            // Import data
            for (const inspection of data.inspections) {
                await dbOperations.save('inspections', inspection);
            }
            
            if (data.templates) {
                for (const template of data.templates) {
                    await dbOperations.save('templates', template);
                }
            }
            
            showNotification('Data imported successfully', 'success');
            
            // Reload app
            location.reload();
        } catch (error) {
            console.error('Error importing data:', error);
            showNotification('Error importing data', 'error');
        }
    };
    
    input.click();
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    attachNavigationListeners();
    
    // Mobile navigation
    elements.mobileNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            if (section) {
                setActiveSection(section);
                
                // Update active state
                elements.mobileNavItems.forEach(nav => nav.classList.remove('active'));
                e.currentTarget.classList.add('active');
            }
        });
    });
    
    // Mobile menu
    elements.mobileMenuBtn?.addEventListener('click', toggleMobileMenu);
    elements.closeSidebarBtn?.addEventListener('click', closeMobileMenu);
    elements.sidebarOverlay?.addEventListener('click', closeMobileMenu);
    
    // User menu
    elements.userMenu?.addEventListener('click', toggleUserMenu);
    
    // Start inspection
    elements.startInspectionBtn?.addEventListener('click', startNewInspection);
    elements.mobileNewInspectionBtn?.addEventListener('click', () => {
        showActionSheet();
    });
    
    // Action sheet
    document.querySelector('.action-sheet-backdrop')?.addEventListener('click', hideActionSheet);
    document.querySelector('.action-sheet-cancel')?.addEventListener('click', hideActionSheet);
    
    document.querySelectorAll('.action-sheet-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            handleActionSheetOption(action);
            hideActionSheet();
        });
    });
    
    // Form actions
    document.getElementById('save-draft-btn')?.addEventListener('click', saveInspection);
    document.getElementById('export-pdf-btn')?.addEventListener('click', exportToPDF);
    document.getElementById('submit-inspection-btn')?.addEventListener('click', submitInspection);
    
    // Quick actions
    document.getElementById('import-questions-btn')?.addEventListener('click', importData);
    document.getElementById('export-questions-btn')?.addEventListener('click', exportAllData);
    document.getElementById('sync-data-btn')?.addEventListener('click', syncAllPending);
    document.getElementById('settings-btn')?.addEventListener('click', () => setActiveSection('settings'));
    
    // Window resize
    window.addEventListener('resize', handleResize);
    
    // Online/offline
    window.addEventListener('online', () => {
        showNotification('Back online', 'success');
        syncAllPending();
    });
    
    window.addEventListener('offline', () => {
        showNotification('Working offline', 'info');
    });
}

function toggleMobileMenu() {
    elements.sidebar.classList.toggle('active');
    elements.sidebarOverlay.classList.toggle('active');
    elements.mobileMenuBtn.classList.toggle('active');
}

function closeMobileMenu() {
    elements.sidebar.classList.remove('active');
    elements.sidebarOverlay.classList.remove('active');
    elements.mobileMenuBtn.classList.remove('active');
}

function toggleUserMenu() {
    // TODO: Implement user menu dropdown
}

function showActionSheet() {
    elements.actionSheet.classList.add('active');
}

function hideActionSheet() {
    elements.actionSheet.classList.remove('active');
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
            exportAllData();
            break;
        case 'sync':
            syncAllPending();
            break;
    }
}

function handleResize() {
    if (window.innerWidth > 1024) {
        closeMobileMenu();
    }
}

// Service Worker
function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showNotification('New version available. Refresh to update.', 'info');
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
        
        // Handle messages from service worker
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data.type === 'SYNC_STARTED') {
                syncAllPending();
            }
        });
    }
}

// Auto-sync
let syncInterval;

function startAutoSync() {
    if (syncInterval) clearInterval(syncInterval);
    
    syncInterval = setInterval(() => {
        if (navigator.onLine) {
            syncAllPending();
        }
    }, state.settings.syncInterval || 60000);
}

// Utility Functions
function generateUUID() {
    if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    }
    
    // Less than 7 days
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}d ago`;
    }
    
    // Default to date
    return date.toLocaleDateString();
}

function showNotification(message, type = 'info') {
    // TODO: Implement toast notifications
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Simple implementation for now
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

async function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Add photo functionality
async function addPhoto(questionId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onload = async (e) => {
                if (!state.currentInspection.photos[questionId]) {
                    state.currentInspection.photos[questionId] = [];
                }
                
                state.currentInspection.photos[questionId].push({
                    data: e.target.result,
                    timestamp: new Date().toISOString()
                });
                
                await saveInspection();
                showNotification('Photo added', 'success');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error adding photo:', error);
            showNotification('Error adding photo', 'error');
        }
    };
    
    input.click();
}

// Add voice note functionality
async function addVoiceNote(questionId) {
    // TODO: Implement voice recording
    showNotification('Voice notes coming soon', 'info');
}



// Global functions for inline handlers
window.handleQuestionResponse = handleQuestionResponse;
window.handleCommentChange = handleCommentChange;
window.showCategoryQuestions = showCategoryQuestions;
window.showInspectionOverview = showInspectionOverview;
window.toggleSetting = toggleSetting;
window.logout = logout;
window.exportAllData = exportAllData;
window.importData = importData;
window.syncAllPending = syncAllPending;
window.generateReport = generateReport;
window.exportReportPDF = exportReportPDF;
window.shareReport = shareReport;
window.addPhoto = addPhoto;
window.addVoiceNote = addVoiceNote;

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .category-card {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-lg);
        padding: 1.5rem;
        cursor: pointer;
        transition: all var(--transition-fast);
        text-align: center;
    }
    
    .category-card:hover {
        border-color: var(--primary);
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }
    
    .category-icon {
        font-size: 3rem;
        color: var(--primary);
        margin-bottom: 1rem;
    }
    
    .category-name {
        font-size: 1.125rem;
        margin-bottom: 1rem;
    }
    
    .category-progress {
        margin-top: 1rem;
    }
    
    .progress-text {
        font-size: 0.875rem;
        color: var(--text-secondary);
        display: block;
        margin-top: 0.5rem;
    }
    
    .category-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-primary);
    }
    
    .question-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
    }
    
    .report-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .setting-item {
        padding: 1rem 0;
        border-bottom: 1px solid var(--border-primary);
    }
    
    .setting-item:last-child {
        border-bottom: none;
    }
    
    .setting-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .setting-label {
        font-weight: 500;
        color: var(--text-primary);
    }
    
    .setting-value {
        color: var(--text-secondary);
    }
    
    .setting-toggle {
        display: flex;
        align-items: center;
        cursor: pointer;
    }
    
    .setting-toggle input[type="checkbox"] {
        margin-right: 0.75rem;
        width: 20px;
        height: 20px;
        cursor: pointer;
    }
    
    .toggle-label {
        font-weight: 500;
        color: var(--text-primary);
    }
    
    .settings-content {
        padding: 1.5rem;
    }
    
    @media (max-width: 768px) {
        .category-grid {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(style);
