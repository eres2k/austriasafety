<!-- src/views/InspectionDetail.vue -->
<template>
  <div class="inspection-detail">
    <!-- Header -->
    <div class="detail-header">
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold">{{ inspection?.name }}</h1>
          <div class="flex items-center gap-4 mt-2">
            <StatusBadge :status="inspection?.status || 'pending'" />
            <span class="text-sm text-text-secondary">
              {{ inspection?.location }} • {{ formattedDate }}
            </span>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <button
            v-if="!isViewerMode && canEdit"
            @click="resumeInspection"
            class="btn-secondary"
          >
            <PencilIcon class="w-4 h-4" />
            <span class="hidden md:inline">Bearbeiten</span>
          </button>
          
          <button
            @click="exportPDF"
            class="btn-primary"
            :disabled="exportingPDF"
          >
            <DocumentArrowDownIcon class="w-4 h-4" />
            <span class="hidden md:inline">
              {{ exportingPDF ? 'Wird erstellt...' : 'PDF Export' }}
            </span>
          </button>
          
          <button
            @click="toggleViewerMode"
            class="btn-secondary"
            v-if="hasViewerAccess"
          >
            <EyeIcon class="w-4 h-4" />
            <span class="hidden md:inline">
              {{ isViewerMode ? 'Bearbeitungsmodus' : 'Ansichtsmodus' }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Progress Overview -->
    <div class="progress-card">
      <h2 class="text-lg font-semibold mb-4">Fortschritt</h2>
      <div class="progress-bar-large">
        <div 
          class="progress-fill-large"
          :style="{ width: `${inspection?.progress || 0}%` }"
        />
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div class="stat-item">
          <span class="stat-value text-accent-success">{{ stats.passed }}</span>
          <span class="stat-label">Bestanden</span>
        </div>
        <div class="stat-item">
          <span class="stat-value text-accent-error">{{ stats.failed }}</span>
          <span class="stat-label">Mängel</span>
        </div>
        <div class="stat-item">
          <span class="stat-value text-text-tertiary">{{ stats.pending }}</span>
          <span class="stat-label">Ausstehend</span>
        </div>
        <div class="stat-item">
          <span class="stat-value text-accent-primary">{{ stats.score }}%</span>
          <span class="stat-label">Bewertung</span>
        </div>
      </div>
    </div>

    <!-- Sections Overview -->
    <div class="sections-overview">
      <h2 class="text-lg font-semibold mb-4">Abschnitte</h2>
      <div class="space-y-3">
        <div
          v-for="(section, index) in template?.sections"
          :key="section.id"
          @click="viewSection(index)"
          class="section-card"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="section-number">{{ index + 1 }}</div>
              <div>
                <h3 class="font-medium">{{ section.title }}</h3>
                <p class="text-sm text-text-secondary">
                  {{ getSectionStats(section).answered }} / {{ section.questions.length }} beantwortet
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="section-progress">
                <CircularProgress :value="getSectionProgress(section)" />
              </div>
              <ChevronRightIcon class="w-5 h-5 text-text-tertiary" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Critical Findings -->
    <div v-if="criticalFindings.length > 0" class="critical-findings">
      <div class="findings-header">
        <ExclamationTriangleIcon class="w-5 h-5 text-accent-error" />
        <h2 class="text-lg font-semibold">Kritische Befunde</h2>
      </div>
      <div class="findings-list">
        <div
          v-for="finding in criticalFindings"
          :key="finding.questionId"
          class="finding-item"
        >
          <div class="finding-content">
            <h4 class="font-medium">{{ finding.question }}</h4>
            <p v-if="finding.note" class="text-sm text-text-secondary mt-1">
              {{ finding.note }}
            </p>
          </div>
          <div v-if="finding.media" class="finding-media">
            <img 
              v-for="media in finding.media"
              :key="media.id"
              :src="media.url || media.data"
              class="media-thumb"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="action-buttons">
      <button
        v-if="canApprove"
        @click="approveInspection"
        class="btn-success"
      >
        <CheckCircleIcon class="w-5 h-5" />
        Freigeben
      </button>
      
      <button
        @click="shareInspection"
        class="btn-secondary"
      >
        <ShareIcon class="w-5 h-5" />
        Teilen
      </button>
      
      <button
        v-if="canArchive"
        @click="archiveInspection"
        class="btn-secondary"
      >
        <ArchiveBoxIcon class="w-5 h-5" />
        Archivieren
      </button>
    </div>

    <!-- Section Detail Modal -->
    <SectionDetailModal
      v-if="showSectionDetail"
      :section="selectedSection"
      :responses="inspection?.responses"
      :viewerMode="isViewerMode"
      @close="showSectionDetail = false"
    />

    <!-- Share Modal -->
    <ShareModal
      v-if="showShareModal"
      :inspectionId="inspection?.id"
      @close="showShareModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  PencilIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ShareIcon,
  ArchiveBoxIcon
} from '@heroicons/vue/24/outline'

