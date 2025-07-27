// Aurora Audit Platform Main Script
// This script adds interactivity to the static HTML by
// integrating Netlify Identity for authentication, using
// Netlify Blobs for persistence, handling form state,
// voice input with the Web Speech API, file uploads and
// dynamic progress calculation.

document.addEventListener('DOMContentLoaded', () => {
  /* ------------------------------------------------------------------ */
  /*                         Netlify Identity Setup                     */
  /* ------------------------------------------------------------------ */
  // Initialize Netlify Identity widget. The widget automatically
  // interacts with the Identity service when this site is deployed
  // on Netlify. Locally it will noop.
  if (window.netlifyIdentity) {
    window.netlifyIdentity.init();
  }

  // Cache references to frequently used DOM elements to avoid
  // unnecessary lookups.
  const userMenu = document.getElementById('user-menu');
  const pendingList = document.getElementById('pending-list');
  const completedList = document.getElementById('completed-list');
  const startInspectionBtn = document.getElementById('start-inspection-btn');
  const saveDraftBtn = document.getElementById('save-draft-btn');
  const submitInspectionBtn = document.getElementById('submit-inspection-btn');
  const previewModeBtn = document.getElementById('preview-mode-btn');
  const exportPdfBtn = document.getElementById('export-pdf-btn');
  const locationSelect = document.getElementById('delivery-station-select');
  const typeSelect = document.getElementById('inspection-type-select');
  const auditorNamesInput = document.getElementById('auditor-names');
  const inspectionDateInput = document.getElementById('inspection-date');
  // Observations and extinguisher inputs have been removed.
  const observationsTextarea = null;
  const extinguisherCountInput = null;
  const fileArea = null;
  const progressStatusEl = document.getElementById('progress-status');
  const progressFillEl = document.getElementById('progress-fill');
  const inspectionTitleEl = document.getElementById('inspection-title');

  // Navigation items
  const navDashboard = document.getElementById('nav-dashboard');
  const navInspections = document.getElementById('nav-inspections');
  const navReports = document.getElementById('nav-reports');
  const navAnalytics = document.getElementById('nav-analytics');

  /**
   * Show only the section with the given name and update nav states.
   * @param {string} section
   */
  function setActiveSection(section) {
    document.querySelectorAll('[data-section]').forEach(el => {
      if (el.dataset.section === section) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const navMap = {
      dashboard: navDashboard,
      inspections: navInspections,
      reports: navReports,
      analytics: navAnalytics
    };
    if (navMap[section]) {
      navMap[section].classList.add('active');
    }
    if (section === 'inspections') {
      updateFormTitle();
      updateProgress();
    } else if (section === 'reports') {
      renderReports();
    } else if (section === 'analytics') {
      renderAnalytics();
    }
  }

  // Bind nav clicks
  navDashboard?.addEventListener('click', e => {
    e.preventDefault();
    setActiveSection('dashboard');
  });
  navInspections?.addEventListener('click', e => {
    e.preventDefault();
    setActiveSection('inspections');
  });
  navReports?.addEventListener('click', e => {
    e.preventDefault();
    setActiveSection('reports');
  });
  navAnalytics?.addEventListener('click', e => {
    e.preventDefault();
    setActiveSection('analytics');
  });

  // Set default section
  setActiveSection('dashboard');

  // Quick actions buttons
  const importQuestionsBtn = document.getElementById('import-questions-btn');
  const exportQuestionsBtn = document.getElementById('export-questions-btn');
  const exportReportsBtn = document.getElementById('export-reports-btn');
  const syncDataBtn = document.getElementById('sync-data-btn');
  const settingsBtn = document.getElementById('settings-btn');

  // Track current inspection identifier. When editing an existing
  // inspection the id is set; for new inspections it is null until
  // saved.
  let currentInspectionId = null;

  // For per-question attachments. Each question id maps to an array of File objects or file name strings.
  let questionFiles = {};
  // Cache loaded inspections for reports and analytics. Populated by loadInspections().
  let inspectionsData = [];

  // Define the default question set extracted from the provided audit report.
  // Each question belongs to a category and is a simple yes/no (boolean) type.
  const defaultQuestions = [
    // Allgemeine Sicherheit (General Safety)
    { id: 'general-visible-signs', type: 'boolean', category: 'General Safety', question: 'Sind Sicherheitshinweise und Fluchtwegpläne deutlich sichtbar?', required: false },
    { id: 'general-exits-clear', type: 'boolean', category: 'General Safety', question: 'Sind alle Notausgänge frei und gut gekennzeichnet?', required: false },
    { id: 'general-first-aid', type: 'boolean', category: 'General Safety', question: 'Ist die Erste-Hilfe-Ausstattung vollständig und erreichbar?', required: false },
    { id: 'general-emergency-equipment', type: 'boolean', category: 'General Safety', question: 'Ist die Notfallausrüstung (Augenspülung, Feuerlöscher) zugänglich?', required: false },
    { id: 'general-psa', type: 'boolean', category: 'General Safety', question: 'Tragen alle Mitarbeiter die korrekte PSA?', required: false },
    { id: 'general-badges', type: 'boolean', category: 'General Safety', question: 'Sind alle Mitarbeiter-Badges sichtbar?', required: false },
    { id: 'general-hair-clothing', type: 'boolean', category: 'General Safety', question: 'Entsprechen Frisur/Kleidung den Sicherheitsvorschriften? (max. Schulterhöhe)', required: false },
    { id: 'general-instructions', type: 'boolean', category: 'General Safety', question: 'Sind aktuelle Arbeitsanweisungen verfügbar?', required: false },
    // Arbeitsplatz und Umgebung (Workplace and Environment)
    { id: 'workplace-clean', type: 'boolean', category: 'Workplace & Environment', question: 'Ist die Lagerhalle sauber und aufgeräumt?', required: false },
    { id: 'workplace-floors', type: 'boolean', category: 'Workplace & Environment', question: 'Sind die Böden rutschfest und eben?', required: false },
    { id: 'workplace-space', type: 'boolean', category: 'Workplace & Environment', question: 'Ist ausreichend Bewegungsfreiheit vorhanden? (min. 1,5 m² pro Person)', required: false },
    { id: 'workplace-lighting', type: 'boolean', category: 'Workplace & Environment', question: 'Entspricht die Beleuchtung den Anforderungen? (min. 200 Lux)', required: false },
    { id: 'workplace-temperature', type: 'boolean', category: 'Workplace & Environment', question: 'Ist die Raumtemperatur angemessen? (18-25°C)', required: false },
    { id: 'workplace-ventilation', type: 'boolean', category: 'Workplace & Environment', question: 'Ist die Lüftung ausreichend?', required: false },
    { id: 'workplace-noise', type: 'boolean', category: 'Workplace & Environment', question: 'Liegt der Lärmpegel im zulässigen Bereich? (< 85 dB(A))', required: false },
    { id: 'workplace-ergonomics', type: 'boolean', category: 'Workplace & Environment', question: 'Sind die Arbeitsplätze ergonomisch gestaltet?', required: false },
    // Lagerung und Transport (Storage & Transport)
    { id: 'storage-5s', type: 'boolean', category: 'Storage & Transport', question: 'Werden die 5S-Markierungen respektiert?', required: false },
    { id: 'storage-organization', type: 'boolean', category: 'Storage & Transport', question: 'Sind die Lagerbereiche sicher organisiert?', required: false },
    { id: 'storage-overhead', type: 'boolean', category: 'Storage & Transport', question: 'Werden Lagerungen über Kopf vermieden?', required: false },
    { id: 'storage-shelves', type: 'boolean', category: 'Storage & Transport', question: 'Sind Regale ordnungsgemäß befestigt?', required: false },
    { id: 'storage-stack-height', type: 'boolean', category: 'Storage & Transport', question: 'Sind die maximalen Stapelhöhen eingehalten?', required: false },
    { id: 'storage-pedestrian-paths', type: 'boolean', category: 'Storage & Transport', question: 'Sind Fußgängerwege klar gekennzeichnet? (min. 1,2 m breit)', required: false },
    { id: 'storage-paths-clear', type: 'boolean', category: 'Storage & Transport', question: 'Sind alle Transportwege frei von Hindernissen?', required: false },
    { id: 'storage-danger-zones', type: 'boolean', category: 'Storage & Transport', question: 'Sind Gefahrenbereiche deutlich markiert?', required: false },
    { id: 'storage-vehicles-condition', type: 'boolean', category: 'Storage & Transport', question: 'Sind alle Flurförderzeuge in gutem Zustand?', required: false },
    { id: 'storage-maintenance-logs', type: 'boolean', category: 'Storage & Transport', question: 'Sind die Wartungsprotokolle aktuell? (jährliche Prüfung)', required: false },
    { id: 'storage-loading-aids', type: 'boolean', category: 'Storage & Transport', question: 'Sind Ladehilfsmittel unbeschädigt?', required: false },
    // Gefahrstoffe (Hazardous Materials)
    { id: 'hazard-storage', type: 'boolean', category: 'Hazardous Materials', question: 'Sind Gefahrstoffe korrekt gelagert?', required: false },
    { id: 'hazard-labeling', type: 'boolean', category: 'Hazardous Materials', question: 'Sind alle Gefahrstoffe ordnungsgemäß gekennzeichnet?', required: false },
    { id: 'hazard-safety-data', type: 'boolean', category: 'Hazardous Materials', question: 'Sind Sicherheitsdatenblätter verfügbar?', required: false },
    { id: 'hazard-area-secured', type: 'boolean', category: 'Hazardous Materials', question: 'Sind Gefahrstoffbereiche abgesperrt?', required: false },
    // Ergonomie und Arbeitsverhalten (Ergonomics & Work Behaviour)
    { id: 'ergo-posture', type: 'boolean', category: 'Ergonomics & Behaviour', question: 'Vermeiden Mitarbeiter ungünstige Körperhaltungen?', required: false },
    { id: 'ergo-cart-control', type: 'boolean', category: 'Ergonomics & Behaviour', question: 'Werden Transportwagen kontrolliert bewegt?', required: false },
    { id: 'ergo-handrails', type: 'boolean', category: 'Ergonomics & Behaviour', question: 'Werden Handläufe verwendet (wo vorhanden)?', required: false },
    { id: 'ergo-lifting-aids', type: 'boolean', category: 'Ergonomics & Behaviour', question: 'Werden Hebehilfen bei schweren Lasten eingesetzt? (ab 25 kg Männer, 15 kg Frauen)', required: false },
    { id: 'ergo-breaks', type: 'boolean', category: 'Ergonomics & Behaviour', question: 'Werden Pausenzeiten eingehalten?', required: false },
    { id: 'ergo-work-rhythm', type: 'boolean', category: 'Ergonomics & Behaviour', question: 'Ist der Arbeitsrhythmus angemessen?', required: false },
    // Notfallvorsorge (Emergency Preparedness)
    { id: 'emergency-first-aiders', type: 'boolean', category: 'Emergency Preparedness', question: 'Sind genügend Ersthelfer verfügbar? (1 pro 19 Mitarbeiter)', required: false },
    { id: 'emergency-fire-wardens', type: 'boolean', category: 'Emergency Preparedness', question: 'Sind Brandschutzwarte ernannt und geschult?', required: false },
    { id: 'emergency-plans', type: 'boolean', category: 'Emergency Preparedness', question: 'Sind die Notfallpläne aktuell und bekannt?', required: false },
    { id: 'emergency-drills', type: 'boolean', category: 'Emergency Preparedness', question: 'Werden regelmäßig Notfallübungen durchgeführt?', required: false },
    { id: 'emergency-assembly-points', type: 'boolean', category: 'Emergency Preparedness', question: 'Sind Sammelplätze bekannt und gekennzeichnet?', required: false },
    { id: 'emergency-alarm-system', type: 'boolean', category: 'Emergency Preparedness', question: 'Funktioniert das Alarmsystem ordnungsgemäß?', required: false },
    // Wartung und Instandhaltung (Maintenance & Inspection)
    { id: 'maintenance-gate-intervals', type: 'boolean', category: 'Maintenance', question: 'Werden Wartungsintervalle bei Toren eingehalten?', required: false },
    { id: 'maintenance-extinguisher', type: 'boolean', category: 'Maintenance', question: 'Sind Feuerlöscher-Prüffristen aktuell? (alle 2 Jahre)', required: false },
    { id: 'maintenance-electrical', type: 'boolean', category: 'Maintenance', question: 'Sind elektrische Anlagen ordnungsgemäß geprüft?', required: false },
    { id: 'maintenance-ventilation', type: 'boolean', category: 'Maintenance', question: 'Erfolgt regelmäßige Wartung der Lüftungsanlagen?', required: false },
    { id: 'maintenance-protocols', type: 'boolean', category: 'Maintenance', question: 'Sind alle Wartungsprotokolle verfügbar?', required: false },
    // Höhenarbeiten (Working at Heights)
    { id: 'height-fall-protection', type: 'boolean', category: 'Working at Heights', question: 'Sind Absturzsicherungen vorhanden?', required: false },
    { id: 'height-special-gear', type: 'boolean', category: 'Working at Heights', question: 'Ist spezielle Schutzausrüstung verfügbar?', required: false },
    { id: 'height-permits', type: 'boolean', category: 'Working at Heights', question: 'Sind Arbeiten in der Höhe genehmigt?', required: false }
  ];

  // The current question list in use. Initially set to the default
  // questions but may be replaced by a user specific set loaded
  // from Netlify Blobs or via import. This array drives dynamic
  // rendering and progress calculations.
  let questions = [...defaultQuestions];

  // Initialize the user menu immediately based on the current
  // authentication state. If Netlify Identity is unavailable or
  // there is no logged in user this will show the login prompt.
  updateUserMenu(window.netlifyIdentity && window.netlifyIdentity.currentUser() || null);
  // Load questions on startup. When not logged in this will render
  // the default question set; when logged in the user-specific
  // question set will be loaded in the init event.
  loadQuestions();

  /**
   * Update the header user menu. When a user is signed in the menu
   * displays the user’s initials and name along with a logout icon.
   * When no user is signed in the menu invites the visitor to log
   * in or sign up. Clicking the menu either opens the login modal
   * or logs the user out accordingly.
   *
   * @param {object|null} user The Netlify Identity user or null.
   */
  function updateUserMenu(user) {
    if (!user) {
      // Show a generic login prompt. The avatar uses a user icon.
      userMenu.innerHTML = `
        <div class="user-avatar"><i class="fas fa-user"></i></div>
        <span>Log in / Sign up</span>
      `;
      userMenu.onclick = () => {
        if (window.netlifyIdentity) {
          window.netlifyIdentity.open();
        }
      };
      // Clear lists when user logs out
      pendingList.innerHTML = '';
      completedList.innerHTML = '';
      return;
    }

    // Compute a friendly display name and initials. Prefer the
    // user_metadata fields, falling back to the email address.
    const name = user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name);
    const displayName = name || user.email;
    const initials = displayName
      .split(/\s+/)
      .map(part => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
    userMenu.innerHTML = `
      <div class="user-avatar">${initials}</div>
      <span>${displayName}</span>
      <i class="fas fa-sign-out-alt"></i>
    `;
    userMenu.onclick = () => {
      if (window.netlifyIdentity) {
        window.netlifyIdentity.logout();
      }
    };
  }

  /**
   * Load the question set for the current user from Netlify Blobs. If
   * no record exists the default question set is used. The loaded
   * questions are stored in the global `questions` variable and the
   * UI is re-rendered accordingly. When the user is not logged in
   * the default questions remain.
   */
  async function loadQuestions() {
    // Use default questions when Identity is unavailable or no user is
    // logged in.
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
      const res = await fetch(`/.netlify/blobs/${path}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          questions = data;
        } else {
          questions = [...defaultQuestions];
        }
      } else {
        // If the file does not exist fall back to default questions
        questions = [...defaultQuestions];
      }
    } catch (err) {
      console.warn('Failed to load questions, using defaults', err);
      questions = [...defaultQuestions];
    }
    renderQuestions();
  }

  /**
   * Persist the current question set to Netlify Blobs for the
   * authenticated user. If the user is not logged in this
   * operation is a no-op and the questions remain only in memory.
   */
  async function saveQuestions() {
    if (!window.netlifyIdentity) return;
    const user = window.netlifyIdentity.currentUser();
    if (!user) return;
    try {
      const token = await user.jwt();
      const path = `questions/${user.id}/questions.json`;
      await fetch(`/.netlify/blobs/${path}`, {
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

  /**
   * Render the questions into the form. This function clears any
   * existing question cards and rebuilds them based on the
   * contents of the `questions` array. Event listeners for voice
   * buttons and input changes are attached. After rendering the
   * progress indicator is updated to reflect the new question
   * count.
   */
  function renderQuestions() {
    const section = document.getElementById('questions-section');
    if (!section) return;
    // Remove all existing question cards
    section.querySelectorAll('.question-card').forEach(card => card.remove());
    // Track the current category to insert headings when category changes
    let currentCategory = null;
    // For each question build appropriate markup
    questions.forEach(q => {
      // Insert a category heading if this question starts a new category
      if (q.category && q.category !== currentCategory) {
        currentCategory = q.category;
        const heading = document.createElement('div');
        heading.className = 'category-heading';
        heading.textContent = currentCategory;
        section.appendChild(heading);
      }
      const card = document.createElement('div');
      card.className = 'question-card';
      const header = document.createElement('div');
      header.className = 'question-header';
      const textEl = document.createElement('div');
      textEl.className = 'question-text';
      // Compose question text and append required indicator
      textEl.textContent = q.question;
      if (q.required) {
        const reqSpan = document.createElement('span');
        reqSpan.className = 'question-required';
        reqSpan.textContent = '*';
        textEl.appendChild(reqSpan);
      }
      header.appendChild(textEl);
      // Voice button (only for text and number questions). For boolean
      // questions voice input may not make sense but we include it
      // anyway for parity.
      if (q.type !== 'file') {
        const voiceBtn = document.createElement('button');
        voiceBtn.type = 'button';
        voiceBtn.className = 'voice-btn';
        voiceBtn.title = 'Voice Input';
        const micIcon = document.createElement('i');
        micIcon.className = 'fas fa-microphone';
        voiceBtn.appendChild(micIcon);
        header.appendChild(voiceBtn);
      }
      card.appendChild(header);
      // Create input control based on type
      let control;
      if (q.type === 'boolean') {
        const options = document.createElement('div');
        options.className = 'boolean-options';
        ['yes', 'no'].forEach(val => {
          const optionCard = document.createElement('div');
          optionCard.className = 'option-card';
          const input = document.createElement('input');
          input.type = 'radio';
          input.name = q.id;
          input.id = `${q.id}-${val}`;
          input.value = val;
          const label = document.createElement('label');
          label.className = 'option-label';
          label.setAttribute('for', `${q.id}-${val}`);
          const icon = document.createElement('i');
          icon.className = val === 'yes' ? 'fas fa-check' : 'fas fa-times';
          label.appendChild(icon);
          label.appendChild(document.createTextNode(val === 'yes' ? ' Yes' : ' No'));
          optionCard.appendChild(input);
          optionCard.appendChild(label);
          options.appendChild(optionCard);
        });
        control = options;
      } else if (q.type === 'text') {
        const textarea = document.createElement('textarea');
        textarea.id = q.id;
        textarea.className = 'text-input';
        textarea.placeholder = 'Enter your answer...';
        control = textarea;
      } else if (q.type === 'number') {
        const input = document.createElement('input');
        input.type = 'number';
        input.id = q.id;
        input.className = 'form-control';
        input.placeholder = 'Enter number';
        input.min = '0';
        control = input;
      } else if (q.type === 'file') {
        // For file type questions we do not render a specific control.
        // Attachments can still be uploaded via the per-question upload area below.
        const wrapper = document.createElement('div');
        control = wrapper;
      } else {
        // Unknown type, fallback to text
        const input = document.createElement('input');
        input.type = 'text';
        input.id = q.id;
        input.className = 'form-control';
        control = input;
      }
      card.appendChild(control);
      // Ensure a files array exists for this question
      if (!questionFiles[q.id]) {
        questionFiles[q.id] = [];
      }
      // Add comment input
      const comment = document.createElement('textarea');
      comment.id = `comment-${q.id}`;
      comment.className = 'text-input comment-input';
      comment.placeholder = 'Add a comment (optional)';
      card.appendChild(comment);
      // Add per-question file upload area
      const attachArea = createFileUploadElement(q.id);
      card.appendChild(attachArea);
      // Append the card to the questions section
      section.appendChild(card);
    });
    // After rendering attach voice button handlers. We need to
    // delegate because voice buttons may be newly created.
    section.querySelectorAll('.voice-btn').forEach(btn => {
      btn.addEventListener('click', () => toggleVoice(btn));
    });
    // Attach change handlers to new inputs for progress updates
    // Boolean radio inputs
    questions.forEach(q => {
      if (q.type === 'boolean') {
        const radios = section.querySelectorAll(`input[name="${q.id}"]`);
        radios.forEach(r => {
          r.addEventListener('change', updateProgress);
        });
      } else if (q.type === 'text' || q.type === 'number') {
        const el = section.querySelector(`#${q.id}`);
        if (el) {
          el.addEventListener('input', () => {
            updateProgress();
          });
          el.addEventListener('change', () => {
            updateProgress();
          });
        }
      }
    });
    // Update progress bar and title after rendering
    updateProgress();
  }

  /**
   * Create a file upload area for a specific question. Allows the user
   * to click or drag files to upload images. Selected files are stored
   * in the questionFiles map. A list of file names is displayed below
   * the upload area.
   *
   * @param {string} qid The question ID.
   * @returns {HTMLElement} The file upload wrapper element.
   */
  function createFileUploadElement(qid) {
    const wrapper = document.createElement('div');
    wrapper.className = 'file-upload';
    // Hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/png,image/jpeg,image/heic';
    input.style.display = 'none';
    wrapper.appendChild(input);
    // Icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'file-upload-icon';
    const icon = document.createElement('i');
    icon.className = 'fas fa-cloud-upload-alt';
    iconDiv.appendChild(icon);
    wrapper.appendChild(iconDiv);
    // Text
    const textDiv = document.createElement('div');
    textDiv.className = 'file-upload-text';
    textDiv.textContent = 'Click to upload or drag and drop';
    wrapper.appendChild(textDiv);
    // Hint
    const hintDiv = document.createElement('div');
    hintDiv.className = 'file-upload-hint';
    hintDiv.textContent = 'PNG, JPG, HEIC up to 10MB';
    wrapper.appendChild(hintDiv);
    // List display
    const listDiv = document.createElement('div');
    listDiv.className = 'file-list';
    wrapper.appendChild(listDiv);
    // Ensure array exists
    if (!questionFiles[qid]) {
      questionFiles[qid] = [];
    }
    // Refresh list
    function refreshList() {
      listDiv.innerHTML = '';
      const files = questionFiles[qid] || [];
      files.forEach(f => {
        const item = document.createElement('div');
        item.textContent = f.name || f;
        item.style.fontSize = '0.8rem';
        item.style.marginTop = '4px';
        listDiv.appendChild(item);
      });
    }
    // Input change
    input.addEventListener('change', e => {
      const files = Array.from(e.target.files || []);
      files.forEach(file => {
        if (!questionFiles[qid].some(existing => existing.name === file.name)) {
          questionFiles[qid].push(file);
        }
      });
      refreshList();
      updateProgress();
    });
    // Click to open file picker
    wrapper.addEventListener('click', () => {
      input.click();
    });
    // Drag & drop
    wrapper.addEventListener('dragover', e => {
      e.preventDefault();
      e.stopPropagation();
      wrapper.classList.add('drag-over');
    });
    wrapper.addEventListener('dragleave', () => {
      wrapper.classList.remove('drag-over');
    });
    wrapper.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();
      wrapper.classList.remove('drag-over');
      const files = Array.from(e.dataTransfer.files || []);
      files.forEach(file => {
        if (!questionFiles[qid].some(existing => existing.name === file.name)) {
          questionFiles[qid].push(file);
        }
      });
      refreshList();
      updateProgress();
    });
    refreshList();
    return wrapper;
  }

  // Register Netlify Identity event listeners. On init, login and logout
  // update the user menu. After login the inspection data is loaded.
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on('init', user => {
      updateUserMenu(user);
      if (user) {
        loadInspections();
        loadQuestions();
      } else {
        // When not logged in fallback to default question set
        questions = [...defaultQuestions];
        renderQuestions();
      }
    });
    window.netlifyIdentity.on('login', user => {
      updateUserMenu(user);
      if (window.netlifyIdentity) {
        window.netlifyIdentity.close();
      }
      loadInspections();
      loadQuestions();
    });
    window.netlifyIdentity.on('logout', () => {
      updateUserMenu(null);
      currentInspectionId = null;
      // Reset to default question set on logout
      questions = [...defaultQuestions];
      renderQuestions();
    });
  }

  /* ------------------------------------------------------------------ */
  /*                        Inspection Form Helpers                     */
  /* ------------------------------------------------------------------ */
  /**
   * Scroll the page smoothly to the inspection form. This is used
   * after starting a new inspection so the form is brought into
   * view.
   */
  function scrollToForm() {
    const form = document.querySelector('.audit-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Reset the inspection form to its default values. Clears
   * previously entered text, resets selections, empties file
   * attachments and resets the progress indicator. Also resets
   * currentInspectionId so that the next save will create a new
   * record rather than updating an existing one.
   */
  function resetForm() {
    currentInspectionId = null;
    locationSelect.selectedIndex = 0;
    typeSelect.selectedIndex = 0;
    auditorNamesInput.value = '';
    inspectionDateInput.value = '';
    // Reset dynamic question fields and attachments
    questions.forEach(q => {
      if (q.type === 'boolean') {
        const radios = document.querySelectorAll(`input[name="${q.id}"]`);
        radios.forEach(r => (r.checked = false));
      } else if (q.type === 'text' || q.type === 'number') {
        const el = document.getElementById(q.id);
        if (el) el.value = '';
      } else {
        const el = document.getElementById(q.id);
        if (el) el.value = '';
      }
      // Clear comment
      const commentEl = document.getElementById(`comment-${q.id}`);
      if (commentEl) commentEl.value = '';
      // Clear attachments for this question
      questionFiles[q.id] = [];
    });
    updateProgress();
    updateFormTitle();
  }

  /**
   * Populate the form with data from an existing inspection. This is
   * invoked when editing a saved inspection. It fills each field
   * with the stored values and sets currentInspectionId so that
   * saving will overwrite the original record.
   *
   * @param {Object} data The inspection data previously saved.
   */
  function populateForm(data) {
    currentInspectionId = data.id || null;
    // Location and type may not match if values have changed, so
    // ensure the option is selected only if it exists. Fall back
    // gracefully if not found.
    const locIdx = Array.from(locationSelect.options).findIndex(
      opt => opt.value === data.location
    );
    if (locIdx >= 0) locationSelect.selectedIndex = locIdx;
    const typeIdx = Array.from(typeSelect.options).findIndex(
      opt => opt.value === data.type
    );
    if (typeIdx >= 0) typeSelect.selectedIndex = typeIdx;
    auditorNamesInput.value = data.auditors || '';
    inspectionDateInput.value = data.date || '';
    // Populate dynamic question answers. Reset questionFiles first.
    questionFiles = {};
    questions.forEach(q => {
      const ans = data.answers && data.answers[q.id];
      const fileNames = ans && ans.files ? ans.files : [];
      questionFiles[q.id] = Array.isArray(fileNames) ? fileNames.slice() : [];
    });
    // Re-render questions to update UI with comments and attachments
    renderQuestions();
    // Set values and comments
    questions.forEach(q => {
      const ans = data.answers && data.answers[q.id];
      const val = ans && ans.value;
      if (q.type === 'boolean') {
        const radio = document.querySelector(`input[name="${q.id}"][value="${val}"]`);
        if (radio) radio.checked = true;
      } else if (q.type === 'text' || q.type === 'number') {
        const el = document.getElementById(q.id);
        if (el) el.value = val || '';
      } else {
        const el = document.getElementById(q.id);
        if (el) el.value = val || '';
      }
      const commentEl = document.getElementById(`comment-${q.id}`);
      if (commentEl) {
        commentEl.value = (ans && ans.comment) || '';
      }
    });
    updateProgress();
    updateFormTitle();
  }

  /**
   * Gather the current contents of the inspection form and return
   * them as a plain object. If currentInspectionId is set the id
   * will be preserved, otherwise a new id is generated using the
   * current timestamp. The status property is passed in to
   * distinguish between drafts and completed inspections.
   *
   * @param {string} status Either 'draft' or 'completed'.
   * @returns {Object} A plain object representing the inspection.
   */
  function collectFormData(status) {
    const id = currentInspectionId || `${Date.now()}`;
    const answers = {};
    questions.forEach(q => {
      let value = '';
      if (q.type === 'boolean') {
        const selected = document.querySelector(`input[name="${q.id}"]:checked`);
        value = selected ? selected.value : '';
      } else if (q.type === 'text' || q.type === 'number') {
        const el = document.getElementById(q.id);
        value = el ? el.value : '';
      } else {
        const el = document.getElementById(q.id);
        value = el ? el.value : '';
      }
      const commentEl = document.getElementById(`comment-${q.id}`);
      const comment = commentEl ? commentEl.value : '';
      const files = (questionFiles[q.id] || []).map(f => (f.name ? f.name : f));
      answers[q.id] = { value, comment, files };
    });
    return {
      id,
      location: locationSelect.value,
      type: typeSelect.value,
      auditors: auditorNamesInput.value,
      date: inspectionDateInput.value,
      status,
      created_at: new Date().toISOString(),
      answers
    };
  }

  /**
   * Update the dynamic title of the inspection form based on the
   * selected inspection type and location. If no values are chosen
   * a generic placeholder is shown.
   */
  function updateFormTitle() {
    const typeVal = typeSelect.value || 'Inspection';
    // Extract a friendly name from the location, dropping the code
    // prefix if present. For example "DVI1 - Vienna Distribution"
    // becomes "Vienna Distribution". If no location selected use
    // "No Location Selected".
    let locText = locationSelect.value;
    if (locText && locText.includes(' - ')) {
      locText = locText.split(' - ').slice(1).join(' - ');
    }
    const locationName = locText || 'No Location Selected';
    inspectionTitleEl.innerHTML = `
      <i class="fas fa-shield-check"></i>
      ${typeVal} - ${locationName}
    `;
  }

  /**
   * Compute and render the progress indicator based on how many
   * required fields have been filled out. The progress bar width
   * scales linearly with the number of completed items. Adjust the
   * total number of items here to match the number of questions on
   * your form.
   */
  function updateProgress() {
    // Compute progress based on required base fields and the current
    // question set. Always include location, type, auditor names and
    // inspection date in the calculation.
    const checks = [];
    checks.push(!!locationSelect.value);
    checks.push(!!typeSelect.value);
    checks.push(auditorNamesInput.value.trim().length > 0);
    checks.push(!!inspectionDateInput.value);
    // Evaluate each question
    questions.forEach(q => {
      if (q.type === 'boolean') {
        checks.push(!!document.querySelector(`input[name="${q.id}"]:checked`));
      } else if (q.type === 'text') {
        const el = document.getElementById(q.id);
        checks.push(el && el.value.trim().length > 0);
      } else if (q.type === 'number') {
        const el = document.getElementById(q.id);
        checks.push(el && el.value !== '');
      } else {
        // For all other types check if value is non-empty
        const el = document.getElementById(q.id);
        checks.push(el && el.value.trim().length > 0);
      }
    });
    const completed = checks.filter(Boolean).length;
    const total = checks.length;
    const percent = total === 0 ? 0 : (completed / total) * 100;
    progressFillEl.style.width = `${percent}%`;
    progressStatusEl.textContent = `${completed} of ${total} completed`;
  }

  /**
   * Read the current inspection data and persist it to Netlify
   * Blobs. When invoked this function uploads any attached files
   * first, then stores the JSON record. If the user is not
   * authenticated they are prompted to sign in. After saving the
   * inspections list is reloaded and the form is reset.
   *
   * @param {string} status Either 'draft' or 'completed'.
   */
  async function saveInspection(status) {
    // Ensure the visitor is authenticated before saving.
    if (!window.netlifyIdentity) {
      alert('Netlify Identity is not available. This feature requires deployment on Netlify.');
      return;
    }
    const user = window.netlifyIdentity.currentUser();
    if (!user) {
      // Trigger the login modal. The promise resolves when login
      // completes or is cancelled.
      window.netlifyIdentity.open();
      return;
    }
    // Collect form data including attachments
    const data = collectFormData(status);
    // Acquire an identity token for authentication with Netlify
    const token = await user.jwt();
    const basePath = `inspections/${user.id}/${data.id}`;
    try {
      // Upload files for each question. Files are stored under
      // inspections/{user}/{inspectionId}/files/{questionId}/{fileName}
      for (const qid of Object.keys(questionFiles)) {
        const files = questionFiles[qid] || [];
        for (const file of files) {
          if (!file || !(file instanceof File)) continue;
          const filePath = `${basePath}/files/${encodeURIComponent(qid)}/${encodeURIComponent(file.name)}`;
          await fetch(`/.netlify/blobs/${filePath}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': file.type || 'application/octet-stream'
            },
            body: file
          });
        }
      }
      // Store the JSON record. Use record.json as filename to differentiate from attachments.
      await fetch(`/.netlify/blobs/${basePath}/record.json`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      // Provide basic feedback to the user. In a real app you may
      // want to use a toast notification instead of alert.
      alert(status === 'completed' ? 'Inspection submitted successfully!' : 'Draft saved successfully!');
      // Reload the list and reset form after save
      await loadInspections();
      resetForm();
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving your inspection.');
    }
  }

  /**
   * Load all inspections belonging to the current user from
   * Netlify Blobs. Each record is expected to live under
   * `inspections/{user.id}/{id}/record.json`. The function lists
   * objects under the user prefix and then fetches each record to
   * build a list in memory. After loading, the pending and
   * completed lists in the sidebar are populated accordingly.
   */
  async function loadInspections() {
    if (!window.netlifyIdentity) return;
    const user = window.netlifyIdentity.currentUser();
    if (!user) return;
    pendingList.innerHTML = '';
    completedList.innerHTML = '';
    // Reset the inspections cache used for reports and analytics
    inspectionsData = [];
    try {
      const token = await user.jwt();
      const prefix = `inspections/${user.id}/`;
      // Request a listing of blobs under this prefix. The API
      // returns a JSON object with a `blobs` array containing
      // metadata objects. See Netlify Blobs documentation for details.
      const listRes = await fetch(`/.netlify/blobs/${prefix}?list=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!listRes.ok) {
        console.warn('Could not list blobs');
        return;
      }
      const listData = await listRes.json();
      const blobs = listData.blobs || [];
      // Filter out any non-record JSON files and group by
      // inspection id. We identify record files by the
      // `record.json` suffix.
      const recordPaths = blobs
        .map(b => b.path || b)
        .filter(p => typeof p === 'string' && p.endsWith('record.json'));
      for (const recordPath of recordPaths) {
        try {
          const recRes = await fetch(`/.netlify/blobs/${recordPath}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!recRes.ok) continue;
      const record = await recRes.json();
      // Add to local cache for reports/analytics
      inspectionsData.push(record);
      appendInspectionToList(record);
        } catch (ex) {
          console.error('Failed to fetch record', recordPath, ex);
        }
      }
    } catch (err) {
      console.error('Error loading inspections', err);
    }
  }

  /**
   * Create an element representing a single inspection and append it
   * to either the pending or completed list based on its status.
   * Each list item includes basic metadata and actions for editing
   * or updating the status.
   *
   * @param {Object} inspection The inspection record to display.
   */
  function appendInspectionToList(inspection) {
    const listEl = inspection.status === 'completed' ? completedList : pendingList;
    const li = document.createElement('li');
    li.className = 'list-item slide-up';
    // Build relative time string for created_at
    const meta = timeAgo(inspection.created_at);
    // Compose HTML using the existing design language
    const title = `${inspection.location} - ${inspection.type}`;
    let statusIndicator = '';
    if (inspection.status === 'completed') {
      statusIndicator = `
        <div class="status-indicator status-completed">
          <i class="fas fa-check"></i>
          Completed
        </div>
      `;
    } else if (inspection.status === 'draft') {
      statusIndicator = `
        <div class="status-indicator status-pending">
          <i class="fas fa-clock"></i>
          Draft
        </div>
      `;
    } else {
      statusIndicator = `
        <div class="status-indicator status-pending">
          <i class="fas fa-clock"></i>
          Pending
        </div>
      `;
    }
    // Actions: edit and complete buttons for pending/draft items. No
    // actions for completed items.
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
    li.innerHTML = `
      <div class="list-item-header">
        <div class="list-item-title">${title}</div>
        ${inspection.status === 'completed' ? statusIndicator : `<div class="list-item-meta">${meta}</div>`}
      </div>
      <div class="list-item-content">
        ${(() => {
          const answers = inspection.answers || {};
          let summary = '';
          for (const key in answers) {
            const ans = answers[key];
            if (ans && typeof ans === 'object') {
              if (ans.comment && ans.comment.trim()) {
                summary = ans.comment.trim();
                break;
              } else if (ans.value && typeof ans.value === 'string' && ans.value.trim()) {
                summary = ans.value.trim();
                break;
              }
            } else if (typeof ans === 'string' && ans.trim()) {
              summary = ans.trim();
              break;
            }
          }
          if (!summary) {
            return 'No description provided.';
          }
          return summary.length > 80 ? summary.substring(0, 80) + '...' : summary;
        })()}
      </div>
      ${inspection.status === 'completed' ? `<div class="list-item-meta">${meta}</div>` : ''}
      ${actionsHtml}
    `;
    listEl.appendChild(li);
    // Attach event listeners for edit/complete if applicable
    if (inspection.status !== 'completed') {
      const editBtn = li.querySelector('.edit-btn');
      const completeBtn = li.querySelector('.complete-btn');
      editBtn?.addEventListener('click', () => {
        populateForm(inspection);
        scrollToForm();
      });
      completeBtn?.addEventListener('click', async () => {
        await updateStatus(inspection.id, 'completed');
      });
    }
  }

  /**
   * Update only the status of an existing inspection. Fetches the
   * current record, modifies the status and persists it back to
   * Netlify. Afterwards the lists are reloaded.
   *
   * @param {string} id The inspection id to update.
   * @param {string} newStatus The new status value to set.
   */
  async function updateStatus(id, newStatus) {
    if (!window.netlifyIdentity) return;
    const user = window.netlifyIdentity.currentUser();
    if (!user) return;
    const token = await user.jwt();
    const basePath = `inspections/${user.id}/${id}`;
    try {
      // Fetch existing record
      const recRes = await fetch(`/.netlify/blobs/${basePath}/record.json`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!recRes.ok) {
        throw new Error('Failed to fetch record for status update');
      }
      const record = await recRes.json();
      record.status = newStatus;
      // Persist updated record
      await fetch(`/.netlify/blobs/${basePath}/record.json`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(record)
      });
      await loadInspections();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  }

  /**
   * Convert an ISO timestamp into a human-friendly relative time
   * string. For example "2h ago", "5d ago" etc. When the
   * timestamp is invalid the function returns an empty string.
   *
   * @param {string} isoTimestamp The ISO formatted date string.
   * @returns {string} A relative time description.
   */
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

  /**
   * Render the list of completed inspections on the Reports page.
   * Inspections are pulled from the global inspectionsData array.
   */
  function renderReports() {
    const container = document.getElementById('reports-container');
    if (!container) return;
    container.innerHTML = '';
    const completed = inspectionsData.filter(ins => ins.status === 'completed');
    if (completed.length === 0) {
      const msg = document.createElement('p');
      msg.style.color = 'var(--text-secondary)';
      msg.textContent = 'No completed inspections available.';
      container.appendChild(msg);
      return;
    }
    completed.forEach(ins => {
      const item = document.createElement('div');
      item.className = 'list-item slide-up';
      const meta = timeAgo(ins.created_at);
      // Generate a summary from the first non-empty comment or value
      let summary = '';
      const answers = ins.answers || {};
      for (const key in answers) {
        const ans = answers[key];
        if (ans && typeof ans === 'object') {
          if (ans.comment && ans.comment.trim()) {
            summary = ans.comment.trim();
            break;
          } else if (ans.value && typeof ans.value === 'string' && ans.value.trim()) {
            summary = ans.value.trim();
            break;
          }
        } else if (typeof ans === 'string' && ans.trim()) {
          summary = ans.trim();
          break;
        }
      }
      if (!summary) {
        summary = 'No description provided.';
      }
      if (summary.length > 80) summary = summary.substring(0, 80) + '...';
      item.innerHTML = `
        <div class="list-item-header">
          <div class="list-item-title">${ins.location} - ${ins.type}</div>
          <div class="list-item-meta">${meta}</div>
        </div>
        <div class="list-item-content">${summary}</div>
      `;
      container.appendChild(item);
    });
  }

  /**
   * Render a simple analytics bar chart summarising the number of
   * "No" answers per category across all completed inspections. Uses
   * Chart.js for visualisation.
   */
  function renderAnalytics() {
    const canvas = document.getElementById('analytics-chart');
    if (!canvas) return;
    // Clear any previous message siblings
    const parent = canvas.parentElement;
    // Remove any text messages previously added
    Array.from(parent.querySelectorAll('.analytics-message')).forEach(el => el.remove());
    if (typeof Chart === 'undefined') {
      const msg = document.createElement('p');
      msg.className = 'analytics-message';
      msg.style.color = 'var(--text-secondary)';
      msg.textContent = 'Chart.js library is not available.';
      parent.appendChild(msg);
      return;
    }
    const completed = inspectionsData.filter(ins => ins.status === 'completed');
    if (completed.length === 0) {
      canvas.style.display = 'none';
      const msg = document.createElement('p');
      msg.className = 'analytics-message';
      msg.style.color = 'var(--text-secondary)';
      msg.textContent = 'No data available for analytics.';
      parent.appendChild(msg);
      return;
    }
    canvas.style.display = '';
    // Compute the number of "no" answers per category
    const counts = {};
    completed.forEach(ins => {
      const answers = ins.answers || {};
      questions.forEach(q => {
        const ans = answers[q.id];
        const category = q.category || 'Other';
        if (!counts[category]) counts[category] = 0;
        if (ans && ans.value === 'no') {
          counts[category] += 1;
        }
      });
    });
    const labels = Object.keys(counts);
    const data = labels.map(cat => counts[cat]);
    // Destroy existing chart instance if present
    if (window.analyticsChart) {
      window.analyticsChart.destroy();
    }
    const ctx = canvas.getContext('2d');
    window.analyticsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Number of "No" answers',
            data: data,
            backgroundColor: 'rgba(99, 102, 241, 0.5)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Categories',
              color: 'var(--text-secondary)',
              font: { size: 12 }
            },
            ticks: {
              color: 'var(--text-secondary)'
            },
            grid: {
              color: 'rgba(255,255,255,0.1)'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Count',
              color: 'var(--text-secondary)',
              font: { size: 12 }
            },
            ticks: {
              stepSize: 1,
              color: 'var(--text-secondary)'
            },
            grid: {
              color: 'rgba(255,255,255,0.1)'
            }
          }
        }
      }
    });
  }


  /* ------------------------------------------------------------------ */
  /*                        Voice Input Support                       */
  /* ------------------------------------------------------------------ */
  let recognition;
  /**
   * Toggle voice recognition for the button that was clicked. When
   * starting recognition the microphone icon changes to a stop icon
   * and the button pulses. Upon receiving a result the text is
   * inserted into the nearest input or textarea. If recognition is
   * already active it is stopped.
   *
   * @param {HTMLButtonElement} btn The voice button clicked.
   */
  function toggleVoice(btn) {
    // Feature detection
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }
    // If already listening then stop
    if (btn.classList.contains('listening')) {
      if (recognition) recognition.stop();
      return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    btn.classList.add('listening');
    // Change icon to stop icon
    const icon = btn.querySelector('i');
    if (icon) {
      icon.classList.remove('fa-microphone');
      icon.classList.add('fa-stop');
    }
    recognition.onresult = event => {
      const transcript = event.results[0][0].transcript;
      // Find the nearest textarea or text input inside the question card
      const card = btn.closest('.question-card');
      if (card) {
        const field = card.querySelector('textarea, input[type="text"], input[type="number"]');
        if (field) {
          // Append or replace value depending on field type
          if (field.tagName.toLowerCase() === 'textarea') {
            const existing = field.value.trim();
            field.value = existing ? existing + '\n' + transcript : transcript;
          } else {
            field.value = transcript;
          }
          updateProgress();
        }
      }
    };
    recognition.onend = () => {
      btn.classList.remove('listening');
      // Restore microphone icon
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-stop');
        icon.classList.add('fa-microphone');
      }
    };
    recognition.onerror = () => {
      btn.classList.remove('listening');
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-stop');
        icon.classList.add('fa-microphone');
      }
    };
    recognition.start();
  }

  // Voice buttons are attached during renderQuestions()

  /* ------------------------------------------------------------------ */
  /*                        Event Listener Wiring                     */
  /* ------------------------------------------------------------------ */
  // When the user changes form values recalculate progress and update
  // the title. Use input and change events to capture text input,
  // selects and numbers. Using bubbling ensures new values trigger
  // correctly.
  const formInputs = [locationSelect, typeSelect, auditorNamesInput, inspectionDateInput];
  formInputs.forEach(inputEl => {
    inputEl.addEventListener('input', () => {
      updateProgress();
      updateFormTitle();
    });
    inputEl.addEventListener('change', () => {
      updateProgress();
      updateFormTitle();
    });
  });
  // Attach change listeners to all radio inputs dynamically when questions are rendered
  // This is handled inside renderQuestions() for the current question set. No need to pre-bind here.

  // New inspection button resets the form, switches to the Inspections section and scrolls to the form
  startInspectionBtn.addEventListener('click', event => {
    event.preventDefault();
    setActiveSection('inspections');
    resetForm();
    scrollToForm();
  });

  // Save draft button persists the current state as a draft
  saveDraftBtn.addEventListener('click', event => {
    event.preventDefault();
    saveInspection('draft');
  });
  // Submit inspection button marks the inspection as completed
  submitInspectionBtn.addEventListener('click', event => {
    event.preventDefault();
    saveInspection('completed');
  });

  // Simple actions for preview and PDF export. These functions
  // provide basic feedback until custom implementations are added.
  previewModeBtn.addEventListener('click', () => {
    alert('Preview mode is not yet implemented.');
  });
  exportPdfBtn.addEventListener('click', () => {
    alert('PDF export is not yet implemented.');
  });

  /* ------------------------------------------------------------------ */
  /*                 Question Import/Export and Other Actions          */
  /* ------------------------------------------------------------------ */
  // Import questions from a JSON file. The JSON must be an array of
  // question objects. Only types boolean, text and number are
  // supported. File questions are ignored.
  importQuestionsBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (!Array.isArray(imported)) {
          alert('Invalid format: expected an array of questions');
          return;
        }
        // Validate each question
        const validTypes = ['boolean', 'text', 'number'];
        const cleaned = [];
        for (const q of imported) {
          if (!q.id || !q.type || !q.question) {
            continue;
          }
          if (!validTypes.includes(q.type)) {
            continue;
          }
          cleaned.push({
            id: String(q.id),
            type: q.type,
            question: String(q.question),
            required: !!q.required
          });
        }
        if (cleaned.length === 0) {
          alert('No valid questions found in the file.');
          return;
        }
        if (!window.confirm('Importing will overwrite your current question set. Proceed?')) {
          return;
        }
        questions = cleaned;
        renderQuestions();
        await saveQuestions();
        alert('Questions imported successfully.');
      } catch (err) {
        console.error(err);
        alert('Failed to import questions. Make sure the file contains valid JSON.');
      }
    };
    input.click();
  });

  // Export the current question set as a JSON file. The file is
  // downloaded to the user’s device. No authentication required.
  exportQuestionsBtn.addEventListener('click', () => {
    try {
      const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions.json';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export questions.');
    }
  });

  // Export all inspections belonging to the current user as a JSON
  // file. This can be used to generate a backup or to inspect
  // results offline. When not logged in the user is prompted to
  // authenticate.
  exportReportsBtn.addEventListener('click', async () => {
    if (!window.netlifyIdentity) {
      alert('This feature is only available when deployed on Netlify.');
      return;
    }
    const user = window.netlifyIdentity.currentUser();
    if (!user) {
      window.netlifyIdentity.open();
      return;
    }
    try {
      const token = await user.jwt();
      const prefix = `inspections/${user.id}/`;
      const listRes = await fetch(`/.netlify/blobs/${prefix}?list=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!listRes.ok) {
        alert('Failed to list inspections for export.');
        return;
      }
      const listData = await listRes.json();
      const blobs = listData.blobs || [];
      const recordPaths = blobs
        .map(b => b.path || b)
        .filter(p => typeof p === 'string' && p.endsWith('record.json'));
      const records = [];
      for (const recordPath of recordPaths) {
        const recRes = await fetch(`/.netlify/blobs/${recordPath}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (recRes.ok) {
          try {
            const rec = await recRes.json();
            records.push(rec);
          } catch (e) {
            // Skip invalid records
          }
        }
      }
      const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inspections.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('An error occurred while exporting inspections.');
    }
  });

  // Sync data by reloading the inspections list from Netlify. If the
  // user is not authenticated they will be prompted to log in.
  syncDataBtn.addEventListener('click', () => {
    if (!window.netlifyIdentity) {
      alert('This feature is only available when deployed on Netlify.');
      return;
    }
    const user = window.netlifyIdentity.currentUser();
    if (!user) {
      window.netlifyIdentity.open();
      return;
    }
    loadInspections().then(() => alert('Data synced successfully.'));
  });

  // Settings button placeholder
  settingsBtn.addEventListener('click', () => {
    alert('Settings are not yet implemented.');
  });

  // Kick off initial progress calculation and title update
  updateProgress();
  updateFormTitle();
});