<!-- src/components/questions/ScaleQuestion.vue -->
<template>
  <div class="scale-question">
    <div class="scale-container">
      <!-- Scale Options -->
      <div class="scale-options">
        <button
          v-for="option in question.options"
          :key="option.id"
          @click="selectValue(option.value)"
          class="scale-option"
          :class="{
            selected: modelValue?.value === option.value,
            'before-selected': isBeforeSelected(option.value),
            disabled: disabled
          }"
          :disabled="disabled"
        >
          <span class="option-value">{{ option.value }}</span>
          <span v-if="option.label" class="option-label">{{ option.label }}</span>
        </button>
      </div>

      <!-- Visual Scale Bar -->
      <div class="scale-bar">
        <div 
          class="scale-fill"
          :style="{ width: `${fillPercentage}%` }"
        />
        <div 
          v-if="modelValue?.value"
          class="scale-indicator"
          :style="{ left: `${fillPercentage}%` }"
        >
          <div class="indicator-dot" />
        </div>
      </div>

      <!-- Scale Labels -->
      <div class="scale-labels">
        <span class="label-start">{{ getScaleLabel('start') }}</span>
        <span class="label-center">{{ getScaleLabel('center') }}</span>
        <span class="label-end">{{ getScaleLabel('end') }}</span>
      </div>
    </div>

    <!-- Emoji Feedback -->
    <div v-if="showEmojiFeedback" class="emoji-feedback">
      <transition name="emoji-fade" mode="out-in">
        <div :key="currentEmoji" class="emoji-display">
          {{ currentEmoji }}
        </div>
      </transition>
    </div>

    <!-- Voice Input for Scale -->
    <div v-if="voiceEnabled" class="voice-scale">
      <button
        @click="toggleVoiceInput"
        class="voice-scale-btn"
        :class="{ active: isListening }"
        :disabled="disabled"
      >
        <MicrophoneIcon class="w-4 h-4" />
        <span>Wert ansagen (1-{{ maxValue }})</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { MicrophoneIcon } from '@heroicons/vue/24/outline'
import { VoiceRecognition } from '@/utils/voice'
import type { Question, QuestionResponse } from '@/types'

interface Props {
  question: Question
  modelValue?: QuestionResponse
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: QuestionResponse]
  'voice-input': [text: string]
}>()

// State
const isListening = ref(false)
const voiceRecognition = ref<VoiceRecognition | null>(null)
const showEmojiFeedback = ref(true)

// Computed
const maxValue = computed(() => {
  return props.question.options?.length || 5
})

const fillPercentage = computed(() => {
  if (!props.modelValue?.value) return 0
  const value = Number(props.modelValue.value)
  return ((value - 1) / (maxValue.value - 1)) * 100
})

const currentEmoji = computed(() => {
  if (!props.modelValue?.value) return '😐'
  
  const value = Number(props.modelValue.value)
  const percentage = value / maxValue.value
  
  if (percentage <= 0.2) return '😟'
  if (percentage <= 0.4) return '😕'
  if (percentage <= 0.6) return '😐'
  if (percentage <= 0.8) return '🙂'
  return '😄'
})

const voiceEnabled = computed(() => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
})

// Methods
function selectValue(value: any) {
  updateResponse(value)
  
  // Haptic feedback on mobile
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
}

function isBeforeSelected(value: number): boolean {
  if (!props.modelValue?.value) return false
  return value < props.modelValue.value
}

function getScaleLabel(position: 'start' | 'center' | 'end'): string {
  // Default labels based on scale type
  const scaleType = detectScaleType()
  
  switch (scaleType) {
    case 'satisfaction':
      if (position === 'start') return 'Sehr unzufrieden'
      if (position === 'center') return 'Neutral'
      return 'Sehr zufrieden'
      
    case 'agreement':
      if (position === 'start') return 'Stimme nicht zu'
      if (position === 'center') return 'Neutral'
      return 'Stimme voll zu'
      
    case 'quality':
      if (position === 'start') return 'Mangelhaft'
      if (position === 'center') return 'Befriedigend'
      return 'Ausgezeichnet'
      
    default:
      if (position === 'start') return 'Niedrig'
      if (position === 'center') return 'Mittel'
      return 'Hoch'
  }
}

