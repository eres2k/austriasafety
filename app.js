// Aurora Audit Platform - Enhanced with Full Feature Set
// Complete implementation with all auditor-focused features

document.addEventListener('DOMContentLoaded', () => {
  /* ------------------------------------------------------------------ */
  /*                         Core Setup & State                         */
  /* ------------------------------------------------------------------ */
  // Initialize Netlify Identity
  if (window.netlifyIdentity) {
    window.netlifyIdentity.init();
  }

  // Global state management
  const state = {
    currentInspectionId: null,
    currentView: 'edit', // 'edit' or 'preview'
    currentCategory: null,
    filters: {
      location: 'all',
      type: 'all',
      dateRange: 'all',
      status: 'all'
    },
    settings: loadSettings(),
    inspectionTimer: null,
    startTime: null,
    gpsLocation: null,
    offlineQueue: []
  };

  // Load settings from localStorage
  function loadSettings() {
    const defaults = {
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      darkMode: false,
      language: 'en',
      notifications: true,
      gpsTracking: true,
      cameraQuality: 'high',
      signatureRequired: true,
      riskScoring: true
    };
    try {
      const saved = localStorage.getItem('aurora-settings');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  }

  // Save settings
  function saveSettings() {
    localStorage.setItem('aurora-settings', JSON.stringify(state.settings));
    applySettings();
  }

  // Apply settings
  function applySettings() {
    document.body.classList.toggle('dark-mode', state.settings.darkMode);
    if (state.settings.gpsTracking) {
      requestGPSLocation();
    }
  }

  // Cache DOM elements
  const elements = {
    userMenu: document.getElementById('user-menu'),
    pendingList: document.getElementById('pending-list'),
    completedList: document.getElementById('completed-list'),
    startInspectionBtn: document.getElementById('start-inspection-btn'),
    saveDraftBtn: document.getElementById('save-draft-btn'),
    submitInspectionBtn: document.getElementById('submit-inspection-btn'),
    previewModeBtn: document.getElementById('preview-mode-btn'),
    exportPdfBtn: document.getElementById('export-pdf-btn'),
    locationSelect: document.getElementById('delivery-station-select'),
    typeSelect: document.getElementById('inspection-type-select'),
    auditorNamesInput: document.getElementById('auditor-names'),
    inspectionDateInput: document.getElementById('inspection-date'),
    progressStatusEl: document.getElementById('progress-status'),
    progressFillEl: document.getElementById('progress-fill'),
    inspectionTitleEl: document.getElementById('inspection-title'),
    questionsSection: document.getElementById('questions-section'),
    navItems: {
      dashboard: document.getElementById('nav-dashboard'),
      inspections: document.getElementById('nav-inspections'),
      reports: document.getElementById('nav-reports'),
      analytics: document.getElementById('nav-analytics')
    },
    quickActions: {
      import: document.getElementById('import-questions-btn'),
      export: document.getElementById('export-questions-btn'),
      exportReports: document.getElementById('export-reports-btn'),
      sync: document.getElementById('sync-data-btn'),
      settings: document.getElementById('settings-btn')
    },
    mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
    sidebar: document.querySelector('.sidebar')
  };

  // Initialize offline queue
  let offlineQueue = JSON.parse(localStorage.getItem('offline-queue') || '[]');
  let autoSaveInterval = null;
  let questionFiles = {};
  let inspectionsData = [];
  let signatureData = {};

  /* ------------------------------------------------------------------ */
  /*                      Enhanced Question System                      */
  /* ------------------------------------------------------------------ */
  
  // Extended question types with risk scoring
  const defaultQuestions = [
    // Critical Safety Items (High Risk)
    { 
      id: 'emergency-exits-blocked', 
      type: 'boolean', 
      category: 'Critical Safety', 
      question: 'Are any emergency exits blocked or locked?',
      required: true,
      riskWeight: 10,
      correctAnswer: 'no',
      guidance: 'All emergency exits must be clear and unlocked during operating hours'
    },
    { 
      id: 'fire-equipment-missing', 
      type: 'boolean', 
      category: 'Critical Safety', 
      question: 'Is any required fire safety equipment missing or damaged?',
      required: true,
      riskWeight: 10,
      correctAnswer: 'no'
    },
    
    // General Safety (Medium Risk)
    { 
      id: 'general-visible-signs', 
      type: 'boolean', 
      category: 'General Safety', 
      question: 'Sind Sicherheitshinweise und Fluchtwegpläne deutlich sichtbar?',
      required: false,
      riskWeight: 5,
      correctAnswer: 'yes'
    },
    { 
      id: 'general-exits-clear', 
      type: 'boolean', 
      category: 'General Safety', 
      question: 'Sind alle Notausgänge frei und gut gekennzeichnet?',
      required: true,
      riskWeight: 8,
      correctAnswer: 'yes'
    },
    { 
      id: 'general-first-aid', 
      type: 'boolean', 
      category: 'General Safety', 
      question: 'Ist die Erste-Hilfe-Ausstattung vollständig und erreichbar?',
      required: false,
      riskWeight: 6,
      correctAnswer: 'yes'
    },
    
    // Workplace & Environment (Low-Medium Risk)
    { 
      id: 'workplace-clean', 
      type: 'boolean', 
      category: 'Workplace & Environment', 
      question: 'Ist die Lagerhalle sauber und aufgeräumt?',
      required: false,
      riskWeight: 3,
      correctAnswer: 'yes'
    },
    { 
      id: 'workplace-lighting', 
      type: 'boolean', 
      category: 'Workplace & Environment', 
      question: 'Entspricht die Beleuchtung den Anforderungen? (min. 200 Lux)',
      required: false,
      riskWeight: 4,
      correctAnswer: 'yes',
      measurement: { unit: 'lux', min: 200 }
    },
    { 
      id: 'workplace-temperature', 
      type: 'range', 
      category: 'Workplace & Environment', 
      question: 'Raumtemperatur (°C)',
      required: false,
      min: 10,
      max: 35,
      optimal: { min: 18, max: 25 },
      unit: '°C'
    },
    
    // Quantitative measurements
    { 
      id: 'extinguisher-count', 
      type: 'number', 
      category: 'Fire Safety', 
      question: 'Anzahl der überprüften Feuerlöscher',
      required: true,
      min: 0
    },
    { 
      id: 'emergency-lights-tested', 
      type: 'checklist', 
      category: 'Emergency Systems', 
      question: 'Notbeleuchtung getestet',
      required: true,
      options: [
        'Haupteingang',
        'Lagerbereich A',
        'Lagerbereich B',
        'Bürobereich',
        'Pausenraum',
        'Notausgang Nord',
        'Notausgang Süd'
      ]
    },
    
    // Photo evidence
    { 
      id: 'safety-violations-photos', 
      type: 'photo', 
      category: 'Documentation', 
      question: 'Fotos von Sicherheitsverstößen',
      required: false,
      multiple: true,
      maxFiles: 10
    },
    
    // Text observations
    { 
      id: 'additional-observations', 
      type: 'text', 
      category: 'General Observations', 
      question: 'Zusätzliche Beobachtungen oder Empfehlungen',
      required: false
    }
  ];

  let questions = [...defaultQuestions];

  // Get unique categories
  function getCategories() {
    const categories = [...new Set(questions.map(q => q.category))];
    return categories;
  }

  /* ------------------------------------------------------------------ */
  /*                    Navigation & View Management                    */
  /* ------------------------------------------------------------------ */
  
  function setActiveSection(section) {
    console.log('Setting active section:', section);
    
    // Hide all sections
    document.querySelectorAll('[data-section]').forEach(el => {
      el.style.display = 'none';
    });
    
    // Hide all category sections
    document.querySelectorAll('[data-category-section]').forEach(el => {
      el.style.display = 'none';
    });
    
    // Show selected section
    const sectionEl = document.querySelector(`[data-section="${section}"]`);
    if (sectionEl) {
      sectionEl.style.display = 'block';
      console.log('Section found and displayed:', section);
    } else {
      console.error('Section not found:', section);
    }
    
    // Update nav states
    Object.values(elements.navItems).forEach(item => {
      item?.classList.remove('active');
    });
    
    // Also remove active from category nav items
    document.querySelectorAll('.category-nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    if (elements.navItems[section]) {
      elements.navItems[section].classList.add('active');
    }
    
    // Close mobile menu after navigation
    if (window.innerWidth <= 1024) {
      closeMobileMenu();
    }
    
    // Section-specific initialization
    switch (section) {
      case 'dashboard':
        // Dashboard is already visible, just update stats if needed
        break;
      case 'inspections':
        if (!state.currentCategory) {
          showInspectionOverview();
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
    
    // Reset current category when switching main sections
    if (section !== 'inspections') {
      state.currentCategory = null;
    }
  }

  function setCategorySection(category) {
    console.log('Setting category section:', category);
    state.currentCategory = category;
    
    // Hide all sections
    document.querySelectorAll('[data-section]').forEach(el => {
      el.style.display = 'none';
    });
    
    // Hide all category sections
    document.querySelectorAll('[data-category-section]').forEach(el => {
      el.style.display = 'none';
    });
    
    // Show inspections section container
    const inspectionsSection = document.querySelector('[data-section="inspections"]');
    if (inspectionsSection) {
      inspectionsSection.style.display = 'block';
    }
    
    // Show specific category section
    const categorySection = document.querySelector(`[data-category-section="${category}"]`);
    if (categorySection) {
      categorySection.style.display = 'block';
    } else {
      // If category section doesn't exist, create it
      createCategorySection(category);
    }
    
    // Update nav states
    document.querySelectorAll('.category-nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.category === category) {
        item.classList.add('active');
      }
    });
    
    // Mark inspections as active in main nav
    Object.values(elements.navItems).forEach(item => {
      item?.classList.remove('active');
    });
    if (elements.navItems.inspections) {
      elements.navItems.inspections.classList.add('active');
    }
    
    // Close mobile menu
    if (window.innerWidth <= 1024) {
      closeMobileMenu();
    }
    
    updateFormTitle();
    updateProgress();
  }

  function showInspectionOverview() {
    // Hide all category sections
    document.querySelectorAll('[data-category-section]').forEach(el => {
      el.style.display = 'none';
    });
    
    // Show overview
    let overview = document.getElementById('inspection-overview');
    if (!overview) {
      overview = createInspectionOverview();
    }
    overview.style.display = 'block';
  }

  function createInspectionOverview() {
    const container = document.querySelector('[data-section="inspections"]');
    const overview = document.createElement('div');
    overview.id = 'inspection-overview';
    overview.className = 'content-card slide-up';
    
    const categories = getCategories();
    const totalQuestions = questions.length;
    const requiredQuestions = questions.filter(q => q.required).length;
    
    overview.innerHTML = `
      <div class="content-header">
        <h2 class="content-title">
          <i class="fas fa-clipboard-check"></i>
          Inspection Categories
        </h2>
      </div>
      
      <div class="inspection-meta">
        <div class="meta-item">
          <span class="meta-label">Location:</span>
          <span class="meta-value">${elements.locationSelect.value || 'Not selected'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Type:</span>
          <span class="meta-value">${elements.typeSelect.value || 'Not selected'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Total Questions:</span>
          <span class="meta-value">${totalQuestions}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Required:</span>
          <span class="meta-value">${requiredQuestions}</span>
        </div>
      </div>
      
      <div class="category-grid">
        ${categories.map(category => {
          const categoryQuestions = questions.filter(q => q.category === category);
          const completedCount = categoryQuestions.filter(q => {
            const element = document.getElementById(q.id);
            return element && element.value;
          }).length;
          const progress = (completedCount / categoryQuestions.length) * 100;
          
          return `
            <div class="category-card" onclick="setCategorySection('${category}')">
              <div class="category-icon">
                <i class="fas ${getCategoryIcon(category)}"></i>
              </div>
              <h3 class="category-title">${category}</h3>
              <div class="category-stats">
                <span>${categoryQuestions.length} questions</span>
                <span class="category-progress">${completedCount}/${categoryQuestions.length} completed</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="inspection-actions">
        <button class="btn btn-primary" onclick="startFullInspection()">
          <i class="fas fa-play"></i> Start Full Inspection
        </button>
        <button class="btn btn-secondary" onclick="continueLastInspection()">
          <i class="fas fa-history"></i> Continue Last Session
        </button>
      </div>
    `;
    
    container.insertBefore(overview, container.firstChild);
    return overview;
  }

  function getCategoryIcon(category) {
    const icons = {
      'Critical Safety': 'fa-exclamation-triangle',
      'General Safety': 'fa-shield-alt',
      'Workplace & Environment': 'fa-building',
      'Fire Safety': 'fa-fire-extinguisher',
      'Emergency Systems': 'fa-bell',
      'Documentation': 'fa-camera',
      'General Observations': 'fa-clipboard'
    };
    return icons[category] || 'fa-folder';
  }

  function createCategorySection(category) {
    const container = document.querySelector('[data-section="inspections"]');
    const categoryQuestions = questions.filter(q => q.category === category);
    
    const section = document.createElement('div');
    section.setAttribute('data-category-section', category);
    section.className = 'content-card slide-up';
    section.style.display = 'block';
    
    section.innerHTML = `
      <div class="content-header">
        <h2 class="content-title">
          <i class="fas ${getCategoryIcon(category)}"></i>
          ${category}
        </h2>
        <div class="content-actions">
          <button class="btn btn-secondary" onclick="showInspectionOverview()">
            <i class="fas fa-arrow-left"></i> Back to Overview
          </button>
          <button class="btn btn-secondary" id="preview-mode-btn-${category}">
            <i class="fas fa-eye"></i> Preview Mode
          </button>
          <button class="btn btn-secondary" id="save-draft-btn-${category}">
            <i class="fas fa-save"></i> Save Draft
          </button>
        </div>
      </div>
      
      <div class="category-progress">
        <div class="flex items-center justify-between">
          <span class="form-label">Category Progress</span>
          <span id="category-progress-status-${category}" class="progress-status">0 of ${categoryQuestions.length} completed</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" id="category-progress-fill-${category}"></div>
        </div>
      </div>
      
      <div class="category-questions" id="category-questions-${category}">
        <!-- Questions will be rendered here -->
      </div>
      
      <div class="category-navigation">
        ${getCategoryNavigation(category)}
      </div>
    `;
    
    container.appendChild(section);
    
    // Render questions for this category
    renderCategoryQuestions(category);
    
    // Attach event listeners
    const previewBtn = document.getElementById(`preview-mode-btn-${category}`);
    const saveBtn = document.getElementById(`save-draft-btn-${category}`);
    
    if (previewBtn) previewBtn.addEventListener('click', togglePreviewMode);
    if (saveBtn) saveBtn.addEventListener('click', () => saveInspection('draft'));
  }

  function getCategoryNavigation(currentCategory) {
    const categories = getCategories();
    const currentIndex = categories.indexOf(currentCategory);
    const prevCategory = currentIndex > 0 ? categories[currentIndex - 1] : null;
    const nextCategory = currentIndex < categories.length - 1 ? categories[currentIndex + 1] : null;
    
    return `
      <div class="flex justify-between items-center">
        <button class="btn btn-secondary" ${!prevCategory ? 'disabled' : ''} 
                onclick="setCategorySection('${prevCategory}')">
          <i class="fas fa-chevron-left"></i>
          ${prevCategory || 'Previous'}
        </button>
        
        <span class="category-indicator">
          ${currentIndex + 1} of ${categories.length} categories
        </span>
        
        <button class="btn btn-primary" ${!nextCategory ? 'disabled' : ''} 
                onclick="${nextCategory ? `setCategorySection('${nextCategory}')` : 'submitInspection()'}">
          ${nextCategory ? 'Next Category' : 'Submit Inspection'}
          <i class="fas ${nextCategory ? 'fa-chevron-right' : 'fa-check-circle'}"></i>
        </button>
      </div>
    `;
  }

  function renderCategoryQuestions(category) {
    const container = document.getElementById(`category-questions-${category}`);
    if (!container) return;
    
    const categoryQuestions = questions.filter(q => q.category === category);
    
    container.innerHTML = '';
    
    categoryQuestions.forEach((q, index) => {
      const card = document.createElement('div');
      card.className = 'question-card';
      card.dataset.questionId = q.id;
      
      // Risk indicator for high-risk questions
      if (q.riskWeight >= 8) {
        card.classList.add('high-risk');
      }
      
      const header = document.createElement('div');
      header.className = 'question-header';
      
      const textEl = document.createElement('div');
      textEl.className = 'question-text';
      textEl.innerHTML = `
        ${q.question}
        ${q.required ? '<span class="question-required">*</span>' : ''}
        ${q.riskWeight >= 8 ? '<span class="risk-indicator" title="High Risk Item"><i class="fas fa-exclamation-triangle"></i></span>' : ''}
      `;
      header.appendChild(textEl);
      
      // Add controls based on question type
      const controlsDiv = document.createElement('div');
      controlsDiv.className = 'question-controls';
      
      // Voice button for text/number inputs
      if (['text', 'number'].includes(q.type)) {
        const voiceBtn = createVoiceButton(q.id);
        controlsDiv.appendChild(voiceBtn);
      }
      
      // Camera button for photo type
      if (q.type === 'photo') {
        const cameraBtn = createCameraButton(q.id);
        controlsDiv.appendChild(cameraBtn);
      }
      
      // Info button for guidance
      if (q.guidance) {
        const infoBtn = document.createElement('button');
        infoBtn.type = 'button';
        infoBtn.className = 'info-btn';
        infoBtn.title = 'Guidance';
        infoBtn.innerHTML = '<i class="fas fa-info-circle"></i>';
        infoBtn.onclick = () => showGuidance(q.guidance);
        controlsDiv.appendChild(infoBtn);
      }
      
      header.appendChild(controlsDiv);
      card.appendChild(header);
      
      // Create input control
      const control = createQuestionControl(q);
      card.appendChild(control);
      
      // Add comment field
      const commentField = createCommentField(q.id);
      card.appendChild(commentField);
      
      // Add file upload for all questions
      if (q.type !== 'photo') {
        const fileUpload = createFileUploadElement(q.id);
        card.appendChild(fileUpload);
      }
      
      // Risk scoring display
      if (q.riskWeight) {
        const riskScore = document.createElement('div');
        riskScore.className = 'risk-score';
        riskScore.innerHTML = `Risk Score: ${q.riskWeight}/10`;
        card.appendChild(riskScore);
      }
      
      container.appendChild(card);
    });
    
    // Initialize event listeners
    attachCategoryEventListeners(category);
    updateCategoryProgress(category);
  }

  function attachCategoryEventListeners(category) {
    const categoryQuestions = questions.filter(q => q.category === category);
    
    categoryQuestions.forEach(q => {
      switch (q.type) {
        case 'boolean':
          document.querySelectorAll(`input[name="${q.id}"]`).forEach(radio => {
            radio.addEventListener('change', () => updateCategoryProgress(category));
          });
          break;
          
        case 'checklist':
          document.querySelectorAll(`input[name="${q.id}"]`).forEach(cb => {
            cb.addEventListener('change', () => updateCategoryProgress(category));
          });
          break;
          
        default:
          const el = document.getElementById(q.id);
          if (el) {
            el.addEventListener('input', () => updateCategoryProgress(category));
            el.addEventListener('change', () => updateCategoryProgress(category));
          }
      }
    });
  }

  function updateCategoryProgress(category) {
    const categoryQuestions = questions.filter(q => q.category === category);
    const checks = [];
    
    categoryQuestions.forEach(q => {
      let hasValue = false;
      
      switch (q.type) {
        case 'boolean':
          hasValue = !!document.querySelector(`input[name="${q.id}"]:checked`);
          break;
          
        case 'text':
          const textEl = document.getElementById(q.id);
          hasValue = textEl && textEl.value.trim().length > 0;
          break;
          
        case 'number':
        case 'range':
          const numEl = document.getElementById(q.id);
          hasValue = numEl && numEl.value !== '';
          break;
          
        case 'checklist':
          const checkedBoxes = document.querySelectorAll(`input[name="${q.id}"]:checked`);
          hasValue = checkedBoxes.length > 0;
          break;
          
        case 'photo':
          hasValue = questionFiles[q.id] && questionFiles[q.id].length > 0;
          break;
      }
      
      checks.push(hasValue);
    });
    
    const completed = checks.filter(Boolean).length;
    const total = checks.length;
    const percent = total === 0 ? 0 : (completed / total) * 100;
    
    // Update category progress bar
    const fillEl = document.getElementById(`category-progress-fill-${category}`);
    const statusEl = document.getElementById(`category-progress-status-${category}`);
    
    if (fillEl) fillEl.style.width = `${percent}%`;
    if (statusEl) statusEl.textContent = `${completed} of ${total} completed`;
    
    // Also update overall progress
    updateProgress();
  }

  // Navigation event listeners
  Object.entries(elements.navItems).forEach(([section, element]) => {
    element?.addEventListener('click', e => {
      e.preventDefault();
      setActiveSection(section);
    });
  });

  // Mobile menu functionality
  function setupMobileMenu() {
    // Create mobile menu toggle if it doesn't exist
    if (!elements.mobileMenuToggle) {
      const toggle = document.createElement('button');
      toggle.id = 'mobile-menu-toggle';
      toggle.className = 'mobile-menu-toggle';
      toggle.innerHTML = '<i class="fas fa-bars"></i>';
      document.querySelector('.header-left').prepend(toggle);
      elements.mobileMenuToggle = toggle;
    }
    
    elements.mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024 && 
          !e.target.closest('.sidebar') && 
          !e.target.closest('.mobile-menu-toggle')) {
        closeMobileMenu();
      }
    });
  }

  function toggleMobileMenu() {
    elements.sidebar.classList.toggle('open');
    document.body.classList.toggle('menu-open');
  }

  function closeMobileMenu() {
    elements.sidebar.classList.remove('open');
    document.body.classList.remove('menu-open');
  }

  /* ------------------------------------------------------------------ */
  /*                        User Authentication                         */
  /* ------------------------------------------------------------------ */
  
  function updateUserMenu(user) {
    if (!user) {
      elements.userMenu.innerHTML = `
        <div class="user-avatar"><i class="fas fa-user"></i></div>
        <span class="user-text">Log in</span>
      `;
      elements.userMenu.onclick = () => {
        window.netlifyIdentity?.open();
      };
      // Clear lists
      elements.pendingList.innerHTML = '';
      elements.completedList.innerHTML = '';
      return;
    }

    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
    const initials = name.split(/\s+/).map(p => p[0]).join('').substring(0, 2).toUpperCase();
    
    elements.userMenu.innerHTML = `
      <div class="user-avatar">${initials}</div>
      <span class="user-text">${name}</span>
      <i class="fas fa-sign-out-alt"></i>
    `;
    elements.userMenu.onclick = () => {
      if (confirm('Are you sure you want to log out?')) {
        window.netlifyIdentity?.logout();
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /*                      Enhanced Form Rendering                       */
  /* ------------------------------------------------------------------ */
  
  function renderQuestions() {
    // This function now creates category navigation instead of rendering all questions
    const container = document.querySelector('[data-section="inspections"]');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create category navigation
    const categoryNav = document.createElement('div');
    categoryNav.className = 'category-navigation-bar';
    categoryNav.innerHTML = `
      <div class="category-nav-header">
        <button class="btn btn-secondary" onclick="showInspectionOverview()">
          <i class="fas fa-th-large"></i> Overview
        </button>
      </div>
      <div class="category-nav-items">
        ${getCategories().map(category => `
          <button class="category-nav-item" data-category="${category}" onclick="setCategorySection('${category}')">
            <i class="fas ${getCategoryIcon(category)}"></i>
            <span>${category}</span>
          </button>
        `).join('')}
      </div>
    `;
    
    container.appendChild(categoryNav);
    
    // Show overview by default
    showInspectionOverview();
  }

  function createQuestionControl(q) {
    switch (q.type) {
      case 'boolean':
        return createBooleanControl(q);
      case 'text':
        return createTextControl(q);
      case 'number':
        return createNumberControl(q);
      case 'range':
        return createRangeControl(q);
      case 'checklist':
        return createChecklistControl(q);
      case 'photo':
        return createPhotoControl(q);
      default:
        return createTextControl(q);
    }
  }

  function createBooleanControl(q) {
    const options = document.createElement('div');
    options.className = 'boolean-options';
    
    ['yes', 'no'].forEach(value => {
      const optionCard = document.createElement('div');
      optionCard.className = 'option-card';
      
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = q.id;
      input.id = `${q.id}-${value}`;
      input.value = value;
      
      const label = document.createElement('label');
      label.className = 'option-label';
      label.setAttribute('for', `${q.id}-${value}`);
      
      // Highlight if this is the "wrong" answer for risk scoring
      if (q.correctAnswer && value !== q.correctAnswer) {
        label.classList.add('risk-answer');
      }
      
      const icon = document.createElement('i');
      icon.className = value === 'yes' ? 'fas fa-check' : 'fas fa-times';
      
      label.appendChild(icon);
      label.appendChild(document.createTextNode(value === 'yes' ? ' Yes' : ' No'));
      
      optionCard.appendChild(input);
      optionCard.appendChild(label);
      options.appendChild(optionCard);
    });
    
    return options;
  }

  function createTextControl(q) {
    const textarea = document.createElement('textarea');
    textarea.id = q.id;
    textarea.className = 'text-input';
    textarea.placeholder = 'Enter your answer...';
    textarea.rows = 4;
    return textarea;
  }

  function createNumberControl(q) {
    const wrapper = document.createElement('div');
    wrapper.className = 'number-input-wrapper';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.id = q.id;
    input.className = 'form-control';
    input.placeholder = 'Enter number';
    
    if (q.min !== undefined) input.min = q.min;
    if (q.max !== undefined) input.max = q.max;
    
    // Add increment/decrement buttons
    const btnDecrement = document.createElement('button');
    btnDecrement.type = 'button';
    btnDecrement.className = 'number-btn';
    btnDecrement.innerHTML = '<i class="fas fa-minus"></i>';
    btnDecrement.onclick = () => {
      const current = parseInt(input.value) || 0;
      input.value = Math.max(current - 1, q.min || 0);
      input.dispatchEvent(new Event('input'));
    };
    
    const btnIncrement = document.createElement('button');
    btnIncrement.type = 'button';
    btnIncrement.className = 'number-btn';
    btnIncrement.innerHTML = '<i class="fas fa-plus"></i>';
    btnIncrement.onclick = () => {
      const current = parseInt(input.value) || 0;
      input.value = q.max ? Math.min(current + 1, q.max) : current + 1;
      input.dispatchEvent(new Event('input'));
    };
    
    wrapper.appendChild(btnDecrement);
    wrapper.appendChild(input);
    wrapper.appendChild(btnIncrement);
    
    return wrapper;
  }

  function createRangeControl(q) {
    const wrapper = document.createElement('div');
    wrapper.className = 'range-control';
    
    const display = document.createElement('div');
    display.className = 'range-display';
    
    const input = document.createElement('input');
    input.type = 'range';
    input.id = q.id;
    input.className = 'range-input';
    input.min = q.min || 0;
    input.max = q.max || 100;
    input.value = q.optimal ? (q.optimal.min + q.optimal.max) / 2 : (q.min + q.max) / 2;
    
    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'range-value';
    valueDisplay.textContent = `${input.value}${q.unit || ''}`;
    
    // Update display on change
    input.oninput = () => {
      valueDisplay.textContent = `${input.value}${q.unit || ''}`;
      
      // Check if in optimal range
      if (q.optimal) {
        const val = parseFloat(input.value);
        if (val >= q.optimal.min && val <= q.optimal.max) {
          valueDisplay.classList.add('optimal');
          valueDisplay.classList.remove('warning');
        } else {
          valueDisplay.classList.add('warning');
          valueDisplay.classList.remove('optimal');
        }
      }
    };
    
    display.appendChild(input);
    display.appendChild(valueDisplay);
    
    // Show optimal range
    if (q.optimal) {
      const optimalRange = document.createElement('div');
      optimalRange.className = 'optimal-range';
      optimalRange.textContent = `Optimal: ${q.optimal.min}-${q.optimal.max}${q.unit || ''}`;
      wrapper.appendChild(optimalRange);
    }
    
    wrapper.appendChild(display);
    return wrapper;
  }

  function createChecklistControl(q) {
    const wrapper = document.createElement('div');
    wrapper.className = 'checklist-control';
    
    const checkedCount = document.createElement('div');
    checkedCount.className = 'checked-count';
    checkedCount.textContent = '0 of ' + q.options.length + ' checked';
    wrapper.appendChild(checkedCount);
    
    const list = document.createElement('div');
    list.className = 'checklist-items';
    
    q.options.forEach((option, index) => {
      const item = document.createElement('div');
      item.className = 'checklist-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `${q.id}-${index}`;
      checkbox.name = q.id;
      checkbox.value = option;
      
      const label = document.createElement('label');
      label.setAttribute('for', `${q.id}-${index}`);
      label.textContent = option;
      
      // Update count on change
      checkbox.onchange = () => {
        const checked = wrapper.querySelectorAll('input[type="checkbox"]:checked').length;
        checkedCount.textContent = `${checked} of ${q.options.length} checked`;
        updateProgress();
      };
      
      item.appendChild(checkbox);
      item.appendChild(label);
      list.appendChild(item);
    });
    
    wrapper.appendChild(list);
    return wrapper;
  }

  function createPhotoControl(q) {
    const wrapper = document.createElement('div');
    wrapper.className = 'photo-control';
    
    const gallery = document.createElement('div');
    gallery.className = 'photo-gallery';
    gallery.id = `gallery-${q.id}`;
    
    const controls = document.createElement('div');
    controls.className = 'photo-controls';
    
    // Camera button
    const cameraBtn = document.createElement('button');
    cameraBtn.type = 'button';
    cameraBtn.className = 'btn btn-primary';
    cameraBtn.innerHTML = '<i class="fas fa-camera"></i> Take Photo';
    cameraBtn.onclick = () => capturePhoto(q.id);
    
    // Upload button
    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'btn btn-secondary';
    uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = q.multiple;
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => handlePhotoUpload(e, q.id);
    
    uploadBtn.onclick = () => fileInput.click();
    
    controls.appendChild(cameraBtn);
    controls.appendChild(uploadBtn);
    controls.appendChild(fileInput);
    
    wrapper.appendChild(gallery);
    wrapper.appendChild(controls);
    
    return wrapper;
  }

  function createCommentField(questionId) {
    const wrapper = document.createElement('div');
    wrapper.className = 'comment-field';
    
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'comment-toggle';
    toggle.innerHTML = '<i class="fas fa-comment"></i> Add Comment';
    
    const textarea = document.createElement('textarea');
    textarea.id = `comment-${questionId}`;
    textarea.className = 'comment-input';
    textarea.placeholder = 'Add additional notes or observations...';
    textarea.style.display = 'none';
    
    toggle.onclick = () => {
      const isVisible = textarea.style.display !== 'none';
      textarea.style.display = isVisible ? 'none' : 'block';
      toggle.innerHTML = isVisible 
        ? '<i class="fas fa-comment"></i> Add Comment'
        : '<i class="fas fa-comment-slash"></i> Hide Comment';
    };
    
    wrapper.appendChild(toggle);
    wrapper.appendChild(textarea);
    
    return wrapper;
  }

  function createVoiceButton(questionId) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'voice-btn';
    btn.title = 'Voice Input';
    btn.innerHTML = '<i class="fas fa-microphone"></i>';
    btn.onclick = () => toggleVoice(btn, questionId);
    return btn;
  }

  function createCameraButton(questionId) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'camera-btn';
    btn.title = 'Take Photo';
    btn.innerHTML = '<i class="fas fa-camera"></i>';
    btn.onclick = () => capturePhoto(questionId);
    return btn;
  }

  /* ------------------------------------------------------------------ */
  /*                    Enhanced File & Photo Handling                  */
  /* ------------------------------------------------------------------ */
  
  function createFileUploadElement(qid) {
    const wrapper = document.createElement('div');
    wrapper.className = 'file-upload';
    
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,application/pdf';
    input.style.display = 'none';
    
    const dropZone = document.createElement('div');
    dropZone.className = 'file-drop-zone';
    dropZone.innerHTML = `
      <div class="file-upload-icon">
        <i class="fas fa-cloud-upload-alt"></i>
      </div>
      <div class="file-upload-text">
        Click to upload or drag and drop
      </div>
      <div class="file-upload-hint">
        Images or PDF documents
      </div>
    `;
    
    const fileList = document.createElement('div');
    fileList.className = 'file-list';
    fileList.id = `files-${qid}`;
    
    // Initialize files array
    if (!questionFiles[qid]) {
      questionFiles[qid] = [];
    }
    
    // Click to upload
    dropZone.onclick = () => input.click();
    
    // File selection
    input.onchange = (e) => {
      handleFileSelection(e.target.files, qid);
    };
    
    // Drag and drop
    dropZone.ondragover = (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    };
    
    dropZone.ondragleave = () => {
      dropZone.classList.remove('drag-over');
    };
    
    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      handleFileSelection(e.dataTransfer.files, qid);
    };
    
    wrapper.appendChild(input);
    wrapper.appendChild(dropZone);
    wrapper.appendChild(fileList);
    
    updateFileList(qid);
    
    return wrapper;
  }

  function handleFileSelection(files, questionId) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        showNotification(`File ${file.name} is too large. Maximum size is 10MB.`, 'error');
        return;
      }
      
      // Check for duplicates
      if (!questionFiles[questionId].some(f => f.name === file.name)) {
        questionFiles[questionId].push(file);
      }
    });
    
    updateFileList(questionId);
    updateProgress();
  }

  function updateFileList(questionId) {
    const listEl = document.getElementById(`files-${questionId}`);
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    const files = questionFiles[questionId] || [];
    files.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'file-item';
      
      const icon = document.createElement('i');
      icon.className = file.type?.startsWith('image/') ? 'fas fa-image' : 'fas fa-file-pdf';
      
      const name = document.createElement('span');
      name.className = 'file-name';
      name.textContent = file.name || file;
      
      const size = document.createElement('span');
      size.className = 'file-size';
      if (file.size) {
        size.textContent = formatFileSize(file.size);
      }
      
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'file-remove';
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.onclick = () => {
        questionFiles[questionId].splice(index, 1);
        updateFileList(questionId);
        updateProgress();
      };
      
      item.appendChild(icon);
      item.appendChild(name);
      item.appendChild(size);
      item.appendChild(removeBtn);
      
      listEl.appendChild(item);
    });
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /* ------------------------------------------------------------------ */
  /*                        Camera Integration                          */
  /* ------------------------------------------------------------------ */
  
  async function capturePhoto(questionId) {
    // Check if we're on a mobile device with camera access
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showNotification('Camera not available on this device', 'error');
      return;
    }
    
    try {
      // Create camera modal
      const modal = createCameraModal(questionId);
      document.body.appendChild(modal);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      const video = modal.querySelector('video');
      video.srcObject = stream;
      
      // Handle capture
      const captureBtn = modal.querySelector('.capture-btn');
      captureBtn.onclick = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob(blob => {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          if (!questionFiles[questionId]) {
            questionFiles[questionId] = [];
          }
          questionFiles[questionId].push(file);
          
          // Update gallery if photo question
          const gallery = document.getElementById(`gallery-${questionId}`);
          if (gallery) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(blob);
            img.className = 'photo-thumbnail';
            gallery.appendChild(img);
          }
          
          updateFileList(questionId);
          updateProgress();
          
          // Close modal
          stream.getTracks().forEach(track => track.stop());
          modal.remove();
          
          showNotification('Photo captured successfully', 'success');
        }, 'image/jpeg', state.settings.cameraQuality === 'high' ? 0.9 : 0.7);
      };
      
      // Handle close
      const closeBtn = modal.querySelector('.close-btn');
      closeBtn.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        modal.remove();
      };
      
    } catch (error) {
      console.error('Camera error:', error);
      showNotification('Failed to access camera', 'error');
    }
  }

  function createCameraModal(questionId) {
    const modal = document.createElement('div');
    modal.className = 'camera-modal';
    modal.innerHTML = `
      <div class="camera-container">
        <div class="camera-header">
          <h3>Take Photo</h3>
          <button class="close-btn" type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <video autoplay playsinline></video>
        <div class="camera-controls">
          <button class="capture-btn" type="button">
            <i class="fas fa-camera"></i>
          </button>
        </div>
      </div>
    `;
    return modal;
  }

  function handlePhotoUpload(event, questionId) {
    const files = event.target.files;
    if (!files.length) return;
    
    const gallery = document.getElementById(`gallery-${questionId}`);
    if (!gallery) return;
    
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'photo-thumbnail';
        gallery.appendChild(img);
      };
      reader.readAsDataURL(file);
      
      // Add to files array
      if (!questionFiles[questionId]) {
        questionFiles[questionId] = [];
      }
      questionFiles[questionId].push(file);
    });
    
    updateProgress();
  }

  /* ------------------------------------------------------------------ */
  /*                          Voice Recognition                         */
  /* ------------------------------------------------------------------ */
  
  let recognition = null;
  
  function toggleVoice(btn, questionId) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      showNotification('Speech recognition not supported', 'error');
      return;
    }
    
    if (btn.classList.contains('listening')) {
      if (recognition) {
        recognition.stop();
      }
      return;
    }
    
    recognition = new SpeechRecognition();
    recognition.lang = state.settings.language === 'de' ? 'de-DE' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    btn.classList.add('listening');
    btn.innerHTML = '<i class="fas fa-stop"></i>';
    
    const targetElement = document.getElementById(questionId);
    
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      if (targetElement) {
        if (targetElement.tagName === 'TEXTAREA') {
          targetElement.value = transcript;
        } else if (targetElement.type === 'number') {
          // Extract numbers from speech
          const numbers = transcript.match(/\d+/);
          if (numbers) {
            targetElement.value = numbers[0];
          }
        }
        updateProgress();
      }
    };
    
    recognition.onend = () => {
      btn.classList.remove('listening');
      btn.innerHTML = '<i class="fas fa-microphone"></i>';
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      btn.classList.remove('listening');
      btn.innerHTML = '<i class="fas fa-microphone"></i>';
      showNotification('Voice recognition error', 'error');
    };
    
    recognition.start();
  }

  /* ------------------------------------------------------------------ */
  /*                       GPS Location Tracking                        */
  /* ------------------------------------------------------------------ */
  
  function requestGPSLocation() {
    if (!navigator.geolocation) return;
    
    // Check if geolocation is allowed before trying to use it
    navigator.permissions.query({ name: 'geolocation' }).then(result => {
      if (result.state === 'granted' || result.state === 'prompt') {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            state.gpsLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString()
            };
          },
          (error) => {
            console.warn('GPS error:', error);
            // Only show notification for user-denied permissions
            if (error.code === 1) {
              showNotification('Location access was denied. You can enable it in browser settings.', 'info');
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } else if (result.state === 'denied') {
        console.info('Geolocation permission denied by user or policy');
      }
    }).catch(err => {
      // Permissions API not supported or blocked by policy
      console.info('Cannot check geolocation permissions:', err);
    });
  }

  /* ------------------------------------------------------------------ */
  /*                    Inspection Timer & Progress                     */
  /* ------------------------------------------------------------------ */
  
  function startInspectionTimer() {
    state.startTime = Date.now();
    state.inspectionTimer = setInterval(updateTimer, 1000);
    
    // Show timer in UI
    const timerEl = document.createElement('div');
    timerEl.id = 'inspection-timer';
    timerEl.className = 'inspection-timer';
    timerEl.innerHTML = '<i class="fas fa-stopwatch"></i> <span>00:00:00</span>';
    
    const formHeader = document.querySelector('.content-header');
    if (formHeader) {
      formHeader.appendChild(timerEl);
    }
  }

  function updateTimer() {
    if (!state.startTime) return;
    
    const elapsed = Date.now() - state.startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const display = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    
    const timerEl = document.querySelector('#inspection-timer span');
    if (timerEl) {
      timerEl.textContent = display;
    }
  }

  function stopInspectionTimer() {
    if (state.inspectionTimer) {
      clearInterval(state.inspectionTimer);
      state.inspectionTimer = null;
    }
  }

  function pad(num) {
    return num.toString().padStart(2, '0');
  }

  /* ------------------------------------------------------------------ */
  /*                    Enhanced Progress Calculation                   */
  /* ------------------------------------------------------------------ */
  
  function updateProgress() {
    const checks = [];
    let riskScore = 0;
    let maxRiskScore = 0;
    
    // Base fields
    checks.push(!!elements.locationSelect.value);
    checks.push(!!elements.typeSelect.value);
    checks.push(elements.auditorNamesInput.value.trim().length > 0);
    checks.push(!!elements.inspectionDateInput.value);
    
    // Question fields
    questions.forEach(q => {
      const element = document.getElementById(q.id);
      let hasValue = false;
      
      switch (q.type) {
        case 'boolean':
          hasValue = !!document.querySelector(`input[name="${q.id}"]:checked`);
          
          // Calculate risk score
          if (hasValue && q.riskWeight && q.correctAnswer) {
            const selected = document.querySelector(`input[name="${q.id}"]:checked`);
            maxRiskScore += q.riskWeight;
            if (selected && selected.value !== q.correctAnswer) {
              riskScore += q.riskWeight;
            }
          }
          break;
          
        case 'text':
          hasValue = element && element.value.trim().length > 0;
          break;
          
        case 'number':
        case 'range':
          hasValue = element && element.value !== '';
          break;
          
        case 'checklist':
          const checkedBoxes = document.querySelectorAll(`input[name="${q.id}"]:checked`);
          hasValue = checkedBoxes.length > 0;
          break;
          
        case 'photo':
          hasValue = questionFiles[q.id] && questionFiles[q.id].length > 0;
          break;
          
        default:
          hasValue = element && element.value.trim().length > 0;
      }
      
      // Only count required questions or questions with values
      if (q.required || hasValue) {
        checks.push(hasValue);
      }
    });
    
    const completed = checks.filter(Boolean).length;
    const total = checks.length;
    const percent = total === 0 ? 0 : (completed / total) * 100;
    
    // Update progress bar
    if (elements.progressFillEl) {
      elements.progressFillEl.style.width = `${percent}%`;
    }
    if (elements.progressStatusEl) {
      elements.progressStatusEl.textContent = `${completed} of ${total} completed`;
    }
    
    // Update risk indicator
    updateRiskIndicator(riskScore, maxRiskScore);
    
    // Update form validity
    updateFormValidity();
  }

  function updateRiskIndicator(score, maxScore) {
    let indicator = document.getElementById('risk-indicator');
    
    if (maxScore === 0) {
      if (indicator) indicator.remove();
      return;
    }
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'risk-indicator';
      indicator.className = 'risk-indicator';
      
      const progressSection = document.querySelector('.form-section:has(.progress-bar)');
      if (progressSection) {
        progressSection.appendChild(indicator);
      }
    }
    
    const percentage = (score / maxScore) * 100;
    let status, icon, message;
    
    if (percentage === 0) {
      status = 'low';
      icon = 'fa-check-circle';
      message = 'Low Risk - All safety checks passed';
    } else if (percentage <= 25) {
      status = 'medium';
      icon = 'fa-exclamation-circle';
      message = 'Medium Risk - Some issues found';
    } else {
      status = 'high';
      icon = 'fa-exclamation-triangle';
      message = 'High Risk - Critical issues detected';
    }
    
    indicator.className = `risk-indicator risk-${status}`;
    indicator.innerHTML = `
      <i class="fas ${icon}"></i>
      <span>${message}</span>
      <span class="risk-score">${score}/${maxScore} risk points</span>
    `;
  }

  function updateFormValidity() {
    const requiredFields = [];
    
    // Check base required fields
    if (!elements.locationSelect.value) requiredFields.push('Location');
    if (!elements.typeSelect.value) requiredFields.push('Inspection Type');
    if (!elements.auditorNamesInput.value.trim()) requiredFields.push('Auditor Name');
    if (!elements.inspectionDateInput.value) requiredFields.push('Inspection Date');
    
    // Check required questions
    questions.forEach(q => {
      if (!q.required) return;
      
      let hasValue = false;
      
      switch (q.type) {
        case 'boolean':
          hasValue = !!document.querySelector(`input[name="${q.id}"]:checked`);
          break;
        case 'checklist':
          hasValue = document.querySelectorAll(`input[name="${q.id}"]:checked`).length > 0;
          break;
        default:
          const el = document.getElementById(q.id);
          hasValue = el && el.value.trim() !== '';
      }
      
      if (!hasValue) {
        requiredFields.push(q.question);
      }
    });
    
    // Update submit button state
    if (elements.submitInspectionBtn) {
      if (requiredFields.length > 0) {
        elements.submitInspectionBtn.disabled = true;
        elements.submitInspectionBtn.title = `Missing required fields: ${requiredFields.join(', ')}`;
      } else {
        elements.submitInspectionBtn.disabled = false;
        elements.submitInspectionBtn.title = 'Submit inspection';
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*                         Preview Mode                               */
  /* ------------------------------------------------------------------ */
  
  function togglePreviewMode() {
    const isPreview = state.currentView === 'preview';
    state.currentView = isPreview ? 'edit' : 'preview';
    
    const form = document.querySelector('.audit-form');
    if (!form) return;
    
    if (state.currentView === 'preview') {
      // Switch to preview mode
      form.classList.add('preview-mode');
      
      // Disable all inputs
      form.querySelectorAll('input, textarea, select, button').forEach(el => {
        if (!el.classList.contains('preview-allowed')) {
          el.disabled = true;
        }
      });
      
      // Update button text
      elements.previewModeBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Mode';
      
      // Show preview indicator
      showNotification('Preview mode activated', 'info');
      
    } else {
      // Switch back to edit mode
      form.classList.remove('preview-mode');
      
      // Enable all inputs
      form.querySelectorAll('input, textarea, select, button').forEach(el => {
        el.disabled = false;
      });
      
      // Update button text
      elements.previewModeBtn.innerHTML = '<i class="fas fa-eye"></i> Preview Mode';
    }
  }

  /* ------------------------------------------------------------------ */
  /*                          PDF Export                                */
  /* ------------------------------------------------------------------ */
  
  async function exportToPDF() {
    if (!window.jspdf) {
      // Load jsPDF dynamically if not already loaded
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get inspection data
    const data = collectFormData('export');
    
    // Document header
    doc.setFontSize(20);
    doc.text('Safety Inspection Report', 20, 20);
    
    // Metadata
    doc.setFontSize(12);
    let y = 40;
    
    doc.text(`Location: ${data.location}`, 20, y);
    y += 10;
    doc.text(`Type: ${data.type}`, 20, y);
    y += 10;
    doc.text(`Auditor(s): ${data.auditors}`, 20, y);
    y += 10;
    doc.text(`Date: ${data.date}`, 20, y);
    y += 10;
    doc.text(`Duration: ${data.duration || 'N/A'}`, 20, y);
    y += 20;
    
    // Risk Assessment
    if (data.riskScore !== undefined) {
      doc.setFontSize(14);
      doc.text('Risk Assessment', 20, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`Overall Risk Score: ${data.riskScore}/${data.maxRiskScore}`, 20, y);
      y += 15;
    }
    
    // Questions and answers
    doc.setFontSize(14);
    doc.text('Inspection Details', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    
    questions.forEach(q => {
      // Check if we need a new page
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      const answer = data.answers[q.id];
      if (!answer || !answer.value) return;
      
      // Question text
      doc.setFont(undefined, 'bold');
      const lines = doc.splitTextToSize(q.question, 170);
      lines.forEach(line => {
        doc.text(line, 20, y);
        y += 5;
      });
      
      // Answer
      doc.setFont(undefined, 'normal');
      let answerText = answer.value;
      
      if (q.type === 'checklist' && Array.isArray(answer.value)) {
        answerText = answer.value.join(', ');
      }
      
      doc.text(`Answer: ${answerText}`, 30, y);
      y += 5;
      
      // Comment if exists
      if (answer.comment) {
        doc.text(`Comment: ${answer.comment}`, 30, y);
        y += 5;
      }
      
      // Files if exist
      if (answer.files && answer.files.length > 0) {
        doc.text(`Attachments: ${answer.files.length} file(s)`, 30, y);
        y += 5;
      }
      
      y += 5; // Space between questions
    });
    
    // GPS location if available
    if (data.gpsLocation) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(12);
      doc.text('Location Coordinates', 20, y);
      y += 10;
      doc.setFontSize(10);
      doc.text(`Latitude: ${data.gpsLocation.latitude}`, 20, y);
      y += 5;
      doc.text(`Longitude: ${data.gpsLocation.longitude}`, 20, y);
      y += 5;
      doc.text(`Accuracy: ${data.gpsLocation.accuracy}m`, 20, y);
    }
    
    // Add signature space if required
    if (state.settings.signatureRequired && signatureData[state.currentInspectionId]) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Signatures', 20, 20);
      
      // Add signature image
      // Note: In real implementation, you'd convert the signature canvas to image
      doc.text('Auditor Signature: _______________________', 20, 40);
      doc.text('Date: _______________________', 20, 60);
    }
    
    // Save the PDF
    const filename = `inspection-${data.location}-${data.date}.pdf`;
    doc.save(filename);
    
    showNotification('PDF exported successfully', 'success');
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /* ------------------------------------------------------------------ */
  /*                        Data Collection                             */
  /* ------------------------------------------------------------------ */
  
  function collectFormData(status) {
    const id = state.currentInspectionId || `${Date.now()}`;
    const answers = {};
    
    // Calculate risk scores
    let riskScore = 0;
    let maxRiskScore = 0;
    
    questions.forEach(q => {
      let value = '';
      
      switch (q.type) {
        case 'boolean':
          const selected = document.querySelector(`input[name="${q.id}"]:checked`);
          value = selected ? selected.value : '';
          
          // Risk scoring
          if (value && q.riskWeight && q.correctAnswer) {
            maxRiskScore += q.riskWeight;
            if (value !== q.correctAnswer) {
              riskScore += q.riskWeight;
            }
          }
          break;
          
        case 'checklist':
          const checked = document.querySelectorAll(`input[name="${q.id}"]:checked`);
          value = Array.from(checked).map(cb => cb.value);
          break;
          
        case 'range':
          const rangeEl = document.getElementById(q.id);
          value = rangeEl ? rangeEl.value : '';
          
          // Check if out of optimal range
          if (value && q.optimal) {
            const val = parseFloat(value);
            if (val < q.optimal.min || val > q.optimal.max) {
              riskScore += q.riskWeight || 2;
            }
            maxRiskScore += q.riskWeight || 2;
          }
          break;
          
        default:
          const el = document.getElementById(q.id);
          value = el ? el.value : '';
      }
      
      const commentEl = document.getElementById(`comment-${q.id}`);
      const comment = commentEl ? commentEl.value : '';
      
      const files = (questionFiles[q.id] || []).map(f => 
        typeof f === 'string' ? f : f.name
      );
      
      answers[q.id] = { value, comment, files };
    });
    
    // Calculate duration
    let duration = null;
    if (state.startTime) {
      const elapsed = Date.now() - state.startTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      duration = `${hours}h ${minutes}m`;
    }
    
    return {
      id,
      location: elements.locationSelect.value,
      type: elements.typeSelect.value,
      auditors: elements.auditorNamesInput.value,
      date: elements.inspectionDateInput.value,
      status,
      created_at: new Date().toISOString(),
      duration,
      answers,
      riskScore,
      maxRiskScore,
      gpsLocation: state.gpsLocation,
      signature: signatureData[id] || null
    };
  }

  /* ------------------------------------------------------------------ */
  /*                     Save & Sync Functions                          */
  /* ------------------------------------------------------------------ */
  
  async function saveInspection(status) {
    // Collect form data first
    const data = collectFormData(status);
    
    if (!window.netlifyIdentity) {
      // Save to offline queue
      offlineQueue.push(data);
      localStorage.setItem('offline-queue', JSON.stringify(offlineQueue));
      showNotification('Saved offline. Will sync when connected.', 'warning');
      
      // Also save to local storage for immediate access
      const localInspections = JSON.parse(localStorage.getItem('local-inspections') || '[]');
      const existingIndex = localInspections.findIndex(ins => ins.id === data.id);
      if (existingIndex >= 0) {
        localInspections[existingIndex] = data;
      } else {
        localInspections.push(data);
      }
      localStorage.setItem('local-inspections', JSON.stringify(localInspections));
      
      // Reload to show in lists
      await loadInspections();
      if (status === 'completed') {
        resetForm();
      }
      return;
    }
    
    const user = window.netlifyIdentity.currentUser();
    if (!user) {
      window.netlifyIdentity.open();
      return;
    }
    
    try {
      const token = await user.jwt();
      const basePath = `inspections/${user.id}/${data.id}`;
      
      // Show saving indicator
      showLoadingIndicator('Saving inspection...');
      
      // Upload files
      for (const qid of Object.keys(questionFiles)) {
        const files = questionFiles[qid] || [];
        
        for (const file of files) {
          if (!(file instanceof File)) continue;
          
          const filePath = `${basePath}/files/${encodeURIComponent(qid)}/${encodeURIComponent(file.name)}`;
          
          // For now, skip file uploads if blob storage isn't working
          try {
            await fetch(`/.netlify/functions/blob?path=${encodeURIComponent(filePath)}`, {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': file.type || 'application/octet-stream'
              },
              body: file
            });
          } catch (err) {
      console.error('Failed to save questions', err);
    }
  }
  
  async function importQuestions() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        
        if (!Array.isArray(imported)) {
          showNotification('Invalid format: expected an array of questions', 'error');
          return;
        }
        
        // Validate questions
        const validTypes = ['boolean', 'text', 'number', 'range', 'checklist', 'photo'];
        const cleaned = [];
        
        for (const q of imported) {
          if (!q.id || !q.type || !q.question) continue;
          if (!validTypes.includes(q.type)) continue;
          
          cleaned.push({
            id: String(q.id),
            type: q.type,
            question: String(q.question),
            category: q.category || 'General',
            required: !!q.required,
            riskWeight: q.riskWeight || 0,
            correctAnswer: q.correctAnswer,
            options: q.options || [],
            min: q.min,
            max: q.max,
            optimal: q.optimal,
            unit: q.unit,
            guidance: q.guidance
          });
        }
        
        if (cleaned.length === 0) {
          showNotification('No valid questions found in file', 'error');
          return;
        }
        
        if (!confirm(`Import ${cleaned.length} questions? This will replace your current question set.`)) {
          return;
        }
        
        questions = cleaned;
        renderQuestions();
        await saveQuestions();
        showNotification('Questions imported successfully', 'success');
        
      } catch (err) {
        console.error(err);
        showNotification('Failed to import questions', 'error');
      }
    };
    
    input.click();
  }
  
  function exportQuestions() {
    try {
      const blob = new Blob([JSON.stringify(questions, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inspection-questions.json';
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      showNotification('Questions exported successfully', 'success');
      
    } catch (err) {
      console.error(err);
      showNotification('Failed to export questions', 'error');
    }
  }
  
  async function exportReports() {
    if (!window.netlifyIdentity) {
      showNotification('Please log in to export reports', 'warning');
      return;
    }
    
    const user = window.netlifyIdentity.currentUser();
    if (!user) {
      window.netlifyIdentity.open();
      return;
    }
    
    try {
      const blob = new Blob([JSON.stringify(inspectionsData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inspections-export-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      showNotification('Reports exported successfully', 'success');
      
    } catch (err) {
      console.error(err);
      showNotification('Failed to export reports', 'error');
    }
  }
  
  function showSignatureModal(callback) {
    const modal = document.createElement('div');
    modal.className = 'signature-modal';
    modal.innerHTML = `
      <div class="signature-container">
        <div class="signature-header">
          <h3>Digital Signature Required</h3>
          <button class="close-btn" type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="signature-body">
          <p>Please sign below to confirm the inspection report.</p>
          <canvas id="signature-canvas" width="400" height="200"></canvas>
          <div class="signature-actions">
            <button class="btn btn-secondary" id="clear-signature">
              <i class="fas fa-eraser"></i> Clear
            </button>
            <button class="btn btn-primary" id="save-signature">
              <i class="fas fa-check"></i> Save & Submit
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup canvas for signature
    const canvas = document.getElementById('signature-canvas');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    function startDrawing(e) {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
    
    function draw(e) {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
    
    function stopDrawing() {
      isDrawing = false;
    }
    
    function handleTouch(e) {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                      e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    }
    
    // Clear button
    document.getElementById('clear-signature').onclick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    
    // Save button
    document.getElementById('save-signature').onclick = () => {
      const dataURL = canvas.toDataURL();
      signatureData[state.currentInspectionId || 'temp'] = dataURL;
      modal.remove();
      if (callback) callback();
    };
    
    // Close button
    modal.querySelector('.close-btn').onclick = () => {
      modal.remove();
    };
  }
  
  // Additional CSS for new features
  const additionalStyles = document.createElement('style');
  additionalStyles.textContent = `
    /* Enhanced styles for new features */
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transform: translateX(400px);
      transition: transform 0.3s ease;
      z-index: 1000;
      max-width: 90vw;
    }
    
    .notification.show {
      transform: translateX(0);
    }
    
    .notification-success {
      border-color: var(--success);
      color: var(--success);
    }
    
    .notification-error {
      border-color: var(--error);
      color: var(--error);
    }
    
    .notification-warning {
      border-color: var(--warning);
      color: var(--warning);
    }
    
    .notification-info {
      border-color: var(--primary);
      color: var(--primary);
    }
    
    .loading-indicator {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--glass-elevated);
      padding: 2rem;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease;
      z-index: 9999;
    }
    
    .loading-indicator.show {
      opacity: 1;
      visibility: visible;
    }
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--glass-border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .camera-modal,
    .guidance-modal,
    .signature-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }
    
    .camera-container,
    .guidance-content,
    .signature-container {
      background: var(--bg-secondary);
      border-radius: var(--radius-xl);
      overflow: hidden;
      max-width: 90vw;
      max-height: 90vh;
      width: 100%;
      max-width: 600px;
    }
    
    .camera-header,
    .guidance-header,
    .signature-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid var(--glass-border);
    }
    
    .camera-container video {
      display: block;
      width: 100%;
      max-height: 60vh;
    }
    
    .camera-controls {
      display: flex;
      justify-content: center;
      padding: 1rem;
    }
    
    .capture-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--error);
      border: 3px solid white;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .capture-btn:active {
      transform: scale(0.9);
    }
    
    .risk-indicator {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .risk-low {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
    }
    
    .risk-medium {
      background: rgba(245, 158, 11, 0.1);
      color: var(--warning);
    }
    
    .risk-high {
      background: rgba(239, 68, 68, 0.1);
      color: var(--error);
    }
    
    .inspection-timer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--surface);
      border-radius: var(--radius-lg);
      font-weight: 600;
    }
    
    .high-risk {
      border-color: var(--error) !important;
    }
    
    .risk-answer:hover {
      border-color: var(--error) !important;
    }
    
    .preview-mode input:disabled,
    .preview-mode textarea:disabled,
    .preview-mode select:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .comment-field {
      margin-top: 1rem;
    }
    
    .comment-toggle {
      background: var(--surface);
      border: 1px solid var(--glass-border);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition-base);
    }
    
    .comment-toggle:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }
    
    .comment-input {
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: var(--surface);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      color: var(--text-primary);
      resize: vertical;
      min-height: 80px;
    }
    
    .number-input-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .number-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: var(--surface);
      border: 1px solid var(--glass-border);
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition-base);
    }
    
    .number-btn:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }
    
    .range-control {
      padding: 1rem 0;
    }
    
    .range-display {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .range-input {
      flex: 1;
      appearance: none;
      height: 6px;
      background: var(--surface);
      border-radius: 3px;
      outline: none;
    }
    
    .range-input::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      background: var(--primary);
      border-radius: 50%;
      cursor: pointer;
    }
    
    .range-value {
      font-weight: 600;
      min-width: 60px;
      text-align: right;
    }
    
    .range-value.optimal {
      color: var(--success);
    }
    
    .range-value.warning {
      color: var(--warning);
    }
    
    .optimal-range {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }
    
    .checklist-control {
      padding: 1rem 0;
    }
    
    .checked-count {
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: var(--text-secondary);
    }
    
    .checklist-items {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.5rem;
    }
    
    .checklist-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: var(--surface);
      border-radius: var(--radius-md);
    }
    
    .checklist-item:hover {
      background: var(--surface-hover);
    }
    
    .photo-control {
      padding: 1rem 0;
    }
    
    .photo-gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1rem;
      min-height: 140px;
      background: var(--surface);
      border-radius: var(--radius-lg);
      padding: 1rem;
    }
    
    .photo-thumbnail {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .photo-thumbnail:hover {
      transform: scale(1.05);
    }
    
    .photo-controls {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .file-drop-zone {
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: var(--transition-base);
    }
    
    .file-drop-zone.drag-over {
      background: var(--surface-hover);
      border-color: var(--primary);
    }
    
    .file-list {
      margin-top: 1rem;
    }
    
    .file-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: var(--surface);
      border-radius: var(--radius-md);
      margin-bottom: 0.5rem;
    }
    
    .file-name {
      flex: 1;
      font-size: 0.875rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .file-size {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    
    .file-remove {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem;
      transition: color 0.2s;
    }
    
    .file-remove:hover {
      color: var(--error);
    }
    
    .report-filters {
      display: flex;
      gap: 1rem;
      align-items: end;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    
    .filter-group {
      flex: 1;
      min-width: 150px;
    }
    
    .filter-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    
    .report-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .summary-stat {
      background: var(--surface);
      padding: 1.5rem;
      border-radius: var(--radius-lg);
      text-align: center;
    }
    
    .summary-stat .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary);
    }
    
    .summary-stat .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    .report-item {
      background: var(--surface);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      margin-bottom: 1rem;
      transition: var(--transition-base);
    }
    
    .report-item:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
    }
    
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .report-title {
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .report-meta {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      flex-wrap: wrap;
    }
    
    .report-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .analytics-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--glass-border);
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    .tab-btn {
      background: none;
      border: none;
      padding: 0.75rem 1.5rem;
      color: var(--text-secondary);
      font-weight: 600;
      cursor: pointer;
      position: relative;
      transition: color 0.2s;
      white-space: nowrap;
    }
    
    .tab-btn:hover {
      color: var(--text-primary);
    }
    
    .tab-btn.active {
      color: var(--primary);
    }
    
    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--primary);
    }
    
    .settings-content {
      max-width: 800px;
    }
    
    .settings-section {
      margin-bottom: 2rem;
    }
    
    .settings-section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--glass-border);
    }
    
    .setting-item {
      margin-bottom: 1rem;
    }
    
    .setting-item label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      cursor: pointer;
    }
    
    .setting-item input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
    
    .setting-item .form-control {
      margin-top: 0.5rem;
    }
    
    .settings-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--glass-border);
    }
    
    .risk-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.7rem;
      font-weight: 700;
      margin-left: 0.5rem;
    }
    
    .risk-badge.risk-low {
      background: rgba(16, 185, 129, 0.2);
      color: var(--success);
    }
    
    .risk-badge.risk-medium {
      background: rgba(245, 158, 11, 0.2);
      color: var(--warning);
    }
    
    .risk-badge.risk-high {
      background: rgba(239, 68, 68, 0.2);
      color: var(--error);
    }
    
    .signature-canvas {
      border: 2px solid var(--glass-border);
      border-radius: var(--radius-md);
      background: white;
      cursor: crosshair;
    }
    
    .signature-body {
      padding: 1.5rem;
    }
    
    .signature-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 1rem;
    }
    
    .guidance-body {
      padding: 1.5rem;
      max-width: 600px;
      color: var(--text-secondary);
      line-height: 1.6;
    }
    
    .close-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
      transition: color 0.2s;
    }
    
    .close-btn:hover {
      color: var(--text-primary);
    }
    
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-muted);
    }
    
    .info-btn {
      background: none;
      border: none;
      color: var(--primary);
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.5rem;
      transition: transform 0.2s;
    }
    
    .info-btn:hover {
      transform: scale(1.1);
    }
    
    .risk-score {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }
    
    /* Category Navigation */
    .category-navigation-bar {
      margin-bottom: 2rem;
    }
    
    .category-nav-header {
      margin-bottom: 1rem;
    }
    
    .category-nav-items {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .category-nav-item {
      padding: 0.75rem 1.5rem;
      background: var(--surface);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition-base);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
    }
    
    .category-nav-item:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
      border-color: var(--primary);
    }
    
    .category-nav-item.active {
      background: rgba(99, 102, 241, 0.1);
      color: var(--primary);
      border-color: var(--primary);
    }
    
    /* Inspection Overview */
    #inspection-overview {
      margin-bottom: 2rem;
    }
    
    .inspection-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--surface);
      border-radius: var(--radius-lg);
    }
    
    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .meta-label {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    
    .meta-value {
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .category-card {
      background: var(--surface);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      cursor: pointer;
      transition: var(--transition-base);
      position: relative;
      overflow: hidden;
    }
    
    .category-card:hover {
      border-color: var(--primary);
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }
    
    .category-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .category-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    
    .category-stats {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }
    
    .category-progress {
      color: var(--primary);
      font-weight: 600;
    }
    
    .inspection-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .category-progress {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--surface);
      border-radius: var(--radius-lg);
    }
    
    .category-questions {
      margin-bottom: 2rem;
    }
    
    .category-navigation {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--glass-border);
    }
    
    .category-indicator {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    
    /* Mobile Menu Toggle */
    .mobile-menu-toggle {
      display: none;
      background: none;
      border: none;
      color: var(--text-primary);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
      margin-right: 1rem;
    }
    
    /* Dark mode adjustments */
    body.dark-mode {
      --bg-primary: #000000;
      --bg-secondary: #0a0a0a;
      --bg-tertiary: #141414;
      --text-primary: #ffffff;
      --text-secondary: #a0a0a0;
      --text-muted: #666666;
    }
    
    body.dark-mode .signature-canvas {
      background: #f0f0f0;
    }
    
    /* Mobile responsiveness for new features */
    @media (max-width: 1024px) {
      .mobile-menu-toggle {
        display: block;
      }
      
      body.menu-open {
        overflow: hidden;
      }
      
      .user-text {
        display: none;
      }
      
      .category-grid {
        grid-template-columns: 1fr;
      }
      
      .header-nav {
        display: none;
      }
    }
    
    @media (max-width: 768px) {
      .notification {
        right: 10px;
        left: 10px;
        max-width: calc(100vw - 20px);
      }
      
      .report-filters {
        flex-direction: column;
      }
      
      .filter-group {
        width: 100%;
      }
      
      .camera-container,
      .guidance-content,
      .signature-container {
        margin: 1rem;
        max-width: calc(100vw - 2rem);
      }
      
      .checklist-items {
        grid-template-columns: 1fr;
      }
      
      .photo-gallery {
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      }
      
      .analytics-tabs {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      
      .tab-btn {
        white-space: nowrap;
      }
      
      .category-nav-items {
        flex-direction: column;
      }
      
      .category-nav-item {
        width: 100%;
        justify-content: center;
      }
      
      .inspection-meta {
        grid-template-columns: 1fr;
      }
      
      .report-summary {
        grid-template-columns: 1fr;
      }
    }
    
    /* Print styles for PDF export */
    @media print {
      .header-bar,
      .sidebar,
      .content-actions,
      .btn,
      .voice-btn,
      .camera-btn,
      .info-btn,
      .comment-toggle,
      .file-upload,
      .photo-controls {
        display: none !important;
      }
      
      .main-content {
        margin: 0;
        padding: 20px;
      }
      
      .question-card {
        page-break-inside: avoid;
        border: 1px solid #ddd;
        margin-bottom: 10px;
      }
      
      .question-text {
        font-weight: bold;
        color: #000;
      }
      
      .comment-input {
        display: block !important;
        border: 1px solid #ddd;
      }
    }
  `;
  
  document.head.appendChild(additionalStyles);

  // Global function exports for inline handlers
  window.applyReportFilters = applyReportFilters;
  window.exportFilteredReports = exportFilteredReports;
  window.saveSettingsChanges = saveSettingsChanges;
  window.exportAllData = exportAllData;
  window.clearOfflineData = clearOfflineData;
  window.resetApplication = resetApplication;
  window.viewInspectionDetails = viewInspectionDetails;
  window.exportSingleReport = exportSingleReport;
  window.setCategorySection = setCategorySection;
  window.showInspectionOverview = showInspectionOverview;
  window.startFullInspection = startFullInspection;
  window.continueLastInspection = continueLastInspection;
  window.submitInspection = submitInspection;
  
  // Performance optimization: Debounce progress updates
  const debouncedUpdateProgress = debounce(updateProgress, 100);
  
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Initialize PWA features
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
      console.log('Service Worker ready');
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute
    });
  }

  // Handle app updates
  let newWorker;
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (newWorker) {
        showNotification('App updated! Refresh to see changes.', 'info');
      }
    });
    
    navigator.serviceWorker.register('/service-worker.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        newWorker = reg.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showNotification('New version available! Click to update.', 'info');
          }
        });
      });
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (state.currentInspectionId) {
        saveInspection('draft');
      }
    }
    
    // Ctrl/Cmd + P to toggle preview
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      togglePreviewMode();
    }
    
    // Ctrl/Cmd + E to export PDF
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      exportToPDF();
    }
    
    // Esc to close modals
    if (e.key === 'Escape') {
      document.querySelectorAll('.camera-modal, .guidance-modal, .signature-modal').forEach(modal => {
        modal.remove();
      });
    }
  });

  // Accessibility improvements
  function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }

  // Add screen reader support
  const srOnlyStyles = document.createElement('style');
  srOnlyStyles.textContent = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `;
  document.head.appendChild(srOnlyStyles);

  // Performance monitoring
  if ('PerformanceObserver' in window) {
    const perfObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 1000) {
          console.warn('Slow operation detected:', entry.name, entry.duration);
        }
      }
    });
    
    perfObserver.observe({ entryTypes: ['measure'] });
  }

  // Error boundary
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('An error occurred. Please try again.', 'error');
  });

  // Batch updates for better performance
  let updateQueue = [];
  let updateScheduled = false;
  
  function scheduleUpdate(fn) {
    updateQueue.push(fn);
    
    if (!updateScheduled) {
      updateScheduled = true;
      requestAnimationFrame(() => {
        updateQueue.forEach(fn => fn());
        updateQueue = [];
        updateScheduled = false;
      });
    }
  }

  // Network status monitoring
  let wasOffline = false;
  
  function updateNetworkStatus() {
    if (!navigator.onLine && !wasOffline) {
      wasOffline = true;
      showNotification('You are offline. Changes will be saved locally.', 'warning');
    } else if (navigator.onLine && wasOffline) {
      wasOffline = false;
      showNotification('Back online! Syncing data...', 'success');
      syncOfflineData();
    }
  }
  
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  // Battery status monitoring for mobile devices
  if ('getBattery' in navigator) {
    navigator.getBattery().then(battery => {
      battery.addEventListener('levelchange', () => {
        if (battery.level < 0.15 && !battery.charging) {
          showNotification('Low battery! Consider saving your work.', 'warning');
        }
      });
    });
  }

  // Visibility change handling - pause timers when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Pause any active timers
      if (state.inspectionTimer) {
        clearInterval(state.inspectionTimer);
      }
    } else {
      // Resume timers
      if (state.startTime && !state.inspectionTimer) {
        state.inspectionTimer = setInterval(updateTimer, 1000);
      }
    }
  });

  // Touch gesture support for mobile
  let touchStartX = 0;
  let touchEndX = 0;
  
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });
  
  function handleSwipe() {
    const swipeThreshold = 100;
    const diff = touchEndX - touchStartX;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe right - could open sidebar on mobile
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && window.innerWidth <= 1024) {
          sidebar.classList.add('open');
        }
      } else {
        // Swipe left - could close sidebar on mobile
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && window.innerWidth <= 1024) {
          sidebar.classList.remove('open');
        }
      }
    }
  }

  // Initialize tooltips for better UX
  function initTooltips() {
    const tooltipElements = document.querySelectorAll('[title]');
    
    tooltipElements.forEach(el => {
      el.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = el.getAttribute('title');
        tooltip.style.position = 'absolute';
        tooltip.style.zIndex = '9999';
        
        document.body.appendChild(tooltip);
        
        const rect = el.getBoundingClientRect();
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
        tooltip.style.left = `${rect.left + (rect.width - tooltip.offsetWidth) / 2}px`;
        
        el._tooltip = tooltip;
      });
      
      el.addEventListener('mouseleave', () => {
        if (el._tooltip) {
          el._tooltip.remove();
          delete el._tooltip;
        }
      });
    });
  }

  // Add tooltip styles
  const tooltipStyles = document.createElement('style');
  tooltipStyles.textContent = `
    .tooltip {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      box-shadow: var(--shadow-lg);
      pointer-events: none;
      opacity: 0;
      animation: tooltip-appear 0.2s forwards;
    }
    
    @keyframes tooltip-appear {
      to {
        opacity: 1;
        transform: translateY(-2px);
      }
    }
  `;
  document.head.appendChild(tooltipStyles);

  // Initialize tooltips after DOM is ready
  setTimeout(initTooltips, 100);

  // Final initialization message
  console.log('Aurora Audit Platform initialized successfully');
  
  // Check for pending updates on load
  if (offlineQueue.length > 0) {
    showNotification(`${offlineQueue.length} inspections pending sync`, 'info');
  }
}); 
            console.warn('File upload failed, continuing...', err);
          }
        }
      }
      
      // Save inspection data
      const saveResponse = await fetch(`/.netlify/functions/blob?path=${encodeURIComponent(basePath + '/record.json')}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      hideLoadingIndicator();
      
      if (!saveResponse.ok) {
        throw new Error('Failed to save to blob storage');
      }
      
      // Stop timer if submitting
      if (status === 'completed') {
        stopInspectionTimer();
      }
      
      showNotification(
        status === 'completed' 
          ? 'Inspection submitted successfully!' 
          : 'Draft saved successfully!',
        'success'
      );
      
      // Reload inspections list
      await loadInspections();
      
      // Reset form if completed
      if (status === 'completed') {
        resetForm();
      }
      
    } catch (error) {
      console.error('Save error:', error);
      hideLoadingIndicator();
      
      // Fallback to local storage
      const localInspections = JSON.parse(localStorage.getItem('local-inspections') || '[]');
      const existingIndex = localInspections.findIndex(ins => ins.id === data.id);
      if (existingIndex >= 0) {
        localInspections[existingIndex] = data;
      } else {
        localInspections.push(data);
      }
      localStorage.setItem('local-inspections', JSON.stringify(localInspections));
      
      // Add to offline queue
      offlineQueue.push(data);
      localStorage.setItem('offline-queue', JSON.stringify(offlineQueue));
      
      showNotification('Saved locally. Will sync to cloud when possible.', 'warning');
      
      // Reload to show in lists
      await loadInspections();
      if (status === 'completed') {
        resetForm();
      }
    }
  }

  async function syncOfflineData() {
    if (offlineQueue.length === 0) {
      showNotification('No offline data to sync', 'info');
      return;
    }
    
    if (!navigator.onLine) {
      showNotification('No internet connection', 'error');
      return;
    }
    
    const user = window.netlifyIdentity?.currentUser();
    if (!user) {
      showNotification('Please log in to sync data', 'warning');
      return;
    }
    
    showLoadingIndicator(`Syncing ${offlineQueue.length} inspections...`);
    
    try {
      const token = await user.jwt();
      let synced = 0;
      
      for (const inspection of offlineQueue) {
        const basePath = `inspections/${user.id}/${inspection.id}`;
        
        // Fixed: Use query parameter for path
        await fetch(`/.netlify/functions/blob?path=${encodeURIComponent(basePath + '/record.json')}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(inspection)
        });
        
        synced++;
      }
      
      // Clear offline queue
      offlineQueue = [];
      localStorage.setItem('offline-queue', '[]');
      
      hideLoadingIndicator();
      showNotification(`Successfully synced ${synced} inspections`, 'success');
      
      // Reload inspections
      await loadInspections();
      
    } catch (error) {
      console.error('Sync error:', error);
      hideLoadingIndicator();
      showNotification('Failed to sync some inspections', 'error');
    }
  }

  /* ------------------------------------------------------------------ */
  /*                          Auto-save                                 */
  /* ------------------------------------------------------------------ */
  
  function startAutoSave() {
    if (!state.settings.autoSave) return;
    
    autoSaveInterval = setInterval(() => {
      if (state.currentInspectionId) {
        saveInspection('draft');
      }
    }, state.settings.autoSaveInterval);
  }

  function stopAutoSave() {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      autoSaveInterval = null;
    }
  }

  /* ------------------------------------------------------------------ */
  /*                      Settings Management                           */
  /* ------------------------------------------------------------------ */
  
  function renderSettings() {
    const container = document.querySelector('[data-section="settings"]');
    if (!container) return;
    
    container.innerHTML = `
      <div class="content-card">
        <div class="content-header">
          <h2 class="content-title">
            <i class="fas fa-cog"></i>
            Settings
          </h2>
        </div>
        
        <div class="settings-content">
          <div class="settings-section">
            <h3 class="settings-section-title">General Settings</h3>
            
            <div class="setting-item">
              <label>
                <input type="checkbox" id="setting-dark-mode" ${state.settings.darkMode ? 'checked' : ''}>
                Dark Mode
              </label>
            </div>
            
            <div class="setting-item">
              <label>
                <input type="checkbox" id="setting-notifications" ${state.settings.notifications ? 'checked' : ''}>
                Enable Notifications
              </label>
            </div>
            
            <div class="setting-item">
              <label>
                Language
                <select id="setting-language" class="form-control">
                  <option value="en" ${state.settings.language === 'en' ? 'selected' : ''}>English</option>
                  <option value="de" ${state.settings.language === 'de' ? 'selected' : ''}>Deutsch</option>
                </select>
              </label>
            </div>
          </div>
          
          <div class="settings-section">
            <h3 class="settings-section-title">Inspection Settings</h3>
            
            <div class="setting-item">
              <label>
                <input type="checkbox" id="setting-auto-save" ${state.settings.autoSave ? 'checked' : ''}>
                Auto-save inspections
              </label>
            </div>
            
            <div class="setting-item">
              <label>
                Auto-save interval (seconds)
                <input type="number" id="setting-auto-save-interval" 
                       class="form-control" 
                       value="${state.settings.autoSaveInterval / 1000}"
                       min="10" max="300">
              </label>
            </div>
            
            <div class="setting-item">
              <label>
                <input type="checkbox" id="setting-gps" ${state.settings.gpsTracking ? 'checked' : ''}>
                GPS Location Tracking
              </label>
            </div>
            
            <div class="setting-item">
              <label>
                <input type="checkbox" id="setting-signature" ${state.settings.signatureRequired ? 'checked' : ''}>
                Require Digital Signature
              </label>
            </div>
            
            <div class="setting-item">
              <label>
                <input type="checkbox" id="setting-risk-scoring" ${state.settings.riskScoring ? 'checked' : ''}>
                Enable Risk Scoring
              </label>
            </div>
            
            <div class="setting-item">
              <label>
                Camera Quality
                <select id="setting-camera-quality" class="form-control">
                  <option value="high" ${state.settings.cameraQuality === 'high' ? 'selected' : ''}>High</option>
                  <option value="medium" ${state.settings.cameraQuality === 'medium' ? 'selected' : ''}>Medium</option>
                  <option value="low" ${state.settings.cameraQuality === 'low' ? 'selected' : ''}>Low</option>
                </select>
              </label>
            </div>
          </div>
          
          <div class="settings-section">
            <h3 class="settings-section-title">Data Management</h3>
            
            <div class="setting-item">
              <button class="btn btn-secondary" onclick="exportAllData()">
                <i class="fas fa-download"></i> Export All Data
              </button>
            </div>
            
            <div class="setting-item">
              <button class="btn btn-secondary" onclick="clearOfflineData()">
                <i class="fas fa-trash"></i> Clear Offline Data
              </button>
            </div>
            
            <div class="setting-item">
              <button class="btn btn-danger" onclick="resetApplication()">
                <i class="fas fa-exclamation-triangle"></i> Reset Application
              </button>
            </div>
          </div>
          
          <div class="settings-actions">
            <button class="btn btn-primary" onclick="saveSettingsChanges()">
              <i class="fas fa-save"></i> Save Changes
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Attach event listeners
    attachSettingsListeners();
  }

  function attachSettingsListeners() {
    // Real-time updates for some settings
    document.getElementById('setting-dark-mode')?.addEventListener('change', (e) => {
      state.settings.darkMode = e.target.checked;
      applySettings();
    });
  }

  window.saveSettingsChanges = function() {
    // Collect all settings
    state.settings.darkMode = document.getElementById('setting-dark-mode')?.checked || false;
    state.settings.notifications = document.getElementById('setting-notifications')?.checked || false;
    state.settings.language = document.getElementById('setting-language')?.value || 'en';
    state.settings.autoSave = document.getElementById('setting-auto-save')?.checked || false;
    state.settings.autoSaveInterval = (parseInt(document.getElementById('setting-auto-save-interval')?.value) || 30) * 1000;
    state.settings.gpsTracking = document.getElementById('setting-gps')?.checked || false;
    state.settings.signatureRequired = document.getElementById('setting-signature')?.checked || false;
    state.settings.riskScoring = document.getElementById('setting-risk-scoring')?.checked || false;
    state.settings.cameraQuality = document.getElementById('setting-camera-quality')?.value || 'high';
    
    // Save and apply
    saveSettings();
    
    // Restart auto-save if needed
    stopAutoSave();
    if (state.settings.autoSave) {
      startAutoSave();
    }
    
    showNotification('Settings saved successfully', 'success');
  };

  /* ------------------------------------------------------------------ */
  /*                      Reports & Analytics                           */
  /* ------------------------------------------------------------------ */
  
  function renderReports() {
    const container = document.getElementById('reports-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Add filters
    const filters = document.createElement('div');
    filters.className = 'report-filters';
    filters.innerHTML = `
      <div class="filter-group">
        <label>Location</label>
        <select id="filter-location" class="form-control">
          <option value="all">All Locations</option>
          <option value="DVI1 - Vienna Distribution">DVI1 - Vienna Distribution</option>
          <option value="DVI2 - Vienna Hub North">DVI2 - Vienna Hub North</option>
          <option value="DVI3 - Vienna Hub South">DVI3 - Vienna Hub South</option>
          <option value="DAP5 - Salzburg Center">DAP5 - Salzburg Center</option>
          <option value="DAP8 - Graz Distribution">DAP8 - Graz Distribution</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Date Range</label>
        <select id="filter-date" class="form-control">
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Risk Level</label>
        <select id="filter-risk" class="form-control">
          <option value="all">All Levels</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>
      </div>
      
      <button class="btn btn-primary" onclick="applyReportFilters()">
        <i class="fas fa-filter"></i> Apply Filters
      </button>
      
      <button class="btn btn-secondary" onclick="exportFilteredReports()">
        <i class="fas fa-file-excel"></i> Export to Excel
      </button>
    `;
    
    container.appendChild(filters);
    
    // Reports list
    const reportsList = document.createElement('div');
    reportsList.className = 'reports-list';
    reportsList.id = 'filtered-reports';
    
    container.appendChild(reportsList);
    
    // Initial render
    renderFilteredReports();
  }

  window.applyReportFilters = function() {
    state.filters.location = document.getElementById('filter-location')?.value || 'all';
    state.filters.dateRange = document.getElementById('filter-date')?.value || 'all';
    renderFilteredReports();
  };

  function renderFilteredReports() {
    const container = document.getElementById('filtered-reports');
    if (!container) return;
    
    let filtered = inspectionsData.filter(ins => ins.status === 'completed');
    
    // Apply location filter
    if (state.filters.location !== 'all') {
      filtered = filtered.filter(ins => ins.location === state.filters.location);
    }
    
    // Apply date filter
    if (state.filters.dateRange !== 'all') {
      const now = new Date();
      const ranges = {
        today: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        quarter: 90 * 24 * 60 * 60 * 1000
      };
      
      const cutoff = now.getTime() - ranges[state.filters.dateRange];
      filtered = filtered.filter(ins => new Date(ins.created_at).getTime() > cutoff);
    }
    
    container.innerHTML = '';
    
    if (filtered.length === 0) {
      container.innerHTML = '<p class="empty-state">No reports match the selected filters.</p>';
      return;
    }
    
    // Summary statistics
    const summary = document.createElement('div');
    summary.className = 'report-summary';
    
    const totalInspections = filtered.length;
    const highRiskCount = filtered.filter(ins => {
      const risk = (ins.riskScore / ins.maxRiskScore) * 100;
      return risk > 50;
    }).length;
    
    summary.innerHTML = `
      <div class="summary-stat">
        <span class="stat-value">${totalInspections}</span>
        <span class="stat-label">Total Inspections</span>
      </div>
      <div class="summary-stat">
        <span class="stat-value">${highRiskCount}</span>
        <span class="stat-label">High Risk</span>
      </div>
      <div class="summary-stat">
        <span class="stat-value">${((totalInspections - highRiskCount) / totalInspections * 100).toFixed(1)}%</span>
        <span class="stat-label">Compliance Rate</span>
      </div>
    `;
    
    container.appendChild(summary);
    
    // Report items
    filtered.forEach(ins => {
      const item = createReportItem(ins);
      container.appendChild(item);
    });
  }

  function createReportItem(inspection) {
    const item = document.createElement('div');
    item.className = 'report-item';
    
    const riskPercentage = inspection.maxRiskScore ? 
      (inspection.riskScore / inspection.maxRiskScore) * 100 : 0;
    
    let riskClass = 'low';
    if (riskPercentage > 50) riskClass = 'high';
    else if (riskPercentage > 25) riskClass = 'medium';
    
    item.innerHTML = `
      <div class="report-header">
        <div class="report-title">${inspection.location} - ${inspection.type}</div>
        <div class="risk-indicator risk-${riskClass}">
          ${riskClass.toUpperCase()} RISK
        </div>
      </div>
      
      <div class="report-meta">
        <span><i class="fas fa-user"></i> ${inspection.auditors}</span>
        <span><i class="fas fa-calendar"></i> ${inspection.date}</span>
        <span><i class="fas fa-clock"></i> ${inspection.duration || 'N/A'}</span>
      </div>
      
      <div class="report-actions">
        <button class="btn btn-secondary" onclick="viewInspectionDetails('${inspection.id}')">
          <i class="fas fa-eye"></i> View Details
        </button>
        <button class="btn btn-secondary" onclick="exportSingleReport('${inspection.id}')">
          <i class="fas fa-file-pdf"></i> Export PDF
        </button>
      </div>
    `;
    
    return item;
  }

  /* ------------------------------------------------------------------ */
  /*                      Enhanced Analytics                            */
  /* ------------------------------------------------------------------ */
  
  function renderAnalytics() {
    const canvas = document.getElementById('analytics-chart');
    if (!canvas) return;
    
    const parent = canvas.parentElement;
    
    // Clear previous content
    Array.from(parent.querySelectorAll('.analytics-message')).forEach(el => el.remove());
    
    if (typeof Chart === 'undefined') {
      const msg = document.createElement('p');
      msg.className = 'analytics-message';
      msg.textContent = 'Chart.js library is not available.';
      parent.appendChild(msg);
      return;
    }
    
    const completed = inspectionsData.filter(ins => ins.status === 'completed');
    
    if (completed.length === 0) {
      canvas.style.display = 'none';
      const msg = document.createElement('p');
      msg.className = 'analytics-message';
      msg.textContent = 'No data available for analytics.';
      parent.appendChild(msg);
      return;
    }
    
    // Create tabs for different analytics views
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'analytics-tabs';
    tabsContainer.innerHTML = `
      <button class="tab-btn active" data-view="risk">Risk Analysis</button>
      <button class="tab-btn" data-view="trends">Trends</button>
      <button class="tab-btn" data-view="locations">By Location</button>
      <button class="tab-btn" data-view="categories">By Category</button>
    `;
    
    parent.insertBefore(tabsContainer, canvas);
    
    // Tab switching
    tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderAnalyticsView(btn.dataset.view);
      };
    });
    
    // Initial view
    renderAnalyticsView('risk');
  }

  function renderAnalyticsView(view) {
    const canvas = document.getElementById('analytics-chart');
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (window.analyticsChart) {
      window.analyticsChart.destroy();
    }
    
    canvas.style.display = '';
    
    switch (view) {
      case 'risk':
        renderRiskAnalysis(ctx);
        break;
      case 'trends':
        renderTrendsAnalysis(ctx);
        break;
      case 'locations':
        renderLocationAnalysis(ctx);
        break;
      case 'categories':
        renderCategoryAnalysis(ctx);
        break;
    }
  }

  function renderRiskAnalysis(ctx) {
    const completed = inspectionsData.filter(ins => ins.status === 'completed');
    
    // Group by risk level
    const riskLevels = { low: 0, medium: 0, high: 0 };
    
    completed.forEach(ins => {
      if (!ins.maxRiskScore) return;
      const percentage = (ins.riskScore / ins.maxRiskScore) * 100;
      
      if (percentage <= 25) riskLevels.low++;
      else if (percentage <= 50) riskLevels.medium++;
      else riskLevels.high++;
    });
    
    window.analyticsChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Low Risk', 'Medium Risk', 'High Risk'],
        datasets: [{
          data: [riskLevels.low, riskLevels.medium, riskLevels.high],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: 'var(--text-secondary)',
              font: { size: 14 }
            }
          },
          title: {
            display: true,
            text: 'Risk Distribution',
            color: 'var(--text-primary)',
            font: { size: 18 }
          }
        }
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*                        Helper Functions                            */
  /* ------------------------------------------------------------------ */
  
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${getNotificationIcon(type)}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function getNotificationIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || icons.info;
  }

  function showLoadingIndicator(message = 'Loading...') {
    let indicator = document.getElementById('loading-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'loading-indicator';
      indicator.className = 'loading-indicator';
      document.body.appendChild(indicator);
    }
    
    indicator.innerHTML = `
      <div class="loading-spinner"></div>
      <span>${message}</span>
    `;
    
    indicator.classList.add('show');
  }

  function hideLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
      indicator.classList.remove('show');
    }
  }

  function showGuidance(text) {
    const modal = document.createElement('div');
    modal.className = 'guidance-modal';
    modal.innerHTML = `
      <div class="guidance-content">
        <div class="guidance-header">
          <h3>Guidance</h3>
          <button class="close-btn" type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="guidance-body">
          ${text}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-btn').onclick = () => modal.remove();
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  /* ------------------------------------------------------------------ */
  /*                      Form Management                               */
  /* ------------------------------------------------------------------ */
  
  function resetForm() {
    state.currentInspectionId = null;
    state.startTime = null;
    state.currentCategory = null;
    stopInspectionTimer();
    
    // Reset basic fields
    elements.locationSelect.selectedIndex = 0;
    elements.typeSelect.selectedIndex = 0;
    elements.auditorNamesInput.value = '';
    elements.inspectionDateInput.value = '';
    
    // Clear question files
    questionFiles = {};
    
    // Clear signatures
    signatureData = {};
    
    // Re-render questions
    renderQuestions();
    
    // Remove timer display
    const timer = document.getElementById('inspection-timer');
    if (timer) timer.remove();
  }

  function populateForm(data) {
    state.currentInspectionId = data.id || null;
    
    // Set basic fields
    const locIdx = Array.from(elements.locationSelect.options).findIndex(
      opt => opt.value === data.location
    );
    if (locIdx >= 0) elements.locationSelect.selectedIndex = locIdx;
    
    const typeIdx = Array.from(elements.typeSelect.options).findIndex(
      opt => opt.value === data.type
    );
    if (typeIdx >= 0) elements.typeSelect.selectedIndex = typeIdx;
    
    elements.auditorNamesInput.value = data.auditors || '';
    elements.inspectionDateInput.value = data.date || '';
    
    // Populate question files
    questionFiles = {};
    questions.forEach(q => {
      const ans = data.answers && data.answers[q.id];
      if (ans && ans.files) {
        questionFiles[q.id] = ans.files.slice();
      }
    });
    
    // Re-render and populate values
    renderQuestions();
    
    // Set question values
    questions.forEach(q => {
      const ans = data.answers && data.answers[q.id];
      if (!ans) return;
      
      switch (q.type) {
        case 'boolean':
          const radio = document.querySelector(`input[name="${q.id}"][value="${ans.value}"]`);
          if (radio) radio.checked = true;
          break;
          
        case 'checklist':
          if (Array.isArray(ans.value)) {
            ans.value.forEach(val => {
              const cb = document.querySelector(`input[name="${q.id}"][value="${val}"]`);
              if (cb) cb.checked = true;
            });
          }
          break;
          
        default:
          const el = document.getElementById(q.id);
          if (el) el.value = ans.value || '';
      }
      
      // Set comment
      const commentEl = document.getElementById(`comment-${q.id}`);
      if (commentEl && ans.comment) {
        commentEl.value = ans.comment;
        commentEl.style.display = 'block';
        
        // Update toggle button
        const toggle = commentEl.previousElementSibling;
        if (toggle) {
          toggle.innerHTML = '<i class="fas fa-comment-slash"></i> Hide Comment';
        }
      }
    });
    
    updateProgress();
    updateFormTitle();
  }

  function updateFormTitle() {
    if (!elements.inspectionTitleEl) return;
    
    const typeVal = elements.typeSelect.value || 'Inspection';
    let locText = elements.locationSelect.value;
    
    if (locText && locText.includes(' - ')) {
      locText = locText.split(' - ').slice(1).join(' - ');
    }
    
    const locationName = locText || 'No Location Selected';
    
    elements.inspectionTitleEl.innerHTML = `
      <i class="fas fa-shield-check"></i>
      ${typeVal} - ${locationName}
    `;
  }

  /* ------------------------------------------------------------------ */
  /*                    Event Listener Attachment                       */
  /* ------------------------------------------------------------------ */
  
  function attachQuestionEventListeners() {
    questions.forEach(q => {
      switch (q.type) {
        case 'boolean':
          document.querySelectorAll(`input[name="${q.id}"]`).forEach(radio => {
            radio.addEventListener('change', updateProgress);
          });
          break;
          
        case 'checklist':
          document.querySelectorAll(`input[name="${q.id}"]`).forEach(cb => {
            cb.addEventListener('change', updateProgress);
          });
          break;
          
        default:
          const el = document.getElementById(q.id);
          if (el) {
            el.addEventListener('input', updateProgress);
            el.addEventListener('change', updateProgress);
          }
      }
    });
  }

  // Initialize event listeners
  elements.startInspectionBtn.addEventListener('click', () => {
    setActiveSection('inspections');
    resetForm();
    startInspectionTimer();
    scrollToForm();
  });
  
  if (elements.saveDraftBtn) {
    elements.saveDraftBtn.addEventListener('click', () => saveInspection('draft'));
  }
  if (elements.submitInspectionBtn) {
    elements.submitInspectionBtn.addEventListener('click', () => {
      if (state.settings.signatureRequired) {
        showSignatureModal(() => saveInspection('completed'));
      } else {
        saveInspection('completed');
      }
    });
  }
  
  if (elements.previewModeBtn) {
    elements.previewModeBtn.addEventListener('click', togglePreviewMode);
  }
  if (elements.exportPdfBtn) {
    elements.exportPdfBtn.addEventListener('click', exportToPDF);
  }
  
  // Form field listeners
  [elements.locationSelect, elements.typeSelect, elements.auditorNamesInput, elements.inspectionDateInput]
    .forEach(el => {
      el.addEventListener('input', updateProgress);
      el.addEventListener('change', () => {
        updateProgress();
        updateFormTitle();
      });
    });
  
  // Quick action buttons
  elements.quickActions.import.addEventListener('click', importQuestions);
  elements.quickActions.export.addEventListener('click', exportQuestions);
  elements.quickActions.exportReports.addEventListener('click', exportReports);
  elements.quickActions.sync.addEventListener('click', syncOfflineData);
  elements.quickActions.settings.addEventListener('click', () => setActiveSection('settings'));
  
  // Monitor online/offline status
  window.addEventListener('online', () => {
    showNotification('Back online! Syncing data...', 'success');
    syncOfflineData();
  });
  
  window.addEventListener('offline', () => {
    showNotification('Working offline. Data will sync when connection restored.', 'warning');
  });
  
  // Service worker registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered'))
      .catch(err => console.error('Service Worker registration failed:', err));
  }
  
  /* ------------------------------------------------------------------ */
  /*                         Initialization                             */
  /* ------------------------------------------------------------------ */
  
  // Initialize user menu
  updateUserMenu(window.netlifyIdentity?.currentUser());
  
  // Load questions
  loadQuestions();
  
  // Apply settings
  applySettings();
  
  // Set default date to today
  elements.inspectionDateInput.valueAsDate = new Date();
  
  // Initialize view
  setActiveSection('dashboard');
  
  // Setup mobile menu
  setupMobileMenu();
  
  // Netlify Identity events
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on('init', user => {
      updateUserMenu(user);
      if (user) {
        console.log('User authenticated on init:', user.email);
        loadInspections();
        loadQuestions();
        syncOfflineData();
      } else {
        console.log('No user authenticated on init');
        // Still load local inspections
        loadInspections();
      }
    });
    
    window.netlifyIdentity.on('login', user => {
      console.log('User logged in:', user.email);
      updateUserMenu(user);
      window.netlifyIdentity.close();
      
      // Reload everything after login
      loadInspections();
      loadQuestions();
      
      // Try to sync offline data
      setTimeout(() => {
        syncOfflineData();
      }, 1000);
    });
    
    window.netlifyIdentity.on('logout', () => {
      console.log('User logged out');
      updateUserMenu(null);
      state.currentInspectionId = null;
      questions = [...defaultQuestions];
      renderQuestions();
      
      // Clear lists but keep local data
      elements.pendingList.innerHTML = '';
      elements.completedList.innerHTML = '';
      
      // Reload to show local inspections only
      loadInspections();
    });
  } else {
    console.warn('Netlify Identity not available - running in local-only mode');
    // Still load local data
    loadInspections();
  }
  
  // Auto-save initialization
  if (state.settings.autoSave) {
    startAutoSave();
  }
  
  // Request notification permission
  if (state.settings.notifications && 'Notification' in window) {
    Notification.requestPermission();
  }

  /* ------------------------------------------------------------------ */
  /*                      Additional Functions                          */
  /* ------------------------------------------------------------------ */
  
  // These functions are referenced in the code but defined here for completeness
  
  window.exportAllData = async function() {
    // Implementation for exporting all data
    showNotification('Export feature coming soon', 'info');
  };
  
  window.clearOfflineData = function() {
    if (confirm('Are you sure you want to clear all offline data?')) {
      localStorage.removeItem('offline-queue');
      offlineQueue = [];
      showNotification('Offline data cleared', 'success');
    }
  };
  
  window.resetApplication = function() {
    if (confirm('This will reset all settings and clear local data. Continue?')) {
      localStorage.clear();
      location.reload();
    }
  };
  
  window.viewInspectionDetails = function(id) {
    const inspection = inspectionsData.find(ins => ins.id === id);
    if (inspection) {
      populateForm(inspection);
      setActiveSection('inspections');
      togglePreviewMode();
    }
  };
  
  window.exportSingleReport = function(id) {
    const inspection = inspectionsData.find(ins => ins.id === id);
    if (inspection) {
      state.currentInspectionId = id;
      exportToPDF();
    }
  };
  
  window.exportFilteredReports = function() {
    showNotification('Excel export feature coming soon', 'info');
  };
  
  window.setCategorySection = setCategorySection;
  window.showInspectionOverview = showInspectionOverview;
  window.startFullInspection = function() {
    const categories = getCategories();
    if (categories.length > 0) {
      setCategorySection(categories[0]);
      startInspectionTimer();
    }
  };
  
  window.continueLastInspection = function() {
    // Find the most recent draft
    const drafts = inspectionsData.filter(ins => ins.status === 'draft')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    if (drafts.length > 0) {
      populateForm(drafts[0]);
      showNotification('Continuing last inspection draft', 'info');
    } else {
      showNotification('No draft inspections found', 'info');
    }
  };
  
  window.submitInspection = function() {
    if (state.settings.signatureRequired) {
      showSignatureModal(() => saveInspection('completed'));
    } else {
      saveInspection('completed');
    }
  };
  
  function scrollToForm() {
    const form = document.querySelector('.audit-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  async function loadInspections() {
    elements.pendingList.innerHTML = '';
    elements.completedList.innerHTML = '';
    inspectionsData = [];
    
    // First, load any local inspections
    const localInspections = JSON.parse(localStorage.getItem('local-inspections') || '[]');
    localInspections.forEach(inspection => {
      inspectionsData.push(inspection);
      appendInspectionToList(inspection);
    });
    
    if (!window.netlifyIdentity) {
      console.log('Using local storage only - Netlify Identity not available');
      return;
    }
    
    const user = window.netlifyIdentity.currentUser();
    if (!user) {
      console.log('No user logged in');
      return;
    }
    
    try {
      const token = await user.jwt();
      const prefix = `inspections/${user.id}/`;
      
      // Fixed: Use query parameter for path and list
      const listRes = await fetch(`/.netlify/functions/blob?path=${encodeURIComponent(prefix)}&list=true`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });
      
      if (!listRes.ok) {
        console.warn('Could not list blobs, using local storage only');
        return;
      }
      
      const listData = await listRes.json();
      const blobs = listData.blobs || [];
      
      // Clear local inspections if we have cloud data
      if (blobs.length > 0) {
        elements.pendingList.innerHTML = '';
        elements.completedList.innerHTML = '';
        inspectionsData = [];
      }
      
      const recordPaths = blobs
        .map(b => b.path || b)
        .filter(p => typeof p === 'string' && p.endsWith('record.json'));
      
      for (const recordPath of recordPaths) {
        try {
          // Fixed: Use query parameter for path
          const recRes = await fetch(`/.netlify/functions/blob?path=${encodeURIComponent(recordPath)}`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              Accept: 'application/json'
            }
          });
          
          if (!recRes.ok) continue;
          
          const record = await recRes.json();
          
          // Check if this inspection exists locally and remove it
          const localIndex = inspectionsData.findIndex(ins => ins.id === record.id);
          if (localIndex >= 0) {
            // Remove from DOM
            const existingElement = document.querySelector(`[data-inspection-id="${record.id}"]`);
            if (existingElement) existingElement.remove();
            // Remove from array
            inspectionsData.splice(localIndex, 1);
          }
          
          inspectionsData.push(record);
          appendInspectionToList(record);
        } catch (ex) {
          console.error('Failed to fetch record', recordPath, ex);
        }
      }
      
      // Clear local storage if cloud sync successful
      if (blobs.length > 0) {
        localStorage.removeItem('local-inspections');
      }
      
    } catch (err) {
      console.error('Error loading inspections from cloud, using local storage', err);
    }
  }
  
  function appendInspectionToList(inspection) {
    const listEl = inspection.status === 'completed' ? elements.completedList : elements.pendingList;
    
    const li = document.createElement('li');
    li.className = 'list-item slide-up';
    li.setAttribute('data-inspection-id', inspection.id);
    
    const meta = timeAgo(inspection.created_at);
    const title = `${inspection.location} - ${inspection.type}`;
    
    let statusIndicator = '';
    if (inspection.status === 'completed') {
      statusIndicator = `
        <div class="status-indicator status-completed">
          <i class="fas fa-check"></i>
          Completed
        </div>
      `;
    } else {
      statusIndicator = `
        <div class="status-indicator status-pending">
          <i class="fas fa-clock"></i>
          Draft
        </div>
      `;
    }
    
    // Risk indicator for completed inspections
    let riskIndicator = '';
    if (inspection.status === 'completed' && inspection.maxRiskScore) {
      const riskPercentage = (inspection.riskScore / inspection.maxRiskScore) * 100;
      let riskClass = 'low';
      if (riskPercentage > 50) riskClass = 'high';
      else if (riskPercentage > 25) riskClass = 'medium';
      
      riskIndicator = `<span class="risk-badge risk-${riskClass}">${riskClass.toUpperCase()}</span>`;
    }
    
    let actionsHtml = '';
    if (inspection.status !== 'completed') {
      actionsHtml = `
        <div class="list-item-actions">
          <button class="btn btn-secondary edit-btn" data-id="${inspection.id}">
            <i class="fas fa-edit"></i>
            Edit
          </button>
          <button class="btn btn-success complete-btn" data-id="${inspection.id}">
            <i class="fas fa-check"></i>
            Complete
          </button>
        </div>
      `;
    }
    
    // Get summary from first comment or answer
    let summary = '';
    const answers = inspection.answers || {};
    for (const key in answers) {
      const ans = answers[key];
      if (ans && typeof ans === 'object') {
        if (ans.comment && ans.comment.trim()) {
          summary = ans.comment.trim();
          break;
        }
      }
    }
    
    if (!summary) {
      summary = 'No description provided.';
    }
    
    if (summary.length > 80) {
      summary = summary.substring(0, 80) + '...';
    }
    
    li.innerHTML = `
      <div class="list-item-header">
        <div class="list-item-title">${title} ${riskIndicator}</div>
        ${inspection.status === 'completed' ? statusIndicator : `<div class="list-item-meta">${meta}</div>`}
      </div>
      <div class="list-item-content">${summary}</div>
      ${inspection.status === 'completed' ? `<div class="list-item-meta">${meta}</div>` : ''}
      ${actionsHtml}
    `;
    
    listEl.appendChild(li);
    
    // Attach event listeners
    if (inspection.status !== 'completed') {
      const editBtn = li.querySelector('.edit-btn');
      const completeBtn = li.querySelector('.complete-btn');
      
      editBtn?.addEventListener('click', () => {
        populateForm(inspection);
        setActiveSection('inspections');
        scrollToForm();
      });
      
      completeBtn?.addEventListener('click', async () => {
        await updateStatus(inspection.id, 'completed');
      });
    }
  }
  
  async function updateStatus(id, newStatus) {
    if (!window.netlifyIdentity) return;
    
    const user = window.netlifyIdentity.currentUser();
    if (!user) return;
    
    const token = await user.jwt();
    const basePath = `inspections/${user.id}/${id}`;
    
    try {
      // Fetch existing record
      // Fixed: Use query parameter for path
      const recRes = await fetch(`/.netlify/functions/blob?path=${encodeURIComponent(basePath + '/record.json')}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!recRes.ok) {
        throw new Error('Failed to fetch record for status update');
      }
      
      const record = await recRes.json();
      record.status = newStatus;
      
      // Persist updated record
      // Fixed: Use query parameter for path
      await fetch(`/.netlify/functions/blob?path=${encodeURIComponent(basePath + '/record.json')}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(record)
      });
      
      await loadInspections();
      showNotification('Status updated successfully', 'success');
      
    } catch (err) {
      console.error(err);
      showNotification('Failed to update status', 'error');
    }
  }
  
  function timeAgo(isoTimestamp) {
    const then = new Date(isoTimestamp);
    if (isNaN(then.getTime())) return '';
    
    const now = new Date();
    let diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 0) diff = 0;
    
    const units = [
      { label: 'y', seconds: 31536000 },
      { label: 'mo', seconds: 2592000 },
      { label: 'd', seconds: 86400 },
      { label: 'h', seconds: 3600 },
      { label: 'm', seconds: 60 },
      { label: 's', seconds: 1 }
    ];
    
    for (const unit of units) {
      const amount = Math.floor(diff / unit.seconds);
      if (amount >= 1) {
        return `${amount}${unit.label} ago`;
      }
    }
    
    return 'just now';
  }
  
  async function loadQuestions() {
    if (!window.netlifyIdentity) {
      questions = [...defaultQuestions];
      renderQuestions();
      return;
    }
    
    const user = window.netlifyIdentity.currentUser();
    if (!user) {
      questions = [...defaultQuestions];
      renderQuestions();
      return;
    }
    
    try {
      const token = await user.jwt();
      const path = `questions/${user.id}/questions.json`;
      
      // Fixed: Use query parameter for path
      const res = await fetch(`/.netlify/functions/blob?path=${encodeURIComponent(path)}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          questions = data;
          console.log('Loaded custom questions:', questions.length);
        } else {
          questions = [...defaultQuestions];
          console.log('Using default questions');
        }
      } else if (res.status === 404) {
        // This is expected for new users - not an error
        questions = [...defaultQuestions];
        console.log('No saved questions found, using defaults');
      } else {
        // Actual error
        console.warn('Failed to load questions:', res.status, res.statusText);
        questions = [...defaultQuestions];
      }
    } catch (err) {
      console.warn('Failed to load questions, using defaults', err);
      questions = [...defaultQuestions];
    }
    
    renderQuestions();
  }

javascript  async function saveQuestions() {
    if (!window.netlifyIdentity) return;
    
    const user = window.netlifyIdentity.currentUser();
    if (!user) return;
    
    try {
      const token = await user.jwt();
      const path = `questions/${user.id}/questions.json`;
      
      // Fixed: Use query parameter for path
      await fetch(`/.netlify/functions/blob?path=${encodeURIComponent(path)}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questions)
      });
    } catch (err) {
      console.error('Failed to save questions', err);
    }
  }
  
  // Close the DOMContentLoaded event listener
});
