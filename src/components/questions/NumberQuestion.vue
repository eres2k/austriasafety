<!-- src/components/questions/NumberQuestion.vue -->
<template>
  <div class="number-question">
    <div class="input-wrapper">
      <button
        @click="decrease"
        class="stepper-btn"
        :disabled="disabled || (min !== undefined && numberValue <= min)"
      >
        <MinusIcon class="w-4 h-4" />
      </button>

      <input
        v-model.number="numberValue"
        type="number"
        :min="min"
        :max="max"
        :step="step"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="handleInput"
        @wheel="handleWheel"
        class="number-input"
      />

      <button
        @click="increase"
        class="stepper-btn"
        :disabled="disabled || (max !== undefined && numberValue >= max)"
      >
        <PlusIcon class="w-4 h-4" />
      </button>

      <span v-if="unit" class="unit-label">
        {{ unit }}
      </span>
    </div>

    <!-- Quick Select Options -->
    <div v-if="quickOptions.length > 0" class="quick-options">
      <button
        v-for="option in quickOptions"
        :key="option"
        @click="numberValue = option"
        class="quick-option"
        :class="{ active: numberValue === option }"
        :disabled="disabled"
      >
        {{ option }}
      </button>
    </div>

    <!-- Visual Range Indicator -->
    <div v-if="showRange" class="range-indicator">
      <div class="range-bar">
        <div 
          class="range-fill"
          :style="{ width: `${rangePercentage}%` }"
          :class="getRangeClass()"
        />
        <div 
          class="range-marker"
          :style="{ left: `${rangePercentage}%` }"
        />
      </div>
      <div class="range-labels">
        <span>{{ min || 0 }}</span>
        <span>{{ max || 100 }}</span>
      </div>
    </div>

    <!-- Validation Message -->
    <div v-if="validationError" class="error-message">
      {{ validationError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { MinusIcon, PlusIcon } from '@heroicons/vue/24/outline'
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
const numberValue = ref<number>(0)
const validationError = ref('')

// Extract validation rules
const min = computed(() => {
  const minRule = props.question.validation?.find(v => v.type === 'min')
  return minRule?.value as number | undefined
})

const max = computed(() => {
  const maxRule = props.question.validation?.find(v => v.type === 'max')
  return maxRule?.value as number | undefined
})

const step = computed(() => {
  // Determine step based on the question context
  if (props.question.title.toLowerCase().includes('prozent') || 
      props.question.title.toLowerCase().includes('percentage')) {
    return 5
  }
  if (props.question.title.toLowerCase().includes('temperatur')) {
    return 0.1
  }
  return 1
})

const unit = computed(() => {
  // Extract unit from question title or description
  const text = props.question.title + ' ' + (props.question.description || '')
  
  if (text.includes('°C')) return '°C'
  if (text.includes('°F')) return '°F'
  if (text.includes('%')) return '%'
  if (text.includes('kg')) return 'kg'
  if (text.includes('m²')) return 'm²'
  if (text.includes('min')) return 'min'
  if (text.includes('Stück')) return 'Stück'
  
  return ''
})

const placeholder = computed(() => {
  if (min.value !== undefined && max.value !== undefined) {
    return `${min.value} - ${max.value}`
  }
  return '0'
})

const quickOptions = computed(() => {
  // Generate quick select options based on range
  if (!min.value || !max.value) return []
  
  const range = max.value - min.value
  if (range <= 10) return []
  
  const options = []
  const steps = 5
  
  for (let i = 0; i <= steps; i++) {
    const value = Math.round(min.value + (range / steps) * i)
    options.push(value)
  }
  
  return options
})

const showRange = computed(() => {
  return min.value !== undefined && max.value !== undefined
})

const rangePercentage = computed(() => {
  if (!showRange.value) return 0
  
  const range = max.value! - min.value!
  const value = Math.max(min.value!, Math.min(max.value!, numberValue.value))
  return ((value - min.value!) / range) * 100
})

// Initialize value
if (props.modelValue?.value !== undefined) {
  numberValue.value = Number(props.modelValue.value)
} else if (min.value !== undefined) {
  numberValue.value = min.value
}

// Methods
function handleInput() {
  validateValue()
  updateResponse()
}

function handleWheel(event: WheelEvent) {
  if (disabled.value) return
  
  event.preventDefault()
  
  if (event.deltaY < 0) {
    increase()
  } else {
    decrease()
  }
}

function increase() {
  const newValue = numberValue.value + step.value
  if (max.value === undefined || newValue <= max.value) {
    numberValue.value = newValue
    handleInput()
  }
}

function decrease() {
  const newValue = numberValue.value - step.value
  if (min.value === undefined || newValue >= min.value) {
    numberValue.value = newValue
    handleInput()
  }
}

function validateValue() {
  validationError.value = ''
  
  if (!props.question.validation) return
  
  for (const rule of props.question.validation) {
    switch (rule.type) {
      case 'required':
        if (numberValue.value === null || numberValue.value === undefined) {
          validationError.value = rule.message
          return
        }
        break
        
      case 'min':
        if (numberValue.value < rule.value) {
          validationError.value = rule.message
          return
        }
        break
        
      case 'max':
        if (numberValue.value > rule.value) {
          validationError.value = rule.message
          return
        }
        break
    }
  }
}

function getRangeClass() {
  const percentage = rangePercentage.value
  
  if (percentage >= 80) return 'range-good'
  if (percentage >= 60) return 'range-ok'
  if (percentage >= 40) return 'range-warning'
  return 'range-bad'
}

function updateResponse() {
  const response: QuestionResponse = {
    questionId: props.question.id,
    value: numberValue.value,
    updatedAt: new Date().toISOString()
  }
  
  if (props.modelValue) {
    response.note = props.modelValue.note
    response.media = props.modelValue.media
    response.status = props.modelValue.status
  }
  
  emit('update:modelValue', response)
}
</script>

<style scoped>
.input-wrapper {
  @apply flex items-center gap-2;
}

.stepper-btn {
  @apply w-10 h-10 rounded-lg;
  @apply bg-surface-tertiary hover:bg-accent-primary hover:bg-opacity-20;
  @apply flex items-center justify-center;
  @apply transition-all;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.number-input {
  @apply flex-1 px-4 py-2 text-center;
  @apply bg-surface-tertiary rounded-lg;
  @apply border-2 border-transparent;
  @apply text-lg font-medium;
  @apply focus:border-accent-primary focus:bg-surface-primary;
  @apply outline-none transition-all;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  
  /* Hide number spinners */
  -moz-appearance: textfield;
}

.number-input::-webkit-outer-spin-button,
.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.unit-label {
  @apply text-sm font-medium text-text-secondary;
  @apply px-3;
}

.quick-options {
  @apply flex gap-2 mt-3;
  @apply overflow-x-auto pb-2;
}

.quick-option {
  @apply px-3 py-1.5 rounded-lg;
  @apply bg-surface-tertiary text-sm;
  @apply hover:bg-accent-primary hover:bg-opacity-20;
  @apply transition-all whitespace-nowrap;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.quick-option.active {
  @apply bg-accent-primary text-white;
}

.range-indicator {
  @apply mt-4;
}

.range-bar {
  @apply relative h-2 bg-surface-tertiary rounded-full overflow-hidden;
}

.range-fill {
  @apply absolute inset-y-0 left-0;
  @apply transition-all duration-300;
}

.range-fill.range-good {
  @apply bg-accent-success;
}

.range-fill.range-ok {
  @apply bg-accent-primary;
}

.range-fill.range-warning {
  @apply bg-accent-warning;
}

.range-fill.range-bad {
  @apply bg-accent-error;
}

.range-marker {
  @apply absolute top-1/2 -translate-y-1/2 -translate-x-1/2;
  @apply w-4 h-4 bg-white rounded-full;
  @apply border-2 border-surface-primary;
  @apply shadow-lg transition-all duration-300;
}

.range-labels {
  @apply flex justify-between mt-1;
  @apply text-xs text-text-tertiary;
}

.error-message {
  @apply text-sm text-accent-error mt-2;
}
</style>
