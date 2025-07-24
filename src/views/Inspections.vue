<!-- src/views/Inspections.vue -->
<template>
  <div class="inspections-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="text-2xl font-bold">Inspektionen</h1>
        <p class="text-text-secondary mt-1">
          Verwalten Sie alle Sicherheitsinspektionen
        </p>
      </div>
      
      <router-link to="/inspections/create" class="btn-primary">
        <PlusIcon class="w-5 h-5" />
        <span class="hidden md:inline">Neue Inspektion</span>
      </router-link>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filters-row">
        <!-- Search -->
        <div class="search-wrapper">
          <MagnifyingGlassIcon class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Suchen..."
            class="search-input"
          />
        </div>

        <!-- Location Filter -->
        <select v-model="selectedLocation" class="filter-select">
          <option value="">Alle Standorte</option>
          <option v-for="loc in locations" :key="loc.code" :value="loc.code">
            {{ loc.code }} - {{ loc.name }}
          </option>
        </select>

        <!-- Status Filter -->
        <select v-model="selectedStatus" class="filter-select">
          <option value="">Alle Status</option>
          <option value="draft">Entwurf</option>
          <option value="in-progress">In Bearbeitung</option>
          <option value="pending-review">Überprüfung ausstehend</option>
          <option value="completed">Abgeschlossen</option>
          <option value="archived">Archiviert</option>
        </select>

        <!-- Date Range -->
        <button @click="toggleDatePicker" class="filter-btn">
          <CalendarIcon class="w-4 h-4" />
          <span>{{ dateRangeLabel }}</span>
        </button>
      </div>

      <!-- Active Filters -->
      <div v-if="activeFilters.length > 0" class="active-filters">
        <span class="text-sm text-text-secondary">Aktive Filter:</span>
        <div class="filter-tags">
          <span
            v-for="filter in activeFilters"
            :key="filter.key"
            class="filter-tag"
          >
            {{ filter.label }}
            <button @click="removeFilter(filter.key)" class="remove-filter">
              <XMarkIcon class="w-3 h-3" />
            </button>
          </span>
        </div>
        <button @click="clearFilters" class="clear-filters-btn">
          Alle löschen
        </button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon bg-accent-primary bg-opacity-20">
          <ClipboardDocumentListIcon class="w-6 h-6 text-accent-primary" />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">Gesamt</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon bg-status-in-progress bg-opacity-20">
          <ClockIcon class="w-6 h-6 text-status-in-progress" />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.inProgress }}</span>
          <span class="stat-label">In Bearbeitung</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon bg-accent-success bg-opacity-20">
          <CheckCircleIcon class="w-6 h-6 text-accent-success" />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.completed }}</span>
          <span class="stat-label">Abgeschlossen</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon bg-accent-error bg-opacity-20">
          <ExclamationTriangleIcon class="w-6 h-6 text-accent-error" />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.withIssues }}</span>
          <span class="stat-label">Mit Mängeln</span>
        </div>
      </div>
    </div>

    <!-- View Toggle -->
    <div class="view-toggle">
      <button
        @click="viewMode = 'grid'"
        class="toggle-btn"
        :class="{ active: viewMode === 'grid' }"
      >
        <Squares2X2Icon class="w-4 h-4" />
      </button>
      <button
        @click="viewMode = 'list'"
        class="toggle-btn"
        :class="{ active: viewMode === 'list' }"
      >
        <ListBulletIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Inspections Grid/List -->
    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
    </div>

    <div v-else-if="filteredInspections.length === 0" class="empty-state">
      <ClipboardDocumentListIcon class="w-16 h-16 text-text-tertiary mb-4" />
      <h3 class="text-lg font-medium mb-2">Keine Inspektionen gefunden</h3>
      <p class="text-text-secondary text-sm">
        Erstellen Sie Ihre erste Inspektion oder ändern Sie die Filter.
      </p>
    </div>

    <div v-else :class="viewMode === 'grid' ? 'inspections-grid' : 'inspections-list'">
      <InspectionCard
        v-for="inspection in paginatedInspections"
        :key="inspection.id"
        :inspection="inspection"
        :view="viewMode"
        @click="openInspection(inspection.id)"
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
      
      <div class="pagination-numbers">
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="currentPage = page"
          class="pagination-number"
          :class="{ active: currentPage === page }"
        >
          {{ page }}
        </button>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'

