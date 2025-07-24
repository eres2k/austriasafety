<template>
  <div class="checkbox-question">
    <div class="options-list">
      <label
        v-for="option in question.options"
        :key="option.id"
        class="option-item"
        :class="{ disabled: disabled }"
      >
        <input
          type="checkbox"
          :value="option.value"
          :checked="isChecked(option.value)"
          :disabled="disabled"
          @change="handleChange(option.value)"
          class="checkbox-input"
        />
        
        <div class="option-content">
          <div 
            class="checkbox-indicator"
            :style="{ 
              borderColor: isChecked(option.value) ? option.color : undefined,
              backgroundColor: isChecked(option.value) ? option.color : undefined 
            }"
          >
            <CheckIcon 
              v-if="isChecked(option.value)" 
              class="w-3 h-3 text-white" 
            />
          </div>
          
          <span class="option-label">{{ option.label }}</span>
        </div>
      </label>
    </div>

    <div v-if="showOtherInput" class="other-input">
      <input
        v-model="otherValue"
        type="text"
        placeholder="Bitte spezifizieren..."
        @input="handleOtherInput"
        class="text-input"
        :disabled="disabled"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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
}>()

const otherValue = ref('')

const selectedValues = computed(() => {
  const value = props.modelValue?.value
  if (Array.isArray(value)) return value
  if (value) return [value]
  return []
})

const showOtherInput = computed(() => {
  return props.question.options?.some(opt => opt.value === 'other') &&
         selectedValues.value.includes('other')
})

function isChecked(value: any): boolean {
  return selectedValues.value.includes(value)
}

function handleChange(value: any) {
  const currentValues = [...selectedValues.value]
  const index = currentValues.indexOf(value)
  
  if (index > -1) {
    currentValues.splice(index, 1)
  } else {
    currentValues.push(value)
  }
  
  updateResponse(currentValues)
}

function handleOtherInput() {
  // Handle "other" option with custom text
  const currentValues = [...selectedValues.value]
  const otherIndex = currentValues.indexOf('other')
  
  if (otherIndex > -1 && otherValue.value) {
    currentValues[otherIndex] = `other:${otherValue.value}`
  }
  
  updateResponse(currentValues)
}

function updateResponse(values: any[]) {
  const response: QuestionResponse = {
    questionId: props.question.id,
    value: values,
    status: getStatus(values),
    updatedAt: new Date().toISOString()
  }
  
  if (props.modelValue) {
    response.note = props.modelValue.note
    response.media = props.modelValue.media
  }
  
  emit('update:modelValue', response)
}

function getStatus(values: any[]): 'passed' | 'failed' | 'na' | 'pending' {
  if (values.length === 0) return 'pending'
  
  // Check if any selected option indicates a failure
  const hasFailureOption = values.some(value => {
    const option = props.question.options?.find(opt => opt.value === value)
    return option?.label?.toLowerCase().includes('nein') || 
           option?.label?.toLowerCase().includes('fehlt') ||
           option?.label?.toLowerCase().includes('mangel')
  })
  
  return hasFailureOption ? 'failed' : 'passed'
}
</script>

<style scoped>
.options-list {
  @apply space-y-3;
}

.option-item {
  @apply flex items-start gap-3 p-4;
  @apply bg-surface-tertiary rounded-lg;
  @apply cursor-pointer transition-all;
  @apply hover:bg-opacity-80;
}

.option-item.disabled {
  @apply opacity-50 cursor-not-allowed;
}

.checkbox-input {
  @apply sr-only;
}

.option-content {
  @apply flex items-center gap-3;
}

.checkbox-indicator {
  @apply w-5 h-5 rounded border-2 border-surface-tertiary;
  @apply flex items-center justify-center transition-all;
  @apply flex-shrink-0;
}

.option-label {
  @apply text-sm font-medium;
}

.other-input {
  @apply mt-3;
}

.text-input {
  @apply w-full px-4 py-2;
  @apply bg-surface-tertiary rounded-lg;
  @apply border-2 border-transparent;
  @apply focus:border-accent-primary outline-none;
}
</style>
