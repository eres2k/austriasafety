<!-- src/components/modals/SectionDetailModal.vue -->
<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h2 class="text-lg font-semibold">{{ section.title }}</h2>
          <p v-if="section.description" class="text-sm text-text-secondary mt-1">
            {{ section.description }}
          </p>
        </div>
        <button @click="close" class="close-btn">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="modal-body">
        <!-- Section Statistics -->
        <div class="section-stats">
          <div class="stat-item">
            <CheckCircleIcon class="w-5 h-5 text-accent-success" />
            <span class="stat-value">{{ stats.passed }}</span>
            <span class="stat-label">Bestanden</span>
          </div>
          <div class="stat-item">
            <XCircleIcon class="w-5 h-5 text-accent-error" />
            <span class="stat-value">{{ stats.failed }}</span>
            <span class="stat-label">Mängel</span>
          </div>
          <div class="stat-item">
            <ClockIcon class="w-5 h-5 text-text-tertiary" />
            <span class="stat-value">{{ stats.pending }}</span>
            <span class="stat-label">Ausstehend</span>
          </div>
          <div class="stat-item">
            <DocumentTextIcon class="w-5 h-5 text-accent-primary" />
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">Gesamt</span>
          </div>
        </div>

        <!-- Questions List -->
        <div class="questions-list">
          <div
            v-for="(question, index) in section.questions"
            :key="question.id"
            class="question-item"
            :class="{ 'viewer-mode': viewerMode }"
          >
            <div class="question-header">
              <div class="question-number">{{ index + 1 }}</div>
              <div class="question-content">
                <h4 class="question-title">{{ question.title }}</h4>
                <p v-if="question.description" class="question-description">
                  {{ question.description }}
                </p>
              </div>
              <div class="question-status">
                <component
                  :is="getStatusIcon(responses[question.id])"
                  class="w-6 h-6"
                  :class="getStatusClass(responses[question.id])"
                />
              </div>
            </div>

            <!-- Response Details -->
            <div v-if="responses[question.id]" class="response-details">
              <div class="response-value">
                <span class="label">Antwort:</span>
                <span class="value">{{ formatResponseValue(question, responses[question.id]) }}</span>
              </div>

              <!-- Notes -->
              <div v-if="responses[question.id].note" class="response-note">
                <DocumentTextIcon class="w-4 h-4 text-text-tertiary" />
                <span>{{ responses[question.id].note }}</span>
              </div>

              <!-- Media -->
              <div v-if="responses[question.id].media?.length" class="response-media">
                <div class="media-label">
                  <CameraIcon class="w-4 h-4 text-text-tertiary" />
                  <span>{{ responses[question.id].media.length }} Medienanhänge</span>
                </div>
                <div class="media-grid">
                  <div
                    v-for="media in responses[question.id].media"
                    :key="media.id"
                    @click="viewMedia(media)"
                    class="media-thumb"
                  >
                    <img
                      v-if="media.type === 'image'"
                      :src="media.url || media.data"
                      :alt="media.caption"
                      class="thumb-image"
                    />
                    <div v-else class="thumb-placeholder">
                      <component
                        :is="getMediaIcon(media.type)"
                        class="w-8 h-8 text-text-tertiary"
                      />
                    </div>
                    <div v-if="media.caption" class="media-caption">
                      {{ media.caption }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Metadata -->
              <div class="response-meta">
                <span>Aktualisiert: {{ formatDate(responses[question.id].updatedAt) }}</span>
                <span v-if="responses[question.id].updatedBy">
                  von {{ responses[question.id].updatedBy }}
                </span>
              </div>
            </div>

            <!-- Edit Button (if not viewer mode) -->
            <button
              v-if="!viewerMode && !responses[question.id]"
              @click="editQuestion(question.id)"
              class="edit-btn"
            >
              <PencilIcon class="w-4 h-4" />
              <span>Beantworten</span>
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="footer-stats">
          <span class="text-sm text-text-secondary">
            Fortschritt: <strong>{{ completionPercentage }}%</strong> abgeschlossen
          </span>
        </div>
        <button @click="close" class="btn-primary">
          Schließen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  CameraIcon,
  PencilIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  MinusCircleIcon
} from '@heroicons/vue/24/outline'
import type { Question, QuestionResponse } from '@/types'

interface Props {
  section: any
  responses: Record<string, QuestionResponse>
  viewerMode?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'close': []
}>()

// Computed
const stats = computed(() => {
  let passed = 0
  let failed = 0
  let pending = 0

  props.section.questions.forEach((question: Question) => {
    const response = props.responses[question.id]
    if (response?.status === 'passed') passed++
    else if (response?.status === 'failed') failed++
    else pending++
  })

  return {
    passed,
    failed,
    pending,
    total: props.section.questions.length
  }
})

const completionPercentage = computed(() => {
  const answered = props.section.questions.filter((q: Question) => 
    props.responses[q.id]?.value !== undefined
  ).length
  
  return Math.round((answered / props.section.questions.length) * 100)
})

