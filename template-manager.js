// template-manager.js - Template creation and editing functionality
// Add this module to manage inspection templates

export class TemplateManager {
  constructor(blobStorage) {
    this.blobStorage = blobStorage;
    this.templates = new Map();
    this.currentTemplate = null;
  }

  // Initialize with default templates
  async initializeDefaults() {
    const defaultTemplates = this.getDefaultTemplates();
    
    for (const template of defaultTemplates) {
      try {
        // Check if template exists
        const existing = await this.blobStorage.getTemplate(template.id).catch(() => null);
        
        if (!existing) {
          await this.blobStorage.saveTemplate(template);
          console.log(`✅ Created default template: ${template.name}`);
        }
      } catch (error) {
        console.error(`Error creating template ${template.id}:`, error);
      }
    }
  }

  // Get default inspection templates
  getDefaultTemplates() {
    return [
      {
        id: 'general-safety',
        name: 'General Safety Inspection',
        description: 'Comprehensive safety inspection covering all areas',
        version: '1.0',
        categories: [
          {
            id: 'emergency',
            name: 'Emergency Preparedness',
            questions: [
              {
                id: 'q1',
                text: 'Are all emergency exits clearly marked and unobstructed?',
                type: 'pass-fail',
                required: true,
                helpText: 'Check all exits for visibility and accessibility',
                category: 'emergency'
              },
              {
                id: 'q2',
                text: 'Are emergency evacuation routes posted and visible?',
                type: 'pass-fail',
                required: true,
                category: 'emergency'
              },
              {
                id: 'q3',
                text: 'Is emergency lighting functional?',
                type: 'pass-fail',
                required: true,
                category: 'emergency'
              }
            ]
          },
          {
            id: 'fire-safety',
            name: 'Fire Safety',
            questions: [
              {
                id: 'q4',
                text: 'Are fire extinguishers present and properly maintained?',
                type: 'pass-fail',
                required: true,
                helpText: 'Check pressure gauges and inspection tags',
                category: 'fire-safety'
              },
              {
                id: 'q5',
                text: 'Are fire alarm pull stations accessible and unobstructed?',
                type: 'pass-fail',
                required: true,
                category: 'fire-safety'
              },
              {
                id: 'q6',
                text: 'Are sprinkler heads free from obstruction?',
                type: 'pass-fail',
                required: false,
                category: 'fire-safety'
              }
            ]
          },
          {
            id: 'ppe',
            name: 'Personal Protective Equipment',
            questions: [
              {
                id: 'q7',
                text: 'Is required PPE available and in good condition?',
                type: 'pass-fail',
                required: true,
                category: 'ppe'
              },
              {
                id: 'q8',
                text: 'Are PPE requirements clearly posted?',
                type: 'pass-fail',
                required: true,
                category: 'ppe'
              },
              {
                id: 'q9',
                text: 'Are employees properly using required PPE?',
                type: 'pass-fail',
                required: true,
                category: 'ppe'
              }
            ]
          }
        ],
        scoring: {
          passingScore: 80,
          criticalQuestions: ['q1', 'q2', 'q4'], // Must pass these
          weightings: {
            emergency: 1.5,
            'fire-safety': 1.5,
            ppe: 1.0
          }
        }
      },
      {
        id: 'fire-safety',
        name: 'Fire Safety Audit',
        description: 'Detailed fire safety inspection',
        version: '1.0',
        categories: [
          {
            id: 'equipment',
            name: 'Fire Equipment',
            questions: [
              {
                id: 'fs1',
                text: 'Are fire extinguishers properly mounted and accessible?',
                type: 'pass-fail',
                required: true,
                category: 'equipment'
              },
              {
                id: 'fs2',
                text: 'Have fire extinguishers been inspected within the last month?',
                type: 'pass-fail',
                required: true,
                helpText: 'Check inspection tags for dates',
                category: 'equipment'
              },
              {
                id: 'fs3',
                text: 'Are fire hoses and connections in good condition?',
                type: 'pass-fail',
                required: false,
                category: 'equipment'
              }
            ]
          },
          {
            id: 'systems',
            name: 'Fire Systems',
            questions: [
              {
                id: 'fs4',
                text: 'Is the fire alarm system operational?',
                type: 'pass-fail',
                required: true,
                critical: true,
                category: 'systems'
              },
              {
                id: 'fs5',
                text: 'Are smoke detectors functioning properly?',
                type: 'pass-fail',
                required: true,
                category: 'systems'
              },
              {
                id: 'fs6',
                text: 'Is the sprinkler system pressure within normal range?',
                type: 'pass-fail',
                required: true,
                helpText: 'Check pressure gauges at riser',
                category: 'systems'
              }
            ]
          }
        ],
        scoring: {
          passingScore: 90,
          criticalQuestions: ['fs1', 'fs4', 'fs5'],
          weightings: {
            equipment: 1.0,
            systems: 2.0
          }
        }
      },
      {
        id: 'equipment-check',
        name: 'Equipment Safety Check',
        description: 'Equipment and machinery safety inspection',
        version: '1.0',
        categories: [
          {
            id: 'general-equipment',
            name: 'General Equipment',
            questions: [
              {
                id: 'eq1',
                text: 'Are all safety guards in place and functional?',
                type: 'pass-fail',
                required: true,
                critical: true,
                category: 'general-equipment'
              },
              {
                id: 'eq2',
                text: 'Are emergency stop buttons accessible and functional?',
                type: 'pass-fail',
                required: true,
                critical: true,
                category: 'general-equipment'
              },
              {
                id: 'eq3',
                text: 'Is equipment properly locked out when under maintenance?',
                type: 'pass-fail',
                required: true,
                category: 'general-equipment'
              }
            ]
          },
          {
            id: 'conveyor-systems',
            name: 'Conveyor Systems',
            questions: [
              {
                id: 'eq4',
                text: 'Are conveyor emergency stops functioning?',
                type: 'pass-fail',
                required: true,
                critical: true,
                category: 'conveyor-systems'
              },
              {
                id: 'eq5',
                text: 'Are pinch points properly guarded?',
                type: 'pass-fail',
                required: true,
                category: 'conveyor-systems'
              },
              {
                id: 'eq6',
                text: 'Is conveyor belt tracking properly?',
                type: 'pass-fail',
                required: false,
                category: 'conveyor-systems'
              }
            ]
          }
        ],
        scoring: {
          passingScore: 85,
          criticalQuestions: ['eq1', 'eq2', 'eq4'],
          weightings: {
            'general-equipment': 1.0,
            'conveyor-systems': 1.0
          }
        }
      },
      {
        id: 'environmental-compliance',
        name: 'Environmental Compliance',
        description: 'Environmental and waste management inspection',
        version: '1.0',
        categories: [
          {
            id: 'waste-management',
            name: 'Waste Management',
            questions: [
              {
                id: 'env1',
                text: 'Is waste properly segregated according to type?',
                type: 'pass-fail',
                required: true,
                category: 'waste-management'
              },
              {
                id: 'env2',
                text: 'Are hazardous materials properly labeled and stored?',
                type: 'pass-fail',
                required: true,
                critical: true,
                category: 'waste-management'
              },
              {
                id: 'env3',
                text: 'Are spill kits available and properly stocked?',
                type: 'pass-fail',
                required: true,
                category: 'waste-management'
              }
            ]
          },
          {
            id: 'air-water',
            name: 'Air & Water Quality',
            questions: [
              {
                id: 'env4',
                text: 'Are air emissions within permitted levels?',
                type: 'pass-fail',
                required: false,
                category: 'air-water'
              },
              {
                id: 'env5',
                text: 'Is wastewater properly treated before discharge?',
                type: 'pass-fail',
                required: false,
                category: 'air-water'
              }
            ]
          }
        ],
        scoring: {
          passingScore: 80,
          criticalQuestions: ['env2'],
          weightings: {
            'waste-management': 1.5,
            'air-water': 1.0
          }
        }
      }
    ];
  }

