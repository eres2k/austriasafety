<!-- src/views/Inspections.vue -->
<template>
  <div class="inspections-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="text-2xl font-bold">Inspektionen</h1>
        <p class="text-text-secondary mt-1">
          Verwalten Sie alle Ihre Sicherheitsinspektionen
        </p>
      </div>
      
      <router-link
        to="/inspections/create"
        class="btn-primary"
      >
        <PlusIcon class="w-5 h-5" />
        <span class="hidden md:inline">Neue Inspektion</span>
      </router-link>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="search-box">
        <MagnifyingGlassIcon class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Suchen nach Name, Standort..."
          class="search-input"
        />
      </div>

      <div class="filter-buttons">
        <button
          @click="showFilters = !showFilters"
          class="filter-btn"
          :class="{ active: activeFiltersCount > 0 }"
        >
          <FunnelIcon class="w-4 h-4" />
          Filter
          <span v-if="activeFiltersCount > 0" class="filter-badge">
            {{ activeFiltersCount }}
          </span>
        </button>

        <div class="view-toggles">
          <button
            @click="viewMode = 'grid'"
            class="view-btn"
            :class="{ active: viewMode === 'grid' }"
          >
            <Squares2X2Icon class="w-4 h-4" />
          </button>
          <button
            @click="viewMode = 'list'"
            class="view-btn"
            :class="{ active: viewMode === 'list' }"
          >
            <ListBulletIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Advanced Filters Panel -->
    <transition name="slide-down">
      <div v-if="showFilters" class="advanced-filters">
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <div class="filter-options">
            <label
              v-for="status in statusOptions"
              :key="status.value"
              class="filter-option"
            >
              <input
                v-model="filters.status"
                type="checkbox"
                :value="status.value"
                class="filter-checkbox"
              />
              <StatusBadge :status="status.value" size="small" />
            </label>
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">Standort</label>
          <div class="filter-options">
            <label
              v-for="location in locationOptions"
              :key="location"
              class="filter-option"
            >
              <input
                v-model="filters.locations"
                type="checkbox"
                :value="location"
                class="filter-checkbox"
              />
              <span>{{ location }}</span>
            </label>
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">Zeitraum</label>
          <select v-model="filters.dateRange" class="filter-select">
            <option value="">Alle</option>
            <option value="today">Heute</option>
            <option value="week">Diese Woche</option>
            <option value="month">Diesen Monat</option>
            <option value="quarter">Dieses Quartal</option>
          </select>
        </div>

        <div class="filter-actions">
          <button @click="resetFilters" class="btn-secondary">
            Zurücksetzen
          </button>
        </div>
      </div>
    </transition>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon bg-accent-primary bg-opacity-20">
          <ClipboardDocumentListIcon class="w-6 h-6 text-accent-primary" />
        </div>
        <div>
          <p class="stat-value">{{ stats.total }}</p>
          <p class="stat-label">Gesamt</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon bg-status-in-progress bg-opacity-20">
          <ClockIcon class="w-6 h-6 text-status-in-progress" />
        </div>
        <div>
          <p class="stat-value">{{ stats.inProgress }}</p>
          <p class="stat-label">In Bearbeitung</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon bg-accent-success bg-opacity-20">
          <CheckCircleIcon class="w-6 h-6 text-accent-success" />
        </div>
        <div>
          <p class="stat-value">{{ stats.completed }}</p>
          <p class="stat-label">Abgeschlossen</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon bg-accent-error bg-opacity-20">
          <ExclamationTriangleIcon class="w-6 h-6 text-accent-error" />
        </div>
        <div>
          <p class="stat-value">{{ stats.withIssues }}</p>
          <p class="stat-label">Mit Mängeln</p>
        </div>
      </div>
    </div>

    <!-- Inspections Grid/List -->
    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
    </div>

    <div v-else-if="filteredInspections.length === 0" class="empty-state">
      <ClipboardDocumentListIcon class="w-16 h-16 text-text-tertiary mb-4" />
      <h3 class="text-lg font-medium mb-2">Keine Inspektionen gefunden</h3>
      <p class="text-text-secondary mb-6">
        {{ searchQuery || activeFiltersCount > 0 
          ? 'Versuchen Sie andere Suchkriterien' 
          : 'Erstellen Sie Ihre erste Inspektion' }}
      </p>
      <router-link
        to="/inspections/create"
        class="btn-primary"
      >
        <PlusIcon class="w-5 h-5" />
        Neue Inspektion
      </router-link>
    </div>

    <!-- Grid View -->
    <div
      v-else-if="viewMode === 'grid'"
      class="inspections-grid"
    >
      <InspectionCard
        v-for="inspection in paginatedInspections"
        :key="inspection.id"
        :inspection="inspection"
        @click="viewInspection(inspection.id)"
      />
    </div>

    <!-- List View -->
    <div
      v-else
      class="inspections-list"
    >
      <InspectionListItem
        v-for="inspection in paginatedInspections"
        :key="inspection.id"
        :inspection="inspection"
        @click="viewInspection(inspection.id)"
        @export="exportInspection(inspection.id)"
        @delete="deleteInspection(inspection.id)"
      />
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="pagination-btn"
      >
        <ChevronLeftIcon class="w-5 h-5" />
      </button>
      
      <div class="pagination-info">
        Seite {{ currentPage }} von {{ totalPages }}
      </div>
      
      <button
        @click="currentPage++"
        :disabled="currentPage === totalPages"
        class="pagination-btn"
      >
        <ChevronRightIcon class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'

