import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveDraft, loadDraft, clearDraft } from '../services/offline';

export default function AuditForm({ audit, onDone }) {
  const draftKey = audit?.id || 'new-audit';
  const [form, setForm] = useState(audit || { id: uuidv4(), station: '', auditor: '', checklist: [], date: '' });

  useEffect(() => {
    (async () => {
      const saved = await loadDraft(draftKey);
      if (saved) setForm(saved);
    })();
  }, []);

  function startVoice(field) {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return alert('Voice API not supported');
    const recog = new Speech();
    recog.onresult = e => {
      const text = e.results[0][0].transcript;
      setForm(f => ({ ...f, [field]: (f[field] || '') + ' ' + text }));
    };
    recog.start();
  }

  async function handleSave() {
    await fetch('/api/submit-audit', {
      method: 'POST',
      body: JSON.stringify({ ...form, date: new Date().toISOString() })
    });
    await clearDraft(draftKey);
    onDone();
  }

  async function handleDraft() {
    await saveDraft(draftKey, form);
    alert('Draft saved');
  }

  return (
    <div>
      <h1 className="text-2xl mb-4">Audit Form</h1>
      <label className="block mb-2">
        Auditor:
        <div className="flex">
          <input
            className="flex-1 p-2 bg-gray-700 rounded"
            value={form.auditor}
            onChange={e => setForm(f => ({ ...f, auditor: e.target.value }))}
          />
          <button onClick={() => startVoice('auditor')} className="ml-2">🎤</button>
        </div>
      </label>
      <label className="block mb-2">
        Station:
        <select
          className="flex-1 p-2 bg-gray-700 rounded"
          value={form.station}
          onChange={e => setForm(f => ({ ...f, station: e.target.value }))}
        >
          <option value="">Select Station</option>
          <option value="DVI1">DVI1</option>
          <option value="DVI2">DVI2</option>
          <option value="DVI3">DVI3</option>
          <option value="DAP5">DAP5</option>
          <option value="DAP8">DAP8</option>
        </select>
      </label>
      {/* Checklist items rendering */}
      <div className="mt-4">
        <button onClick={handleDraft} className="px-4 py-2 bg-blue-600 rounded mr-2">Save Draft</button>
        <button onClick={handleSave} className="px-4 py-2 bg-green-600 rounded">Submit</button>
      </div>
    </div>
); }