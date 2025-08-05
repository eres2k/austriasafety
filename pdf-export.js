// pdf-export.js - PDF generation for inspection reports
// Uses jsPDF for client-side PDF generation

export class PDFExporter {
  constructor() {
    this.doc = null;
    this.yPosition = 20;
    this.pageHeight = 280;
    this.margins = {
      left: 20,
      right: 20,
      top: 20,
      bottom: 20
    };
    this.pageWidth = 210; // A4 width in mm
  }

  // Generate inspection report PDF
  async generateInspectionReport(inspection, template, responses) {
    // Create new document
    if (typeof window.jspdf === 'undefined') {
      throw new Error('jsPDF not loaded. Add script to index.html');
    }
    
    const { jsPDF } = window.jspdf;
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Generate report
    this.addHeader(inspection);
    this.addInspectionDetails(inspection, template);
    this.addExecutiveSummary(inspection, template, responses);
    this.addInspectionResults(template, inspection.responses, inspection.comments);
    this.addSignatureSection(inspection);
    this.addFooter();
    
    // Return blob for saving
    return this.doc.output('blob');
  }

  // Add header with logo and title
  addHeader(inspection) {
    // Company header
    this.doc.setFillColor(15, 15, 35); // Aurora dark color
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');
    
    // Title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Safety Inspection Report', this.pageWidth / 2, 20, { align: 'center' });
    
    // Subtitle
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Aurora Audit Platform', this.pageWidth / 2, 30, { align: 'center' });
    
    // Reset text color
    this.doc.setTextColor(0, 0, 0);
    this.yPosition = 50;
  }

  // Add inspection details section
  addInspectionDetails(inspection, template) {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Inspection Details', this.margins.left, this.yPosition);
    this.yPosition += 10;
    
    // Details box
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setFillColor(248, 249, 250);
    this.doc.roundedRect(
      this.margins.left, 
      this.yPosition - 5, 
      this.pageWidth - this.margins.left - this.margins.right, 
      50, 
      3, 
      3, 
      'FD'
    );
    
    // Details content
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    
    const details = [
      { label: 'Inspection ID:', value: inspection.id },
      { label: 'Type:', value: template?.name || inspection.type },
      { label: 'Location:', value: inspection.location },
      { label: 'Date:', value: new Date(inspection.date).toLocaleDateString() },
      { label: 'Auditor:', value: inspection.auditor },
      { label: 'Status:', value: inspection.status.toUpperCase() }
    ];
    
    let xPos = this.margins.left + 5;
    let yPos = this.yPosition + 3;
    
    details.forEach((detail, index) => {
      if (index % 2 === 0 && index > 0) {
        yPos += 8;
        xPos = this.margins.left + 5;
      }
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(detail.label, xPos, yPos);
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(detail.value, xPos + 35, yPos);
      
      if (index % 2 === 0) {
        xPos += 90;
      }
    });
    
    this.yPosition += 55;
  }

