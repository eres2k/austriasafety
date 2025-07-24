<template>
  <div class="create-inspection">
    <!-- Progress Steps -->
    <div class="progress-steps">
      <div 
        v-for="(step, index) in steps" 
        :key="step.id"
        class="step"
        :class="{
          active: currentStep === index,
          completed: currentStep > index
        }"
      >
        <div class="step-indicator">
          <CheckIcon v-if="currentStep > index" class="w-4 h-4" />
          <span v-else>{{ index + 1 }}</span>
        </div>
        <span class="step-label">{{ step.label }}</span>
      </div>
    </div>

    <!-- Step Content -->
    <div class="step-content">
      <!-- Step 1: Location Selection -->
      <div v-if="currentStep === 0" class="location-step">
        <h2 class="step-title">Standort auswählen</h2>
        <p class="step-description">
          Wählen Sie den Standort für die Inspektion
        </p>
        
        <div class="location-grid">
          <button
            v-for="location in locations"
            :key="location.code"
            @click="selectLocation(location.code)"
            class="location-card"
            :class="{ selected: formData.location === location.code }"
          >
            <BuildingOfficeIcon class="w-8 h-8 mb-2" />
            <h3 class="font-semibold">{{ location.code }}</h3>
            <p class="text-sm text-text-secondary">{{ location.name }}</p>
          </button>
        </div>
      </div>

      <!-- Step 2: Template Selection -->
      <div v-if="currentStep === 1" class="template-step">
        <h2 class="step-title">Vorlage wählen</h2>
        <p class="step-description">
          Wählen Sie eine Inspektionsvorlage
        </p>

        <div v-if="loadingTemplates" class="loading-state">
          <LoadingSpinner />
        </div>

        <div v-else class="template-grid">
          <div
            v-for="template in availableTemplates"
            :key="template.id"
            @click="selectTemplate(template.id)"
            class="template-card"
            :class="{ selected: formData.templateId === template.id }"
          >
            <div class="template-header">
              <component :is="getTemplateIcon(template.category)" class="w-6 h-6" />
              <StatusBadge 
                v-if="template.version !== '1.0'" 
                :status="`v${template.version}`" 
                size="small" 
              />
            </div>
            <h3 class="font-semibold">{{ template.name }}</h3>
            <p class="text-sm text-text-secondary mt-1">
              {{ template.description }}
            </p>
            <div class="template-meta">
              <span class="meta-item">
                <DocumentTextIcon class="w-4 h-4" />
                {{ template.sections.length }} Abschnitte
              </span>
              <span class="meta-item">
                <ClockIcon class="w-4 h-4" />
                ~{{ estimateTime(template) }} min
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Details -->
      <div v-if="currentStep === 2" class="details-step">
        <h2 class="step-title">Details hinzufügen</h2>
        <p class="step-description">
          Optionale Informationen für die Inspektion
        </p>

        <div class="form-section">
          <label class="form-label">Inspektionsname</label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="z.B. Wöchentliche Sicherheitsbegehung"
            class="form-input"
          />
        </div>

        <div class="form-section">
          <label class="form-label">Beschreibung</label>
          <textarea
            v-model="formData.description"
            placeholder="Zusätzliche Informationen..."
            rows="3"
            class="form-input"
          />
        </div>

        <div class="form-section">
          <label class="form-label">Verantwortliche Personen</label>
          <div class="assignee-selector">
            <button
              v-for="user in availableUsers"
              :key="user.id"
              @click="toggleAssignee(user.id)"
              class="assignee-chip"
              :class="{ selected: formData.assignedTo.includes(user.id) }"
            >
              <div class="assignee-avatar" :style="{ backgroundColor: user.color }">
                {{ getInitials(user.name) }}
              </div>
              <span>{{ user.name }}</span>
            </button>
          </div>
        </div>

        <div class="form-section">
          <label class="toggle-option">
            <input
              v-model="formData.enableCollaboration"
              type="checkbox"
              class="toggle-checkbox"
            />
            <span>Echtzeit-Zusammenarbeit aktivieren</span>
          </label>
          
          <label class="toggle-option">
            <input
              v-model="formData.enableVoiceInput"
              type="checkbox"
              class="toggle-checkbox"
            />
            <span>Spracheingabe aktivieren</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="step-navigation">
      <button
        v-if="currentStep > 0"
        @click="previousStep"
        class="btn-secondary"
      >
        <ArrowLeftIcon class="w-4 h-4" />
        Zurück
      </button>
      
      <div class="ml-auto flex gap-3">
        <button
          @click="saveDraft"
          class="btn-secondary"
        >
          Als Entwurf speichern
        </button>
        
        <button
          v-if="currentStep < steps.length - 1"
          @click="nextStep"
          :disabled="!canProceed"
          class="btn-primary"
        >
          Weiter
          <ArrowRightIcon class="w-4 h-4" />
        </button>
        
        <button
          v-else
          @click="startInspection"
          :disabled="!canProceed"
          class="btn-primary"
        >
          <PlayIcon class="w-4 h-4" />
          Inspektion starten
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  CheckIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlayIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

