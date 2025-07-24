<!-- src/components/modals/CameraModal.vue -->
<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="text-lg font-semibold">Foto aufnehmen</h2>
        <button @click="close" class="close-btn">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="camera-container">
        <video
          v-show="!photoTaken"
          ref="videoElement"
          class="camera-feed"
          autoplay
          playsinline
        />
        
        <canvas
          v-show="photoTaken"
          ref="canvasElement"
          class="camera-feed"
        />

        <div v-if="!cameraReady" class="camera-loading">
          <LoadingSpinner />
          <p class="text-sm text-text-secondary mt-2">
            Kamera wird gestartet...
          </p>
        </div>

        <!-- Camera Controls Overlay -->
        <div v-if="cameraReady && !photoTaken" class="camera-overlay">
          <!-- Grid Lines -->
          <div class="grid-lines">
            <div class="grid-line vertical left-1/3"></div>
            <div class="grid-line vertical right-1/3"></div>
            <div class="grid-line horizontal top-1/3"></div>
            <div class="grid-line horizontal bottom-1/3"></div>
          </div>

          <!-- Flash indicator -->
          <div v-if="flashEnabled" class="flash-indicator">
            <BoltIcon class="w-5 h-5" />
          </div>
        </div>

        <!-- AI Detection Overlay -->
        <div v-if="aiDetections.length > 0" class="ai-overlay">
          <div
            v-for="detection in aiDetections"
            :key="detection.id"
            class="detection-box"
            :style="{
              left: `${detection.x}%`,
              top: `${detection.y}%`,
              width: `${detection.width}%`,
              height: `${detection.height}%`
            }"
          >
            <span class="detection-label">
              {{ detection.label }}
              <span class="confidence">{{ detection.confidence }}%</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="camera-controls">
        <div v-if="!photoTaken" class="control-row">
          <button
            @click="switchCamera"
            class="control-btn"
            :disabled="cameras.length <= 1"
          >
            <ArrowPathIcon class="w-5 h-5" />
          </button>

          <button
            @click="capturePhoto"
            class="capture-btn"
            :disabled="!cameraReady"
          >
            <div class="capture-inner"></div>
          </button>

          <button
            @click="toggleFlash"
            class="control-btn"
          >
            <BoltIcon 
              class="w-5 h-5"
              :class="{ 'text-accent-warning': flashEnabled }"
            />
          </button>
        </div>

        <div v-else class="control-row">
          <button
            @click="retakePhoto"
            class="btn-secondary flex-1"
          >
            <ArrowPathIcon class="w-4 h-4" />
            Wiederholen
          </button>

          <button
            @click="confirmPhoto"
            class="btn-primary flex-1"
          >
            <CheckIcon class="w-4 h-4" />
            Verwenden
          </button>
        </div>
      </div>

      <!-- AI Analysis Results -->
      <div v-if="aiAnalysis && photoTaken" class="ai-results">
        <div class="ai-header">
          <SparklesIcon class="w-5 h-5 text-accent-primary" />
          <span>KI-Analyse</span>
        </div>
        <div class="ai-findings">
          <div
            v-for="finding in aiAnalysis.findings"
            :key="finding.id"
            class="finding-item"
            :class="`finding-${finding.severity}`"
          >
            <component :is="getFindingIcon(finding.type)" class="w-4 h-4" />
            <span>{{ finding.description }}</span>
          </div>
        </div>
        <div v-if="aiAnalysis.suggestions.length > 0" class="ai-suggestions">
          <p class="text-sm font-medium mb-2">Empfehlungen:</p>
          <ul class="text-sm text-text-secondary space-y-1">
            <li v-for="(suggestion, index) in aiAnalysis.suggestions" :key="index">
              • {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  XMarkIcon,
  ArrowPathIcon,
  BoltIcon,
  CheckIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const emit = defineEmits<{
  capture: [photoData: string]
  close: []
}>()

// Refs
const videoElement = ref<HTMLVideoElement>()
const canvasElement = ref<HTMLCanvasElement>()
const stream = ref<MediaStream | null>(null)
const cameraReady = ref(false)
const photoTaken = ref(false)
const flashEnabled = ref(false)
const cameras = ref<MediaDeviceInfo[]>([])
const currentCameraIndex = ref(0)
const aiDetections = ref<any[]>([])
const aiAnalysis = ref<any>(null)

// Camera setup
async function initCamera() {
  try {
    // Get available cameras
    const devices = await navigator.mediaDevices.enumerateDevices()
    cameras.value = devices.filter(device => device.kind === 'videoinput')

    // Request camera access
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    }

    stream.value = await navigator.mediaDevices.getUserMedia(constraints)
    
    if (videoElement.value) {
      videoElement.value.srcObject = stream.value
      cameraReady.value = true
      
      // Start AI detection
      startAIDetection()
    }
  } catch (error) {
    console.error('Camera initialization failed:', error)
  }
}

// AI Detection simulation
function startAIDetection() {
  // Simulate real-time object detection
  const detectionInterval = setInterval(() => {
    if (!cameraReady.value || photoTaken.value) {
      clearInterval(detectionInterval)
      return
    }

    // Simulate random safety equipment detection
    if (Math.random() > 0.7) {
      aiDetections.value = [
        {
          id: '1',
          label: 'Sicherheitshelm',
          confidence: 95,
          x: 30 + Math.random() * 20,
          y: 10 + Math.random() * 20,
          width: 15,
          height: 20
        }
      ]
    } else if (Math.random() > 0.5) {
      aiDetections.value = [
        {
          id: '2',
          label: 'Warnweste',
          confidence: 88,
          x: 25 + Math.random() * 30,
          y: 30 + Math.random() * 30,
          width: 25,
          height: 35
        }
      ]
    } else {
      aiDetections.value = []
    }
  }, 2000)
}