import { useInspectionStore } from '@/stores/inspection'
import { useAuthStore } from '@/stores/auth'
import { getTemplateById } from '@/data/questionnaire-templates'
import { generateInspectionPDF } from '@/utils/pdf-generator'
import StatusBadge from '@/components/common/StatusBadge.vue'
import CircularProgress from '@/components/common/CircularProgress.vue'
import SectionDetailModal from '@/components/modals/SectionDetailModal.vue'
import ShareModal from '@/components/modals/ShareModal.vue'

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const authStore = useAuthStore()

// State
const inspection = ref<any>(null)
const template = ref<any>(null)
const isViewerMode = ref(false)
const exportingPDF = ref(false)
const showSectionDetail = ref(false)
const showShareModal = ref(false)
const selectedSection = ref<any>(null)

// Computed
const formattedDate = computed(() => {
  if (!inspection.value) return ''
  return format(new Date(inspection.value.createdAt), 'dd. MMMM yyyy', { locale: de })
})

const hasViewerAccess = computed(() => {
  return authStore.hasRole(['safety_manager', 'leadership_viewer', 'admin'])
})

const canEdit = computed(() => {
  return inspection.value?.status !== 'completed' && 
         inspection.value?.status !== 'archived'
})

const canApprove = computed(() => {
  return inspection.value?.status === 'pending-review' &&
         authStore.hasRole(['safety_manager', 'admin'])
})

const canArchive = computed(() => {
  return inspection.value?.status === 'completed' &&
         authStore.hasRole(['safety_manager', 'admin'])
})

const stats = computed(() => {
  if (!inspection.value || !template.value) {
    return { passed: 0, failed: 0, pending: 0, total: 0, score: 0 }
  }
  
  let passed = 0
  let failed = 0
  let pending = 0
  let total = 0
  
  template.value.sections.forEach((section: any) => {
    section.questions.forEach((question: any) => {
      const response = inspection.value.responses[question.id]
      if (response) {
        total++
        switch (response.status) {
          case 'passed':
            passed++
            break
          case 'failed':
            failed++
            break
          default:
            pending++
        }
      } else if (question.required) {
        total++
        pending++
      }
    })
  })
  
  const score = total > 0 ? Math.round((passed / total) * 100) : 0
  
  return { passed, failed, pending, total, score }
})

const criticalFindings = computed(() => {
  if (!inspection.value || !template.value) return []
  
  const findings: any[] = []
  
  template.value.sections.forEach((section: any) => {
    section.questions.forEach((question: any) => {
      const response = inspection.value.responses[question.id]
      if (response?.status === 'failed' && question.weight >= 15) {
        findings.push({
          questionId: question.id,
          question: question.title,
          note: response.note,
          media: response.media
        })
      }
    })
  })
  
  return findings
})

