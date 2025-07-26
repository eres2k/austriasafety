/*
 * Template builder script for admin users.
 * Allows creating, editing, reordering, importing and exporting
 * questionnaires for each location and inspection type. Interacts
 * with Netlify Function saveTemplate to persist changes server-side.
 */

(() => {
  // Authentication: ensure only admin users access this page
  const userRaw = localStorage.getItem('currentUser');
  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch (err) {
    user = null;
  }
  if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
    return;
  }

  // DOM elements
  const locationSelect = document.getElementById('builder-location');
  const inspectionSelect = document.getElementById('builder-inspection');
  const questionsList = document.getElementById('builder-questions');
  const addQuestionBtn = document.getElementById('add-question');
  const importBtn = document.getElementById('import-template');
  const importFileInput = document.getElementById('import-file');
  const exportBtn = document.getElementById('export-template');
  const saveBtn = document.getElementById('save-template');
  const newInspectionBtn = document.getElementById('new-inspection-type');
  const backBtn = document.getElementById('back-btn');

  // Modal elements
  const modal = document.getElementById('question-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalQuestionText = document.getElementById('modal-question-text');
  const modalQuestionType = document.getElementById('modal-question-type');
  const modalQuestionRequired = document.getElementById('modal-question-required');
  const modalSave = document.getElementById('modal-save');
  const modalCancel = document.getElementById('modal-cancel');

  // State
  const templatePaths = {
    DVI1: 'templates/DVI1.json',
    DVI2: 'templates/DVI2.json',
    DVI3: 'templates/DVI3.json',
    DAP5: 'templates/DAP5.json',
    DAP8: 'templates/DAP8.json',
  };
  let templates = {}; // loaded templates per location
  let currentLocation = null;
  let currentInspectionType = null;
  let currentQuestionIndex = null; // for editing

  // Utility: generate unique id
  function generateId() {
    return 'q-' + Math.random().toString(36).substr(2, 9);
  }

  // Load all templates
  async function loadAllTemplates() {
    for (const loc of Object.keys(templatePaths)) {
      const path = templatePaths[loc];
      try {
        const res = await fetch(path);
        const data = await res.json();
        templates[loc] = data;
      } catch (err) {
        console.error('Failed to load template for', loc, err);
        templates[loc] = { inspectionTypes: {} };
      }
    }
  }

  // Populate location select
  function populateLocations() {
    locationSelect.innerHTML = '';
    Object.keys(templatePaths).forEach((loc) => {
      const opt = document.createElement('option');
      opt.value = loc;
      opt.textContent = loc;
      locationSelect.appendChild(opt);
    });
    currentLocation = locationSelect.value;
  }

  // Populate inspection types select
  function populateInspections() {
    inspectionSelect.innerHTML = '';
    const types = templates[currentLocation]?.inspectionTypes || {};
    Object.keys(types).forEach((type) => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type;
      inspectionSelect.appendChild(opt);
    });
    currentInspectionType = inspectionSelect.value || null;
    renderQuestions();
  }

  // Render question list for current inspection
  function renderQuestions() {
    questionsList.innerHTML = '';
    if (!currentInspectionType) return;
    const questions = templates[currentLocation].inspectionTypes[currentInspectionType] || [];
    questions.forEach((q, index) => {
      const li = document.createElement('li');
      li.dataset.index = index;
      const span = document.createElement('span');
      span.textContent = `${q.text} (${q.type}${q.required ? ', required' : ''})`;
      li.appendChild(span);
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'question-actions';
      const editBtn = document.createElement('button');
      editBtn.className = 'secondary-btn';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => {
        openQuestionModal(q, index);
      });
      actionsDiv.appendChild(editBtn);
      const delBtn = document.createElement('button');
      delBtn.className = 'secondary-btn';
      delBtn.style.color = '#ef5350';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => {
        if (confirm('Delete this question?')) {
          templates[currentLocation].inspectionTypes[currentInspectionType].splice(index, 1);
          renderQuestions();
        }
      });
      actionsDiv.appendChild(delBtn);
      li.appendChild(actionsDiv);
      questionsList.appendChild(li);
    });
    // Make list sortable
    if (typeof Sortable !== 'undefined') {
      Sortable.create(questionsList, {
        animation: 150,
        handle: 'li',
        onEnd: (evt) => {
          const questionsArr = templates[currentLocation].inspectionTypes[currentInspectionType];
          const movedItem = questionsArr.splice(evt.oldIndex, 1)[0];
          questionsArr.splice(evt.newIndex, 0, movedItem);
          renderQuestions();
        },
      });
    }
  }

  // Open question modal to add or edit
  function openQuestionModal(question = null, index = null) {
    currentQuestionIndex = index;
    if (question) {
      modalTitle.textContent = 'Edit Question';
      modalQuestionText.value = question.text;
      modalQuestionType.value = question.type;
      modalQuestionRequired.checked = question.required || false;
    } else {
      modalTitle.textContent = 'Add Question';
      modalQuestionText.value = '';
      modalQuestionType.value = 'boolean';
      modalQuestionRequired.checked = false;
    }
    modal.classList.remove('hidden');
  }

  // Close modal
  function closeModal() {
    modal.classList.add('hidden');
  }

  // Save question from modal
  modalSave.addEventListener('click', () => {
    const text = modalQuestionText.value.trim();
    const type = modalQuestionType.value;
    const required = modalQuestionRequired.checked;
    if (!text) {
      alert('Please enter question text');
      return;
    }
    const newQuestion = { id: generateId(), text, type, required };
    if (currentQuestionIndex !== null && currentQuestionIndex >= 0) {
      templates[currentLocation].inspectionTypes[currentInspectionType][currentQuestionIndex] = {
        ...templates[currentLocation].inspectionTypes[currentInspectionType][currentQuestionIndex],
        text,
        type,
        required,
      };
    } else {
      templates[currentLocation].inspectionTypes[currentInspectionType].push(newQuestion);
    }
    closeModal();
    renderQuestions();
  });

  modalCancel.addEventListener('click', () => {
    closeModal();
  });

  // Add question button
  addQuestionBtn.addEventListener('click', () => {
    if (!currentInspectionType) {
      alert('Please select an inspection type');
      return;
    }
    currentQuestionIndex = null;
    openQuestionModal();
  });

  // Create new inspection type
  newInspectionBtn.addEventListener('click', () => {
    const name = prompt('Enter new inspection type name');
    if (name) {
      if (!templates[currentLocation].inspectionTypes[name]) {
        templates[currentLocation].inspectionTypes[name] = [];
        populateInspections();
        inspectionSelect.value = name;
        currentInspectionType = name;
        renderQuestions();
      } else {
        alert('Inspection type already exists');
      }
    }
  });

  // Change location
  locationSelect.addEventListener('change', () => {
    currentLocation = locationSelect.value;
    populateInspections();
  });

  // Change inspection type
  inspectionSelect.addEventListener('change', () => {
    currentInspectionType = inspectionSelect.value;
    renderQuestions();
  });

  // Export template
  exportBtn.addEventListener('click', () => {
    if (!currentInspectionType) {
      alert('Select an inspection type to export');
      return;
    }
    const data = {
      inspectionTypes: {
        [currentInspectionType]: templates[currentLocation].inspectionTypes[currentInspectionType],
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentLocation}-${currentInspectionType}-template.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import template
  importBtn.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        // Merge imported types into current location
        if (imported.inspectionTypes) {
          Object.keys(imported.inspectionTypes).forEach((type) => {
            templates[currentLocation].inspectionTypes[type] = imported.inspectionTypes[type];
          });
          populateInspections();
          alert('Template imported');
        } else {
          alert('Invalid template format');
        }
      } catch (err) {
        alert('Failed to import template');
      }
    };
    reader.readAsText(file);
  });

  // Save template to serverless
  saveBtn.addEventListener('click', async () => {
    if (!currentInspectionType) {
      alert('Please select an inspection type');
      return;
    }
    const payload = {
      location: currentLocation,
      inspectionType: currentInspectionType,
      questions: templates[currentLocation].inspectionTypes[currentInspectionType],
    };
    try {
      const res = await fetch('/.netlify/functions/saveTemplate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) {
        alert('Template saved');
      } else {
        alert(json.error || 'Failed to save template');
      }
    } catch (err) {
      alert('Failed to save template');
    }
  });

  // Back to main app
  backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Initialize
  (async () => {
    await loadAllTemplates();
    populateLocations();
    populateInspections();
  })();
})();