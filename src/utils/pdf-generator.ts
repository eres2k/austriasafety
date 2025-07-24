// src/utils/pdf-generator.ts
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import type { Inspection, Questionnaire, Question, QuestionResponse } from '@/types'

// Initialize pdfMake with fonts
pdfMake.vfs = pdfFonts.vfs

interface PDFGeneratorOptions {
  inspection: Inspection
  template: Questionnaire
  includeMedia?: boolean
  includeSignatures?: boolean
}

export class PDFGenerator {
  private options: PDFGeneratorOptions

  constructor(options: PDFGeneratorOptions) {
    this.options = options
  }

  async generate(): Promise<Blob> {
    const docDefinition = await this.createDocumentDefinition()
    
    return new Promise((resolve) => {
      pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
        resolve(blob)
      })
    })
  }

  private async createDocumentDefinition(): Promise<any> {
    const { inspection, template } = this.options
    
    return {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      
      header: this.createHeader(),
      footer: this.createFooter(),
      
      content: [
        this.createTitleSection(),
        { text: '', margin: [0, 20] }, // Spacer
        this.createMetadataSection(),
        { text: '', margin: [0, 20] }, // Spacer
        this.createSummarySection(),
        { pageBreak: 'after' },
        ...this.createSectionsContent(),
        this.createSignatureSection()
      ],
      
      styles: this.getStyles(),
      defaultStyle: {
        fontSize: 10,
        lineHeight: 1.5
      }
    }
  }

  private createHeader(): any {
    return (currentPage: number, pageCount: number) => {
      if (currentPage === 1) return null
      
      return {
        columns: [
          {
            text: 'Amazon WHS SIFA Inspektionsbericht',
            style: 'headerText',
            alignment: 'left',
            margin: [40, 20, 0, 0]
          },
          {
            text: `${this.options.inspection.location} - ${format(new Date(this.options.inspection.createdAt), 'dd.MM.yyyy')}`,
            style: 'headerText',
            alignment: 'right',
            margin: [0, 20, 40, 0]
          }
        ]
      }
    }
  }

  private createFooter(): any {
    return (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: `Erstellt am ${format(new Date(), 'dd.MM.yyyy HH:mm')} Uhr`,
          style: 'footerText',
          alignment: 'left',
          margin: [40, 0]
        },
        {
          text: `Seite ${currentPage} von ${pageCount}`,
          style: 'footerText',
          alignment: 'right',
          margin: [0, 0, 40, 0]
        }
      ]
    })
  }

  private createTitleSection(): any {
    const { inspection } = this.options
    
    return [
      {
        svg: this.getAmazonLogo(),
        width: 150,
        alignment: 'center',
        margin: [0, 0, 0, 30]
      },
      {
        text: 'WHS SIFA Inspektionsbericht',
        style: 'title',
        alignment: 'center'
      },
      {
        text: inspection.name,
        style: 'subtitle',
        alignment: 'center',
        margin: [0, 10, 0, 0]
      }
    ]
  }

  private createMetadataSection(): any {
    const { inspection, template } = this.options
    
    return {
      table: {
        widths: ['30%', '70%'],
        body: [
          [
            { text: 'Standort:', style: 'labelBold' },
            { text: `${inspection.location} - ${this.getLocationName(inspection.location)}` }
          ],
          [
            { text: 'Inspektionstyp:', style: 'labelBold' },
            { text: template.name }
          ],
          [
            { text: 'Datum:', style: 'labelBold' },
            { text: format(new Date(inspection.createdAt), 'dd. MMMM yyyy', { locale: de }) }
          ],
          [
            { text: 'Uhrzeit:', style: 'labelBold' },
            { text: `${format(new Date(inspection.createdAt), 'HH:mm')} - ${inspection.completedAt ? format(new Date(inspection.completedAt), 'HH:mm') : 'In Bearbeitung'} Uhr` }
          ],
          [
            { text: 'Prüfer:', style: 'labelBold' },
            { text: inspection.createdBy || 'N/A' }
          ],
          [
            { text: 'Status:', style: 'labelBold' },
            { text: this.getStatusText(inspection.status), style: this.getStatusStyle(inspection.status) }
          ]
        ]
      },
      layout: 'noBorders'
    }
  }

  private createSummarySection(): any {
    const stats = this.calculateStatistics()
    
    return [
      {
        text: 'Zusammenfassung',
        style: 'sectionTitle',
        margin: [0, 0, 0, 10]
      },
      {
        columns: [
          this.createStatCard('Bestanden', stats.passed, '#10B981'),
          this.createStatCard('Mängel', stats.failed, '#EF4444'),
          this.createStatCard('Ausstehend', stats.pending, '#6B7280'),
          this.createStatCard('Gesamt', stats.total, '#FF9500')
        ],
        columnGap: 10
      },
      {
        text: `Gesamtbewertung: ${stats.score}%`,
        style: 'scoreText',
        alignment: 'center',
        margin: [0, 20, 0, 0]
      }
    ]
  }

  private createStatCard(label: string, value: number, color: string): any {
    return {
      table: {
        widths: ['*'],
        body: [
          [
            {
              text: value.toString(),
              style: 'statNumber',
              alignment: 'center',
              color: color
            }
          ],
          [
            {
              text: label,
              style: 'statLabel',
              alignment: 'center'
            }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingTop: () => 10,
        paddingBottom: () => 10
      }
    }
  }

  private createSectionsContent(): any[] {
    const { template, inspection } = this.options
    const content: any[] = []
    
    template.sections.forEach((section, sectionIndex) => {
      content.push({
        text: `${sectionIndex + 1}. ${section.title}`,
        style: 'sectionTitle',
        pageBreak: sectionIndex > 0 ? 'before' : undefined,
        margin: [0, 0, 0, 10]
      })
      
      if (section.description) {
        content.push({
          text: section.description,
          style: 'sectionDescription',
          margin: [0, 0, 0, 15]
        })
      }
      
      section.questions.forEach((question, questionIndex) => {
        const response = inspection.responses[question.id]
        
        content.push(this.createQuestionContent(question, response, `${sectionIndex + 1}.${questionIndex + 1}`))
      })
    })
    
    return content
  }

  private createQuestionContent(question: Question, response: QuestionResponse | undefined, numbering: string): any {
    const content: any[] = []
    
    // Question header
    content.push({
      columns: [
        {
          text: `${numbering} ${question.title}`,
          style: 'questionTitle',
          width: '*'
        },
        {
          text: this.getResponseStatus(response),
          style: this.getResponseStatusStyle(response),
          width: 'auto',
          alignment: 'right'
        }
      ],
      margin: [0, 10, 0, 5]
    })
    
    // Question description
    if (question.description) {
      content.push({
        text: question.description,
        style: 'questionDescription',
        margin: [20, 0, 0, 5]
      })
    }
    
    // Response value
    if (response?.value !== undefined) {
      content.push({
        text: `Antwort: ${this.formatResponseValue(question, response)}`,
        margin: [20, 5, 0, 0]
      })
    }
    
    // Notes
    if (response?.note) {
      content.push({
        text: 'Anmerkung:',
        style: 'labelBold',
        margin: [20, 10, 0, 2]
      })
      content.push({
        text: response.note,
        style: 'noteText',
        margin: [20, 0, 0, 0]
      })
    }
    
    // Media references
    if (response?.media?.length && this.options.includeMedia) {
      content.push({
        text: `📷 ${response.media.length} Medienanhänge`,
        style: 'mediaReference',
        margin: [20, 5, 0, 0]
      })
    }
    
    return content
  }

  private createSignatureSection(): any {
    if (!this.options.includeSignatures) return []
    
    return [
      {
        text: 'Unterschriften',
        style: 'sectionTitle',
        pageBreak: 'before',
        margin: [0, 0, 0, 30]
      },
      {
        columns: [
          {
            stack: [
              { text: 'Prüfer:', style: 'labelBold' },
              { text: '_________________________', margin: [0, 40, 0, 5] },
              { text: 'Name, Datum', style: 'signatureLabel' }
            ]
          },
          {
            stack: [
              { text: 'Verantwortlicher:', style: 'labelBold' },
              { text: '_________________________', margin: [0, 40, 0, 5] },
              { text: 'Name, Datum', style: 'signatureLabel' }
            ]
          }
        ],
        columnGap: 50
      }
    ]
  }

  private calculateStatistics(): any {
    const { inspection, template } = this.options
    let passed = 0
    let failed = 0
    let pending = 0
    let total = 0
    
    template.sections.forEach(section => {
      section.questions.forEach(question => {
        const response = inspection.responses[question.id]
        if (response?.status) {
          total++
          switch (response.status) {
            case 'passed':
              passed++
              break
            case 'failed':
              failed++
              break
            case 'pending':
              pending++
              break
          }
        }
      })
    })
    
    const score = total > 0 ? Math.round((passed / total) * 100) : 0
    
    return { passed, failed, pending, total, score }
  }

  private formatResponseValue(question: Question, response: QuestionResponse): string {
    switch (question.type) {
      case 'radio':
        const option = question.options?.find(o => o.value === response.value)
        return option?.label || response.value
      
      case 'checkbox':
        if (Array.isArray(response.value)) {
          return response.value.map(v => {
            const opt = question.options?.find(o => o.value === v)
            return opt?.label || v
          }).join(', ')
        }
        return response.value
      
      case 'date':
        return format(new Date(response.value), 'dd.MM.yyyy')
      
      case 'scale':
        return `${response.value} / ${question.options?.length || 5}`
      
      default:
        return response.value?.toString() || 'N/A'
    }
  }

  private getLocationName(code: string): string {
    const locations: Record<string, string> = {
      'DVI1': 'Wien 1',
      'DVI2': 'Wien 2', 
      'DVI3': 'Wien 3',
      'DAP5': 'Graz',
      'DAP8': 'Linz'
    }
    return locations[code] || code
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'Entwurf',
      'in-progress': 'In Bearbeitung',
      'pending-review': 'Überprüfung ausstehend',
      'completed': 'Abgeschlossen',
      'archived': 'Archiviert'
    }
    return statusMap[status] || status
  }

  private getStatusStyle(status: string): string {
    switch (status) {
      case 'completed':
        return 'statusCompleted'
      case 'in-progress':
        return 'statusInProgress'
      default:
        return 'statusDefault'
    }
  }

  private getResponseStatus(response: QuestionResponse | undefined): string {
    if (!response) return 'Ausstehend'
    
    switch (response.status) {
      case 'passed':
        return '✓ Bestanden'
      case 'failed':
        return '✗ Mangel'
      case 'na':
        return 'N/A'
      default:
        return 'Ausstehend'
    }
  }

  private getResponseStatusStyle(response: QuestionResponse | undefined): string {
    if (!response) return 'statusPending'
    
    switch (response.status) {
      case 'passed':
        return 'statusPassed'
      case 'failed':
        return 'statusFailed'
      default:
        return 'statusPending'
    }
  }

  private getStyles(): any {
    return {
      title: {
        fontSize: 24,
        bold: true,
        color: '#121212'
      },
      subtitle: {
        fontSize: 18,
        color: '#2D2D2D'
      },
      sectionTitle: {
        fontSize: 16,
        bold: true,
        color: '#121212'
      },
      sectionDescription: {
        fontSize: 11,
        color: '#6B7280',
        italics: true
      },
      questionTitle: {
        fontSize: 12,
        bold: true,
        color: '#1E1E1E'
      },
      questionDescription: {
        fontSize: 10,
        color: '#6B7280'
      },
      labelBold: {
        bold: true,
        color: '#2D2D2D'
      },
      noteText: {
        fontSize: 10,
        italics: true,
        color: '#4B5563'
      },
      mediaReference: {
        fontSize: 10,
        color: '#3B82F6'
      },
      headerText: {
        fontSize: 9,
        color: '#6B7280'
      },
      footerText: {
        fontSize: 8,
        color: '#9CA3AF'
      },
      statNumber: {
        fontSize: 28,
        bold: true
      },
      statLabel: {
        fontSize: 10,
        color: '#6B7280'
      },
      scoreText: {
        fontSize: 18,
        bold: true,
        color: '#FF9500'
      },
      signatureLabel: {
        fontSize: 9,
        color: '#6B7280'
      },
      statusCompleted: {
        color: '#10B981',
        bold: true
      },
      statusInProgress: {
        color: '#3B82F6',
        bold: true
      },
      statusDefault: {
        color: '#6B7280'
      },
      statusPassed: {
        color: '#10B981',
        fontSize: 10
      },
      statusFailed: {
        color: '#EF4444',
        fontSize: 10
      },
      statusPending: {
        color: '#6B7280',
        fontSize: 10
      }
    }
  }

  private getAmazonLogo(): string {
    // Simplified Amazon logo SVG
    return `<svg viewBox="0 0 603 182" xmlns="http://www.w3.org/2000/svg">
      <path d="M374.00642,142.18404 C337.65644,167.24252 285.51602,180.45566 240.9846,180.45566 C175.34394,180.45566 116.27105,157.38347 71.67155,119.33379 C67.87206,116.09166 71.23808,112.13983 75.75874,114.70446 C123.12445,141.87637 181.05071,157.53494 241.17322,157.53494 C280.44234,157.53494 334.17901,149.25346 383.58835,132.12122 C390.47419,129.44333 396.26083,137.94553 390.61495,142.14312" fill="#FF9900"/>
      <path d="M388.55678,125.53635 C383.6263,119.17948 356.81881,122.5252 344.5236,124.15524 C340.84484,124.65202 340.24467,121.59021 343.46682,119.26645 C364.09586,104.68524 398.72969,109.07588 402.98072,114.39671 C407.23176,119.75683 401.85175,155.79083 382.65961,172.92694 C379.67131,175.70188 376.82394,174.26497 378.27576,171.08679 C382.71193,161.3362 393.52584,131.9497 388.55678,125.53635" fill="#FF9900"/>
    </svg>`
  }
}

// Export helper function for easy use
export async function generateInspectionPDF(
  inspection: Inspection,
  template: Questionnaire,
  options?: Partial<PDFGeneratorOptions>
): Promise<Blob> {
  const generator = new PDFGenerator({
    inspection,
    template,
    includeMedia: true,
    includeSignatures: true,
    ...options
  })
  
  return generator.generate()
}
