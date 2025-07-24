import React, { useEffect, useState } from 'react';

export default function AuditDashboard({ onSelectAudit }) {
  const [audits, setAudits] = useState([]);
  useEffect(() => {
    async function loadAudits() {
      try {
        const res = await fetch('/api/fetch-audits');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAudits(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch audits', error);
        setAudits([]);
      }
    }
    loadAudits();
  }, []);

  return (
    <div>
      <h1 className="text-2xl mb-4">Audit Dashboard</h1>
      {audits.length ? (
        <ul>
          {audits.map(a => (
            <li key={a.id} className="mb-2">
              <button
                className="w-full text-left p-2 bg-gray-700 rounded"
                onClick={() => onSelectAudit(a)}
              >
                {a.date} - {a.station} - {a.auditor}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No audits found or failed to load.</p>
      )}
    </div>
  );
}