import { useInspectionStore } from '@/stores/inspection'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import InspectionCard from '@/components/inspections/InspectionCard.vue'

const router = useRouter()
const inspectionStore = useInspectionStore()

// State
const searchQuery = ref('')
const selectedLocation = ref('')
const selectedStatus = ref('')
const dateRange = ref<[Date | null, Date | null]>([null, null])
const viewMode = ref<'grid' | 'list'>('grid')
const currentPage = ref(1)
const itemsPerPage = 12
const loading = ref(false)

// Data
const locations = [
  { code: 'DVI1', name: 'Wien 1' },
  { code: 'DVI2', name: 'Wien 2' },
  { code: 'DVI3', name: 'Wien 3' },
  { code: 'DAP5', name: 'Graz' },
  { code: 'DAP8', name: 'Linz' }
]

// Computed
const filteredInspections = computed(() => {
  let result = inspectionStore.inspections

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(i => 
      i.name.toLowerCase().includes(query) ||
      i.description?.toLowerCase().includes(query)
    )
  }

  // Location filter
  if (selectedLocation.value) {
    result = result.filter(i => i.location === selectedLocation.value)
  }

  // Status filter
  if (selectedStatus.value) {
    result = result.filter(i => i.status === selectedStatus.value)
  }

  // Date range filter
  if (dateRange.value[0] && dateRange.value[1]) {
    result = result.filter(i => {
      const date = new Date(i.createdAt)
      return date >= dateRange.value[0]! && date <= dateRange.value[1]!
    })
  }

  return result
})

const paginatedInspections = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredInspections.value.slice(start, end)
})

const totalPages = computed(() => 
  Math.ceil(filteredInspections.value.length / itemsPerPage)
)

const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const activeFilters = computed(() => {
  const filters = []
  
  if (searchQuery.value) {
    filters.push({ key: 'search', label: `Suche: ${searchQuery.value}` })
  }
  
  if (selectedLocation.value) {
    const loc = locations.find(l => l.code === selectedLocation.value)
    filters.push({ key: 'location', label: `Standort: ${loc?.code}` })
  }
  
  if (selectedStatus.value) {
    filters.push({ key: 'status', label: `Status: ${getStatusLabel(selectedStatus.value)}` })
  }
  
  if (dateRange.value[0] && dateRange.value[1]) {
    filters.push({ key: 'date', label: dateRangeLabel.value })
  }
  
  return filters
})

const dateRangeLabel = computed(() => {
  if (!dateRange.value[0] || !dateRange.value[1]) {
    return 'Zeitraum wählen'
  }
  
  const start = dateRange.value[0].toLocaleDateString('de-AT')
  const end = dateRange.value[1].toLocaleDateString('de-AT')
  return `${start} - ${end}`
})

const stats = computed(() => {
  const all = inspectionStore.inspections
  return {
    total: all.length,
    inProgress: all.filter(i => i.status === 'in-progress').length,
    completed: all.filter(i => i.status === 'completed').length,
    withIssues: all.filter(i => {
      // Count inspections with failed responses
      return Object.values(i.responses || {}).some((r: any) => r.status === 'failed')
    }).length
  }
})

// Methods
function toggleDatePicker() {
  // Implement date picker modal
  console.log('Toggle date picker')
}

function removeFilter(key: string) {
  switch (key) {
    case 'search':
      searchQuery.value = ''
      break
    case 'location':
      selectedLocation.value = ''
      break
    case 'status':
      selectedStatus.value = ''
      break
    case 'date':
      dateRange.value = [null, null]
      break
  }
}