function detectScaleType(): string {
  const title = props.question.title.toLowerCase()
  if (title.includes('zufrieden')) return 'satisfaction'
  if (title.includes('zustimm') || title.includes('einverstand')) return 'agreement'
  if (title.includes('qualität') || title.includes('zustand')) return 'quality'
  return 'default'
}

function toggleVoiceInput() {
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
  // Parse number from voice input
  const numbers = text.match(/\d+/g)
  if (numbers) {
    const value = parseInt(numbers[0])
    if (value >= 1 && value <= maxValue.value) {
      selectValue(value)
      emit('voice-input', text)
    }
  }
  
  stopVoiceInput()
}

function handleVoiceError(error: any) {
  console.error('Voice recognition error:', error)
  isListening.value = false
}

function updateResponse(value: any) {
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

// Animate emoji on value change
watch(() => props.modelValue?.value, () => {
  if (showEmojiFeedback.value) {
    // Brief animation effect
    showEmojiFeedback.value = false
    setTimeout(() => {
      showEmojiFeedback.value = true
    }, 100)
  }
})
</script>

<style scoped>
.scale-container {
  @apply space-y-4;
}

.scale-options {
  @apply flex items-center justify-between gap-2;
}

.scale-option {
  @apply flex-1 flex flex-col items-center justify-center;
  @apply p-3 rounded-lg bg-surface-tertiary;
  @apply border-2 border-transparent;
  @apply hover:bg-opacity-80 transition-all;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply relative overflow-hidden;
}

.scale-option.selected {
  @apply border-accent-primary bg-accent-primary bg-opacity-20;
  @apply transform scale-105;
}

.scale-option.before-selected {
  @apply bg-accent-primary bg-opacity-10;
}

.option-value {
  @apply text-lg font-bold;
}

.option-label {
  @apply text-xs text-text-secondary mt-1;
}

.scale-bar {
  @apply relative h-2 bg-surface-tertiary rounded-full overflow-hidden;
}

.scale-fill {
  @apply absolute inset-y-0 left-0 bg-accent-primary;
  @apply transition-all duration-300 ease-out;
}

.scale-indicator {
  @apply absolute top-1/2 -translate-y-1/2 -translate-x-1/2;
  @apply transition-all duration-300 ease-out;
}

.indicator-dot {
  @apply w-4 h-4 bg-accent-primary rounded-full;
  @apply border-2 border-surface-primary;
  @apply shadow-lg;
}

.scale-labels {
  @apply flex justify-between text-xs text-text-secondary;
}

.label-center {
  @apply absolute left-1/2 -translate-x-1/2;
}

.emoji-feedback {
  @apply flex justify-center mt-6;
}

.emoji-display {
  @apply text-5xl;
  @apply transform transition-all duration-300;
}

.emoji-fade-enter-active,
.emoji-fade-leave-active {
  transition: all 0.3s ease;
}

.emoji-fade-enter-from {
  opacity: 0;
  transform: scale(0.8) rotate(-10deg);
}

.emoji-fade-leave-to {
  opacity: 0;
  transform: scale(1.2) rotate(10deg);
}

.voice-scale {
  @apply mt-4;
}

.voice-scale-btn {
  @apply flex items-center justify-center gap-2 w-full;
  @apply p-3 bg-surface-tertiary rounded-lg;
  @apply text-sm text-text-secondary;
  @apply hover:bg-opacity-80 transition-all;
}

.voice-scale-btn.active {
  @apply bg-accent-error bg-opacity-20 text-accent-error;
  @apply animate-pulse;
}

/* Ripple effect on selection */
.scale-option::after {
  content: '';
  @apply absolute inset-0 bg-accent-primary opacity-0;
  @apply transition-opacity duration-300;
  @apply pointer-events-none;
}

.scale-option:active::after {
  @apply opacity-20;
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  from {
    transform: scale(0);
    opacity: 0.4;
  }
  to {
    transform: scale(1);
    opacity: 0;
  }
}
</style>
