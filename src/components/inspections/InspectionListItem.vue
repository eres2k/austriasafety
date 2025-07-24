<!-- src/components/inspections/InspectionListItem.vue -->
<template>
  <div class="inspection-list-item" @click="$emit('click')">
    <div class="list-item-content">
      <!-- Status Indicator -->
      <div class="status-indicator" :class="`status-${inspection.status}`"></div>
      
      <!-- Main Content -->
      <div class="item-main">
        <div class="item-header">
          <h3 class="item-title">{{ inspection.name }}</h3>
          <div class="item-meta">
            <span class="location-badge">
              <BuildingOfficeIcon class="w-4 h-4" />
              {{ inspection.location }}
            </span>
            <span class="date">{{ formattedDate }}</span>
          </div>
        </div>
        
        <p class="item-description">{{ inspection.templateName }}</p>
        
        <div class="item-stats">
          <div class="stat">
            <CheckCircleIcon class="w-4 h-4 text-accent-success" />
            <span>{{ stats.passed }}</span>
          </div>
          <div class="stat">
            <XCircleIcon class="w-4 h-4 text-accent-error" />
            <span>{{ stats.failed }}</span>
          </div>
          <div class="stat">
            <ClockIcon class="w-4 h-4 text-text-tertiary" />
            <span>{{ stats.pending }}</span>
          </div>
        </div>
      </div>
      
      <!-- Progress -->
      <div class="item-progress">
        <CircularProgress :value="inspection.progress || 0" :size="48" />
      </div>
      
      <!-- Actions -->
      <div class="item-actions">
        <StatusBadge :status="inspection.status" size="small" />
        <div class="action-buttons">
          <button
            @click.stop="$emit('export')"
            class="action-btn"
            title="PDF exportieren"
          >
            <DocumentArrowDownIcon class="w-5 h-5" />
          </button>
          <button
            v-if="canDelete"
            @click.stop="$emit('delete')"
            class="action-btn action-danger"
            title="Löschen"
          >
            <TrashIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

import StatusBadge from '@/components/common/StatusBadge.vue'
import CircularProgress from '@/components/common/CircularProgress.vue'
import { useAuthStore } from '@/stores/auth'

interface Props {
  inspection: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: []
  export: []
  delete: []
}>()

const authStore = useAuthStore()

const formattedDate = computed(() => {
  return format(new Date(props.inspection.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })
})

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

const canDelete = computed(() => {
  return props.inspection.status === 'draft' || 
         authStore.hasRole(['admin'])
})
</script>

<style scoped>
.inspection-list-item {
  @apply bg-surface-secondary rounded-lg;
  @apply border border-surface-tertiary;
  @apply hover:border-accent-primary transition-all;
  @apply cursor-pointer;
}

.list-item-content {
  @apply flex items-center gap-4 p-4;
}

.status-indicator {
  @apply w-1 h-16 rounded-full flex-shrink-0;
}

.status-indicator.status-draft {
  @apply bg-status-pending;
}

.status-indicator.status-in-progress {
  @apply bg-status-in-progress;
}

.status-indicator.status-completed {
  @apply bg-status-completed;
}

.item-main {
  @apply flex-1 min-w-0;
}

.item-header {
  @apply flex items-start justify-between gap-4 mb-1;
}

.item-title {
  @apply font-semibold truncate;
}

.item-meta {
  @apply flex items-center gap-3 text-xs text-text-secondary;
}

.location-badge {
  @apply flex items-center gap-1;
}

.item-description {
  @apply text-sm text-text-secondary truncate mb-2;
}

.item-stats {
  @apply flex items-center gap-4;
}

.stat {
  @apply flex items-center gap-1 text-sm;
}

.item-progress {
  @apply flex-shrink-0;
}

.item-actions {
  @apply flex flex-col items-end gap-2;
}

.action-buttons {
  @apply flex items-center gap-1;
}

.action-btn {
  @apply p-1.5 rounded hover:bg-surface-tertiary;
  @apply transition-colors text-text-secondary;
}

.action-btn.action-danger {
  @apply hover:bg-accent-error hover:bg-opacity-20;
  @apply hover:text-accent-error;
}
</style>