  // Create custom template
  createTemplate(name, description = '') {
    const template = {
      id: this.generateTemplateId(name),
      name: name,
      description: description,
      version: '1.0',
      createdAt: new Date().toISOString(),
      createdBy: window.state?.user?.email || 'system',
      categories: [],
      scoring: {
        passingScore: 80,
        criticalQuestions: [],
        weightings: {}
      }
    };
    
    this.currentTemplate = template;
    return template;
  }

  // Add category to template
  addCategory(templateId, categoryName) {
    const template = this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');
    
    const category = {
      id: this.generateCategoryId(categoryName),
      name: categoryName,
      questions: []
    };
    
    template.categories.push(category);
    template.scoring.weightings[category.id] = 1.0;
    
    return category;
  }

  // Add question to category
  addQuestion(templateId, categoryId, question) {
    const template = this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');
    
    const category = template.categories.find(c => c.id === categoryId);
    if (!category) throw new Error('Category not found');
    
    const newQuestion = {
      id: this.generateQuestionId(),
      text: question.text,
      type: question.type || 'pass-fail',
      required: question.required !== false,
      critical: question.critical || false,
      helpText: question.helpText || '',
      category: categoryId,
      options: question.options || null
    };
    
    category.questions.push(newQuestion);
    
    if (newQuestion.critical) {
      template.scoring.criticalQuestions.push(newQuestion.id);
    }
    
    return newQuestion;
  }

