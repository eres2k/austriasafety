<template>
  <div class="inspection-execution">
    <!-- Header -->
    <div class="execution-header">
      <div class="header-content">
        <h1 class="text-xl font-semibold">{{ inspection?.name }}</h1>
        <p class="text-sm text-text-secondary">
          {{ currentSection?.title }}
        </p>
      </div>
      
      <div class="header-actions">
        <button
          @click="toggleTimer"
          class="timer-btn"
          :class="{ active: timerRunning }"
        >
          <ClockIcon class="w-5 h-5" />
          <span>{{ formattedTime }}</span>
        </button>
        
        <button
          @click="saveProgress"
          class="btn-secondary"
          :disabled="saving"
        >
          <CloudArrowUpIcon class="w-5 h-5" />
          <span class="hidden md:inline">
            {{ saving ? 'Speichert...' : 'Speichern' }}
          </span>
        </button>
        
        <button
          @click="showExitConfirm = true"
          class="btn-secondary"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-container">
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :style="{ width: `${overallProgress}%` }"
        />
      </div>
      <div class="progress-stats">
        <span>{{ answeredQuestions }} / {{ totalQuestions }} beantwortet</span>
        <span>{{ overallProgress }}%</span>
      </div>
    </div>

    <!-- Section Navigation -->
    <div class="section-nav">
      <button
        v-for="(section, index) in template?.sections"
        :key="section.id"
        @click="navigateToSection(index)"
        class="section-tab"
        :class="{
          active: currentSectionIndex === index,
          completed: isSectionCompleted(section)
        }"
      >
        <span class="section-number">{{ index + 1 }}</span>
        <span class="section-name">{{ section.title }}</span>
        <CheckIcon 
          v-if="isSectionCompleted(section)" 
          class="w-4 h-4 text-accent-success" 
        />
      </button>
    </div>

    <!-- Question Display -->
    <div class="question-container">
      <transition name="slide-fade" mode="out-in">
        <div
          v-if="currentQuestion"
          :key="currentQuestion.id"
          class="question-card"
        >
          <!-- Question Header -->
          <div class="question-header">
            <div class="question-info">
              <span class="question-number">
                Frage {{ currentQuestionIndex + 1 }} von {{ currentSection.questions.length }}
              </span>
              <span 
                v-if="currentQuestion.required" 
                class="required-badge"
              >
                Pflichtfeld
              </span>
            </div>
            
            <!-- Quick Actions -->
            <div class="quick-actions">
              <button
                @click="toggleNote"
                class="action-btn"
                :class="{ active: hasNote }"
              >
                <DocumentTextIcon class="w-4 h-4" />
                <span>Notiz</span>
              </button>
              
              <button
                @click="toggleMedia"
                class="action-btn"
                :class="{ active: hasMedia }"
              >
                <CameraIcon class="w-4 h-4" />
                <span>Medien</span>
              </button>
              
              <button
                v-if="voiceEnabled"
                @click="toggleVoice"
                class="action-btn"
                :class="{ active: isListening }"
              >
                <MicrophoneIcon class="w-4 h-4" />
                <span>Sprache</span>
              </button>
            </div>
          </div>

          <!-- Question Content -->
          <div class="question-content">
            <h2 class="question-title">{{ currentQuestion.title }}</h2>
            <p 
              v-if="currentQuestion.description" 
              class="question-description"
            >
              {{ currentQuestion.description }}
            </p>
          </div>

          <!-- Question Component -->
          <div class="question-component">
            <component
              :is="getQuestionComponent(currentQuestion.type)"
              :question="currentQuestion"
              :modelValue="currentResponse"
              @update:modelValue="updateResponse"
              @voice-input="handleVoiceInput"
            />
          </div>

          <!-- Additional Inputs -->
          <transition name="expand">
            <div v-if="showNote" class="additional-input">
              <label class="input-label">Notiz hinzufügen</label>
              <textarea
                v-model="noteText"
                @blur="saveNote"
                placeholder="Fügen Sie hier Ihre Beobachtungen hinzu..."
                rows="3"
                class="note-textarea"
              />
            </div>
          </transition>

          <transition name="expand">
            <div v-if="showMedia" class="additional-input">
              <label class="input-label">Medien anhängen</label>
              <div class="media-buttons">
                <button
                  @click="capturePhoto"
                  class="media-btn"
                >
                  <CameraIcon class="w-5 h-5" />
                  <span>Foto</span>
                </button>
                
                <button
                  @click="recordAudio"
                  class="media-btn"
                >
                  <MicrophoneIcon class="w-5 h-5" />
                  <span>Audio</span>
                </button>
                
                <button
                  @click="selectFile"
                  class="media-btn"
                >
                  <PhotoIcon class="w-5 h-5" />
                  <span>Datei</span>
                </button>
              </div>
              
              <!-- Media Preview -->
              <div v-if="currentResponse?.media?.length" class="media-preview">
                <div
                  v-for="media in currentResponse.media"
                  :key="media.id"
                  class="media-item"
                >
                  <img 
                    v-if="media.type === 'image'" 
                    :src="media.url || media.data" 
                    class="media-thumb"
                  />
                  <button
                    @click="removeMedia(media.id)"
                    class="remove-media"
                  >
                    <XMarkIcon class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </div>

    <!-- Navigation Controls -->
    <div class="navigation-controls">
      <button
        @click="previousQuestion"
        :disabled="isFirstQuestion"
        class="nav-btn"
      >
        <ArrowLeftIcon class="w-5 h-5" />
        <span class="hidden md:inline">Zurück</span>
      </button>

      <div class="question-dots">
        <button
          v-for="(q, index) in currentSection?.questions"
          :key="q.id"
          @click="navigateToQuestion(index)"
          class="question-dot"
          :class="{
            active: currentQuestionIndex === index,
            answered: !!inspection?.responses[q.id]?.value
          }"
        />
      </div>

      <button
        v-if="!isLastQuestion"
        @click="nextQuestion"
        class="nav-btn nav-btn-primary"
      >
        <span class="hidden md:inline">Weiter</span>
        <ArrowRightIcon class="w-5 h-5" />
      </button>
      
      <button
        v-else-if="!isLastSection"
        @click="nextSection"
        class="nav-btn nav-btn-primary"
      >
        <span>Nächster Abschnitt</span>
        <ArrowRightIcon class="w-5 h-5" />
      </button>
      
      <button
        v-else
        @click="completeInspection"
        class="nav-btn nav-btn-success"
      >
        <CheckIcon class="w-5 h-5" />
        <span>Abschließen</span>
      </button>
    </div>

    <!-- Modals -->
    <CameraModal
      v-if="showCamera"
      @capture="handlePhotoCapture"
      @close="showCamera = false"
    />

    <AudioRecorderModal
      v-if="showAudioRecorder"
      @record="handleAudioRecord"
      @close="showAudioRecorder = false"
    />

    <!-- Exit Confirmation -->
    <div v-if="showExitConfirm" class="modal-backdrop" @click.self="showExitConfirm = false">
      <div class="modal-content">
        <h3 class="text-lg font-semibold mb-4">Inspektion verlassen?</h3>
        <p class="text-text-secondary mb-6">
          Ihr Fortschritt wurde automatisch gespeichert. Sie können die Inspektion später fortsetzen.
        </p>
        <div class="flex gap-3 justify-end">
          <button @click="showExitConfirm = false" class="btn-secondary">
            Abbrechen
          </button>
          <button @click="exitInspection" class="btn-primary">
            Verlassen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ClockIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  CheckIcon,
  DocumentTextIcon,
  CameraIcon,
  MicrophoneIcon,
  PhotoIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/vue/24/outline'

