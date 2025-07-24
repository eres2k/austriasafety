import React from 'react';

export default function Sidebar({ view, setView }) {
  return (
    <nav className="w-64 bg-gray-900 text-gray-200 p-4">
      <h2 className="text-xl mb-4">WHS Audit</h2>
      <button
        className={`block w-full text-left p-2 rounded ${view==='dashboard'?'bg-gray-700':''}`}
        onClick={() => setView('dashboard')}
      >Dashboard</button>
      <button
        className={`block w-full text-left p-2 rounded mt-2 ${view==='form'?'bg-gray-700':''}`}
        onClick={() => setView('form')}
      >New Audit</button>
    </nav>