// Methods
function getSectionStats(section: any) {
  let answered = 0
  let passed = 0
  let failed = 0
  
  section.questions.forEach((question: any) => {
    const response = inspection.value?.responses[question.id]
    if (response) {
      answered++
      if (response.status === 'passed') passed++
      if (response.status === 'failed') failed++
    }
  })
  
  return { answered, passed, failed }
}

function getSectionProgress(section: any): number {
  const stats = getSectionStats(section)
  return Math.round((stats.answered / section.questions.length) * 100)
}

function resumeInspection() {
  router.push(`/inspections/${inspection.value.id}/execute`)
}

async function exportPDF() {
  if (!inspection.value || !template.value) return
  
  exportingPDF.value = true
  
  try {
    const pdfBlob = await generateInspectionPDF(inspection.value, template.value)
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `WHS-Inspektion-${inspection.value.location}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
    link.click()
    
    // Cleanup
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('PDF generation failed:', error)
  } finally {
    exportingPDF.value = false
  }
}

function toggleViewerMode() {
  isViewerMode.value = !isViewerMode.value
}

function viewSection(index: number) {
  selectedSection.value = template.value.sections[index]
  showSectionDetail.value = true
}

function shareInspection() {
  showShareModal.value = true
}

async function approveInspection() {
  await inspectionStore.updateInspection(inspection.value.id, {
    status: 'completed',
    completedAt: new Date().toISOString()
  })
  
  // Reload data
  await loadInspection()
}

async function archiveInspection() {
  await inspectionStore.updateInspection(inspection.value.id, {
    status: 'archived'
  })
  
  router.push('/inspections')
}

async function loadInspection() {
  const inspectionId = route.params.id as string
  inspection.value = await inspectionStore.loadInspection(inspectionId)
  template.value = getTemplateById(inspection.value.templateId)
}

// Lifecycle
onMounted(async () => {
  await loadInspection()
})
</script>

<style scoped>
.detail-header {
  @apply bg-surface-secondary rounded-lg p-6 mb-6;
  @apply border border-surface-tertiary;
}

.progress-card {
  @apply bg-surface-secondary rounded-lg p-6 mb-6;
  @apply border border-surface-tertiary;
}

.progress-bar-large {
  @apply w-full h-4 bg-surface-tertiary rounded-full overflow-hidden;
}

.progress-fill-large {
  @apply h-full bg-accent-primary transition-all duration-500;
}

.stat-item {
  @apply text-center;
}

.stat-value {
  @apply block text-2xl font-bold;
}

.stat-label {
  @apply block text-sm text-text-secondary mt-1;
}

.sections-overview {
  @apply bg-surface-secondary rounded-lg p-6 mb-6;
  @apply border border-surface-tertiary;
}

.section-card {
  @apply p-4 bg-surface-primary rounded-lg;
  @apply hover:bg-surface-tertiary transition-colors cursor-pointer;
}

.section-number {
  @apply w-10 h-10 rounded-full bg-accent-primary;
  @apply flex items-center justify-center font-bold;
}

.section-progress {
  @apply w-12 h-12;
}

.critical-findings {
  @apply bg-accent-error bg-opacity-10 rounded-lg p-6 mb-6;
  @apply border border-accent-error border-opacity-30;
}

.findings-header {
  @apply flex items-center gap-2 mb-4;
}

.findings-list {
  @apply space-y-3;
}

.finding-item {
  @apply p-4 bg-surface-primary rounded-lg;
}

.finding-content {
  @apply mb-3;
}

.finding-media {
  @apply flex gap-2;
}

.media-thumb {
  @apply w-16 h-16 object-cover rounded-lg;
}

.action-buttons {
  @apply flex flex-wrap gap-3;
}

.btn-success {
  @apply px-4 py-2 bg-accent-success text-white rounded-lg;
  @apply hover:bg-opacity-90 active:scale-95 transition-all;
  @apply flex items-center gap-2;
}
</style>