import { useInspectionStore } from '@/stores/inspection'
import { useCollaborationStore } from '@/stores/collaboration'
import { useAuthStore } from '@/stores/auth'
import { getTemplateById } from '@/data/questionnaire-templates'
import { VoiceRecognition } from '@/utils/voice'

// Import Question Components
import RadioQuestion from '@/components/questions/RadioQuestion.vue'
import CheckboxQuestion from '@/components/questions/CheckboxQuestion.vue'
import TextQuestion from '@/components/questions/TextQuestion.vue'
import NumberQuestion from '@/components/questions/NumberQuestion.vue'
import DateQuestion from '@/components/questions/DateQuestion.vue'
import ScaleQuestion from '@/components/questions/ScaleQuestion.vue'
import MediaQuestion from '@/components/questions/MediaQuestion.vue'
import SignatureQuestion from '@/components/questions/SignatureQuestion.vue'

// Import Modals
import CameraModal from '@/components/modals/CameraModal.vue'
import AudioRecorderModal from '@/components/modals/AudioRecorderModal.vue'

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const collaborationStore = useCollaborationStore()
const authStore = useAuthStore()

// State
const inspection = ref<any>(null)
const template = ref<any>(null)
const currentSectionIndex = ref(0)
const currentQuestionIndex = ref(0)
const saving = ref(false)
const showExitConfirm = ref(false)

