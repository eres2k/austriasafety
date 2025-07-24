<!-- src/components/questions/MediaQuestion.vue -->
<template>
  <div class="media-question">
    <div class="capture-buttons">
      <button
        @click="capturePhoto"
        class="capture-btn"
        :disabled="disabled"
      >
        <CameraIcon class="w-6 h-6" />
        <span>Foto aufnehmen</span>
      </button>
      
      <button
        @click="selectFile"
        class="capture-btn"
        :disabled="disabled"
      >
        <PhotoIcon class="w-6 h-6" />
        <span>Datei wählen</span>
      </button>
      
      <button
        v-if="hasVoiceSupport"
        @click="recordAudio"
        class="capture-btn"
        :disabled="disabled"
      >
        <MicrophoneIcon class="w-6 h-6" />
        <span>Audio aufnehmen</span>
      </button>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*,video/*,audio/*"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Media Preview Grid -->
    <div v-if="mediaItems.length > 0" class="media-grid">
      <div
        v-for="(media, index) in mediaItems"
        :key="media.id"
        class="media-item"
      >
        <img
          v-if="media.type === 'image'"
          :src="media.url || media.data"
          :alt="media.caption || 'Captured image'"
          class="media-preview"
          @click="viewMedia(media)"
        />
        
        <video
          v-else-if="media.type === 'video'"
          :src="media.url || media.data"
          class="media-preview"
          controls
        />
        
        <div
          v-else-if="media.type === 'audio'"
          class="audio-preview"
          @click="playAudio(media)"
        >
          <SpeakerWaveIcon class="w-12 h-12" />
          <span class="text-xs">Audio {{ index + 1 }}</span>
        </div>

        <button
          @click="removeMedia(media.id)"
          class="remove-btn"
          :disabled="disabled"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>

        <button
          @click="addCaption(media)"
          class="caption-btn"
          :disabled="disabled"
        >
          <PencilIcon class="w-3 h-3" />
        </button>
      </div>
    </div>

    <!-- AI Analysis Results -->
    <div v-if="aiAnalysis" class="ai-analysis">
      <div class="analysis-header">
        <SparklesIcon class="w-5 h-5 text-accent-primary" />
        <span>KI-Analyse</span>
      </div>
      <p class="analysis-text">{{ aiAnalysis }}</p>
    </div>

    <!-- Camera Modal -->
    <CameraModal
      v-if="showCamera"
      @capture="handlePhotoCapture"
      @close="showCamera = false"
    />

    <!-- Audio Recorder Modal -->
    <AudioRecorderModal
      v-if="showAudioRecorder"
      @record="handleAudioRecord"
      @close="showAudioRecorder = false"
    />

    <!-- Caption Modal -->
    <CaptionModal
      v-if="showCaptionModal"
      v-model="currentCaption"
      @save="handleCaptionSave"
      @close="showCaptionModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  CameraIcon,
  PhotoIcon,
  MicrophoneIcon,
  XMarkIcon,
  PencilIcon,
  SpeakerWaveIcon,
  SparklesIcon
} from '@heroicons/vue/24/outline'

import CameraModal from '@/components/modals/CameraModal.vue'
import AudioRecorderModal from '@/components/modals/AudioRecorderModal.vue'
import CaptionModal from '@/components/modals/CaptionModal.vue'

import type { Question, QuestionResponse, MediaAttachment } from '@/types'

interface Props {
  question: Question
  modelValue?: QuestionResponse
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: QuestionResponse]
}>()

const fileInput = ref<HTMLInputElement>()
const showCamera = ref(false)
const showAudioRecorder = ref(false)
const showCaptionModal = ref(false)
const currentMedia = ref<MediaAttachment | null>(null)
const currentCaption = ref('')
const aiAnalysis = ref<string | null>(null)

const hasVoiceSupport = computed(() => {
  return 'MediaRecorder' in window
})

const mediaItems = computed(() => {
  return props.modelValue?.media || []
})

function capturePhoto() {
  showCamera.value = true
}

function selectFile() {
  fileInput.value?.click()
}

function recordAudio() {
  showAudioRecorder.value = true
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const media: MediaAttachment = {
      id: crypto.randomUUID(),
      type: file.type.startsWith('image/') ? 'image' : 
            file.type.startsWith('video/') ? 'video' : 'audio',
      data: e.target?.result as string,
      createdAt: new Date().toISOString()
    }
    
    addMedia(media)
    analyzeMedia(media)
  }
  
  reader.readAsDataURL(file)
}

function handlePhotoCapture(photoData: string) {
  const media: MediaAttachment = {
    id: crypto.randomUUID(),
    type: 'image',
    data: photoData,
    createdAt: new Date().toISOString()
  }
  
  addMedia(media)
  analyzeMedia(media)
  showCamera.value = false
}

function handleAudioRecord(audioData: string) {
  const media: MediaAttachment = {
    id: crypto.randomUUID(),
    type: 'audio',
    data: audioData,
    createdAt: new Date().toISOString()
  }
  
  addMedia(media)
  showAudioRecorder.value = false
}

function addMedia(media: MediaAttachment) {
  const currentMedia = props.modelValue?.media || []
  const newMedia = [...currentMedia, media]
  
  updateResponse({ media: newMedia })
}

function removeMedia(mediaId: string) {
  const currentMedia = props.modelValue?.media || []
  const newMedia = currentMedia.filter(m => m.id !== mediaId)
  
  updateResponse({ media: newMedia })
}

function addCaption(media: MediaAttachment) {
  currentMedia.value = media
  currentCaption.value = media.caption || ''
  showCaptionModal.value = true
}

function handleCaptionSave() {
  if (!currentMedia.value) return
  
  const currentMediaItems = props.modelValue?.media || []
  const updatedMedia = currentMediaItems.map(m => 
    m.id === currentMedia.value!.id 
      ? { ...m, caption: currentCaption.value }
      : m
  )
  
  updateResponse({ media: updatedMedia })
  showCaptionModal.value = false
}

function viewMedia(media: MediaAttachment) {
  // Implement media viewer
  console.log('View media:', media)
}

function playAudio(media: MediaAttachment) {
  // Implement audio player
  console.log('Play audio:', media)
}

async function analyzeMedia(media: MediaAttachment) {
  // Simulate AI analysis
  if (media.type === 'image') {
    setTimeout(() => {
      aiAnalysis.value = 'Sicherheitshelm erkannt ✓ | Warnweste sichtbar ✓ | Keine offensichtlichen Mängel gefunden'
    }, 2000)
  }
}

function updateResponse(updates: Partial<QuestionResponse>) {
  const response: QuestionResponse = {
    questionId: props.question.id,
    value: true, // Media questions are considered answered if they have media
    updatedAt: new Date().toISOString(),
    ...props.modelValue,
    ...updates
  }
  
  emit('update:modelValue', response)
}
</script>

<style scoped>
.capture-buttons {
  @apply grid grid-cols-2 md:grid-cols-3 gap-3;
}

.capture-btn {
  @apply flex flex-col items-center justify-center gap-2 p-4;
  @apply bg-surface-tertiary rounded-lg;
  @apply hover:bg-accent-primary hover:bg-opacity-20 transition-all;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.media-grid {
  @apply grid grid-cols-3 gap-3 mt-4;
}

.media-item {
  @apply relative aspect-square rounded-lg overflow-hidden;
  @apply bg-surface-tertiary;
}

.media-preview {
  @apply w-full h-full object-cover cursor-pointer;
  @apply hover:opacity-90 transition-opacity;
}

.audio-preview {
  @apply w-full h-full flex flex-col items-center justify-center;
  @apply text-text-secondary cursor-pointer;
  @apply hover:bg-surface-tertiary transition-colors;
}

.remove-btn {
  @apply absolute top-1 right-1 p-1.5 rounded-full;
  @apply bg-surface-primary bg-opacity-80;
  @apply hover:bg-opacity-100 transition-all;
}

.caption-btn {
  @apply absolute bottom-1 right-1 p-1.5 rounded-full;
  @apply bg-surface-primary bg-opacity-80;
  @apply hover:bg-opacity-100 transition-all;
}

.ai-analysis {
  @apply mt-4 p-4 bg-accent-primary bg-opacity-10;
  @apply rounded-lg border border-accent-primary border-opacity-30;
}

.analysis-header {
  @apply flex items-center gap-2 mb-2;
  @apply text-sm font-medium text-accent-primary;
}

.analysis-text {
  @apply text-sm text-text-secondary;
}
</style>