function capturePhoto() {
  if (!videoElement.value || !canvasElement.value) return

  const video = videoElement.value
  const canvas = canvasElement.value
  const context = canvas.getContext('2d')

  if (!context) return

  // Set canvas dimensions to video dimensions
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  // Apply flash effect if enabled
  if (flashEnabled.value) {
    const flashOverlay = document.createElement('div')
    flashOverlay.className = 'flash-effect'
    document.body.appendChild(flashOverlay)
    
    setTimeout(() => {
      document.body.removeChild(flashOverlay)
    }, 200)
  }

  // Draw video frame to canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  
  photoTaken.value = true
  
  // Simulate AI analysis
  analyzePhoto()
}

function analyzePhoto() {
  // Simulate AI analysis delay
  setTimeout(() => {
    aiAnalysis.value = {
      findings: [
        {
          id: '1',
          type: 'safety',
          severity: 'good',
          description: 'PSA vollständig vorhanden'
        },
        {
          id: '2',
          type: 'warning',
          severity: 'medium',
          description: 'Leichte Verschmutzung des Arbeitsbereichs'
        }
      ],
      suggestions: [
        'Arbeitsbereich reinigen',
        'Dokumentation aktualisieren'
      ]
    }
  }, 1500)
}

function retakePhoto() {
  photoTaken.value = false
  aiAnalysis.value = null
  startAIDetection()
}

function confirmPhoto() {
  if (!canvasElement.value) return
  
  const photoData = canvasElement.value.toDataURL('image/jpeg', 0.85)
  emit('capture', photoData)
}

function switchCamera() {
  currentCameraIndex.value = (currentCameraIndex.value + 1) % cameras.value.length
  // Re-initialize with new camera
  stopCamera()
  initCamera()
}

function toggleFlash() {
  flashEnabled.value = !flashEnabled.value
}

function close() {
  emit('close')
}

function stopCamera() {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }
}

function getFindingIcon(type: string) {
  switch (type) {
    case 'safety':
      return ShieldCheckIcon
    case 'warning':
      return ExclamationTriangleIcon
    default:
      return InformationCircleIcon
  }
}

// Lifecycle
onMounted(() => {
  initCamera()
})

onUnmounted(() => {
  stopCamera()
})
</script>

<style scoped>
.modal-backdrop {
  @apply fixed inset-0 bg-black bg-opacity-80 z-50;
  @apply flex items-center justify-center p-4;
}

.modal-content {
  @apply bg-surface-secondary rounded-lg;
  @apply w-full max-w-2xl max-h-[90vh] overflow-hidden;
  @apply flex flex-col;
}

.modal-header {
  @apply flex items-center justify-between p-4;
  @apply border-b border-surface-tertiary;
}

.close-btn {
  @apply p-2 rounded-lg hover:bg-surface-tertiary;
  @apply transition-colors;
}

.camera-container {
  @apply relative bg-black;
  @apply aspect-video overflow-hidden;
}

.camera-feed {
  @apply w-full h-full object-cover;
}

.camera-loading {
  @apply absolute inset-0 flex flex-col items-center justify-center;
  @apply bg-surface-primary;
}

.camera-overlay {
  @apply absolute inset-0 pointer-events-none;
}

.grid-lines {
  @apply absolute inset-0;
}

.grid-line {
  @apply absolute bg-white bg-opacity-30;
}

.grid-line.vertical {
  @apply w-px h-full;
}

.grid-line.horizontal {
  @apply w-full h-px;
}

.flash-indicator {
  @apply absolute top-4 right-4;
  @apply p-2 rounded-full bg-accent-warning;
  @apply text-white;
}

.ai-overlay {
  @apply absolute inset-0 pointer-events-none;
}

.detection-box {
  @apply absolute border-2 border-accent-primary;
  @apply rounded-lg;
}

.detection-label {
  @apply absolute -top-6 left-0;
  @apply bg-accent-primary text-white text-xs px-2 py-1 rounded;
  @apply whitespace-nowrap;
}

.confidence {
  @apply opacity-80 ml-1;
}

.camera-controls {
  @apply p-4 bg-surface-primary;
}

.control-row {
  @apply flex items-center justify-center gap-8;
}

.control-btn {
  @apply w-12 h-12 rounded-full;
  @apply bg-surface-tertiary text-text-secondary;
  @apply flex items-center justify-center;
  @apply hover:bg-opacity-80 transition-all;
  @apply disabled:opacity-50;
}

.capture-btn {
  @apply w-16 h-16 rounded-full;
  @apply bg-white p-1;
  @apply hover:scale-105 active:scale-95 transition-transform;
}

.capture-inner {
  @apply w-full h-full rounded-full bg-accent-error;
}

.ai-results {
  @apply p-4 bg-surface-tertiary border-t border-surface-tertiary;
}

.ai-header {
  @apply flex items-center gap-2 mb-3;
  @apply text-sm font-medium;
}

.ai-findings {
  @apply space-y-2 mb-4;
}

.finding-item {
  @apply flex items-center gap-2 text-sm;
  @apply p-2 rounded-lg;
}

.finding-good {
  @apply bg-accent-success bg-opacity-10 text-accent-success;
}

.finding-medium {
  @apply bg-accent-warning bg-opacity-10 text-accent-warning;
}

.finding-bad {
  @apply bg-accent-error bg-opacity-10 text-accent-error;
}

.ai-suggestions {
  @apply pt-3 border-t border-surface-tertiary;
}

/* Flash effect */
:global(.flash-effect) {
  @apply fixed inset-0 bg-white z-[60];
  @apply pointer-events-none;
  animation: flash 0.2s ease-out;
}

@keyframes flash {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
