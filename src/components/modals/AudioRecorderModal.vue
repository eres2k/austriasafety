<!-- src/components/modals/AudioRecorderModal.vue -->
<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="text-lg font-semibold">Audioaufnahme</h2>
        <button @click="close" class="close-btn">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="modal-body">
        <!-- Recording Status -->
        <div class="recording-status">
          <div class="status-indicator" :class="{ recording: isRecording, paused: isPaused }">
            <div class="pulse-ring"></div>
            <div class="pulse-ring delay-1"></div>
            <div class="pulse-ring delay-2"></div>
            <MicrophoneIcon class="w-12 h-12" />
          </div>
          
          <div class="status-text">
            <span v-if="!hasRecording" class="text-lg">
              {{ isRecording ? 'Aufnahme läuft...' : 'Bereit zur Aufnahme' }}
            </span>
            <span v-else-if="isPlaying" class="text-lg">
              Wiedergabe läuft...
            </span>
            <span v-else class="text-lg">
              Aufnahme bereit
            </span>
            
            <div class="timer">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </div>
          </div>
        </div>

        <!-- Audio Waveform Visualization -->
        <div class="waveform-container">
          <canvas
            ref="waveformCanvas"
            class="waveform-canvas"
            :width="canvasWidth"
            :height="canvasHeight"
          />
        </div>

        <!-- Audio Controls -->
        <div class="audio-controls">
          <div v-if="!hasRecording" class="record-controls">
            <button
              v-if="!isRecording"
              @click="startRecording"
              class="control-btn primary"
              :disabled="!canRecord"
            >
              <div class="record-icon"></div>
              <span>Aufnahme starten</span>
            </button>
            
            <button
              v-else
              @click="stopRecording"
              class="control-btn stop"
            >
              <StopIcon class="w-6 h-6" />
              <span>Stoppen</span>
            </button>

            <button
              v-if="isRecording && !isPaused"
              @click="pauseRecording"
              class="control-btn secondary"
            >
              <PauseIcon class="w-6 h-6" />
              <span>Pause</span>
            </button>

            <button
              v-if="isRecording && isPaused"
              @click="resumeRecording"
              class="control-btn secondary"
            >
              <PlayIcon class="w-6 h-6" />
              <span>Fortsetzen</span>
            </button>
          </div>

          <div v-else class="playback-controls">
            <button
              @click="playRecording"
              class="control-btn"
              :disabled="isPlaying"
            >
              <PlayIcon class="w-6 h-6" />
            </button>

            <button
              @click="pausePlayback"
              class="control-btn"
              :disabled="!isPlaying"
            >
              <PauseIcon class="w-6 h-6" />
            </button>

            <button
              @click="deleteRecording"
              class="control-btn danger"
            >
              <TrashIcon class="w-6 h-6" />
            </button>
          </div>
        </div>

        <!-- Recording Settings -->
        <div class="recording-settings">
          <label class="setting-item">
            <input
              v-model="enableNoiseSuppression"
              type="checkbox"
              class="setting-checkbox"
            />
            <span>Rauschunterdrückung</span>
          </label>

          <label class="setting-item">
            <input
              v-model="enableAutoGain"
              type="checkbox"
              class="setting-checkbox"
            />
            <span>Automatische Lautstärkeanpassung</span>
          </label>
        </div>

        <!-- Voice Transcription (if available) -->
        <div v-if="transcription" class="transcription">
          <h3 class="text-sm font-medium mb-2">Transkription:</h3>
          <div class="transcription-text">
            {{ transcription }}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="close" class="btn-secondary">
          Abbrechen
        </button>
        <button
          @click="saveRecording"
          class="btn-primary"
          :disabled="!hasRecording"
        >
          <CheckIcon class="w-4 h-4" />
          Speichern
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {
  XMarkIcon,
  MicrophoneIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/vue/24/outline'

const emit = defineEmits<{
  'record': [audioData: string]
  'close': []
}>()

// State
const isRecording = ref(false)
const isPaused = ref(false)
const isPlaying = ref(false)
const hasRecording = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const transcription = ref('')

// Audio references
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])
const audioBlob = ref<Blob | null>(null)
const audioUrl = ref<string | null>(null)
const audioElement = ref<HTMLAudioElement | null>(null)
const stream = ref<MediaStream | null>(null)