// Timer
const startTime = ref(Date.now())
const elapsedTime = ref(0)
const timerRunning = ref(true)
let timerInterval: NodeJS.Timeout | null = null

// Additional inputs
const showNote = ref(false)
const showMedia = ref(false)
const noteText = ref('')
const showCamera = ref(false)
const showAudioRecorder = ref(false)

// Voice
const voiceEnabled = ref(false)
const isListening = ref(false)
const voiceRecognition = ref<VoiceRecognition | null>(null)

// Computed
const currentSection = computed(() => {
  return template.value?.sections[currentSectionIndex.value]
})

const currentQuestion = computed(() => {
  return currentSection.value?.questions[currentQuestionIndex.value]
})

const currentResponse = computed(() => {
  if (!currentQuestion.value || !inspection.value) return null
  return inspection.value.responses[currentQuestion.value.id]
})

const isFirstQuestion = computed(() => {
  return currentSectionIndex.value === 0 && currentQuestionIndex.value === 0
})

const isLastQuestion = computed(() => {
  return currentQuestionIndex.value === currentSection.value?.questions.length - 1
})

const isLastSection = computed(() => {
  return currentSectionIndex.value === template.value?.sections.length - 1
})

const totalQuestions = computed(() => {
  if (!template.value) return 0
  return template.value.sections.reduce(
    (sum: number, section: any) => sum + section.questions.length, 
    0
  )
})

const answeredQuestions = computed(() => {
  if (!inspection.value) return 0
  return Object.values(inspection.value.responses).filter(
    (r: any) => r.value !== undefined
  ).length
})

const overallProgress = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((answeredQuestions.value / totalQuestions.value) * 100)
})