import { useInspectionStore } from '@/stores/inspection'
import { useQuestionnaireStore } from '@/stores/questionnaire'
import { useAuthStore } from '@/stores/auth'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const router = useRouter()
const inspectionStore = useInspectionStore()
const questionnaireStore = useQuestionnaireStore()
const authStore = useAuthStore()

// State
const currentStep = ref(0)
const loadingTemplates = ref(false)

const steps = [
  { id: 'location', label: 'Standort' },
  { id: 'template', label: 'Vorlage' },
  { id: 'details', label: 'Details' }
]

const locations = [
  { code: 'DVI1', name: 'Wien 1' },
  { code: 'DVI2', name: 'Wien 2' },
  { code: 'DVI3', name: 'Wien 3' },
  { code: 'DAP5', name: 'Graz' },
  { code: 'DAP8', name: 'Linz' }
]

const formData = ref({
  location: '',
  templateId: '',
  name: '',
  description: '',
  assignedTo: [] as string[],
  enableCollaboration: true,
  enableVoiceInput: false
})

// Mock users - in production, load from API
const availableUsers = ref([
  { id: '1', name: 'Max Mustermann', color: '#3B82F6' },
  { id: '2', name: 'Anna Schmidt', color: '#8B5CF6' },
  { id: '3', name: 'Thomas Weber', color: '#10B981' }
])

// Computed
const availableTemplates = computed(() => {
  if (!formData.value.location) return []
  
  return questionnaireStore.questionnaires.filter(q => 
    q.location === formData.value.location && q.active
  )
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return !!formData.value.location
    case 1:
      return !!formData.value.templateId
    case 2:
      return true // Details are optional
    default:
      return false
  }
})

// Methods
function selectLocation(code: string) {
  formData.value.location = code
  formData.value.templateId = '' // Reset template when location changes
}

function selectTemplate(id: string) {
  formData.value.templateId = id
  
  // Auto-fill name if empty
  if (!formData.value.name) {
    const template = availableTemplates.value.find(t => t.id === id)
    if (template) {
      formData.value.name = `${template.name} - ${new Date().toLocaleDateString('de-AT')}`
    }
  }
}

function toggleAssignee(userId: string) {
  const index = formData.value.assignedTo.indexOf(userId)
  if (index > -1) {
    formData.value.assignedTo.splice(index, 1)
  } else {
    formData.value.assignedTo.push(userId)
  }
}

function getTemplateIcon(category: string) {
  switch (category) {
    case 'general-safety':
      return ClipboardDocumentCheckIcon
    case 'equipment-safety':
      return ShieldCheckIcon
    case 'emergency':
      return ExclamationTriangleIcon
    default:
      return DocumentTextIcon
  }
}

