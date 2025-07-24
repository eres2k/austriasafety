// script.js
const questionnaires = {
    'general-safety': {
        name: 'General Safety Inspection',
        questions: [
            'Are all walkways clear of obstacles?',
            'Is lighting adequate in all areas?',
            'Are emergency exits clearly marked and accessible?',
            'Are employees wearing appropriate PPE?',
            'Is the workspace clean and organized?'
        ]
    },
    'fire-safety': {
        name: 'Fire Safety Check',
        questions: [
            'Are fire extinguishers accessible and inspected?',
            'Are flammable materials stored properly?',
            'Are smoke detectors functional?',
            'Is there a clear evacuation plan posted?',
            'Are electrical cords in good condition?'
        ]
    },
    'equipment-maintenance': {
        name: 'Equipment Maintenance Audit',
        questions: [
            'Are all machines calibrated and maintained?',
            'Is there any visible damage to equipment?',
            'Are safety guards in place?',
            'Have maintenance logs been updated?',
            'Are operators trained on equipment use?'
        ]
    }
};

let currentAudit = null;
let selectedAudit = null;

document.addEventListener('DOMContentLoaded', () => {
    const homeSection = document.getElementById('home-section');
    const auditSection = document.getElementById('audit-section');
    const viewSection = document.getElementById('view-section');
    const questionsContainer = document.getElementById('questions-container');
    const auditsList = document.getElementById('audits-list');
    const detailsContent = document.getElementById('details-content');
    const auditDetails = document.getElementById('audit-details');

    document.getElementById('home-btn').addEventListener('click', () => {
        showSection(homeSection);
    });

    document.getElementById('view-btn').addEventListener('click', () => {
        showSection(viewSection);
        loadAudits();
    });

    document.getElementById('start-audit').addEventListener('click', () => {
        const station = document.getElementById('station').value;
        const auditor = document.getElementById('auditor').value.trim();
        const qType = document.getElementById('questionnaire').value;

        if (!auditor) {
            alert('Please enter auditor name.');
            return;
        }

        const questionnaire = questionnaires[qType];
        currentAudit = {
            id: crypto.randomUUID(),
            station,
            auditor,
            questionnaire: questionnaire.name,
            date: new Date().toISOString(),
            answers: questionnaire.questions.reduce((acc, q) => {
                acc[q] = { answer: '', comment: '' };
                return acc;
            }, {})
        };

        questionsContainer.innerHTML = '';
        questionnaire.questions.forEach((q, index) => {
            const div = document.createElement('div');
            div.classList.add('question');
            div.innerHTML = `
                <p>${index + 1}. ${q}</p>
                <label><input type="radio" name="ans-${index}" value="yes"> Yes</label>
                <label><input type="radio" name="ans-${index}" value="no"> No</label>
                <label><input type="radio" name="ans-${index}" value="na"> N/A</label>
                <textarea placeholder="Comment" rows="2"></textarea>
            `;
            questionsContainer.appendChild(div);
        });

        showSection(auditSection);
    });

    document.getElementById('save-audit').addEventListener('click', async () => {
        const questionDivs = questionsContainer.querySelectorAll('.question');
        questionDivs.forEach((div, index) => {
            const q = questionnaires[document.getElementById('questionnaire').value].questions[index];
            const radios = div.querySelectorAll('input[type="radio"]');
            let answer = '';
            radios.forEach(r => { if (r.checked) answer = r.value; });
            const comment = div.querySelector('textarea').value;
            currentAudit.answers[q] = { answer, comment };
        });

        try {
            await fetch('/.netlify/functions/save-audit', {
                method: 'POST',
                body: JSON.stringify(currentAudit)
            });
            alert('Audit saved successfully!');
            showSection(homeSection);
        } catch (error) {
            console.error('Error saving audit:', error);
            alert('Failed to save audit.');
        }
    });

    document.getElementById('export-pdf').addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 10;
        doc.text(`Audit ID: ${selectedAudit.id}`, 10, y);
        y += 10;
        doc.text(`Station: ${selectedAudit.station}`, 10, y);
        y += 10;
        doc.text(`Auditor: ${selectedAudit.auditor}`, 10, y);
        y += 10;
        doc.text(`Questionnaire: ${selectedAudit.questionnaire}`, 10, y);
        y += 10;
        doc.text(`Date: ${new Date(selectedAudit.date).toLocaleString()}`, 10, y);
        y += 20;
        doc.text('Answers:', 10, y);
        y += 10;
        Object.entries(selectedAudit.answers).forEach(([q, {answer, comment}], index) => {
            doc.text(`${index + 1}. ${q}: ${answer.toUpperCase()}`, 10, y);
            y += 10;
            if (comment) {
                doc.text(`Comment: ${comment}`, 15, y);
                y += 10;
            }
        });
        doc.save(`audit_${selectedAudit.id}.pdf`);
    });

    async function loadAudits() {
        try {
            const response = await fetch('/.netlify/functions/get-audits');
            const audits = await response.json();
            auditsList.innerHTML = '';
            audits.forEach(audit => {
                const li = document.createElement('li');
                li.textContent = `Audit ${audit.id} - ${audit.station} by ${audit.auditor} on ${new Date(audit.date).toLocaleDateString()}`;
                li.addEventListener('click', () => {
                    selectedAudit = audit;
                    detailsContent.innerHTML = `
                        <p>Station: ${audit.station}</p>
                        <p>Auditor: ${audit.auditor}</p>
                        <p>Questionnaire: ${audit.questionnaire}</p>
                        <p>Date: ${new Date(audit.date).toLocaleString()}</p>
                        <h4>Answers:</h4>
                        <ul>
                            ${Object.entries(audit.answers).map(([q, {answer, comment}]) => `
                                <li>${q}: ${answer.toUpperCase()}${comment ? ` - ${comment}` : ''}</li>
                            `).join('')}
                       </ul>
                    `;
                    auditDetails.hidden = false;
                });
                auditsList.appendChild(li);
            });
        } catch (error) {
            console.error('Error loading audits:', error);
            auditsList.innerHTML = '<li>No audits found or error loading.</li>';
        }
    }

    function showSection(section) {
        [homeSection, auditSection, viewSection].forEach(s => s.hidden = true);
        section.hidden = false;
        auditDetails.hidden = true;
    }
});