// Methods
function getStatusIcon(response: QuestionResponse | undefined) {
  if (!response || !response.status) return ClockIcon
  
  switch (response.status) {
    case 'passed':
      return CheckCircleIcon
    case 'failed':
      return XCircleIcon
    case 'na':
      return MinusCircleIcon
    default:
      return ClockIcon
  }
}

function getStatusClass(response: QuestionResponse | undefined) {
  if (!response || !response.status) return 'text-text-tertiary'
  
  switch (response.status) {
    case 'passed':
      return 'text-accent-success'
    case 'failed':
      return 'text-accent-error'
    case 'na':
      return 'text-text-secondary'
    default:
      return 'text-text-tertiary'
  }
}

function formatResponseValue(question: Question, response: QuestionResponse): string {
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
      
    case 'media':
      return `${response.media?.length || 0} Dateien`
      
    case 'signature':
      return 'Unterschrift vorhanden'
      
    default:
      return response.value?.toString() || 'N/A'
  }
}

function formatDate(dateString: string): string {
  return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: de })
}

function getMediaIcon(type: string) {
  switch (type) {
    case 'audio':
      return MicrophoneIcon
    case 'video':
      return VideoCameraIcon
    default:
      return CameraIcon
  }
}

function viewMedia(media: any) {
  // Implement media viewer
  console.log('View media:', media)
}

function editQuestion(questionId: string) {
  // Navigate to question
  console.log('Edit question:', questionId)
}

function close() {
  emit('close')
}
</script>

<style scoped>
.modal-backdrop {
  @apply fixed inset-0 bg-black bg-opacity-50 z-50;
  @apply flex items-center justify-center p-4;
}

.modal-content {
  @apply bg-surface-secondary rounded-lg;
  @apply w-full max-w-4xl max-h-[90vh];
  @apply flex flex-col;
}

.modal-header {
  @apply flex items-start justify-between;
  @apply p-6 border-b border-surface-tertiary;
}

.close-btn {
  @apply p-2 rounded-lg hover:bg-surface-tertiary;
  @apply transition-colors ml-4;
}

.modal-body {
  @apply flex-1 p-6 overflow-y-auto;
}

.section-stats {
  @apply grid grid-cols-4 gap-4 mb-6;
  @apply bg-surface-tertiary rounded-lg p-4;
}

.stat-item {
  @apply flex flex-col items-center text-center;
}

.stat-value {
  @apply text-2xl font-bold my-1;
}

.stat-label {
  @apply text-xs text-text-secondary;
}

.questions-list {
  @apply space-y-4;
}

.question-item {
  @apply bg-surface-primary rounded-lg p-4;
  @apply border border-surface-tertiary;
}

.question-item.viewer-mode {
  @apply cursor-default;
}

.question-header {
  @apply flex items-start gap-3;
}

.question-number {
  @apply w-8 h-8 rounded-full bg-accent-primary;
  @apply flex items-center justify-center;
  @apply text-sm font-bold flex-shrink-0;
}

.question-content {
  @apply flex-1;
}

.question-title {
  @apply font-medium mb-1;
}

.question-description {
  @apply text-sm text-text-secondary;
}

.question-status {
  @apply flex-shrink-0;
}

.response-details {
  @apply mt-4 ml-11 space-y-3;
  @apply bg-surface-secondary rounded-lg p-3;
}

.response-value {
  @apply flex gap-2;
}

.label {
  @apply text-sm text-text-secondary;
}

.value {
  @apply text-sm font-medium;
}

.response-note {
  @apply flex items-start gap-2;
  @apply text-sm text-text-secondary;
  @apply bg-surface-tertiary rounded p-2;
}

.response-media {
  @apply space-y-2;
}

.media-label {
  @apply flex items-center gap-2 text-sm text-text-secondary;
}

.media-grid {
  @apply grid grid-cols-4 gap-2;
}

.media-thumb {
  @apply relative aspect-square rounded-lg overflow-hidden;
  @apply bg-surface-tertiary cursor-pointer;
  @apply hover:opacity-80 transition-opacity;
}

.thumb-image {
  @apply w-full h-full object-cover;
}

.thumb-placeholder {
  @apply w-full h-full flex items-center justify-center;
}

.media-caption {
  @apply absolute bottom-0 left-0 right-0;
  @apply bg-black bg-opacity-70 text-white;
  @apply text-xs p-1 truncate;
}

.response-meta {
  @apply text-xs text-text-tertiary;
}

.edit-btn {
  @apply flex items-center gap-2 mt-3 ml-11;
  @apply px-3 py-1.5 bg-surface-secondary rounded-lg;
  @apply text-sm hover:bg-accent-primary hover:bg-opacity-20;
  @apply transition-all;
}

.modal-footer {
  @apply flex items-center justify-between;
  @apply p-6 border-t border-surface-tertiary;
}

.footer-stats {
  @apply flex items-center gap-4;
}
</style>