function estimateTime(template: any): number {
  const totalQuestions = template.sections.reduce(
    (sum: number, section: any) => sum + section.questions.length, 
    0
  )
  return Math.round(totalQuestions * 1.5) // 1.5 minutes per question
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function nextStep() {
  if (currentStep.value < steps.length - 1 && canProceed.value) {
    currentStep.value++
  }
}

async function saveDraft() {
  // Save as draft inspection
  const inspection = await inspectionStore.createInspection({
    ...formData.value,
    status: 'draft',
    responses: {},
    progress: 0,
    createdBy: authStore.user?.id
  })
  
  router.push(`/inspections/${inspection.id}`)
}

async function startInspection() {
  if (!canProceed.value) return
  
  // Create inspection and start execution
  const inspection = await inspectionStore.createInspection({
    ...formData.value,
    status: 'in-progress',
    responses: {},
    progress: 0,
    createdBy: authStore.user?.id
  })
  
  router.push(`/inspections/${inspection.id}/execute`)
}

// Load templates when location changes
watch(() => formData.value.location, async (newLocation) => {
  if (newLocation) {
    loadingTemplates.value = true
    await questionnaireStore.loadQuestionnaires()
    loadingTemplates.value = false
  }
})

// Load initial data
onMounted(async () => {
  await questionnaireStore.loadQuestionnaires()
})
</script>

<style scoped>
.create-inspection {
  @apply max-w-4xl mx-auto;
}

.progress-steps {
  @apply flex items-center justify-center mb-8;
  @apply bg-surface-secondary rounded-lg p-6;
}

.step {
  @apply flex items-center gap-2 text-text-tertiary;
  @apply relative px-4;
}

.step:not(:last-child)::after {
  content: '';
  @apply absolute right-0 top-1/2 -translate-y-1/2;
  @apply w-16 h-0.5 bg-surface-tertiary;
}

.step.active {
  @apply text-text-primary;
}

.step.completed {
  @apply text-accent-success;
}

.step-indicator {
  @apply w-8 h-8 rounded-full bg-surface-tertiary;
  @apply flex items-center justify-center;
  @apply text-sm font-medium;
}

.step.active .step-indicator {
  @apply bg-accent-primary text-white;
}

.step.completed .step-indicator {
  @apply bg-accent-success text-white;
}

.step-label {
  @apply text-sm font-medium;
}

.step-content {
  @apply bg-surface-secondary rounded-lg p-8 mb-6;
  @apply min-h-[400px];
}

.step-title {
  @apply text-2xl font-bold mb-2;
}

.step-description {
  @apply text-text-secondary mb-8;
}

.location-grid {
  @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4;
}

.location-card {
  @apply flex flex-col items-center justify-center p-6;
  @apply bg-surface-tertiary rounded-lg;
  @apply border-2 border-transparent;
  @apply hover:bg-opacity-80 transition-all;
}

.location-card.selected {
  @apply border-accent-primary bg-accent-primary bg-opacity-10;
}

.template-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.template-card {
  @apply p-6 bg-surface-tertiary rounded-lg;
  @apply border-2 border-transparent;
  @apply hover:bg-opacity-80 transition-all cursor-pointer;
}

.template-card.selected {
  @apply border-accent-primary bg-accent-primary bg-opacity-10;
}

.template-header {
  @apply flex items-center justify-between mb-3;
}

.template-meta {
  @apply flex items-center gap-4 mt-4;
  @apply text-xs text-text-tertiary;
}

.meta-item {
  @apply flex items-center gap-1;
}

.form-section {
  @apply mb-6;
}

.form-label {
  @apply block text-sm font-medium mb-2;
}

.form-input {
  @apply w-full px-4 py-2 bg-surface-tertiary rounded-lg;
  @apply border-2 border-transparent;
  @apply focus:border-accent-primary outline-none;
}

.assignee-selector {
  @apply flex flex-wrap gap-2;
}

.assignee-chip {
  @apply flex items-center gap-2 px-3 py-2;
  @apply bg-surface-tertiary rounded-full;
  @apply border-2 border-transparent;
  @apply hover:bg-opacity-80 transition-all;
}

.assignee-chip.selected {
  @apply border-accent-primary bg-accent-primary bg-opacity-10;
}

.assignee-avatar {
  @apply w-6 h-6 rounded-full;
  @apply flex items-center justify-center;
  @apply text-xs font-bold text-white;
}

.toggle-option {
  @apply flex items-center gap-3 p-3;
  @apply bg-surface-tertiary rounded-lg mb-2;
  @apply cursor-pointer hover:bg-opacity-80;
}

.toggle-checkbox {
  @apply w-4 h-4 rounded;
  @apply bg-surface-primary border-surface-tertiary;
  @apply text-accent-primary focus:ring-accent-primary;
}

.step-navigation {
  @apply flex items-center;
}

.loading-state {
  @apply flex justify-center py-12;
}
</style>
