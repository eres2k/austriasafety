import React, { useEffect, useState } from 'react';

export default function AuditDashboard({ onSelectAudit }) {
  const [audits, setAudits] = useState([]);
  useEffect(() => {
    fetch('/api/fetch-audits')
      .then(res => res.json())
      .then(setAudits);
  }, []);
  return (
    <div>
      <h1 className="text-2xl mb-4">Audit Dashboard</h1>
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
    </div>
  );
}
