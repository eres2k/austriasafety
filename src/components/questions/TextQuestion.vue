<!-- src/components/questions/TextQuestion.vue -->
<template>
  <div class="text-question">
    <div class="input-wrapper">
      <textarea
        v-if="isTextarea"
        v-model="inputValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxLength"
        @input="handleInput"
        @focus="isFocused = true"
        @blur="isFocused = false"
        class="text-input textarea"
        :rows="rows"
      />
      
      <input
        v-else
        v-model="inputValue"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxLength"
        @input="handleInput"
        @focus="isFocused = true"
        @blur="isFocused = false"
        class="text-input"
      />

      <button
        v-if="voiceEnabled && !disabled"
        @click="toggleVoiceInput"
        class="voice-btn"
        :class="{ active: isListening }"
      >
        <MicrophoneIcon class="w-4 h-4" />
      </button>
    </div>

    <div class="input-footer">
      <span v-if="showCharCount" class="char-count">
        {{ inputValue.length }} / {{ maxLength }}
      </span>
      
      <span v-if="validationError" class="error-text">
        {{ validationError }}
      </span>
    </div>

    <!-- Voice transcription preview -->
    <div v-if="isListening" class="voice-preview">
      <div class="voice-wave">
        <span v-for="i in 5" :key="i" class="wave-bar"></span>
      </div>
      <span class="text-sm text-text-secondary">Sprechen Sie jetzt...</span>
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
const inputValue = ref('')
const isFocused = ref(false)
const isListening = ref(false)
const validationError = ref('')
const voiceRecognition = ref<VoiceRecognition | null>(null)

// Computed
const isTextarea = computed(() => {
  const minLength = props.question.validation?.find(v => v.type === 'min')?.value || 0
  return minLength > 100
})

const rows = computed(() => {
  const minLength = props.question.validation?.find(v => v.type === 'min')?.value || 0
  if (minLength > 200) return 5
  if (minLength > 100) return 3
  return 2
})

const maxLength = computed(() => {
  const maxRule = props.question.validation?.find(v => v.type === 'max')
  return maxRule?.value || (isTextarea.value ? 1000 : 200)
})

const showCharCount = computed(() => {
  return maxLength.value < 1000 && (isFocused.value || inputValue.value.length > 0)
})

const placeholder = computed(() => {
  return props.question.description || 'Ihre Antwort eingeben...'
})

const voiceEnabled = computed(() => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
})

// Initialize value from modelValue
if (props.modelValue?.value) {
  inputValue.value = props.modelValue.value
}

// Methods
function handleInput() {
  validateInput()
  updateResponse()
}

function validateInput() {
  validationError.value = ''
  
  if (!props.question.validation) return
  
  for (const rule of props.question.validation) {
    switch (rule.type) {
      case 'required':
        if (!inputValue.value.trim()) {
          validationError.value = rule.message
          return
        }
        break
        
      case 'min':
        if (inputValue.value.length < rule.value) {
          validationError.value = rule.message
          return
        }
        break
        
      case 'max':
        if (inputValue.value.length > rule.value) {
          validationError.value = rule.message
          return
        }
        break
        
      case 'pattern':
        const regex = new RegExp(rule.value)
        if (!regex.test(inputValue.value)) {
          validationError.value = rule.message
          return
        }
        break
    }
  }
}

function updateResponse() {
  const response: QuestionResponse = {
    questionId: props.question.id,
    value: inputValue.value,
    updatedAt: new Date().toISOString()
  }
  
  if (props.modelValue) {
    response.note = props.modelValue.note
    response.media = props.modelValue.media
    response.status = props.modelValue.status
  }
  
  emit('update:modelValue', response)
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
  // Append to existing text with a space
  if (inputValue.value) {
    inputValue.value += ' ' + text
  } else {
    inputValue.value = text
  }
  
  handleInput()
  emit('voice-input', text)
}

function handleVoiceError(error: any) {
  console.error('Voice recognition error:', error)
  isListening.value = false
}

// Cleanup
watch(() => props.disabled, (disabled) => {
  if (disabled && isListening.value) {
    stopVoiceInput()
  }
})
</script>

<style scoped>
.input-wrapper {
  @apply relative;
}

.text-input {
  @apply w-full px-4 py-3 pr-12;
  @apply bg-surface-tertiary rounded-lg;
  @apply border-2 border-transparent;
  @apply text-text-primary placeholder-text-tertiary;
  @apply outline-none transition-all;
  @apply focus:border-accent-primary focus:bg-surface-primary;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.text-input.textarea {
  @apply resize-none;
}

.voice-btn {
  @apply absolute right-2 top-3 p-2;
  @apply rounded-lg bg-surface-primary;
  @apply text-text-secondary hover:text-accent-primary;
  @apply transition-all;
}

.voice-btn.active {
  @apply bg-accent-error text-white animate-pulse;
}

.input-footer {
  @apply flex items-center justify-between mt-2 px-1;
  @apply text-xs;
}

.char-count {
  @apply text-text-tertiary;
}

.error-text {
  @apply text-accent-error;
}

.voice-preview {
  @apply flex items-center gap-3 mt-3 p-3;
  @apply bg-surface-tertiary rounded-lg;
}

.voice-wave {
  @apply flex items-center gap-1;
}

.wave-bar {
  @apply w-1 bg-accent-primary rounded-full;
  @apply animate-wave;
}

.wave-bar:nth-child(1) { @apply h-2; animation-delay: 0ms; }
.wave-bar:nth-child(2) { @apply h-4; animation-delay: 100ms; }
.wave-bar:nth-child(3) { @apply h-6; animation-delay: 200ms; }
.wave-bar:nth-child(4) { @apply h-4; animation-delay: 300ms; }
.wave-bar:nth-child(5) { @apply h-2; animation-delay: 400ms; }

@keyframes wave {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(2); }
}
</style>
