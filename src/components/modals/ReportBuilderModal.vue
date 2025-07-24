<!-- src/components/modals/ReportBuilderModal.vue -->
<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="text-xl font-semibold">Bericht erstellen</h2>
        <button @click="close" class="close-btn">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="modal-body">
        <!-- Report Type -->
        <div class="form-section">
          <h3 class="form-label">Berichtstyp</h3>
          <div class="report-types">
            <label
              v-for="type in reportTypes"
              :key="type.id"
              class="report-type-option"
            >
              <input
                v-model="config.type"
                type="radio"
                :value="type.id"
                class="sr-only"
              />
              <div class="option-card" :class="{ selected: config.type === type.id }">
                <component :is="type.icon" class="w-8 h-8 mb-2" />
                <h4 class="font-medium">{{ type.name }}</h4>
                <p class="text-xs text-text-secondary mt-1">{{ type.description }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Date Range -->
        <div class="form-section">
          <h3 class="form-label">Zeitraum</h3>
          <div class="date-inputs">
            <input
              v-model="config.startDate"
              type="date"
              class="date-input"
              :max="today"
            />
            <span class="mx-2">bis</span>
            <input
              v-model="config.endDate"
              type="date"
              class="date-input"
              :max="today"
              :min="config.startDate"
            />
          </div>
        </div>

        <!-- Locations -->
        <div class="form-section">
          <h3 class="form-label">Standorte</h3>
          <div class="checkbox-group">
            <label
              v-for="location in locations"
              :key="location"
              class="checkbox-option"
            >
              <input
                v-model="config.locations"
                type="checkbox"
                :value="location"
                class="checkbox-input"
              />
              <span>{{ location }}</span>
            </label>
          </div>
        </div>

        <!-- Include Options -->
        <div class="form-section">
          <h3 class="form-label">Einschließen</h3>
          <div class="include-options">
            <label class="toggle-option">
              <input
                v-model="config.includeCharts"
                type="checkbox"
                class="toggle-checkbox"
              />
              <span>Diagramme und Visualisierungen</span>
            </label>
            <label class="toggle-option">
              <input
                v-model="config.includeDetails"
                type="checkbox"
                class="toggle-checkbox"
              />
              <span>Detaillierte Inspektionslisten</span>
            </label>
            <label class="toggle-option">
              <input
                v-model="config.includeRecommendations"
                type="checkbox"
                class="toggle-checkbox"
              />
              <span>Handlungsempfehlungen</span>
            </label>
          </div>
        </div>

        <!-- Format -->
        <div class="form-section">
          <h3 class="form-label">Format</h3>
          <div class="format-options">
            <label class="format-option">
              <input
                v-model="config.format"
                type="radio"
                value="pdf"
                class="sr-only"
              />
              <div class="format-card" :class="{ selected: config.format === 'pdf' }">
                <DocumentTextIcon class="w-6 h-6" />
                <span>PDF</span>
              </div>
            </label>
            <label class="format-option">
              <input
                v-model="config.format"
                type="radio"
                value="excel"
                class="sr-only"
              />
              <div class="format-card" :class="{ selected: config.format === 'excel' }">
                <TableCellsIcon class="w-6 h-6" />
                <span>Excel</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="close" class="btn-secondary">
          Abbrechen
        </button>
        <button @click="generate" class="btn-primary" :disabled="!isValid">
          <DocumentPlusIcon class="w-4 h-4" />
          Bericht erstellen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  XMarkIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DocumentPlusIcon,
  ChartBarIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/vue/24/outline'
import { format } from 'date-fns'

const emit = defineEmits<{
  close: []
  generate: [config: any]
}>()

const today = format(new Date(), 'yyyy-MM-dd')

const reportTypes = [
  {
    id: 'overview',
    name: 'Übersichtsbericht',
    description: 'Zusammenfassung aller Kennzahlen',
    icon: ChartBarIcon
  },
  {
    id: 'compliance',
    name: 'Compliance-Bericht',
    description: 'Detaillierte Compliance-Analyse',
    icon: ClipboardDocumentCheckIcon
  },
  {
    id: 'trend',
    name: 'Trendbericht',
    description: 'Entwicklung über Zeit',
    icon: CalendarIcon
  },
  {
    id: 'location',
    name: 'Standortvergleich',
    description: 'Vergleich zwischen Standorten',
    icon: BuildingOfficeIcon
  }
]

const locations = ['DVI1', 'DVI2', 'DVI3', 'DAP5', 'DAP8']

const config = reactive({
  type: 'overview',
  startDate: '',
  endDate: today,
  locations: [] as string[],
  includeCharts: true,
  includeDetails: false,
  includeRecommendations: true,
  format: 'pdf'
})

const isValid = computed(() => {
  return config.startDate && 
         config.endDate && 
         config.locations.length > 0
})

function close() {
  emit('close')
}

function generate() {
  if (!isValid.value) return
  emit('generate', { ...config })
}
</script>

<style scoped>
.modal-backdrop {
  @apply fixed inset-0 bg-black bg-opacity-50 z-50;
  @apply flex items-center justify-center p-4;
}

.modal-content {
  @apply bg-surface-secondary rounded-lg;
  @apply w-full max-w-3xl max-h-[90vh];
  @apply flex flex-col;
}

.modal-header {
  @apply flex items-center justify-between;
  @apply p-6 border-b border-surface-tertiary;
}

.close-btn {
  @apply p-2 rounded-lg hover:bg-surface-tertiary;
  @apply transition-colors;
}

.modal-body {
  @apply flex-1 p-6 overflow-y-auto;
  @apply space-y-6;
}

.form-section {
  @apply space-y-3;
}

.form-label {
  @apply text-sm font-medium text-text-secondary;
}

.report-types {
  @apply grid grid-cols-2 gap-3;
}

.report-type-option {
  @apply cursor-pointer;
}

.option-card {
  @apply p-4 bg-surface-tertiary rounded-lg;
  @apply border-2 border-transparent;
  @apply hover:bg-opacity-80 transition-all;
  @apply text-center;
}

.option-card.selected {
  @apply border-accent-primary bg-accent-primary bg-opacity-10;
}

.date-inputs {
  @apply flex items-center;
}

.date-input {
  @apply px-3 py-2 bg-surface-tertiary rounded-lg;
  @apply text-sm border-2 border-transparent;
  @apply focus:border-accent-primary outline-none;
}

.checkbox-group {
  @apply grid grid-cols-2 md:grid-cols-3 gap-3;
}

.checkbox-option {
  @apply flex items-center gap-2 cursor-pointer;
  @apply p-3 bg-surface-tertiary rounded-lg;
  @apply hover:bg-opacity-80;
}

.checkbox-input {
  @apply w-4 h-4 rounded bg-surface-primary;
  @apply text-accent-primary focus:ring-accent-primary;
}

.include-options {
  @apply space-y-2;
}

.toggle-option {
  @apply flex items-center gap-3 p-3;
  @apply bg-surface-tertiary rounded-lg;
  @apply cursor-pointer hover:bg-opacity-80;
}

.toggle-checkbox {
  @apply w-4 h-4 rounded;
  @apply bg-surface-primary border-surface-tertiary;
  @apply text-accent-primary focus:ring-accent-primary;
}

.format-options {
  @apply flex gap-3;
}

.format-option {
  @apply cursor-pointer flex-1;
}

.format-card {
  @apply flex flex-col items-center gap-2 p-4;
  @apply bg-surface-tertiary rounded-lg;
  @apply border-2 border-transparent;
  @apply hover:bg-opacity-80 transition-all;
}

.format-card.selected {
  @apply border-accent-primary bg-accent-primary bg-opacity-10;
}

.modal-footer {
  @apply flex items-center justify-end gap-3;
  @apply p-6 border-t border-surface-tertiary;
}
</style>
