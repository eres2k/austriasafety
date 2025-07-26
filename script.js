/*
 * Main client-side logic for the audit platform.
 * This file manages loading templates, generating forms dynamically,
 * capturing user input (including voice input), saving drafts to local
 * storage, syncing with Netlify Functions, and exporting finished
 * inspections to PDF. It operates entirely in the browser and is
 * designed to function offline with local persistence, syncing when
 * connectivity is available.
 */

(() => {
  // Paths to template files. If you add new locations, update here.
  const TEMPLATE_PATHS = {
    DVI1: 'templates/DVI1.json',
    DVI2: 'templates/DVI2.json',
    DVI3: 'templates/DVI3.json',
    DAP5: 'templates/DAP5.json',
    DAP8: 'templates/DAP8.json'
  };

  // DOM elements
  const locationSelect = document.getElementById('location-select');
  const inspectionSelect = document.getElementById('inspection-select');
  const newInspectionBtn = document.getElementById('new-inspection-btn');
  const inspectionForm = document.getElementById('inspection-form');
  const formTitle = document.getElementById('form-title');
  const questionsContainer = document.getElementById('questions-container');
  const saveDraftBtn = document.getElementById('save-draft');
  const submitInspectionBtn = document.getElementById('submit-inspection');
  const exportPdfBtn = document.getElementById('export-pdf');
  const viewerToggleBtn = document.getElementById('viewer-toggle');
  const draftsList = document.getElementById('drafts-list');
  const completedList = document.getElementById('completed-list');
  const auditorNamesInput = document.getElementById('auditor-names');
  const inspectionDateInput = document.getElementById('inspection-date');
  const statusMessage = document.getElementById('status-message');
  const noInspection = document.getElementById('no-inspection');

  // State variables
  let templates = {};
  let currentLocation = null;
  let currentInspectionType = null;
  let viewerMode = false;
  let currentAuditId = null; // used when editing drafts

  /* ------------------------------------------------------------------ */
  /* Template Loading and Initialization                                */
  /* ------------------------------------------------------------------ */
  // Fetch templates for a specific location from the templates folder
  async function loadTemplatesForLocation(location) {
    const path = TEMPLATE_PATHS[location];
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to load template for ${location}`);
      const data = await response.json();
      return data.inspectionTypes;
    } catch (error) {
      console.error(error);
      return {};
    }
  }

  // Populate the inspection type select element based on loaded templates
  function populateInspectionSelect(inspectionTypes) {
    inspectionSelect.innerHTML = '';
    Object.keys(inspectionTypes).forEach((type) => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type;
      inspectionSelect.appendChild(opt);
    });
  }

  // Initialize the page by loading templates for the default location
  async function init() {
    await loadTemplates();
    // Initialize local storage structures if not present
    if (!localStorage.getItem('auditsPending')) {
      localStorage.setItem('auditsPending', JSON.stringify([]));
    }
    if (!localStorage.getItem('auditsCompleted')) {
      localStorage.setItem('auditsCompleted', JSON.stringify([]));
    }
    populateDraftsList();
    populateCompletedList();
    // Attempt to sync pending audits when online
    window.addEventListener('online', syncPendingAudits);
  }

  // Load templates for the currently selected location and update UI
  async function loadTemplates() {
    currentLocation = locationSelect.value;
    templates = await loadTemplatesForLocation(currentLocation);
    populateInspectionSelect(templates);
  }

  /* ------------------------------------------------------------------ */
  /* Form Generation                                                    */
  /* ------------------------------------------------------------------ */
  // Generate HTML for a single question based on its definition
  function createQuestionElement(question) {
    const wrapper = document.createElement('div');
    wrapper.className = 'question';
    wrapper.dataset.qid = question.id;

    // Label
    const label = document.createElement('label');
    label.textContent = question.text + (question.required ? ' *' : '');
    wrapper.appendChild(label);

    // Voice button (not for file inputs)
    if (question.type !== 'file') {
      const voiceBtn = document.createElement('button');
      voiceBtn.type = 'button';
      voiceBtn.className = 'voice-btn';
      voiceBtn.innerHTML = '<i class="fa fa-microphone"></i>';
      voiceBtn.title = 'Record voice input';
      wrapper.appendChild(voiceBtn);
      // Setup event for voice input
      voiceBtn.addEventListener('click', () => {
        startVoiceRecognition(wrapper);
      });
    }

    // Input element(s) based on type
    let inputElement;
    switch (question.type) {
      case 'boolean':
        inputElement = document.createElement('div');
        inputElement.className = 'boolean-options';
        ['Yes', 'No'].forEach((opt) => {
          const id = `${question.id}-${opt.toLowerCase()}`;
          const labelEl = document.createElement('label');
          labelEl.style.marginRight = '1rem';
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = question.id;
          radio.value = opt;
          radio.required = question.required || false;
          radio.id = id;
          labelEl.appendChild(radio);
          const span = document.createElement('span');
          span.textContent = opt;
          labelEl.appendChild(span);
          inputElement.appendChild(labelEl);
        });
        break;
      case 'text':
        inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.placeholder = 'Enter answer';
        inputElement.required = question.required || false;
        break;
      case 'number':
        inputElement = document.createElement('input');
        inputElement.type = 'number';
        inputElement.placeholder = 'Enter number';
        inputElement.required = question.required || false;
        break;
      case 'textarea':
        inputElement = document.createElement('textarea');
        inputElement.rows = 3;
        inputElement.placeholder = 'Enter details';
        inputElement.required = question.required || false;
        break;
      case 'file':
        inputElement = document.createElement('input');
        inputElement.type = 'file';
        inputElement.accept = 'image/*';
        inputElement.required = question.required || false;
        break;
      default:
        console.warn('Unknown question type:', question.type);
        inputElement = document.createElement('input');
        inputElement.type = 'text';
    }
    inputElement.dataset.qid = question.id;
    wrapper.appendChild(inputElement);
    return wrapper;
  }

  // Render form based on selected inspection type
  function renderForm() {
    const inspectionType = inspectionSelect.value;
    currentInspectionType = inspectionType;
    const questions = templates[inspectionType] || [];
    questionsContainer.innerHTML = '';
    questions.forEach((q) => {
      const el = createQuestionElement(q);
      questionsContainer.appendChild(el);
    });
    // Enable drag & drop reordering of questions using Sortable.js
    if (typeof Sortable !== 'undefined') {
      Sortable.create(questionsContainer, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        handle: '.question',
      });
    }
    formTitle.textContent = `${currentInspectionType} – ${currentLocation}`;
    inspectionForm.classList.remove('hidden');
    noInspection.style.display = 'none';
    viewerMode = false;
    applyViewerMode();
    currentAuditId = null;
    // Pre-fill date to today
    const today = new Date().toISOString().substr(0, 10);
    inspectionDateInput.value = today;
  }

  /* ------------------------------------------------------------------ */
  /* Voice Recognition                                                   */
  /* ------------------------------------------------------------------ */
  function startVoiceRecognition(wrapper) {
    const voiceBtn = wrapper.querySelector('.voice-btn');
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE'; // Use German for Austria; adjust as needed
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    voiceBtn.classList.add('listening');
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      // Find the input element within wrapper and set value
      const input = wrapper.querySelector('input[type="text"], textarea');
      if (input) {
        input.value = transcript;
      }
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };
    recognition.onend = () => {
      voiceBtn.classList.remove('listening');
    };
    recognition.start();
  }

  /* ------------------------------------------------------------------ */
  /* Data Collection & Persistence                                      */
  /* ------------------------------------------------------------------ */
  // Collect form data into an audit object
  function collectAuditData() {
    const id = currentAuditId || `audit-${Date.now()}`;
    const audit = {
      id,
      location: currentLocation,
      inspectionType: currentInspectionType,
      auditorNames: auditorNamesInput.value.trim(),
      inspectionDate: inspectionDateInput.value,
      responses: {},
      attachments: {},
      createdAt: new Date().toISOString()
    };
    const questionElems = questionsContainer.querySelectorAll('.question');
    questionElems.forEach((qe) => {
      const qid = qe.dataset.qid;
      const input = qe.querySelector('input, textarea, select, div.boolean-options');
      if (!input) return;
      if (input.classList.contains('boolean-options')) {
        const checked = input.querySelector('input[type="radio"]:checked');
        audit.responses[qid] = checked ? checked.value : '';
      } else if (input.type === 'file') {
        const file = input.files[0];
        if (file) {
          audit.attachments[qid] = file;
        }
      } else {
        audit.responses[qid] = input.value;
      }
    });
    return audit;
  }

  // Save draft to localStorage
  function saveDraft() {
    const audit = collectAuditData();
    let drafts = JSON.parse(localStorage.getItem('auditsPending'));
    // If editing an existing draft, replace it
    const existingIndex = drafts.findIndex((d) => d.id === audit.id);
    if (existingIndex > -1) {
      drafts[existingIndex] = audit;
    } else {
      drafts.push(audit);
    }
    localStorage.setItem('auditsPending', JSON.stringify(drafts));
    populateDraftsList();
    statusMessage.textContent = 'Draft saved locally.';
    currentAuditId = audit.id;
  }

  // Delete draft from localStorage
  function deleteDraft(auditId) {
    let drafts = JSON.parse(localStorage.getItem('auditsPending'));
    drafts = drafts.filter((d) => d.id !== auditId);
    localStorage.setItem('auditsPending', JSON.stringify(drafts));
    populateDraftsList();
  }

  // Load a draft into the form for editing or viewing
  async function loadDraft(audit, readOnly = false) {
    // Ensure templates are loaded for the draft's location
    if (currentLocation !== audit.location) {
      locationSelect.value = audit.location;
      await loadTemplates();
    }
    currentLocation = audit.location;
    currentInspectionType = audit.inspectionType;
    populateInspectionSelect(templates);
    inspectionSelect.value = audit.inspectionType;
    renderForm();
    // Fill auditor and date
    auditorNamesInput.value = audit.auditorNames || '';
    inspectionDateInput.value = audit.inspectionDate || '';
    // Fill responses
    Object.keys(audit.responses).forEach((qid) => {
      const qElem = questionsContainer.querySelector(`.question[data-qid="${qid}"]`);
      if (qElem) {
        const input = qElem.querySelector('input, textarea, select, div.boolean-options');
        if (!input) return;
        if (input.classList.contains('boolean-options')) {
          const val = audit.responses[qid];
          const radio = input.querySelector(`input[value="${val}"]`);
          if (radio) {
            radio.checked = true;
          }
        } else {
          input.value = audit.responses[qid];
        }
      }
    });
    currentAuditId = audit.id;
    if (readOnly) {
      viewerMode = true;
      applyViewerMode();
    }
  }

  // Toggle viewer mode (read-only view)
  function applyViewerMode() {
    const inputs = inspectionForm.querySelectorAll('input, textarea, select, button.voice-btn');
    inputs.forEach((el) => {
      if (viewerMode) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
          el.setAttribute('disabled', '');
        }
        el.classList.add('viewer-disabled');
      } else {
        el.removeAttribute('disabled');
        el.classList.remove('viewer-disabled');
      }
    });
    viewerToggleBtn.textContent = viewerMode ? 'Exit Viewer Mode' : 'Viewer Mode';
  }

  // Submit inspection: sync with serverless function and mark as completed
  async function submitInspection() {
    const audit = collectAuditData();
    // Basic validation
    if (!audit.auditorNames || !audit.inspectionDate) {
      alert('Please provide auditor names and inspection date.');
      return;
    }
    // Add to pending list immediately
    let drafts = JSON.parse(localStorage.getItem('auditsPending'));
    const existingIndex = drafts.findIndex((d) => d.id === audit.id);
    if (existingIndex > -1) {
      drafts[existingIndex] = audit;
    } else {
      drafts.push(audit);
    }
    localStorage.setItem('auditsPending', JSON.stringify(drafts));
    populateDraftsList();
    currentAuditId = audit.id;
    // Attempt to sync immediately
    statusMessage.textContent = 'Submitting...';
    const success = await syncSingleAudit(audit);
    if (success) {
      statusMessage.textContent = 'Inspection submitted and synced.';
      // Remove from pending
      deleteDraft(audit.id);
      // Add to completed list
      let completed = JSON.parse(localStorage.getItem('auditsCompleted'));
      completed.push({ id: audit.id, location: audit.location, inspectionType: audit.inspectionType, date: audit.inspectionDate });
      localStorage.setItem('auditsCompleted', JSON.stringify(completed));
      populateCompletedList();
      // Reset form
      inspectionForm.reset();
      inspectionForm.classList.add('hidden');
      noInspection.style.display = 'flex';
    } else {
      statusMessage.textContent = 'Failed to sync. Saved locally for later.';
    }
  }

  // Export inspection to PDF using jsPDF
  async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const audit = collectAuditData();
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(16);
    doc.text(`Inspection Report – ${audit.inspectionType}`, 10, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Delivery Station: ${audit.location}`, 10, y);
    y += 6;
    doc.text(`Auditor(s): ${audit.auditorNames}`, 10, y);
    y += 6;
    doc.text(`Date: ${audit.inspectionDate}`, 10, y);
    y += 10;
    doc.setFontSize(14);
    doc.text('Responses', 10, y);
    y += 8;
    doc.setFontSize(11);
    Object.keys(audit.responses).forEach((qid) => {
      const answer = audit.responses[qid];
      // Find the question text from template
      let questionText = qid;
      const qDefs = templates[currentInspectionType] || [];
      const qDef = qDefs.find((q) => q.id === qid);
      if (qDef) questionText = qDef.text;
      const text = `${questionText}: ${answer || '–'}`;
      // Wrap text if necessary
      const lines = doc.splitTextToSize(text, 180);
      lines.forEach((line) => {
        if (y > 280) {
          doc.addPage();
          y = 10;
        }
        doc.text(line, 10, y);
        y += 6;
      });
    });
    // Save file
    doc.save(`inspection-${audit.location}-${audit.inspectionType}-${audit.id}.pdf`);
  }

  /* ------------------------------------------------------------------ */
  /* Local Storage Lists                                                */
  /* ------------------------------------------------------------------ */
  // Populate drafts list UI
  function populateDraftsList() {
    draftsList.innerHTML = '';
    const drafts = JSON.parse(localStorage.getItem('auditsPending'));
    drafts.forEach((draft) => {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = `${draft.location} – ${draft.inspectionType} (${draft.inspectionDate || 'no date'})`;
      li.appendChild(span);
      // Edit button
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => loadDraft(draft, false));
      li.appendChild(editBtn);
      // View button
      const viewBtn = document.createElement('button');
      viewBtn.textContent = 'View';
      viewBtn.style.marginLeft = '0.5rem';
      viewBtn.addEventListener('click', () => loadDraft(draft, true));
      li.appendChild(viewBtn);
      // Delete button
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.style.marginLeft = '0.5rem';
      delBtn.style.color = '#ef5350';
      delBtn.addEventListener('click', () => {
        if (confirm('Delete this draft?')) {
          deleteDraft(draft.id);
        }
      });
      li.appendChild(delBtn);
      draftsList.appendChild(li);
    });
  }

  // Populate completed inspections list
  function populateCompletedList() {
    completedList.innerHTML = '';
    const completed = JSON.parse(localStorage.getItem('auditsCompleted'));
    completed.forEach((audit) => {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = `${audit.location} – ${audit.inspectionType} (${audit.date})`;
      li.appendChild(span);
      // We may add a view/download button if needed
      completedList.appendChild(li);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Sync with Serverless Backend                                       */
  /* ------------------------------------------------------------------ */
  // Sync a single audit via Netlify Function
  async function syncSingleAudit(audit) {
    // Convert attachments to base64 strings
    const data = { ...audit, attachments: {} };
    const attachmentsPromises = Object.keys(audit.attachments).map(async (qid) => {
      const file = audit.attachments[qid];
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          data.attachments[qid] = {
            name: file.name,
            type: file.type,
            content: reader.result.split(',')[1] // base64 content without prefix
          };
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });
    await Promise.all(attachmentsPromises);
    try {
      const response = await fetch('/.netlify/functions/saveAudit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        return true;
      }
    } catch (err) {
      console.error('Sync failed:', err);
    }
    return false;
  }

  // Sync all pending audits
  async function syncPendingAudits() {
    const drafts = JSON.parse(localStorage.getItem('auditsPending'));
    if (!drafts.length) return;
    for (const draft of drafts) {
      const success = await syncSingleAudit(draft);
      if (success) {
        deleteDraft(draft.id);
        let completed = JSON.parse(localStorage.getItem('auditsCompleted'));
        completed.push({ id: draft.id, location: draft.location, inspectionType: draft.inspectionType, date: draft.inspectionDate });
        localStorage.setItem('auditsCompleted', JSON.stringify(completed));
        populateCompletedList();
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Event Listeners                                                    */
  /* ------------------------------------------------------------------ */
  // Change location
  locationSelect.addEventListener('change', async () => {
    await loadTemplates();
    // Reset inspection type list
    currentInspectionType = null;
    questionsContainer.innerHTML = '';
    inspectionForm.classList.add('hidden');
    noInspection.style.display = 'flex';
  });

  // Start new inspection
  newInspectionBtn.addEventListener('click', () => {
    renderForm();
  });

  // Change inspection type selection
  inspectionSelect.addEventListener('change', () => {
    if (inspectionSelect.value) {
      renderForm();
    }
  });

  // Save draft
  saveDraftBtn.addEventListener('click', () => {
    saveDraft();
  });

  // Submit and sync
  submitInspectionBtn.addEventListener('click', () => {
    submitInspection();
  });

  // Export PDF
  exportPdfBtn.addEventListener('click', () => {
    exportPDF();
  });

  // Toggle viewer mode
  viewerToggleBtn.addEventListener('click', () => {
    viewerMode = !viewerMode;
    applyViewerMode();
  });

  // Initialize on load
  document.addEventListener('DOMContentLoaded', init);
})();