// Visualization
const waveformCanvas = ref<HTMLCanvasElement>()
const canvasWidth = 600
const canvasHeight = 100
const analyser = ref<AnalyserNode | null>(null)
const animationId = ref<number | null>(null)

// Settings
const enableNoiseSuppression = ref(true)
const enableAutoGain = ref(true)

// Computed
const canRecord = computed(() => {
  return 'MediaRecorder' in window && navigator.mediaDevices?.getUserMedia
})

// Methods
async function startRecording() {
  try {
    // Request microphone access with constraints
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: enableNoiseSuppression.value,
        autoGainControl: enableAutoGain.value
      }
    }

    stream.value = await navigator.mediaDevices.getUserMedia(constraints)
    
    // Create MediaRecorder
    mediaRecorder.value = new MediaRecorder(stream.value, {
      mimeType: 'audio/webm'
    })

    audioChunks.value = []

    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }

    mediaRecorder.value.onstop = () => {
      audioBlob.value = new Blob(audioChunks.value, { type: 'audio/webm' })
      audioUrl.value = URL.createObjectURL(audioBlob.value)
      hasRecording.value = true
      
      // Start transcription if available
      transcribeAudio()
    }

    // Start recording
    mediaRecorder.value.start()
    isRecording.value = true
    
    // Start visualization
    setupAudioVisualization()
    startTimer()
    
  } catch (error) {
    console.error('Failed to start recording:', error)
    alert('Mikrofon konnte nicht aktiviert werden')
  }
}

function stopRecording() {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false
    isPaused.value = false
    
    // Stop all tracks
    stream.value?.getTracks().forEach(track => track.stop())
    
    // Stop visualization
    if (animationId.value) {
      cancelAnimationFrame(animationId.value)
    }
  }
}

function pauseRecording() {
  if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
    mediaRecorder.value.pause()
    isPaused.value = true
  }
}

function resumeRecording() {
  if (mediaRecorder.value && mediaRecorder.value.state === 'paused') {
    mediaRecorder.value.resume()
    isPaused.value = false
  }
}

function playRecording() {
  if (!audioUrl.value) return

  audioElement.value = new Audio(audioUrl.value)
  audioElement.value.play()
  isPlaying.value = true

  audioElement.value.onended = () => {
    isPlaying.value = false
    currentTime.value = 0
  }

  audioElement.value.ontimeupdate = () => {
    currentTime.value = audioElement.value!.currentTime
    duration.value = audioElement.value!.duration || 0
  }
}

function pausePlayback() {
  if (audioElement.value) {
    audioElement.value.pause()
    isPlaying.value = false
  }
}

function deleteRecording() {
  if (confirm('Möchten Sie die Aufnahme wirklich löschen?')) {
    hasRecording.value = false
    audioBlob.value = null
    audioUrl.value = null
    currentTime.value = 0
    duration.value = 0
    transcription.value = ''
    
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value = null
    }
  }
}

function saveRecording() {
  if (!audioBlob.value) return

  // Convert to base64
  const reader = new FileReader()
  reader.onloadend = () => {
    emit('record', reader.result as string)
  }
  reader.readAsDataURL(audioBlob.value)
}

function setupAudioVisualization() {
  if (!stream.value || !waveformCanvas.value) return

  const audioContext = new AudioContext()
  const source = audioContext.createMediaStreamSource(stream.value)
  analyser.value = audioContext.createAnalyser()
  analyser.value.fftSize = 256

  source.connect(analyser.value)

  visualize()
}

function visualize() {
  if (!analyser.value || !waveformCanvas.value) return

  const canvas = waveformCanvas.value
  const ctx = canvas.getContext('2d')!
  const bufferLength = analyser.value.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const draw = () => {
    animationId.value = requestAnimationFrame(draw)

    analyser.value!.getByteFrequencyData(dataArray)

    ctx.fillStyle = '#2D2D2D'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const barWidth = (canvas.width / bufferLength) * 2.5
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height

      ctx.fillStyle = `hsl(${i / bufferLength * 120 + 120}, 70%, 50%)`
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

      x += barWidth + 1
    }
  }

  draw()
}

