document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('checklist-container');
  container.innerHTML = '<p>Dynamic checklist will appear here</p>';

  document.getElementById('save-draft').onclick = () => {
    localStorage.setItem('audit-draft', JSON.stringify({ example: true }));
    alert('Draft saved locally');
  };

  document.getElementById('export-pdf').onclick = async () => {
    const res = await fetch('/api/generate-pdf', { method: 'POST', body: JSON.stringify({ data: 'sample' }) });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit.pdf';
    a.click();
  };
});