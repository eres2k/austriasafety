import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function AuditForm({ audit, onDone }) {
  const [form, setForm] = useState(audit || { id: uuidv4(), checklist: [] });
  // TODO: implement drag-drop, voice input, offline save
  const handleSubmit = async () => {
    await fetch('/api/submit-audit', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    onDone();
  };
  return (
    <div>
      <h1 className="text-2xl mb-4">Audit Form</h1>
      {/* Form fields go here */}
      <button onClick={handleSubmit} className="mt-4 px-4 py-2 bg-yellow-500 rounded">Save</button>
    </div>
  );
}