  // Update template
  async updateTemplate(templateId, updates) {
    const template = await this.blobStorage.getTemplate(templateId);
    if (!template) throw new Error('Template not found');
    
    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: window.state?.user?.email || 'system',
      version: this.incrementVersion(template.version)
    };
    
    await this.blobStorage.saveTemplate(updatedTemplate);
    return updatedTemplate;
  }

  // Delete template
  async deleteTemplate(templateId) {
    // Don't delete default templates
    const defaultIds = this.getDefaultTemplates().map(t => t.id);
    if (defaultIds.includes(templateId)) {
      throw new Error('Cannot delete default templates');
    }
    
    await this.blobStorage.deleteTemplate(templateId);
  }

  // Get template
  getTemplate(templateId) {
    return this.templates.get(templateId) || this.currentTemplate;
  }

  // Generate IDs
  generateTemplateId(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  generateCategoryId(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  generateQuestionId() {
    return `q${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Version management
  incrementVersion(version) {
    const parts = version.split('.');
    const minor = parseInt(parts[1]) + 1;
    return `${parts[0]}.${minor}`;
  }

  // Calculate inspection score
  calculateScore(template, responses) {
    let totalScore = 0;
    let totalWeight = 0;
    let criticalFailed = false;
    
    for (const category of template.categories) {
      const weight = template.scoring.weightings[category.id] || 1.0;
      let categoryScore = 0;
      let categoryQuestions = 0;
      
      for (const question of category.questions) {
        if (responses[question.id]) {
          categoryQuestions++;
          
          if (responses[question.id] === 'pass') {
            categoryScore++;
          } else if (responses[question.id] === 'fail') {
            // Check if critical question failed
            if (template.scoring.criticalQuestions.includes(question.id)) {
              criticalFailed = true;
            }
          }
          // N/A responses don't affect score
        }
      }
      
      if (categoryQuestions > 0) {
        const categoryPercentage = (categoryScore / categoryQuestions) * 100;
        totalScore += categoryPercentage * weight;
        totalWeight += weight;
      }
    }
    
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    return {
      score: Math.round(finalScore),
      passed: finalScore >= template.scoring.passingScore && !criticalFailed,
      criticalFailed: criticalFailed,
      details: {
        passingScore: template.scoring.passingScore,
        criticalQuestions: template.scoring.criticalQuestions
      }
    };
  }

  // Export template
  exportTemplate(templateId) {
    const template = this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');
    
    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${template.id}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  // Import template
  async importTemplate(file) {
    const text = await file.text();
    const template = JSON.parse(text);
    
    // Validate template structure
    if (!template.id || !template.name || !template.categories) {
      throw new Error('Invalid template format');
    }
    
    // Generate new ID to avoid conflicts
    template.id = `imported-${template.id}-${Date.now()}`;
    template.importedAt = new Date().toISOString();
    template.importedBy = window.state?.user?.email || 'system';
    
    await this.blobStorage.saveTemplate(template);
    return template;
  }
}

// Template editor UI component
export function createTemplateEditor(templateManager) {
  const editor = document.createElement('div');
  editor.className = 'template-editor';
  
  editor.innerHTML = `
    <div class="content-card">
      <div class="content-header">
        <h2 class="content-title">
          <i class="fas fa-edit"></i>
          Template Editor
        </h2>
        <div class="content-actions">
          <button class="btn btn-secondary" onclick="importTemplate()">
            <i class="fas fa-upload"></i>
            Import
          </button>
          <button class="btn btn-primary" onclick="createNewTemplate()">
            <i class="fas fa-plus"></i>
            New Template
          </button>
        </div>
      </div>
      
      <div class="template-editor-content">
        <div class="template-list">
          <h3>Available Templates</h3>
          <div id="template-list-items">
            <!-- Template list will be populated here -->
          </div>
        </div>
        
        <div class="template-details" id="template-details" style="display: none;">
          <div class="form-group">
            <label class="form-label">Template Name</label>
            <input type="text" id="template-name" class="form-control">
          </div>
          
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea id="template-description" class="form-control"></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">Passing Score (%)</label>
            <input type="number" id="template-passing-score" class="form-control" min="0" max="100">
          </div>
          
          <div class="categories-section">
            <h3>Categories & Questions</h3>
            <div id="categories-container">
              <!-- Categories will be populated here -->
            </div>
            <button class="btn btn-secondary" onclick="addCategory()">
              <i class="fas fa-plus"></i>
              Add Category
            </button>
          </div>
          
          <div class="template-actions">
            <button class="btn btn-primary" onclick="saveTemplate()">
              <i class="fas fa-save"></i>
              Save Template
            </button>
            <button class="btn btn-secondary" onclick="exportTemplate()">
              <i class="fas fa-download"></i>
              Export
            </button>
            <button class="btn btn-secondary" onclick="deleteTemplate()">
              <i class="fas fa-trash"></i>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <style>
      .template-editor-content {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 20px;
        padding: 20px;
      }
      
      .template-list {
        border-right: 1px solid var(--border-primary);
        padding-right: 20px;
      }
      
      .template-list-item {
        padding: 12px;
        margin-bottom: 8px;
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-fast);
      }
      
      .template-list-item:hover {
        background: var(--bg-hover);
        transform: translateX(4px);
      }
      
      .template-list-item.active {
        background: var(--primary);
        color: white;
      }
      
      .categories-section {
        margin-top: 30px;
      }
      
      .category-item {
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        padding: 16px;
        margin-bottom: 16px;
      }
      
      .category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .question-item {
        background: var(--bg-secondary);
        padding: 12px;
        margin-bottom: 8px;
        border-radius: var(--radius-sm);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .question-text {
        flex: 1;
        margin-right: 12px;
      }
      
      .question-badges {
        display: flex;
        gap: 8px;
      }
      
      .badge {
        padding: 4px 8px;
        border-radius: var(--radius-full);
        font-size: 0.75rem;
        font-weight: 500;
      }
      
      .badge.required {
        background: rgba(245, 158, 11, 0.1);
        color: var(--warning);
      }
      
      .badge.critical {
        background: rgba(239, 68, 68, 0.1);
        color: var(--danger);
      }
      
      .template-actions {
        margin-top: 30px;
        display: flex;
        gap: 12px;
      }
      
      @media (max-width: 768px) {
        .template-editor-content {
          grid-template-columns: 1fr;
        }
        
        .template-list {
          border-right: none;
          border-bottom: 1px solid var(--border-primary);
          padding-right: 0;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
      }
    </style>
  `;
  
  return editor;
}

// Make available globally
window.TemplateManager = TemplateManager;