  // Add executive summary
  addExecutiveSummary(inspection, template, responses) {
    // Calculate statistics
    const stats = this.calculateStatistics(inspection.responses);
    const score = template ? 
      this.calculateScore(template, inspection.responses) : 
      { score: 0, passed: false };
    
    // Summary section
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Executive Summary', this.margins.left, this.yPosition);
    this.yPosition += 10;
    
    // Score card
    const scoreColor = score.passed ? [16, 185, 129] : [239, 68, 68];
    this.doc.setFillColor(...scoreColor);
    this.doc.roundedRect(
      this.margins.left,
      this.yPosition - 5,
      60,
      30,
      3,
      3,
      'F'
    );
    
    // Score text
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${score.score}%`, this.margins.left + 30, this.yPosition + 10, { align: 'center' });
    
    this.doc.setFontSize(10);
    this.doc.text(score.passed ? 'PASSED' : 'FAILED', this.margins.left + 30, this.yPosition + 18, { align: 'center' });
    
    // Statistics
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    
    const statsText = [
      `Total Questions: ${stats.total}`,
      `Passed: ${stats.passed} (${stats.passedPercentage}%)`,
      `Failed: ${stats.failed} (${stats.failedPercentage}%)`,
      `Not Applicable: ${stats.na}`
    ];
    
    let statsY = this.yPosition;
    statsText.forEach((text, index) => {
      this.doc.text(text, this.margins.left + 70, statsY + (index * 7));
    });
    
    this.yPosition += 35;
    
    // Key findings
    if (stats.failed > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Key Findings:', this.margins.left, this.yPosition);
      this.yPosition += 7;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      this.doc.setTextColor(220, 38, 38);
      this.doc.text(`⚠ ${stats.failed} item(s) require immediate attention`, this.margins.left + 5, this.yPosition);
      this.doc.setTextColor(0, 0, 0);
      this.yPosition += 10;
    }
  }

  // Add detailed inspection results
  addInspectionResults(template, responses, comments) {
    // New page for results
    this.doc.addPage();
    this.yPosition = this.margins.top;
    
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Detailed Inspection Results', this.margins.left, this.yPosition);
    this.yPosition += 15;
    
    // Group questions by category
    const categories = template?.categories || [{ 
      name: 'Inspection Items', 
      questions: this.getDefaultQuestions() 
    }];
    
    categories.forEach((category, catIndex) => {
      // Check for page break
      if (this.yPosition > this.pageHeight - 40) {
        this.doc.addPage();
        this.yPosition = this.margins.top;
      }
      
      // Category header
      this.doc.setFillColor(99, 102, 241); // Primary color
      this.doc.rect(
        this.margins.left,
        this.yPosition - 5,
        this.pageWidth - this.margins.left - this.margins.right,
        10,
        'F'
      );
      
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(category.name, this.margins.left + 5, this.yPosition);
      this.doc.setTextColor(0, 0, 0);
      this.yPosition += 12;
      
      // Questions in category
      category.questions.forEach((question, qIndex) => {
        const response = responses[question.id];
        const comment = comments[question.id];
        
        // Check for page break
        if (this.yPosition > this.pageHeight - 30) {
          this.doc.addPage();
          this.yPosition = this.margins.top;
        }
        
        // Question number and text
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);
        
        const questionNum = `${catIndex + 1}.${qIndex + 1}`;
        const maxWidth = this.pageWidth - this.margins.left - this.margins.right - 40;
        const lines = this.doc.splitTextToSize(question.text, maxWidth);
        
        this.doc.text(questionNum, this.margins.left, this.yPosition);
        this.doc.text(lines, this.margins.left + 15, this.yPosition);
        
        // Response indicator
        const statusX = this.pageWidth - this.margins.right - 25;
        
        if (response === 'pass') {
          this.doc.setTextColor(16, 185, 129);
          this.doc.text('✓ PASS', statusX, this.yPosition);
        } else if (response === 'fail') {
          this.doc.setTextColor(239, 68, 68);
          this.doc.text('✗ FAIL', statusX, this.yPosition);
        } else if (response === 'na') {
          this.doc.setTextColor(100, 116, 139);
          this.doc.text('— N/A', statusX, this.yPosition);
        } else {
          this.doc.setTextColor(156, 163, 175);
          this.doc.text('○ PENDING', statusX, this.yPosition);
        }
        
        this.doc.setTextColor(0, 0, 0);
        this.yPosition += lines.length * 5;
        
        // Add comment if exists
        if (comment) {
          this.doc.setFont('helvetica', 'italic');
          this.doc.setFontSize(9);
          this.doc.setTextColor(75, 85, 99);
          
          const commentLines = this.doc.splitTextToSize(`Comment: ${comment}`, maxWidth - 15);
          this.doc.text(commentLines, this.margins.left + 30, this.yPosition);
          this.yPosition += commentLines.length * 4;
        }
        
        this.yPosition += 8;
      });
      
      this.yPosition += 5;
    });
  }

  // Add signature section
  addSignatureSection(inspection) {
    // Check if we need a new page
    if (this.yPosition > this.pageHeight - 60) {
      this.doc.addPage();
      this.yPosition = this.margins.top;
    } else {
      this.yPosition = this.pageHeight - 60;
    }
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Signatures', this.margins.left, this.yPosition);
    this.yPosition += 10;
    
    // Signature boxes
    const boxWidth = (this.pageWidth - this.margins.left - this.margins.right - 10) / 2;
    
    // Auditor signature
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(this.margins.left, this.yPosition, boxWidth, 30);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Auditor:', this.margins.left + 5, this.yPosition + 5);
    this.doc.text(inspection.auditor, this.margins.left + 5, this.yPosition + 12);
    this.doc.text(`Date: ${new Date(inspection.completedAt || inspection.date).toLocaleDateString()}`, 
      this.margins.left + 5, this.yPosition + 25);
    
    // Supervisor signature
    this.doc.rect(this.margins.left + boxWidth + 10, this.yPosition, boxWidth, 30);
    this.doc.text('Supervisor:', this.margins.left + boxWidth + 15, this.yPosition + 5);
    this.doc.text('_______________________', this.margins.left + boxWidth + 15, this.yPosition + 15);
    this.doc.text('Date: _________________', this.margins.left + boxWidth + 15, this.yPosition + 25);
  }

  // Add footer to all pages
  addFooter() {
    const pageCount = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.doc.setDrawColor(200, 200, 200);
      this.doc.line(
        this.margins.left, 
        this.pageHeight - 10, 
        this.pageWidth - this.margins.right, 
        this.pageHeight - 10
      );
      
      // Footer text
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 116, 139);
      
      // Left side - document info
      this.doc.text(
        'Generated by Aurora Audit Platform', 
        this.margins.left, 
        this.pageHeight - 5
      );
      
      // Center - generation date
      this.doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        this.pageWidth / 2,
        this.pageHeight - 5,
        { align: 'center' }
      );
      
      // Right side - page number
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth - this.margins.right,
        this.pageHeight - 5,
        { align: 'right' }
      );
    }
  }

  // Calculate statistics
  calculateStatistics(responses) {
    const values = Object.values(responses);
    const total = values.length;
    const passed = values.filter(r => r === 'pass').length;
    const failed = values.filter(r => r === 'fail').length;
    const na = values.filter(r => r === 'na').length;
    
    return {
      total,
      passed,
      failed,
      na,
      passedPercentage: total > 0 ? Math.round((passed / (total - na)) * 100) : 0,
      failedPercentage: total > 0 ? Math.round((failed / (total - na)) * 100) : 0
    };
  }

  // Calculate score based on template
  calculateScore(template, responses) {
    // Use template manager's scoring if available
    if (window.TemplateManager) {
      const tm = new window.TemplateManager();
      return tm.calculateScore(template, responses);
    }
    
    // Simple scoring fallback
    const stats = this.calculateStatistics(responses);
    const score = stats.passedPercentage;
    
    return {
      score,
      passed: score >= (template?.scoring?.passingScore || 80)
    };
  }

  // Get default questions if no template
  getDefaultQuestions() {
    return [
      { id: 'q1', text: 'Safety equipment available and functional?' },
      { id: 'q2', text: 'Emergency exits clear and marked?' },
      { id: 'q3', text: 'Fire extinguishers present and maintained?' },
      { id: 'q4', text: 'PPE requirements posted and followed?' },
      { id: 'q5', text: 'Work areas clean and organized?' }
    ];
  }

  // Save PDF to device
  async savePDF(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Generate filename
  generateFilename(inspection) {
    const date = new Date(inspection.date).toISOString().split('T')[0];
    return `inspection-${inspection.location}-${date}-${inspection.id}.pdf`;
  }
}

// Integration with main app
export async function exportInspectionToPDF(inspection) {
  try {
    const exporter = new PDFExporter();
    
    // Get template if available
    let template = null;
    if (window.blobStorage && inspection.type) {
      try {
        template = await window.blobStorage.getTemplate(inspection.type);
      } catch (err) {
        console.warn('Template not found, using defaults');
      }
    }
    
    // Generate PDF
    const pdfBlob = await exporter.generateInspectionReport(
      inspection,
      template,
      inspection.responses
    );
    
    // Save to device
    const filename = exporter.generateFilename(inspection);
    await exporter.savePDF(pdfBlob, filename);
    
    // Show success message
    if (window.showNotification) {
      window.showNotification(`PDF saved: ${filename}`, 'success');
    }
    
    return pdfBlob;
  } catch (error) {
    console.error('PDF export error:', error);
    if (window.showNotification) {
      window.showNotification('Error generating PDF: ' + error.message, 'error');
    }
    throw error;
  }
}

// Batch export multiple inspections
export async function exportBatchPDF(inspections) {
  const exporter = new PDFExporter();
  const { jsPDF } = window.jspdf;
  
  // Create combined document
  const combinedDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  let firstDoc = true;
  
  for (const inspection of inspections) {
    if (!firstDoc) {
      combinedDoc.addPage();
    }
    firstDoc = false;
    
    // Generate individual report
    const pdfBlob = await exportInspectionToPDF(inspection);
    
    // TODO: Merge PDFs (requires additional library)
  }
  
  // Save combined document
  const blob = combinedDoc.output('blob');
  const filename = `batch-export-${new Date().toISOString().split('T')[0]}.pdf`;
  await exporter.savePDF(blob, filename);
}

// Add to window for global access
window.PDFExporter = PDFExporter;
window.exportInspectionToPDF = exportInspectionToPDF;