import { useInspectionStore } from '@/stores/inspection'
import { getTemplateById } from '@/data/questionnaire-templates'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import InspectionCard from '@/components/inspections/InspectionCard.vue'
import InspectionListItem from '@/components/inspections/InspectionListItem.vue'

const router = useRouter()
const inspectionStore = useInspectionStore()

// State
const searchQuery = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const showFilters = ref(false)
const currentPage = ref(1)
const itemsPerPage = 12

const filters = ref({
  status: [] as string[],
  locations: [] as string[],
  dateRange: ''
})

// Options
const statusOptions = [
  { value: 'draft', label: 'Entwurf' },
  { value: 'in-progress', label: 'In Bearbeitung' },
  { value: 'pending-review', label: 'Überprüfung' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'archived', label: 'Archiviert' }
]

const locationOptions = ['DVI1', 'DVI2', 'DVI3', 'DAP5', 'DAP8']

// Computed
const loading = computed(() => inspectionStore.loading)

const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.status.length > 0) count += filters.value.status.length
  if (filters.value.locations.length > 0) count += filters.value.locations.length
  if (filters.value.dateRange) count++
  return count
})

const filteredInspections = computed(() => {
  let inspections = [...inspectionStore.inspections]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    inspections = inspections.filter(inspection => 
      inspection.name.toLowerCase().includes(query) ||
      inspection.location.toLowerCase().includes(query) ||
      inspection.description?.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (filters.value.status.length > 0) {
    inspections = inspections.filter(inspection =>
      filters.value.status.includes(inspection.status)
    )
  }

  // Location filter
  if (filters.value.locations.length > 0) {
    inspections = inspections.filter(inspection =>
      filters.value.locations.includes(inspection.location)
    )
  }

  // Date range filter
  if (filters.value.dateRange) {
    const now = new Date()
    const startOfDay = new Date(now.setHours(0, 0, 0, 0))
    
    inspections = inspections.filter(inspection => {
      const date = new Date(inspection.createdAt)
      
      switch (filters.value.dateRange) {
        case 'today':
          return date >= startOfDay
        case 'week':
          const weekAgo = new Date(now.setDate(now.getDate() - 7))
          return date >= weekAgo
        case 'month':
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
          return date >= monthAgo
        case 'quarter':
          const quarterAgo = new Date(now.setMonth(now.getMonth() - 3))
          return date >= quarterAgo
        default:
          return true
      }
    })
  }

  // Sort by date (newest first)
  inspections.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return inspections
})

const totalPages = computed(() => 
  Math.ceil(filteredInspections.value.length / itemsPerPage)
)

const paginatedInspections = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  
  return filteredInspections.value.slice(start, end).map(inspection => {
    const template = getTemplateById(inspection.templateId)
    return {
      ...inspection,
      templateName: template?.name || 'Unbekannte Vorlage'
    }
  })
})

