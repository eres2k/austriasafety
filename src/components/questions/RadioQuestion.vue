<!-- src/components/questions/RadioQuestion.vue -->
<template>
  <div class="radio-question">
    <div class="options-grid">
      <label
        v-for="option in question.options"
        :key="option.id"
        class="option-card"
        :class="{
          selected: modelValue?.value === option.value,
          disabled: disabled
        }"
      >
        <input
          type="radio"
          :name="`q-${question.id}`"
          :value="option.value"
          :checked="modelValue?.value === option.value"
          :disabled="disabled"
          @change="handleChange(option.value)"
          class="sr-only"
        />
        
        <div 
          class="option-indicator"
          :style="{ 
            backgroundColor: modelValue?.value === option.value ? option.color : undefined 
          }"
        >
          <CheckIcon 
            v-if="modelValue?.value === option.value" 
            class="w-4 h-4 text-white" 
          />
        </div>
        
        <span class="option-label">{{ option.label }}</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/24/solid'
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

function handleChange(value: any) {
  const response: QuestionResponse = {
    questionId: props.question.id,
    value,
    status: getStatus(value),
    updatedAt: new Date().toISOString()
  }
  
  if (props.modelValue) {
    response.note = props.modelValue.note
    response.media = props.modelValue.media
  }
  
  emit('update:modelValue', response)
}

function getStatus(value: any): 'passed' | 'failed' | 'na' | 'pending' {
  // Map values to status based on common patterns
  if (value === 'passed' || value === 'yes' || value === 'ja') return 'passed'
  if (value === 'failed' || value === 'no' || value === 'nein') return 'failed'
  if (value === 'na' || value === 'n/a') return 'na'
  return 'pending'
}
</script>

<style scoped>
.options-grid {
  @apply grid grid-cols-1 sm:grid-cols-3 gap-3;
}

.option-card {
  @apply relative flex items-center gap-3 p-4;
  @apply bg-surface-tertiary rounded-lg border-2 border-transparent;
  @apply cursor-pointer transition-all;
  @apply hover:border-surface-tertiary hover:bg-opacity-80;
}

.option-card.selected {
  @apply border-accent-primary bg-accent-primary bg-opacity-10;
}

.option-card.disabled {
  @apply opacity-50 cursor-not-allowed;
}

.option-indicator {
  @apply w-6 h-6 rounded-full border-2 border-surface-tertiary;
  @apply flex items-center justify-center transition-all;
}

.option-card.selected .option-indicator {
  @apply border-transparent;
}

.option-label {
  @apply text-sm font-medium;
}
</style>
