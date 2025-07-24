<!-- src/components/questions/SignatureQuestion.vue -->
<template>
  <div class="signature-question">
    <div class="signature-container">
      <canvas
        ref="canvasElement"
        class="signature-canvas"
        :class="{ signing: isDrawing }"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="stopDrawing"
      />
      
      <div v-if="!hasSignature" class="signature-placeholder">
        <PencilIcon class="w-8 h-8 text-text-tertiary mb-2" />
        <span class="text-sm text-text-secondary">
          Hier unterschreiben
        </span>
      </div>

      <img
        v-if="hasSignature && !isEditing"
        :src="signatureData"
        class="signature-preview"
        @click="editSignature"
      />
    </div>

    <div class="signature-controls">
      <button
        v-if="hasSignature || isDrawing"
        @click="clearSignature"
        class="control-btn"
        :disabled="disabled"
      >
        <TrashIcon class="w-4 h-4" />
        <span>Löschen</span>
      </button>

      <button
        v-if="hasSignature && !isEditing"
        @click="editSignature"
        class="control-btn"
        :disabled="disabled"
      >
        <PencilIcon class="w-4 h-4" />
        <span>Bearbeiten</span>
      </button>

      <button
        v-if="isEditing"
        @click="saveSignature"
        class="control-btn primary"
      >
        <CheckIcon class="w-4 h-4" />
        <span>Speichern</span>
      </button>

      <div class="ml-auto text-xs text-text-tertiary">
        {{ signatureTimestamp }}
      </div>
    </div>

    <!-- Signature Guidelines -->
    <div v-if="showGuidelines" class="signature-guidelines">
      <InformationCircleIcon class="w-4 h-4 text-text-tertiary flex-shrink-0" />
      <p class="text-xs text-text-secondary">
        Ihre Unterschrift wird sicher gespeichert und ist rechtlich bindend.
        Unterschreiben Sie mit dem Finger oder Stift.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import type { Question, QuestionResponse } from '@/types'

interface Props {
  question: Question
  modelValue?: QuestionResponse
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: QuestionResponse]
}>()

// State
const canvasElement = ref<HTMLCanvasElement>()
const context = ref<CanvasRenderingContext2D | null>(null)
const isDrawing = ref(false)
const isEditing = ref(false)
const signatureData = ref('')
const lastX = ref(0)
const lastY = ref(0)
const showGuidelines = ref(true)

// Canvas settings
const lineWidth = 2
const strokeStyle = '#FAFAFA'
const canvasBackground = '#2D2D2D'

// Computed
const hasSignature = computed(() => {
  return signatureData.value || props.modelValue?.value
})

const signatureTimestamp = computed(() => {
  if (!props.modelValue?.updatedAt) return ''
  return format(new Date(props.modelValue.updatedAt), 'dd.MM.yyyy HH:mm', { locale: de })
})

// Initialize
onMounted(() => {
  initCanvas()
  
  // Load existing signature if available
  if (props.modelValue?.value) {
    signatureData.value = props.modelValue.value
  }
})

// Methods
function initCanvas() {
  if (!canvasElement.value) return
  
  const canvas = canvasElement.value
  const rect = canvas.getBoundingClientRect()
  
  // Set canvas size
  canvas.width = rect.width * window.devicePixelRatio
  canvas.height = rect.height * window.devicePixelRatio
  
  // Scale canvas for high DPI displays
  canvas.style.width = `${rect.width}px`
  canvas.style.height = `${rect.height}px`
  
  context.value = canvas.getContext('2d')
  
  if (context.value) {
    context.value.scale(window.devicePixelRatio, window.devicePixelRatio)
    context.value.lineCap = 'round'
    context.value.lineJoin = 'round'
    context.value.lineWidth = lineWidth
    context.value.strokeStyle = strokeStyle
    
    // Clear canvas with background
    clearCanvas()
  }
}

function clearCanvas() {
  if (!context.value || !canvasElement.value) return
  
  const canvas = canvasElement.value
  context.value.fillStyle = canvasBackground
  context.value.fillRect(0, 0, canvas.width, canvas.height)
}