const stats = computed(() => {
  const all = inspectionStore.inspections
  
  return {
    total: all.length,
    inProgress: all.filter(i => i.status === 'in-progress').length,
    completed: all.filter(i => i.status === 'completed').length,
    withIssues: all.filter(i => {
      // Count inspections with failed questions
      return Object.values(i.responses || {}).some((r: any) => r.status === 'failed')
    }).length
  }
})

// Methods
function resetFilters() {
  filters.value = {
    status: [],
    locations: [],
    dateRange: ''
  }
}

function viewInspection(id: string) {
  router.push(`/inspections/${id}`)
}

async function exportInspection(id: string) {
  // Trigger PDF export
  console.log('Export inspection:', id)
}

async function deleteInspection(id: string) {
  if (confirm('Möchten Sie diese Inspektion wirklich löschen?')) {
    // Delete inspection
    console.log('Delete inspection:', id)
  }
}

// Watch for filter changes to reset pagination
watch([searchQuery, filters], () => {
  currentPage.value = 1
}, { deep: true })

// Load inspections on mount
onMounted(async () => {
  await inspectionStore.loadInspections()
})
</script>

<style scoped>
.inspections-page {
  @apply max-w-7xl mx-auto;
}

.page-header {
  @apply flex items-start justify-between mb-6;
}

.filters-section {
  @apply flex flex-col md:flex-row gap-4 mb-6;
}

.search-box {
  @apply relative flex-1;
}

.search-icon {
  @apply absolute left-3 top-1/2 -translate-y-1/2;
  @apply w-5 h-5 text-text-tertiary;
}

.search-input {
  @apply w-full pl-10 pr-4 py-2 bg-surface-secondary rounded-lg;
  @apply border border-surface-tertiary focus:border-accent-primary;
  @apply text-text-primary placeholder-text-tertiary;
  @apply outline-none transition-colors;
}

.filter-buttons {
  @apply flex items-center gap-3;
}

.filter-btn {
  @apply flex items-center gap-2 px-4 py-2;
  @apply bg-surface-secondary rounded-lg;
  @apply hover:bg-surface-tertiary transition-colors;
}

.filter-btn.active {
  @apply bg-accent-primary text-white;
}

.filter-badge {
  @apply w-5 h-5 rounded-full bg-white text-accent-primary;
  @apply text-xs font-bold flex items-center justify-center;
}

.view-toggles {
  @apply flex bg-surface-secondary rounded-lg p-1;
}

.view-btn {
  @apply p-2 rounded transition-all;
}

.view-btn.active {
  @apply bg-surface-tertiary;
}

.advanced-filters {
  @apply grid grid-cols-1 md:grid-cols-4 gap-4 p-4;
  @apply bg-surface-secondary rounded-lg mb-6;
}

.filter-group {
  @apply space-y-2;
}

.filter-label {
  @apply block text-sm font-medium text-text-secondary;
}

.filter-options {
  @apply space-y-2;
}

.filter-option {
  @apply flex items-center gap-2 cursor-pointer;
}

.filter-checkbox {
  @apply rounded border-surface-tertiary bg-surface-tertiary;
  @apply text-accent-primary focus:ring-accent-primary;
}

.filter-select {
  @apply w-full px-3 py-2 bg-surface-tertiary rounded-lg;
  @apply border border-transparent focus:border-accent-primary;
  @apply text-text-primary outline-none;
}

.filter-actions {
  @apply flex items-end;
}

.stats-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4 mb-6;
}

.stat-card {
  @apply flex items-center gap-4 p-4;
  @apply bg-surface-secondary rounded-lg;
}

.stat-icon {
  @apply w-12 h-12 rounded-lg;
  @apply flex items-center justify-center;
}

.stat-value {
  @apply text-2xl font-bold;
}

.stat-label {
  @apply text-sm text-text-secondary;
}

.loading-state {
  @apply flex justify-center py-12;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12;
  @apply text-center;
}

.inspections-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.inspections-list {
  @apply space-y-3;
}

.pagination {
  @apply flex items-center justify-center gap-4 mt-8;
}

.pagination-btn {
  @apply p-2 rounded-lg bg-surface-secondary;
  @apply hover:bg-surface-tertiary transition-colors;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.pagination-info {
  @apply text-sm text-text-secondary;
}

/* Animations */
.slide-down-enter-active,
.slide-down-leave-active {
  @apply transition-all duration-300 ease-in-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  @apply transform -translate-y-4 opacity-0;
}
</style>
