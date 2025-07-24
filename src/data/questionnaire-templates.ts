// src/data/questionnaire-templates.ts
import { Questionnaire } from '@/types'

export const questionnaireTemplates: Questionnaire[] = [
  {
    id: 'general-safety-dvi1',
    name: 'Allgemeine Sicherheitsbegehung DVI1',
    description: 'Standard Sicherheitsinspektion für DVI1 Wien',
    version: '2.0',
    location: 'DVI1',
    category: 'general-safety',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
    tags: ['safety', 'general', 'dvi1'],
    sections: [
      {
        id: 'access-routes',
        title: 'Verkehrswege und Zugänge',
        description: 'Überprüfung aller Verkehrswege, Notausgänge und Zugangsbereiche',
        order: 1,
        questions: [
          {
            id: 'q1-1',
            type: 'radio',
            title: 'Sind alle Verkehrswege frei von Hindernissen?',
            description: 'Prüfen Sie Gänge, Durchgänge und Fluchtwege',
            required: true,
            order: 1,
            options: [
              { id: 'o1', label: 'Ja', value: 'passed', color: '#10B981' },
              { id: 'o2', label: 'Nein', value: 'failed', color: '#EF4444' },
              { id: 'o3', label: 'Teilweise', value: 'partial', color: '#F59E0B' }
            ],
            category: 'access',
            weight: 10
          },
          {
            id: 'q1-2',
            type: 'checkbox',
            title: 'Welche Mängel wurden festgestellt?',
            description: 'Wählen Sie alle zutreffenden Mängel aus',
            required: false,
            order: 2,
            options: [
              { id: 'o1', label: 'Blockierte Fluchtwege', value: 'blocked-exits' },
              { id: 'o2', label: 'Rutschige Oberflächen', value: 'slippery-surfaces' },
              { id: 'o3', label: 'Beschädigte Bodenbeläge', value: 'damaged-floors' },
              { id: 'o4', label: 'Fehlende Markierungen', value: 'missing-markings' }
            ],
            conditionalLogic: [
              {
                questionId: 'q1-1',
                operator: 'not_equals',
                value: 'passed',
                action: 'show'
              }
            ]
          },
          {
            id: 'q1-3',
            type: 'media',
            title: 'Foto der Mängel',
            description: 'Dokumentieren Sie gefundene Mängel mit Fotos',
            required: false,
            order: 3,
            mediaRequired: true,
            conditionalLogic: [
              {
                questionId: 'q1-1',
                operator: 'not_equals',
                value: 'passed',
                action: 'require'
              }
            ]
          }
        ]
      },
      {
        id: 'fire-safety',
        title: 'Brandschutz',
        description: 'Überprüfung aller Brandschutzeinrichtungen',
        order: 2,
        questions: [
          {
            id: 'q2-1',
            type: 'radio',
            title: 'Sind alle Feuerlöscher zugänglich und geprüft?',
            required: true,
            order: 1,
            options: [
              { id: 'o1', label: 'Ja', value: 'passed', color: '#10B981' },
              { id: 'o2', label: 'Nein', value: 'failed', color: '#EF4444' }
            ],
            category: 'fire-safety',
            weight: 15
          },
          {
            id: 'q2-2',
            type: 'date',
            title: 'Letztes Prüfdatum der Feuerlöscher',
            required: true,
            order: 2,
            validation: [
              {
                type: 'max',
                value: 'today',
                message: 'Datum kann nicht in der Zukunft liegen'
              }
            ]
          },
          {
            id: 'q2-3',
            type: 'scale',
            title: 'Bewertung des Brandschutzzustands',
            description: 'Bewerten Sie den Gesamtzustand von 1 (mangelhaft) bis 5 (ausgezeichnet)',
            required: true,
            order: 3,
            options: [
              { id: 's1', label: '1', value: 1 },
              { id: 's2', label: '2', value: 2 },
              { id: 's3', label: '3', value: 3 },
              { id: 's4', label: '4', value: 4 },
              { id: 's5', label: '5', value: 5 }
            ]
          }
        ]
      },
      {
        id: 'ppe',
        title: 'Persönliche Schutzausrüstung (PSA)',
        description: 'Kontrolle der PSA-Nutzung und -Verfügbarkeit',
        order: 3,
        questions: [
          {
            id: 'q3-1',
            type: 'radio',
            title: 'Tragen alle Mitarbeiter die erforderliche PSA?',
            required: true,
            order: 1,
            options: [
              { id: 'o1', label: 'Ja', value: 'passed', color: '#10B981' },
              { id: 'o2', label: 'Nein', value: 'failed', color: '#EF4444' },
              { id: 'o3', label: 'Teilweise', value: 'partial', color: '#F59E0B' }
            ],
            category: 'ppe',
            weight: 20
          },
          {
            id: 'q3-2',
            type: 'text',
            title: 'Anmerkungen zur PSA-Nutzung',
            description: 'Beschreiben Sie beobachtete Probleme oder positive Beispiele',
            required: false,
            order: 2,
            validation: [
              {
                type: 'max',
                value: 500,
                message: 'Maximal 500 Zeichen'
              }
            ]
          }
        ]
      },
      {
        id: 'equipment',
        title: 'Arbeitsmittel und Maschinen',
        description: 'Sicherheitszustand von Geräten und Maschinen',
        order: 4,
        questions: [
          {
            id: 'q4-1',
            type: 'radio',
            title: 'Sind alle Sicherheitseinrichtungen an Maschinen funktionsfähig?',
            required: true,
            order: 1,
            options: [
              { id: 'o1', label: 'Ja', value: 'passed', color: '#10B981' },
              { id: 'o2', label: 'Nein', value: 'failed', color: '#EF4444' },
              { id: 'o3', label: 'N/A', value: 'na', color: '#6B7280' }
            ],
            category: 'equipment',
            weight: 15
          },
          {
            id: 'q4-2',
            type: 'number',
            title: 'Anzahl der überprüften Geräte',
            required: true,
            order: 2,
            validation: [
              {
                type: 'min',
                value: 0,
                message: 'Wert muss positiv sein'
              }
            ]
          }
        ]
      },
      {
        id: 'documentation',
        title: 'Dokumentation',
        description: 'Abschließende Dokumentation und Unterschrift',
        order: 5,
        questions: [
          {
            id: 'q5-1',
            type: 'text',
            title: 'Zusammenfassung der Begehung',
            description: 'Fassen Sie die wichtigsten Erkenntnisse zusammen',
            required: true,
            order: 1,
            validation: [
              {
                type: 'min',
                value: 50,
                message: 'Mindestens 50 Zeichen erforderlich'
              }
            ]
          },
          {
            id: 'q5-2',
            type: 'signature',
            title: 'Unterschrift des Prüfers',
            required: true,
            order: 2
          }
        ]
      }
    ]
  },
  {
    id: 'forklift-safety-dvi2',
    name: 'Staplerprüfung DVI2',
    description: 'Sicherheitsprüfung für Flurförderzeuge in DVI2',
    version: '1.5',
    location: 'DVI2',
    category: 'equipment-safety',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
    tags: ['forklift', 'equipment', 'dvi2'],
    sections: [
      {
        id: 'forklift-condition',
        title: 'Zustand der Flurförderzeuge',
        order: 1,
        questions: [
          {
            id: 'f1-1',
            type: 'radio',
            title: 'Sind alle Stapler betriebsbereit?',
            required: true,
            order: 1,
            options: [
              { id: 'o1', label: 'Ja', value: 'passed', color: '#10B981' },
              { id: 'o2', label: 'Nein', value: 'failed', color: '#EF4444' }
            ],
            category: 'equipment',
            weight: 25
          },
          {
            id: 'f1-2',
            type: 'checkbox',
            title: 'Überprüfte Komponenten',
            required: true,
            order: 2,
            options: [
              { id: 'c1', label: 'Bremsen', value: 'brakes' },
              { id: 'c2', label: 'Hupe', value: 'horn' },
              { id: 'c3', label: 'Beleuchtung', value: 'lights' },
              { id: 'c4', label: 'Hydraulik', value: 'hydraulics' },
              { id: 'c5', label: 'Reifen', value: 'tires' },
              { id: 'c6', label: 'Gabeln', value: 'forks' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'emergency-drill-dap5',
    name: 'Notfallübung DAP5',
    description: 'Checkliste für Evakuierungsübungen',
    version: '1.0',
    location: 'DAP5',
    category: 'emergency',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
    tags: ['emergency', 'evacuation', 'dap5'],
    sections: [
      {
        id: 'evacuation',
        title: 'Evakuierungsablauf',
        order: 1,
        questions: [
          {
            id: 'e1-1',
            type: 'radio',
            title: 'Wurde die Evakuierung innerhalb der Zielzeit abgeschlossen?',
            description: 'Zielzeit: 3 Minuten',
            required: true,
            order: 1,
            options: [
              { id: 'o1', label: 'Ja', value: 'passed', color: '#10B981' },
              { id: 'o2', label: 'Nein', value: 'failed', color: '#EF4444' }
            ],
            category: 'emergency',
            weight: 30
          },
          {
            id: 'e1-2',
            type: 'number',
            title: 'Tatsächliche Evakuierungszeit (Minuten)',
            required: true,
            order: 2,
            validation: [
              {
                type: 'min',
                value: 0,
                message: 'Zeit muss positiv sein'
              },
              {
                type: 'max',
                value: 60,
                message: 'Wert scheint unrealistisch hoch'
              }
            ]
          }
        ]
      }
    ]
  }
]

// Helper function to get templates by location
export function getTemplatesByLocation(location: string): Questionnaire[] {
  return questionnaireTemplates.filter(t => t.location === location && t.active)
}

// Helper function to get template by ID
export function getTemplateById(id: string): Questionnaire | undefined {
  return questionnaireTemplates.find(t => t.id === id)
}

// Helper function to get all categories
export function getAllCategories(): string[] {
  const categories = new Set<string>()
  questionnaireTemplates.forEach(t => categories.add(t.category))
  return Array.from(categories)
}
