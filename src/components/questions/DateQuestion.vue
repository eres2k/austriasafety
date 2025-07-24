<!-- src/components/questions/DateQuestion.vue -->
<template>
  <div class="date-question">
    <div class="date-input-wrapper">
      <input
        v-model="dateValue"
        type="date"
        :min="minDate"
        :max="maxDate"
        :disabled="disabled"
        @change="handleChange"
        class="date-input"
      />
      
      <CalendarIcon class="calendar-icon" />
    </div>

    <!-- Quick Select Buttons -->
    <div class="quick-select">
      <button
        @click="selectToday"
        class="quick-btn"
        :disabled="disabled"
      >
        Heute
      </button>
      <button
        @click="selectYesterday"
        class="quick-btn"
        :disabled="disabled"
      >
        Gestern
      </button>
      <button
        @click="selectLastWeek"
        class="quick-btn"
        :disabled="disabled"
      >
        Letzte Woche
      </button>
      <button
        @click="selectLastMonth"
        class="quick-btn"
        :disabled="disabled"
      >
        Letzter Monat
      </button>
    </div>

    <!-- Calendar Preview -->
    <div v-if="showCalendarPreview" class="calendar-preview">
      <div class="calendar-header">
        <button @click="previousMonth" class="nav-btn">
          <ChevronLeftIcon class="w-4 h-4" />
        </button>
        <span class="month-year">
          {{ formatMonth(calendarMonth) }} {{ calendarYear }}
        </span>
        <button @click="nextMonth" class="nav-btn">
          <ChevronRightIcon class="w-4 h-4" />
        </button>
      </div>

      <div class="calendar-grid">
        <div v-for="day in weekDays" :key="day" class="weekday">
          {{ day }}
        </div>
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          @click="selectDate(day)"
          class="calendar-day"
          :class="{
            'other-month': day && !isCurrentMonth(day),
            'selected': day && isSelected(day),
            'today': day && isToday(day),
            'disabled': day && !isSelectable(day)
          }"
        >
          {{ day ? day.getDate() : '' }}
        </div>
      </div>
    </div>

    <!-- Relative Date Display -->
    <div v-if="dateValue" class="relative-date">
      <ClockIcon class="w-4 h-4 text-text-tertiary" />
      <span class="text-sm text-text-secondary">
        {{ getRelativeDate() }}
      </span>
    </div>

    <!-- Validation Message -->
    <div v-if="validationError" class="error-message">
      {{ validationError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { format, formatRelative, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday as isTodayFn, isSameMonth } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  CalendarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
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
const dateValue = ref('')
const validationError = ref('')
const showCalendarPreview = ref(true)
const calendarMonth = ref(new Date().getMonth())
const calendarYear = ref(new Date().getFullYear())

// Constants
const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

// Computed
const minDate = computed(() => {
  const minRule = props.question.validation?.find(v => v.type === 'min')
  if (minRule?.value === 'today') {
    return format(new Date(), 'yyyy-MM-dd')
  }
  return minRule?.value as string | undefined
})

const maxDate = computed(() => {
  const maxRule = props.question.validation?.find(v => v.type === 'max')
  if (maxRule?.value === 'today') {
    return format(new Date(), 'yyyy-MM-dd')
  }
  return maxRule?.value as string | undefined
})

const calendarDays = computed(() => {
  const firstDay = new Date(calendarYear.value, calendarMonth.value, 1)
  const lastDay = endOfMonth(firstDay)
  const days = eachDayOfInterval({ start: firstDay, end: lastDay })
  
  // Add padding for the first week
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
  const paddingDays = Array(firstDayOfWeek).fill(null)
  
  // Add padding for the last week
  const totalCells = paddingDays.length + days.length
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
  const trailingDays = Array(remainingCells).fill(null)
  
  return [...paddingDays, ...days, ...trailingDays]
})

// Initialize value
if (props.modelValue?.value) {
  dateValue.value = format(new Date(props.modelValue.value), 'yyyy-MM-dd')
}

// Methods
function handleChange() {
  validateValue()
  updateResponse()
}

function selectToday() {
  dateValue.value = format(new Date(), 'yyyy-MM-dd')
  handleChange()
}

function selectYesterday() {
  dateValue.value = format(addDays(new Date(), -1), 'yyyy-MM-dd')
  handleChange()
}

function selectLastWeek() {
  dateValue.value = format(addDays(new Date(), -7), 'yyyy-MM-dd')
  handleChange()
}

function selectLastMonth() {
  dateValue.value = format(addDays(new Date(), -30), 'yyyy-MM-dd')
  handleChange()
}

function selectDate(date: Date | null) {
  if (!date || !isSelectable(date)) return
  
  dateValue.value = format(date, 'yyyy-MM-dd')
  handleChange()
}

function previousMonth() {
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
}

function nextMonth() {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
}

function formatMonth(month: number): string {
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ]
  return months[month]
}

function isCurrentMonth(date: Date): boolean {
  return date.getMonth() === calendarMonth.value && 
         date.getFullYear() === calendarYear.value
}

function isSelected(date: Date): boolean {
  if (!dateValue.value) return false
  return isSameDay(date, new Date(dateValue.value))
}

function isToday(date: Date): boolean {
  return isTodayFn(date)
}

function isSelectable(date: Date): boolean {
  if (disabled.value) return false
  
  const dateStr = format(date, 'yyyy-MM-dd')
  
  if (minDate.value && dateStr < minDate.value) return false
  if (maxDate.value && dateStr > maxDate.value) return false
  
  return true
}

function getRelativeDate(): string {
  if (!dateValue.value) return ''
  
  const date = new Date(dateValue.value)
  const now = new Date()
  const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Heute'
  if (diffInDays === -1) return 'Gestern'
  if (diffInDays === 1) return 'Morgen'
  if (diffInDays > 0 && diffInDays <= 7) return `In ${diffInDays} Tagen`
  if (diffInDays < 0 && diffInDays >= -7) return `Vor ${Math.abs(diffInDays)} Tagen`
  
  return formatRelative(date, now, { locale: de })
}

function validateValue() {
  validationError.value = ''
  
  if (!props.question.validation) return
  
  for (const rule of props.question.validation) {
    switch (rule.type) {
      case 'required':
        if (!dateValue.value) {
          validationError.value = rule.message
          return
        }
        break
        
      case 'min':
        if (minDate.value && dateValue.value < minDate.value) {
          validationError.value = rule.message
          return
        }
        break
        
      case 'max':
        if (maxDate.value && dateValue.value > maxDate.value) {
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
    value: dateValue.value ? new Date(dateValue.value).toISOString() : '',
    updatedAt: new Date().toISOString()
  }
  
  if (props.modelValue) {
    response.note = props.modelValue.note
    response.media = props.modelValue.media
    response.status = props.modelValue.status
  }
  
  emit('update:modelValue', response)
}

// Update calendar view when date changes
watch(dateValue, (newValue) => {
  if (newValue) {
    const date = new Date(newValue)
    calendarMonth.value = date.getMonth()
    calendarYear.value = date.getFullYear()
  }
})
</script>

<style scoped>
.date-input-wrapper {
  @apply relative;
}

.date-input {
  @apply w-full px-4 py-3 pr-12;
  @apply bg-surface-tertiary rounded-lg;
  @apply border-2 border-transparent;
  @apply text-text-primary;
  @apply focus:border-accent-primary focus:bg-surface-primary;
  @apply outline-none transition-all;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.calendar-icon {
  @apply absolute right-3 top-1/2 -translate-y-1/2;
  @apply w-5 h-5 text-text-tertiary pointer-events-none;
}

.quick-select {
  @apply flex gap-2 mt-3;
  @apply overflow-x-auto pb-2;
}

.quick-btn {
  @apply px-3 py-1.5 rounded-lg;
  @apply bg-surface-tertiary text-sm whitespace-nowrap;
  @apply hover:bg-accent-primary hover:bg-opacity-20;
  @apply transition-all;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.calendar-preview {
  @apply mt-4 p-4 bg-surface-tertiary rounded-lg;
}

.calendar-header {
  @apply flex items-center justify-between mb-4;
}

.nav-btn {
  @apply p-1.5 rounded-lg;
  @apply hover:bg-surface-primary transition-colors;
}

.month-year {
  @apply font-medium text-sm;
}

.calendar-grid {
  @apply grid grid-cols-7 gap-1;
}

.weekday {
  @apply text-xs text-text-tertiary text-center font-medium;
  @apply py-2;
}

.calendar-day {
  @apply aspect-square flex items-center justify-center;
  @apply text-sm rounded-lg cursor-pointer;
  @apply hover:bg-surface-primary transition-colors;
}

.calendar-day.other-month {
  @apply text-text-tertiary opacity-50;
}

.calendar-day.selected {
  @apply bg-accent-primary text-white;
  @apply hover:bg-accent-primary;
}

.calendar-day.today {
  @apply font-bold text-accent-primary;
  @apply ring-1 ring-accent-primary ring-inset;
}

.calendar-day.disabled {
  @apply opacity-30 cursor-not-allowed;
  @apply hover:bg-transparent;
}

.relative-date {
  @apply flex items-center gap-2 mt-3;
}

.error-message {
  @apply text-sm text-accent-error mt-2;
}

/* Dark mode date input styling */
::-webkit-calendar-picker-indicator {
  @apply invert opacity-60 hover:opacity-100;
  @apply cursor-pointer;
}
</style>