function startTimer() {
  const startTime = Date.now()
  
  const updateTimer = () => {
    if (isRecording.value && !isPaused.value) {
      currentTime.value = (Date.now() - startTime) / 1000
      requestAnimationFrame(updateTimer)
    }
  }
  
  updateTimer()
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

async function transcribeAudio() {
  // Simulate transcription - in production, use a real speech-to-text API
  setTimeout(() => {
    transcription.value = 'Beispieltranskription: Sicherheitshelm wurde nicht getragen im Bereich der Laderampe.'
  }, 2000)
}

function close() {
  // Clean up
  if (isRecording.value) {
    stopRecording()
  }
  
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
  }
  
  emit('close')
}

// Lifecycle
onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
  }
  
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
  
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
  }
})
</script>

<style scoped>
.modal-backdrop {
  @apply fixed inset-0 bg-black bg-opacity-50 z-50;
  @apply flex items-center justify-center p-4;
}

.modal-content {
  @apply bg-surface-secondary rounded-lg;
  @apply w-full max-w-2xl max-h-[90vh];
  @apply flex flex-col;
}

.modal-header {
  @apply flex items-center justify-between;
  @apply p-4 border-b border-surface-tertiary;
}

.close-btn {
  @apply p-2 rounded-lg hover:bg-surface-tertiary;
  @apply transition-colors;
}

.modal-body {
  @apply flex-1 p-6 overflow-y-auto;
}

.recording-status {
  @apply flex flex-col items-center justify-center mb-8;
}

.status-indicator {
  @apply relative mb-4;
}

.status-indicator.recording {
  @apply text-accent-error;
}

.status-indicator.paused {
  @apply text-accent-warning;
}

.pulse-ring {
  @apply absolute inset-0 rounded-full;
  @apply border-4 border-current opacity-0;
}

.status-indicator.recording .pulse-ring {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.pulse-ring.delay-1 {
  animation-delay: 0.5s;
}

.pulse-ring.delay-2 {
  animation-delay: 1s;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.status-text {
  @apply text-center;
}

.timer {
  @apply text-2xl font-mono text-text-secondary mt-2;
}

.waveform-container {
  @apply bg-surface-tertiary rounded-lg p-4 mb-6;
  @apply overflow-hidden;
}

.waveform-canvas {
  @apply w-full h-full;
}

.audio-controls {
  @apply flex justify-center mb-6;
}

.record-controls,
.playback-controls {
  @apply flex items-center gap-3;
}

.control-btn {
  @apply flex items-center gap-2 px-4 py-2;
  @apply bg-surface-tertiary rounded-lg;
  @apply hover:bg-opacity-80 transition-all;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.control-btn.primary {
  @apply bg-accent-error text-white;
}

.control-btn.secondary {
  @apply bg-accent-primary text-white;
}

.control-btn.stop {
  @apply bg-surface-tertiary;
}

.control-btn.danger {
  @apply hover:bg-accent-error hover:bg-opacity-20;
}

.record-icon {
  @apply w-6 h-6 rounded-full bg-white;
}

.recording-settings {
  @apply flex flex-wrap gap-4 justify-center mb-6;
}

.setting-item {
  @apply flex items-center gap-2 cursor-pointer;
  @apply text-sm text-text-secondary;
}

.setting-checkbox {
  @apply w-4 h-4 rounded;
  @apply bg-surface-tertiary border-surface-tertiary;
  @apply text-accent-primary focus:ring-accent-primary;
}

.transcription {
  @apply bg-surface-tertiary rounded-lg p-4;
}

.transcription-text {
  @apply text-sm text-text-secondary italic;
}

.modal-footer {
  @apply flex items-center justify-end gap-3;
  @apply p-4 border-t border-surface-tertiary;
}
</style>