const formattedTime = computed(() => {
  const minutes = Math.floor(elapsedTime.value / 60)
  const seconds = elapsedTime.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const hasNote = computed(() => {
  return !!currentResponse.value?.note
})

const hasMedia = computed(() => {
  return currentResponse.value?.media?.length > 0
})

// Methods
function getQuestionComponent(type: string) {
  const components: Record<string, any> = {
    radio: RadioQuestion,
    checkbox: CheckboxQuestion,
    text: TextQuestion,
    number: NumberQuestion,
    date: DateQuestion,
    scale: ScaleQuestion,
    media: MediaQuestion,
    signature: SignatureQuestion
  }
  return components[type] || TextQuestion
}

function updateResponse(response: any) {
  if (!inspection.value || !currentQuestion.value) return
  
  inspection.value.responses[currentQuestion.value.id] = {
    ...response,
    updatedAt: new Date().toISOString(),
    updatedBy: authStore.user?.name
  }
  
  // Update progress
  inspection.value.progress = overallProgress.value
  
  // Broadcast to collaborators
  if (collaborationStore.isConnected) {
    collaborationStore.broadcastAnswer(currentQuestion.value.id, response)
  }
  
  // Auto-save after each answer
  debouncedSave()
}

function toggleNote() {
  showNote.value = !showNote.value
  if (showNote.value) {
    noteText.value = currentResponse.value?.note || ''
  }
}

function saveNote() {
  if (!currentQuestion.value) return
  
  updateResponse({
    ...currentResponse.value,
    note: noteText.value
  })
}

function toggleMedia() {
  showMedia.value = !showMedia.value
}

function toggleVoice() {
  if (isListening.value) {
    stopVoiceInput()
  } else {
    startVoiceInput()
  }
}

function startVoiceInput() {
  if (!voiceRecognition.value) {
    voiceRecognition.value = new VoiceRecognition({
      onResult: handleVoiceResult,
      onError: handleVoiceError,
      language: 'de-DE'
    })
  }
  
  voiceRecognition.value.start()
  isListening.value = true
}

function stopVoiceInput() {
  voiceRecognition.value?.stop()
  isListening.value = false
}

function handleVoiceResult(text: string) {
  // Handle voice input based on question type
  console.log('Voice input:', text)
}

function handleVoiceError(error: any) {
  console.error('Voice error:', error)
  isListening.value = false
}

function handleVoiceInput(text: string) {
  // Process voice command
  console.log('Voice command:', text)
}

function capturePhoto() {
  showCamera.value = true
}

function recordAudio() {
  showAudioRecorder.value = true
}

function selectFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*,video/*,audio/*'
  input.onchange = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }
  input.click()
}

function handlePhotoCapture(photoData: string) {
  const media = {
    id: crypto.randomUUID(),
    type: 'image' as const,
    data: photoData,
    createdAt: new Date().toISOString()
  }
  
  updateResponse({
    ...currentResponse.value,
    media: [...(currentResponse.value?.media || []), media]
  })
  
  showCamera.value = false
}

function handleAudioRecord(audioData: string) {
  const media = {
    id: crypto.randomUUID(),
    type: 'audio' as const,
    data: audioData,
    createdAt: new Date().toISOString()
  }
  
  updateResponse({
    ...currentResponse.value,
    media: [...(currentResponse.value?.media || []), media]
  })
  
  showAudioRecorder.value = false
}

function handleFileUpload(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const media = {
      id: crypto.randomUUID(),
      type: file.type.startsWith('image/') ? 'image' as const : 
            file.type.startsWith('video/') ? 'video' as const : 'audio' as const,
      data: e.target?.result as string,
      createdAt: new Date().toISOString()
    }
    
    updateResponse({
      ...currentResponse.value,
      media: [...(currentResponse.value?.media || []), media]
    })
  }
  reader.readAsDataURL(file)
}

function removeMedia(mediaId: string) {
  const media = currentResponse.value?.media?.filter((m: any) => m.id !== mediaId) || []
  updateResponse({
    ...currentResponse.value,
    media
  })
}

function previousQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  } else if (currentSectionIndex.value > 0) {
    currentSectionIndex.value--
    currentQuestionIndex.value = currentSection.value.questions.length - 1
  }
}

function nextQuestion() {
  if (currentQuestionIndex.value < currentSection.value.questions.length - 1) {
    currentQuestionIndex.value++
  }
}

function nextSection() {
  if (currentSectionIndex.value < template.value.sections.length - 1) {
    currentSectionIndex.value++
    currentQuestionIndex.value = 0
  }
}

function navigateToSection(index: number) {
  currentSectionIndex.value = index
  currentQuestionIndex.value = 0
}

function navigateToQuestion(index: number) {
  currentQuestionIndex.value = index
}

function isSectionCompleted(section: any): boolean {
  if (!inspection.value) return false
  
  return section.questions.every((q: any) => {
    const response = inspection.value.responses[q.id]
    return response?.value !== undefined
  })
}

async function saveProgress() {
  saving.value = true
  
  try {
    await inspectionStore.updateInspection(inspection.value.id, {
      responses: inspection.value.responses,
      progress: overallProgress.value,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to save:', error)
  } finally {
    saving.value = false
  }
}

const debouncedSave = debounce(saveProgress, 2000)

async function completeInspection() {
  if (confirm('Möchten Sie die Inspektion wirklich abschließen?')) {
    await inspectionStore.updateInspection(inspection.value.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      responses: inspection.value.responses,
      progress: 100
    })
    
    router.push(`/inspections/${inspection.value.id}`)
  }
}

function exitInspection() {
  saveProgress()
  router.push(`/inspections/${inspection.value.id}`)
}

function toggleTimer() {
  timerRunning.value = !timerRunning.value
}

// Debounce helper
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Initialize
async function loadInspection() {
  const inspectionId = route.params.id as string
  inspection.value = await inspectionStore.loadInspection(inspectionId)
  template.value = getTemplateById(inspection.value.templateId)
  
  // Enable voice if configured
  voiceEnabled.value = inspection.value.enableVoiceInput || false
  
  // Connect to collaboration if enabled
  if (inspection.value.enableCollaboration) {
    collaborationStore.connect(
      inspectionId,
      authStore.user!.id,
      authStore.user
    )
  }
  
  // Find current position
  findCurrentPosition()
}

function findCurrentPosition() {
  // Find first unanswered question
  for (let sIndex = 0; sIndex < template.value.sections.length; sIndex++) {
    const section = template.value.sections[sIndex]
    for (let qIndex = 0; qIndex < section.questions.length; qIndex++) {
      const question = section.questions[qIndex]
      if (!inspection.value.responses[question.id]?.value) {
        currentSectionIndex.value = sIndex
        currentQuestionIndex.value = qIndex
        return
      }
    }
  }
}

// Timer
function startTimer() {
  timerInterval = setInterval(() => {
    if (timerRunning.value) {
      elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000)
    }
  }, 1000)
}

// Lifecycle
onMounted(async () => {
  await loadInspection()
  startTimer()
  
  // Keyboard shortcuts
  window.addEventListener('keydown', handleKeyboard)
})

onUnmounted(() => {
  // Clean up
  if (timerInterval) clearInterval(timerInterval)
  window.removeEventListener('keydown', handleKeyboard)
  
  // Save on exit
  saveProgress()
  
  // Disconnect collaboration
  if (collaborationStore.isConnected) {
    collaborationStore.disconnect()
  }
})

function handleKeyboard(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' && !isLastQuestion.value) {
    nextQuestion()
  } else if (e.key === 'ArrowLeft' && !isFirstQuestion.value) {
    previousQuestion()
  }
}

// Update collaboration activity
watch([currentSectionIndex, currentQuestionIndex], () => {
  if (collaborationStore.isConnected) {
    collaborationStore.updateActivity(
      currentSectionIndex.value,
      currentQuestion.value?.id
    )
  }
})
</script>

<style scoped>
.inspection-execution {
  @apply max-w-5xl mx-auto;
}

.execution-header {
  @apply flex items-center justify-between mb-4;
  @apply bg-surface-secondary rounded-lg p-4;
}

.header-actions {
  @apply flex items-center gap-3;
}

.timer-btn {
  @apply flex items-center gap-2 px-3 py-2;
  @apply bg-surface-tertiary rounded-lg;
  @apply hover:bg-opacity-80 transition-all;
}

.timer-btn.active {
  @apply bg-accent-primary text-white;
}

.progress-container {
  @apply mb-6;
}

.progress-bar {
  @apply w-full h-2 bg-surface-tertiary rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-accent-primary transition-all duration-500;
}

.progress-stats {
  @apply flex justify-between text-sm text-text-secondary mt-2;
}

.section-nav {
  @apply flex gap-2 mb-6 overflow-x-auto pb-2;
}

.section-tab {
  @apply flex items-center gap-2 px-4 py-2;
  @apply bg-surface-secondary rounded-lg;
  @apply hover:bg-surface-tertiary transition-all;
  @apply whitespace-nowrap;
}

.section-tab.active {
  @apply bg-accent-primary text-white;
}

.section-tab.completed {
  @apply border-2 border-accent-success;
}

.section-number {
  @apply w-6 h-6 rounded-full bg-surface-tertiary;
  @apply flex items-center justify-center text-xs font-medium;
}

.section-tab.active .section-number {
  @apply bg-white bg-opacity-20;
}

.question-container {
  @apply mb-6;
}

.question-card {
  @apply bg-surface-secondary rounded-lg p-6;
  @apply border border-surface-tertiary;
}

.question-header {
  @apply flex items-start justify-between mb-4;
}

.question-info {
  @apply flex items-center gap-3;
}

.question-number {
  @apply text-sm text-text-secondary;
}

.required-badge {
  @apply px-2 py-0.5 bg-accent-error bg-opacity-20;
  @apply text-accent-error text-xs rounded-full;
}

.quick-actions {
  @apply flex items-center gap-2;
}

.action-btn {
  @apply flex items-center gap-1.5 px-3 py-1.5;
  @apply bg-surface-tertiary rounded-lg text-sm;
  @apply hover:bg-opacity-80 transition-all;
}

.action-btn.active {
  @apply bg-accent-primary text-white;
}

.question-content {
  @apply mb-6;
}

.question-title {
  @apply text-lg font-semibold mb-2;
}

.question-description {
  @apply text-text-secondary;
}

.question-component {
  @apply mb-6;
}

.additional-input {
  @apply mt-6 p-4 bg-surface-tertiary rounded-lg;
}

.input-label {
  @apply block text-sm font-medium mb-2;
}

.note-textarea {
  @apply w-full p-3 bg-surface-primary rounded-lg;
  @apply border-2 border-transparent;
  @apply focus:border-accent-primary outline-none;
  @apply resize-none;
}

.media-buttons {
  @apply flex gap-3 mb-4;
}

.media-btn {
  @apply flex items-center gap-2 px-4 py-2;
  @apply bg-surface-primary rounded-lg;
  @apply hover:bg-opacity-80 transition-all;
}

.media-preview {
  @apply flex gap-2 flex-wrap;
}

.media-item {
  @apply relative;
}

.media-thumb {
  @apply w-20 h-20 object-cover rounded-lg;
}

.remove-media {
  @apply absolute -top-2 -right-2 p-1;
  @apply bg-accent-error rounded-full text-white;
}

.navigation-controls {
  @apply flex items-center justify-between;
  @apply bg-surface-secondary rounded-lg p-4;
}

.nav-btn {
  @apply flex items-center gap-2 px-4 py-2;
  @apply bg-surface-tertiary rounded-lg;
  @apply hover:bg-opacity-80 transition-all;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.nav-btn-primary {
  @apply bg-accent-primary text-white;
}

.nav-btn-success {
  @apply bg-accent-success text-white;
}

.question-dots {
  @apply flex items-center gap-1.5;
}

.question-dot {
  @apply w-2 h-2 rounded-full bg-surface-tertiary;
  @apply transition-all;
}

.question-dot.active {
  @apply w-8 bg-accent-primary;
}

.question-dot.answered {
  @apply bg-accent-success;
}

.modal-backdrop {
  @apply fixed inset-0 bg-black bg-opacity-50 z-50;
  @apply flex items-center justify-center p-4;
}

.modal-content {
  @apply bg-surface-secondary rounded-lg p-6;
  @apply max-w-md w-full;
}

/* Animations */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
