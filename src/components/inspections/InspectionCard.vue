<!-- src/components/inspections/InspectionCard.vue -->
<template>
<div class="inspection-card group" @click="$emit('click')">
    <!-- Header -->
    <div class="card-header">
      <div class="location-badge">
        <BuildingOfficeIcon class="w-4 h-4" />
        {{ inspection.location }}
      </div>
      <StatusBadge :status="inspection.status" size="small" />
    </div>

    <!-- Content -->
    <div class="card-content">
      <h3 class="card-title">{{ inspection.name }}</h3>
      <p class="card-subtitle">{{ inspection.templateName }}</p>
      
      <div class="progress-section">
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: `${inspection.progress || 0}%` }"
          />
        </div>
        <span class="progress-text">{{ inspection.progress || 0 }}%</span>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-item">
          <CheckCircleIcon class="w-4 h-4 text-accent-success" />
          <span>{{ stats.passed }}</span>
        </div>
        <div class="stat-item">
          <XCircleIcon class="w-4 h-4 text-accent-error" />
          <span>{{ stats.failed }}</span>
        </div>
        <div class="stat-item">
          <ClockIcon class="w-4 h-4 text-text-tertiary" />
          <span>{{ stats.pending }}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="card-footer">
      <div class="date-info">
        <CalendarIcon class="w-4 h-4" />
        <span>{{ formattedDate }}</span>
      </div>
      
      <div v-if="inspection.assignedTo?.length" class="assignees">
        <div
          v-for="(assignee, index) in visibleAssignees"
          :key="assignee"
          class="assignee-avatar"
          :style="{ zIndex: visibleAssignees.length - index }"
        >
          {{ getInitials(assignee) }}
        </div>
        <div
          v-if="inspection.assignedTo.length > 3"
          class="assignee-more"
        >
          +{{ inspection.assignedTo.length - 3 }}
        </div>
      </div>
    </div>

    <!-- Hover Actions -->
    <div class="hover-actions">
      <button
        @click.stop="$emit('export')"
        class="action-btn"
        title="PDF exportieren"
      >
        <DocumentArrowDownIcon class="w-5 h-5" />
      </button>
      <button
        @click.stop="$emit('duplicate')"
        class="action-btn"
        title="Duplizieren"
      >
        <DocumentDuplicateIcon class="w-5 h-5" />
      </button>
      <button
        v-if="canDelete"
        @click.stop="$emit('delete')"
        class="action-btn action-btn-danger"
        title="Löschen"
      >
        <TrashIcon class="w-5 h-5" />
      </button>
    </div>

    <!-- Badges -->
    <div v-if="hasCriticalFindings" class="critical-badge">
      <ExclamationTriangleIcon class="w-4 h-4" />
    </div>

    <div v-if="isNew" class="new-badge">
      NEU
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, isToday, isYesterday, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAuthStore } from '@/stores/auth'

interface Props {
  inspection: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: []
  export: []
  duplicate: []
  delete: []
}>()

const authStore = useAuthStore()

// Computed
const stats = computed(() => {
  let passed = 0
  let failed = 0
  let pending = 0

  Object.values(props.inspection.responses || {}).forEach((response: any) => {
    switch (response.status) {
      case 'passed':
        passed++
        break
      case 'failed':
        failed++
        break
      default:
        pending++
    }
  })

  return { passed, failed, pending }
})

const formattedDate = computed(() => {
  const date = new Date(props.inspection.createdAt)
  
  if (isToday(date)) {
    return 'Heute'
  } else if (isYesterday(date)) {
    return 'Gestern'
  } else if (differenceInDays(new Date(), date) < 7) {
    return format(date, 'EEEE', { locale: de })
  } else {
    return format(date, 'dd.MM.yyyy')
  }
})

const visibleAssignees = computed(() => {
  return props.inspection.assignedTo?.slice(0, 3) || []
})

const canDelete = computed(() => {
  return props.inspection.status === 'draft' || 
         authStore.hasRole(['admin'])
})

const hasCriticalFindings = computed(() => {
  return stats.value.failed > 0 && 
         props.inspection.status === 'completed'
})

const isNew = computed(() => {
  const date = new Date(props.inspection.createdAt)
  return differenceInDays(new Date(), date) < 2 && 
         props.inspection.status === 'draft'
})

// Methods
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<style scoped>
.inspection-card {
  @apply relative bg-surface-secondary rounded-lg p-4;
  @apply border border-surface-tertiary;
  @apply hover:border-accent-primary transition-all duration-200;
  @apply cursor-pointer;  /* Removed 'group' */
}

.card-header {
  @apply flex items-center justify-between mb-3;
}

.location-badge {
  @apply flex items-center gap-1 text-xs;
  @apply px-2 py-1 rounded-full;
  @apply bg-surface-tertiary text-text-secondary;
}

.card-content {
  @apply space-y-3;
}

.card-title {
  @apply font-semibold text-text-primary;
  @apply line-clamp-2;
}

.card-subtitle {
  @apply text-sm text-text-secondary;
  @apply line-clamp-1;
}

.progress-section {
  @apply flex items-center gap-2;
}

.progress-bar {
  @apply flex-1 h-2 bg-surface-tertiary rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-accent-primary transition-all duration-300;
}

.progress-text {
  @apply text-xs text-text-secondary font-medium;
}

.stats-row {
  @apply flex items-center gap-4;
}

.stat-item {
  @apply flex items-center gap-1 text-sm;
}

.card-footer {
  @apply flex items-center justify-between mt-4 pt-3;
  @apply border-t border-surface-tertiary;
}

.date-info {
  @apply flex items-center gap-1 text-xs text-text-secondary;
}

.assignees {
  @apply flex items-center -space-x-2;
}

.assignee-avatar {
  @apply w-6 h-6 rounded-full bg-accent-primary;
  @apply flex items-center justify-center;
  @apply text-xs font-medium text-white;
  @apply ring-2 ring-surface-secondary;
}

.assignee-more {
  @apply w-6 h-6 rounded-full bg-surface-tertiary;
  @apply flex items-center justify-center;
  @apply text-xs font-medium text-text-secondary;
  @apply ring-2 ring-surface-secondary;
}

.hover-actions {
  @apply absolute top-2 right-2;
  @apply flex items-center gap-1;
  @apply opacity-0 group-hover:opacity-100 transition-opacity;
}

.action-btn {
  @apply p-1.5 rounded-lg bg-surface-primary;
  @apply hover:bg-surface-tertiary transition-colors;
  @apply text-text-secondary hover:text-text-primary;
}

.action-btn-danger {
  @apply hover:bg-accent-error hover:bg-opacity-20;
  @apply hover:text-accent-error;
}

.critical-badge {
  @apply absolute top-2 left-2;
  @apply w-8 h-8 rounded-full bg-accent-error;
  @apply flex items-center justify-center text-white;
  @apply animate-pulse;
}

.new-badge {
  @apply absolute -top-2 -right-2;
  @apply px-2 py-0.5 rounded-full;
  @apply bg-accent-primary text-white text-xs font-bold;
  @apply transform rotate-12;
}
</style>