function startDrawing(e: MouseEvent) {
  if (disabled.value || !isEditing.value) {
    if (!hasSignature.value) {
      isEditing.value = true
    }
    return
  }
  
  isDrawing.value = true
  showGuidelines.value = false
  
  const rect = canvasElement.value!.getBoundingClientRect()
  lastX.value = e.clientX - rect.left
  lastY.value = e.clientY - rect.top
}

function draw(e: MouseEvent) {
  if (!isDrawing.value || !context.value) return
  
  const rect = canvasElement.value!.getBoundingClientRect()
  const currentX = e.clientX - rect.left
  const currentY = e.clientY - rect.top
  
  context.value.beginPath()
  context.value.moveTo(lastX.value, lastY.value)
  context.value.lineTo(currentX, currentY)
  context.value.stroke()
  
  lastX.value = currentX
  lastY.value = currentY
}

function stopDrawing() {
  isDrawing.value = false
}

// Touch event handlers
function handleTouchStart(e: TouchEvent) {
  e.preventDefault()
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  canvasElement.value?.dispatchEvent(mouseEvent)
}

function handleTouchMove(e: TouchEvent) {
  e.preventDefault()
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  canvasElement.value?.dispatchEvent(mouseEvent)
}

function clearSignature() {
  clearCanvas()
  signatureData.value = ''
  isEditing.value = true
  updateResponse('')
}

function editSignature() {
  isEditing.value = true
  clearCanvas()
}

function saveSignature() {
  if (!canvasElement.value) return
  
  // Check if canvas has content
  const imageData = context.value?.getImageData(
    0, 0, 
    canvasElement.value.width, 
    canvasElement.value.height
  )
  
  if (!imageData) return
  
  // Check if signature exists (not just background)
  let hasContent = false
  for (let i = 0; i < imageData.data.length; i += 4) {
    // Check if pixel is not background color
    if (imageData.data[i] !== parseInt(canvasBackground.slice(1, 3), 16) ||
        imageData.data[i + 1] !== parseInt(canvasBackground.slice(3, 5), 16) ||
        imageData.data[i + 2] !== parseInt(canvasBackground.slice(5, 7), 16)) {
      hasContent = true
      break
    }
  }
  
  if (!hasContent) return
  
  // Convert to data URL
  signatureData.value = canvasElement.value.toDataURL('image/png')
  isEditing.value = false
  
  updateResponse(signatureData.value)
}

function updateResponse(value: string) {
  const response: QuestionResponse = {
    questionId: props.question.id,
    value,
    updatedAt: new Date().toISOString()
  }
  
  if (props.modelValue) {
    response.note = props.modelValue.note
    response.media = props.modelValue.media
    response.status = props.modelValue.status
  }
  
  emit('update:modelValue', response)
}

// Handle window resize
function handleResize() {
  if (isEditing.value) {
    initCanvas()
  }
}

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.signature-container {
  @apply relative bg-surface-tertiary rounded-lg overflow-hidden;
  @apply border-2 border-dashed border-surface-tertiary;
  @apply transition-all;
  min-height: 200px;
}

.signature-canvas {
  @apply absolute inset-0 w-full h-full cursor-crosshair;
  @apply touch-none; /* Prevent scrolling while drawing */
}

.signature-canvas.signing {
  @apply cursor-crosshair;
}

.signature-placeholder {
  @apply absolute inset-0 flex flex-col items-center justify-center;
  @apply pointer-events-none;
}

.signature-preview {
  @apply w-full h-full object-contain cursor-pointer;
  @apply hover:opacity-90 transition-opacity;
}

.signature-controls {
  @apply flex items-center gap-2 mt-3;
}

.control-btn {
  @apply flex items-center gap-1.5 px-3 py-1.5;
  @apply text-sm bg-surface-tertiary rounded-lg;
  @apply hover:bg-opacity-80 transition-all;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.control-btn.primary {
  @apply bg-accent-primary text-white;
}

.signature-guidelines {
  @apply flex items-start gap-2 mt-3 p-3;
  @apply bg-surface-tertiary bg-opacity-50 rounded-lg;
}
</style>
