import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import AuditDashboard from './components/AuditDashboard';
import AuditForm from './components/AuditForm';

function App() {
  const [view, setView] = useState('dashboard');
  const [selectedAudit, setSelectedAudit] = useState(null);

  return (
    <div className="flex h-screen">
      <Sidebar view={view} setView={setView} />
      <main className="flex-1 overflow-auto p-6 bg-gray-800">
        {view === 'dashboard' && (
          <AuditDashboard onSelectAudit={audit => { setSelectedAudit(audit); setView('form'); }} />
        )}
        {view === 'form' && (
          <AuditForm audit={selectedAudit} onDone={() => setView('dashboard')} />
        )}
      </main>
    </div>
  );
}

export default App;
