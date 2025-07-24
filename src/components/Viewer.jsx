import React from 'react';

export default function Viewer({ audit }) {
  return (
    <div className="p-4 bg-gray-800 rounded">
      <h2 className="text-xl mb-2">View Audit</h2>
      <p><strong>Auditor:</strong> {audit.auditor}</p>
      <p><strong>Station:</strong> {audit.station}</p>
      <p><strong>Date:</strong> {new Date(audit.date).toLocaleString()}</p>
      <ol className="mt-4 list-decimal pl-5">
        {audit.checklist.map((item, i) => (
          <li key={i} className="mb-2">
            <p><strong>{item.question}</strong></p>
            <p>Response: {item.response}</p>
            {item.comment && <p>Comment: {item.comment}</p>}
          </li>
        ))}
      </ol>
    </div>
);}
