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
  const observationsTextarea = document.getElementById('observations');
  const extinguisherCountInput = document.getElementById('extinguisher-count');
  const fileArea = document.getElementById('file-upload-area');
  const progressStatusEl = document.getElementById('progress-status');
  const progressFillEl = document.getElementById('progress-fill');
  const inspectionTitleEl = document.getElementById('inspection-title');

  // Track current inspection identifier. When editing an existing
  // inspection the id is set; for new inspections it is null until
  // saved.
  let currentInspectionId = null;

  // Keep selected/dragged files in memory until saved. Each entry is a
  // File object. When saving the inspection these files will be
  // uploaded individually.
  let uploadedFiles = [];

  // Initialize the user menu immediately based on the current
  // authentication state. If Netlify Identity is unavailable or
  // there is no logged in user this will show the login prompt.
  updateUserMenu(window.netlifyIdentity && window.netlifyIdentity.currentUser() || null);

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

  // Register Netlify Identity event listeners. On init, login and logout
  // update the user menu. After login the inspection data is loaded.
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on('init', user => {
      updateUserMenu(user);
      if (user) {
        loadInspections();
      }
    });
    window.netlifyIdentity.on('login', user => {
      updateUserMenu(user);
      if (window.netlifyIdentity) {
        window.netlifyIdentity.close();
      }
      loadInspections();
    });
    window.netlifyIdentity.on('logout', () => {
      updateUserMenu(null);
      currentInspectionId = null;
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
    // Reset radio buttons to unchecked states
    const radioNames = ['fire-alarms', 'evacuation-routes'];
    radioNames.forEach(name => {
      const radios = document.querySelectorAll(`input[name="${name}"]`);
      radios.forEach(radio => {
        radio.checked = false;
      });
    });
    observationsTextarea.value = '';
    extinguisherCountInput.value = '';
    uploadedFiles = [];
    updateFileListDisplay();
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
    // Fire alarms and evacuation routes
    const fire = document.querySelector(
      `input[name="fire-alarms"][value="${data.answers?.fireAlarms || ''}"]`
    );
    if (fire) fire.checked = true;
    const evac = document.querySelector(
      `input[name="evacuation-routes"][value="${data.answers?.evacuationRoutes || ''}"]`
    );
    if (evac) evac.checked = true;
    observationsTextarea.value = data.answers?.observations || '';
    extinguisherCountInput.value = data.answers?.extinguisherCount || '';
    // Currently file uploads are not pulled from server; the UI lists
    // file names from the data but does not download the files. The
    // user would need to re-upload attachments when editing.
    uploadedFiles = [];
    if (Array.isArray(data.answers?.files)) {
      // Build dummy File-like objects with only name property for
      // display. When editing the user must reattach actual files
      // before saving.
      uploadedFiles = data.answers.files.map(name => ({ name }));
    }
    updateFileListDisplay();
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
    // Determine selected values for radio inputs
    const fireAlarms = (document.querySelector('input[name="fire-alarms"]:checked') || {}).value || '';
    const evacuation = (document.querySelector('input[name="evacuation-routes"]:checked') || {}).value || '';
    return {
      id,
      location: locationSelect.value,
      type: typeSelect.value,
      auditors: auditorNamesInput.value,
      date: inspectionDateInput.value,
      status,
      created_at: new Date().toISOString(),
      answers: {
        fireAlarms,
        observations: observationsTextarea.value,
        evacuationRoutes: evacuation,
        extinguisherCount: extinguisherCountInput.value,
        files: uploadedFiles.map(f => f.name)
      }
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
    // Each of these checks contributes one step to progress when
    // satisfied.
    const checks = [];
    // Location and type selections
    checks.push(!!locationSelect.value);
    checks.push(!!typeSelect.value);
    // Auditor names and date
    checks.push(auditorNamesInput.value.trim().length > 0);
    checks.push(!!inspectionDateInput.value);
    // Radio questions
    checks.push(!!document.querySelector('input[name="fire-alarms"]:checked'));
    checks.push(!!document.querySelector('input[name="evacuation-routes"]:checked'));
    // Observations (text area)
    checks.push(observationsTextarea.value.trim().length > 0);
    // Numeric entry for extinguishers
    checks.push(!!extinguisherCountInput.value);
    // File upload presence
    checks.push(uploadedFiles.length > 0);
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
      // Upload files individually. Use await in sequence to avoid
      // overwhelming the remote API. Each file is stored under a
      // unique path. When editing an existing record the user must
      // reattach files; previously uploaded attachments are not
      // preserved automatically.
      for (const file of uploadedFiles) {
        // Files with only a name (dummy objects created when
        // editing existing records) do not have a Blob body to
        // upload and therefore are skipped. These will simply
        // remain referenced in the JSON until the user re-uploads
        // them.
        if (!file || !file instanceof File) continue;
        const filePath = `${basePath}/files/${encodeURIComponent(file.name)}`;
        await fetch(`/.netlify/blobs/${filePath}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': file.type || 'application/octet-stream'
          },
          body: file
        });
      }
      // Store the JSON record. Use record.json as filename to
      // differentiate from attachments. Overwrite existing record
      // when currentInspectionId is defined.
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
        ${inspection.answers && inspection.answers.observations ? inspection.answers.observations.substring(0, 80) + (inspection.answers.observations.length > 80 ? '...' : '') : 'No description provided.'}
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

  /* ------------------------------------------------------------------ */
  /*                        File Upload Interactions                   */
  /* ------------------------------------------------------------------ */
  // Create a hidden file input which is triggered when the file
  // upload area is clicked. Accept multiple image files.
  const hiddenFileInput = document.createElement('input');
  hiddenFileInput.type = 'file';
  hiddenFileInput.accept = 'image/*';
  hiddenFileInput.multiple = true;
  hiddenFileInput.style.display = 'none';
  fileArea.appendChild(hiddenFileInput);

  // Handle click on the upload area by forwarding it to the
  // hidden input.
  fileArea.addEventListener('click', () => {
    hiddenFileInput.click();
  });

  // Apply visual feedback on dragenter/dragover and reset on dragleave/drop
  fileArea.addEventListener('dragover', event => {
    event.preventDefault();
    fileArea.classList.add('dragover');
  });
  fileArea.addEventListener('dragleave', () => {
    fileArea.classList.remove('dragover');
  });
  fileArea.addEventListener('drop', event => {
    event.preventDefault();
    fileArea.classList.remove('dragover');
    const files = Array.from(event.dataTransfer.files);
    handleFiles(files);
  });

  // Listen for changes on the hidden file input
  hiddenFileInput.addEventListener('change', () => {
    const files = Array.from(hiddenFileInput.files);
    handleFiles(files);
    hiddenFileInput.value = '';
  });

  /**
   * Add new files to the in-memory file list and update the
   * display. Ignores files that exceed the maximum allowed size
   * (10MB) and notifies the user. Duplicate file names are also
   * prevented.
   *
   * @param {File[]} files A list of File objects selected/dropped.
   */
  function handleFiles(files) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    files.forEach(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} exceeds the 10MB limit and was skipped.`);
        return;
      }
      // Prevent duplicates based on file name
      if (uploadedFiles.find(f => f.name === file.name)) {
        alert(`File ${file.name} has already been added.`);
        return;
      }
      uploadedFiles.push(file);
    });
    updateFileListDisplay();
    updateProgress();
  }

  /**
   * Render the list of selected file names under the upload area. If
   * no files are attached the display is cleared. This function
   * creates a container lazily the first time it is needed.
   */
  function updateFileListDisplay() {
    let listContainer = fileArea.querySelector('.uploaded-file-list');
    if (!listContainer) {
      listContainer = document.createElement('div');
      listContainer.className = 'uploaded-file-list';
      listContainer.style.marginTop = '0.5rem';
      listContainer.style.fontSize = '0.75rem';
      listContainer.style.color = 'var(--text-secondary)';
      fileArea.appendChild(listContainer);
    }
    if (uploadedFiles.length === 0) {
      listContainer.innerHTML = '';
    } else {
      listContainer.innerHTML = uploadedFiles.map(f => `<div>${f.name}</div>`).join('');
    }
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

  // Attach voice recognition toggling to all existing voice buttons
  document.querySelectorAll('.voice-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleVoice(btn));
  });

  /* ------------------------------------------------------------------ */
  /*                        Event Listener Wiring                     */
  /* ------------------------------------------------------------------ */
  // When the user changes form values recalculate progress and update
  // the title. Use input and change events to capture text input,
  // selects and numbers. Using bubbling ensures new values trigger
  // correctly.
  const formInputs = [locationSelect, typeSelect, auditorNamesInput, inspectionDateInput, observationsTextarea, extinguisherCountInput];
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
  // Radio buttons need separate listeners
  document.querySelectorAll('input[name="fire-alarms"], input[name="evacuation-routes"]').forEach(radio => {
    radio.addEventListener('change', updateProgress);
  });

  // New inspection button resets the form and scrolls into view
  startInspectionBtn.addEventListener('click', event => {
    event.preventDefault();
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

  // Kick off initial progress calculation and title update
  updateProgress();
  updateFormTitle();
});