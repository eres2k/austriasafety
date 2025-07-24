<!-- src/components/inspections/InspectionCard.vue -->
<template>
  <div 
    class="inspection-card"
    :class="[`view-${view}`, { 'has-issues': hasIssues }]"
    @click="$emit('click')"
  >
    <!-- Card Header -->
    <div class="card-header">
      <div class="header-content">
        <h3 class="card-title">{{ inspection.name }}</h3>
        <StatusBadge :status="inspection.status" size="small" />
      </div>
      
      <div class="location-badge">
        <BuildingOfficeIcon class="w-4 h-4" />
        {{ inspection.location }}
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-section">
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :style="{ width: `${inspection.progress || 0}%` }"
        />
      </div>
      <span class="progress-text">{{ inspection.progress || 0 }}%</span>
    </div>

    <!-- Card Content -->
    <div class="card-content">
      <div v-if="inspection.description" class="description">
        {{ truncateText(inspection.description, 80) }}
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats">
        <div class="stat" :class="{ 'stat-good': stats.passed > 0 }">
          <CheckCircleIcon class="w-4 h-4" />
          <span>{{ stats.passed }}</span>
        </div>
        <div class="stat" :class="{ 'stat-bad': stats.failed > 0 }">
          <XCircleIcon class="w-4 h-4" />
          <span>{{ stats.failed }}</span>
        </div>
        <div class="stat" :class="{ 'stat-neutral': stats.pending > 0 }">
          <ClockIcon class="w-4 h-4" />
          <span>{{ stats.pending }}</span>
        </div>
      </div>

      <!-- Collaborators -->
      <div v-if="collaborators.length > 0" class="collaborators">
        <div class="avatar-group">
          <div
            v-for="(collaborator, index) in displayedCollaborators"
            :key="collaborator.id"
            class="avatar"
            :style="{ 
              zIndex: collaborators.length - index,
              backgroundColor: collaborator.color 
            }"
            :title="collaborator.name"
          >
            {{ getInitials(collaborator.name) }}
          </div>
          <div
            v-if="collaborators.length > 3"
            class="avatar more"
            :title="`+${collaborators.length - 3} weitere`"
          >
            +{{ collaborators.length - 3 }}
          </div>
        </div>
      </div>
    </div>

    <!-- Card Footer -->
    <div class="card-footer">
      <div class="footer-info">
        <CalendarIcon class="w-4 h-4 text-text-tertiary" />
        <span class="text-sm text-text-secondary">
          {{ formatDate(inspection.createdAt) }}
        </span>
      </div>

      <div class="footer-actions">
        <button
          v-if="canEdit"
          @click.stop="editInspection"
          class="action-btn"
          title="Bearbeiten"
        >
          <PencilIcon class="w-4 h-4" />
        </button>
        
        <button
          @click.stop="exportPDF"
          class="action-btn"
          title="PDF exportieren"
        >
          <DocumentArrowDownIcon class="w-4 h-4" />
        </button>
        
        <button
          @click.stop="showMore"
          class="action-btn"
          title="Mehr Optionen"
        >
          <EllipsisVerticalIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Issue Indicator -->
    <div v-if="hasIssues" class="issue-indicator">
      <ExclamationTriangleIcon class="w-5 h-5" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAuthStore } from '@/stores/auth'
import type { Inspection } from '@/types'

interface Props {
  inspection: Inspection
  view: 'grid' | 'list'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: []
}>()

const router = useRouter()
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

const hasIssues = computed(() => stats.value.failed > 0)

const canEdit = computed(() => {
  return props.inspection.status !== 'completed' && 
         props.inspection.status !== 'archived' &&
         authStore.hasRole(['sifa', 'safety_inspector', 'admin'])
})

const collaborators = computed(() => {
  // Mock collaborators for demo
  if (props.inspection.assignedTo?.length) {
    return props.inspection.assignedTo.map((userId, index) => ({
      id: userId,
      name: `User ${index + 1}`,
      color: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'][index % 4]
    }))
  }
  return []
})

const displayedCollaborators = computed(() => 
  collaborators.value.slice(0, 3)
)

// Methods
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Heute'
  if (diffInDays === 1) return 'Gestern'
  if (diffInDays < 7) return `vor ${diffInDays} Tagen`
  
  return format(date, 'dd. MMM yyyy', { locale: de })
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

function editInspection() {
  router.push(`/inspections/${props.inspection.id}/execute`)
}

function exportPDF() {
  // Implement PDF export
  console.log('Export PDF:', props.inspection.id)
}

function showMore() {
  // Implement more options menu
  console.log('Show more options')
}
</script>

<style scoped>
.inspection-card {
  @apply bg-surface-secondary rounded-lg;
  @apply border border-surface-tertiary;
  @apply hover:border-accent-primary transition-all;
  @apply cursor-pointer relative overflow-hidden;
}

.inspection-card.view-grid {
  @apply p-4 flex flex-col;
}

.inspection-card.view-list {
  @apply p-4;
}

.inspection-card.has-issues {
  @apply border-accent-error border-opacity-50;
}

.card-header {
  @apply mb-3;
}

.header-content {
  @apply flex items-start justify-between gap-2 mb-2;
}

.card-title {
  @apply font-semibold text-text-primary line-clamp-2;
}

.location-badge {
  @apply inline-flex items-center gap-1 text-xs text-text-secondary;
  @apply bg-surface-tertiary px-2 py-1 rounded;
}

.progress-section {
  @apply flex items-center gap-2 mb-3;
}

.progress-bar {
  @apply flex-1 h-1.5 bg-surface-tertiary rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-accent-primary transition-all duration-300;
}

.progress-text {
  @apply text-xs font-medium text-text-secondary;
}

.card-content {
  @apply flex-1 space-y-3;
}

.description {
  @apply text-sm text-text-secondary line-clamp-2;
}

.quick-stats {
  @apply flex items-center gap-3;
}

.stat {
  @apply flex items-center gap-1 text-sm;
}

.stat-good {
  @apply text-accent-success;
}

.stat-bad {
  @apply text-accent-error;
}

.stat-neutral {
  @apply text-text-tertiary;
}

.collaborators {
  @apply mt-auto pt-3;
}

.avatar-group {
  @apply flex -space-x-2;
}

.avatar {
  @apply w-8 h-8 rounded-full;
  @apply flex items-center justify-center;
  @apply text-xs font-medium text-white;
  @apply border-2 border-surface-secondary;
  @apply relative;
}

.avatar.more {
  @apply bg-surface-tertiary text-text-secondary;
}

.card-footer {
  @apply flex items-center justify-between mt-4 pt-3;
  @apply border-t border-surface-tertiary;
}

.footer-info {
  @apply flex items-center gap-1;
}

.footer-actions {
  @apply flex items-center gap-1;
}

.action-btn {
  @apply p-1.5 rounded-lg;
  @apply hover:bg-surface-tertiary transition-colors;
  @apply text-text-secondary hover:text-text-primary;
}

.issue-indicator {
  @apply absolute top-2 right-2;
  @apply text-accent-error;
}

/* List view specific styles */
.view-list .card-header {
  @apply flex items-center justify-between;
}

.view-list .header-content {
  @apply flex-1 flex items-center gap-4 mb-0;
}

.view-list .card-content {
  @apply flex items-center gap-4 mt-3;
}

.view-list .description {
  @apply flex-1;
}

.view-list .quick-stats {
  @apply flex-shrink-0;
}

.view-list .collaborators {
  @apply mt-0 pt-0;
}

.view-list .card-footer {
  @apply mt-0 pt-0 border-0 ml-auto;
}
</style>