function clearFilters() {
  searchQuery.value = ''
  selectedLocation.value = ''
  selectedStatus.value = ''
  dateRange.value = [null, null]
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'draft': 'Entwurf',
    'in-progress': 'In Bearbeitung',
    'pending-review': 'Überprüfung ausstehend',
    'completed': 'Abgeschlossen',
    'archived': 'Archiviert'
  }
  return labels[status] || status
}

function openInspection(id: string) {
  router.push(`/inspections/${id}`)
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  await inspectionStore.loadInspections()
  loading.value = false
})
</script>

<style scoped>
.page-header {
  @apply flex items-start justify-between mb-6;
}

.filters-section {
  @apply bg-surface-secondary rounded-lg p-4 mb-6;
  @apply border border-surface-tertiary;
}

.filters-row {
  @apply flex flex-wrap items-center gap-3;
}

.search-wrapper {
  @apply relative flex-1 min-w-[200px];
}

.search-icon {
  @apply absolute left-3 top-1/2 -translate-y-1/2;
  @apply w-5 h-5 text-text-tertiary;
}

.search-input {
  @apply w-full pl-10 pr-4 py-2;
  @apply bg-surface-primary rounded-lg;
  @apply border border-surface-tertiary;
  @apply text-text-primary placeholder-text-tertiary;
  @apply focus:border-accent-primary outline-none;
}

.filter-select {
  @apply px-4 py-2 bg-surface-primary rounded-lg;
  @apply border border-surface-tertiary;
  @apply text-text-primary;
  @apply focus:border-accent-primary outline-none;
}

.filter-btn {
  @apply flex items-center gap-2 px-4 py-2;
  @apply bg-surface-primary rounded-lg;
  @apply border border-surface-tertiary;
  @apply hover:bg-surface-tertiary transition-colors;
}

.active-filters {
  @apply flex items-center gap-3 mt-3 pt-3;
  @apply border-t border-surface-tertiary;
}

.filter-tags {
  @apply flex flex-wrap gap-2;
}

.filter-tag {
  @apply inline-flex items-center gap-1 px-3 py-1;
  @apply bg-accent-primary bg-opacity-20 rounded-full;
  @apply text-sm text-accent-primary;
}

.remove-filter {
  @apply p-0.5 rounded-full hover:bg-accent-primary hover:bg-opacity-30;
  @apply transition-colors;
}

.clear-filters-btn {
  @apply text-sm text-accent-primary hover:underline;
}

.stats-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4 mb-6;
}

.stat-card {
  @apply flex items-center gap-4 p-4;
  @apply bg-surface-secondary rounded-lg;
  @apply border border-surface-tertiary;
}

.stat-icon {
  @apply w-12 h-12 rounded-lg;
  @apply flex items-center justify-center;
}

.stat-content {
  @apply flex flex-col;
}

.stat-value {
  @apply text-2xl font-bold;
}

.stat-label {
  @apply text-sm text-text-secondary;
}

.view-toggle {
  @apply flex gap-1 mb-6;
}

.toggle-btn {
  @apply p-2 rounded-lg;
  @apply bg-surface-secondary border border-surface-tertiary;
  @apply hover:bg-surface-tertiary transition-colors;
}

.toggle-btn.active {
  @apply bg-accent-primary text-white;
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
  @apply flex items-center justify-center gap-2 mt-8;
}

.pagination-btn {
  @apply p-2 rounded-lg;
  @apply bg-surface-secondary border border-surface-tertiary;
  @apply hover:bg-surface-tertiary transition-colors;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.pagination-numbers {
  @apply flex gap-1;
}

.pagination-number {
  @apply w-10 h-10 rounded-lg;
  @apply bg-surface-secondary border border-surface-tertiary;
  @apply hover:bg-surface-tertiary transition-colors;
  @apply flex items-center justify-center text-sm;
}

.pagination-number.active {
  @apply bg-accent-primary text-white border-accent-primary;
}
</style>
