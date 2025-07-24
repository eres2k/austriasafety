<!-- src/views/Reports.vue -->
<template>
  <div class="reports-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="text-2xl font-bold">Berichte & Analysen</h1>
        <p class="text-text-secondary mt-1">
          Detaillierte Einblicke in Ihre Sicherheitsdaten
        </p>
      </div>
      
      <div class="header-actions">
        <button @click="exportDashboard" class="btn-secondary">
          <DocumentArrowDownIcon class="w-4 h-4" />
          Dashboard exportieren
        </button>
        
        <button @click="showReportBuilder = true" class="btn-primary">
          <DocumentPlusIcon class="w-4 h-4" />
          Bericht erstellen
        </button>
      </div>
    </div>

    <!-- Date Range Selector -->
    <div class="date-range-selector">
      <button
        v-for="range in dateRanges"
        :key="range.value"
        @click="selectedDateRange = range.value"
        class="range-btn"
        :class="{ active: selectedDateRange === range.value }"
      >
        {{ range.label }}
      </button>
      
      <div class="custom-range">
        <input
          type="date"
          v-model="customStartDate"
          class="date-input"
          :max="today"
        />
        <span class="mx-2">bis</span>
        <input
          type="date"
          v-model="customEndDate"
          class="date-input"
          :max="today"
        />
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="metrics-grid">
      <div class="metric-card metric-primary">
        <div class="metric-header">
          <h3>Sicherheitsbewertung</h3>
          <TrendIndicator :value="metrics.safetyScoreTrend" />
        </div>
        <div class="metric-value">
          <span class="value-main">{{ metrics.safetyScore }}</span>
          <span class="value-suffix">%</span>
        </div>
        <div class="metric-chart">
          <MiniLineChart :data="metrics.safetyScoreHistory" />
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <h3>Durchgeführte Inspektionen</h3>
          <span class="metric-badge">{{ metrics.inspectionGrowth }}%</span>
        </div>
        <div class="metric-value">{{ metrics.totalInspections }}</div>
        <div class="metric-subtext">
          {{ metrics.inspectionsThisPeriod }} in diesem Zeitraum
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <h3>Identifizierte Mängel</h3>
        </div>
        <div class="metric-value">{{ metrics.totalIssues }}</div>
        <div class="metric-breakdown">
          <div class="breakdown-item">
            <span class="dot critical"></span>
            <span>{{ metrics.criticalIssues }} Kritisch</span>
          </div>
          <div class="breakdown-item">
            <span class="dot major"></span>
            <span>{{ metrics.majorIssues }} Wichtig</span>
          </div>
          <div class="breakdown-item">
            <span class="dot minor"></span>
            <span>{{ metrics.minorIssues }} Gering</span>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <h3>Durchschnittliche Bearbeitungszeit</h3>
        </div>
        <div class="metric-value">
          {{ metrics.avgCompletionTime }}
          <span class="value-suffix">min</span>
        </div>
        <div class="metric-progress">
          <div class="progress-label">
            <span>Ziel: 30 min</span>
            <span :class="metrics.avgCompletionTime <= 30 ? 'text-accent-success' : 'text-accent-warning'">
              {{ metrics.avgCompletionTime <= 30 ? 'Erreicht' : 'Überschritten' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <!-- Inspections by Location -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>Inspektionen nach Standort</h3>
          <button @click="toggleChartType('location')" class="chart-toggle">
            <ChartBarIcon v-if="chartTypes.location === 'bar'" class="w-4 h-4" />
            <ChartPieIcon v-else class="w-4 h-4" />
          </button>
        </div>
        <div class="chart-container">
          <LocationChart 
            :data="chartData.byLocation" 
            :type="chartTypes.location"
          />
        </div>
      </div>

      <!-- Safety Trends -->
      <div class="chart-card col-span-2">
        <div class="chart-header">
          <h3>Sicherheitstrends</h3>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-dot passed"></span>
              <span>Bestanden</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot failed"></span>
              <span>Mängel</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot score"></span>
              <span>Score</span>
            </div>
          </div>
        </div>
        <div class="chart-container">
          <SafetyTrendsChart :data="chartData.trends" />
        </div>
      </div>

      <!-- Issue Categories -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>Mängelkategorien</h3>
        </div>
        <div class="chart-container">
          <IssueCategoriesChart :data="chartData.issueCategories" />
        </div>
      </div>

      <!-- Compliance Matrix -->
      <div class="chart-card col-span-2">
        <div class="chart-header">
          <h3>Compliance-Matrix</h3>
          <span class="chart-subtitle">Nach Standort und Kategorie</span>
        </div>
        <div class="chart-container">
          <ComplianceMatrix :data="chartData.complianceMatrix" />
        </div>
      </div>
    </div>

    <!-- Top Performers -->
    <div class="performers-section">
      <h2 class="section-title">Top Performer</h2>
      <div class="performers-grid">
        <div
          v-for="performer in topPerformers"
          :key="performer.id"
          class="performer-card"
        >
          <div class="performer-rank">#{{ performer.rank }}</div>
          <div class="performer-info">
            <h4 class="performer-name">{{ performer.name }}</h4>
            <p class="performer-stats">
              {{ performer.inspections }} Inspektionen • 
              {{ performer.score }}% Score
            </p>
          </div>
          <div class="performer-badges">
            <span
              v-for="badge in performer.badges"
              :key="badge"
              class="badge"
              :title="getBadgeTitle(badge)"
            >
              {{ getBadgeEmoji(badge) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Reports -->
    <div class="recent-reports">
      <h2 class="section-title">Gespeicherte Berichte</h2>
      <div class="reports-list">
        <div
          v-for="report in recentReports"
          :key="report.id"
          class="report-item"
        >
          <div class="report-icon">
            <DocumentTextIcon class="w-5 h-5" />
          </div>
          <div class="report-info">
            <h4 class="report-name">{{ report.name }}</h4>
            <p class="report-meta">
              {{ report.type }} • {{ formatDate(report.createdAt) }}
            </p>
          </div>
          <div class="report-actions">
            <button @click="viewReport(report.id)" class="action-btn">
              <EyeIcon class="w-4 h-4" />
            </button>
            <button @click="downloadReport(report.id)" class="action-btn">
              <ArrowDownTrayIcon class="w-4 h-4" />
            </button>
            <button @click="shareReport(report.id)" class="action-btn">
              <ShareIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Report Builder Modal -->
    <ReportBuilderModal
      v-if="showReportBuilder"
      @close="showReportBuilder = false"
      @generate="generateReport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  DocumentArrowDownIcon,
  DocumentPlusIcon,
  ChartBarIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ShareIcon
} from '@heroicons/vue/24/outline'
import { ChartPieIcon } from '@heroicons/vue/24/solid'

import TrendIndicator from '@/components/reports/TrendIndicator.vue'
import MiniLineChart from '@/components/reports/MiniLineChart.vue'
import LocationChart from '@/components/reports/LocationChart.vue'
import SafetyTrendsChart from '@/components/reports/SafetyTrendsChart.vue'
import IssueCategoriesChart from '@/components/reports/IssueCategoriesChart.vue'
import ComplianceMatrix from '@/components/reports/ComplianceMatrix.vue'
import ReportBuilderModal from '@/components/modals/ReportBuilderModal.vue'

// State
const selectedDateRange = ref('month')
const customStartDate = ref('')
const customEndDate = ref('')
const showReportBuilder = ref(false)

const chartTypes = ref({
  location: 'bar',
  trends: 'line',
  issues: 'doughnut'
})

const today = format(new Date(), 'yyyy-MM-dd')

// Date range options
const dateRanges = [
  { value: 'week', label: 'Woche' },
  { value: 'month', label: 'Monat' },
  { value: 'quarter', label: 'Quartal' },
  { value: 'year', label: 'Jahr' },
  { value: 'custom', label: 'Benutzerdefiniert' }
]

// Mock data - would come from API
const metrics = ref({
  safetyScore: 87,
  safetyScoreTrend: 5,
  safetyScoreHistory: [82, 84, 83, 85, 86, 85, 87],
  totalInspections: 234,
  inspectionsThisPeriod: 42,
  inspectionGrowth: 12,
  totalIssues: 156,
  criticalIssues: 12,
  majorIssues: 45,
  minorIssues: 99,
  avgCompletionTime: 28
})

const chartData = ref({
  byLocation: {
    labels: ['DVI1', 'DVI2', 'DVI3', 'DAP5', 'DAP8'],
    datasets: [{
      label: 'Inspektionen',
      data: [45, 38, 52, 41, 58],
      backgroundColor: '#FF9500'
    }]
  },
  trends: {
    labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Bestanden',
        data: [85, 88, 86, 90, 89, 91],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)'
      },
      {
        label: 'Mängel',
        data: [15, 12, 14, 10, 11, 9],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)'
      },
      {
        label: 'Score',
        data: [82, 84, 83, 87, 86, 87],
        borderColor: '#FF9500',
        backgroundColor: 'rgba(255, 149, 0, 0.1)'
      }
    ]
  },
  issueCategories: {
    labels: ['Verkehrswege', 'PSA', 'Brandschutz', 'Maschinen', 'Sonstiges'],
    datasets: [{
      data: [32, 28, 18, 15, 7],
      backgroundColor: [
        '#EF4444',
        '#F59E0B',
        '#10B981',
        '#3B82F6',
        '#8B5CF6'
      ]
    }]
  },
  complianceMatrix: {
    locations: ['DVI1', 'DVI2', 'DVI3', 'DAP5', 'DAP8'],
    categories: ['Verkehrswege', 'PSA', 'Brandschutz', 'Maschinen'],
    data: [
      [95, 88, 92, 90],
      [89, 92, 88, 93],
      [91, 90, 95, 88],
      [93, 87, 89, 91],
      [88, 94, 90, 92]
    ]
  }
})

const topPerformers = ref([
  {
    id: '1',
    rank: 1,
    name: 'Maria Schmidt',
    inspections: 45,
    score: 96,
    badges: ['champion', 'streak', 'perfect']
  },
  {
    id: '2',
    rank: 2,
    name: 'Thomas Müller',
    inspections: 38,
    score: 94,
    badges: ['streak', 'fast']
  },
  {
    id: '3',
    rank: 3,
    name: 'Anna Weber',
    inspections: 35,
    score: 92,
    badges: ['perfect', 'collaborative']
  }
])

const recentReports = ref([
  {
    id: '1',
    name: 'Q2 2024 Sicherheitsbericht',
    type: 'Quartalsbericht',
    createdAt: new Date('2024-07-01')
  },
  {
    id: '2',
    name: 'Standortvergleich Juni 2024',
    type: 'Vergleichsbericht',
    createdAt: new Date('2024-06-30')
  },
  {
    id: '3',
    name: 'PSA Compliance Analyse',
    type: 'Themenbericht',
    createdAt: new Date('2024-06-15')
  }
])

// Methods
function toggleChartType(chart: string) {
  switch (chart) {
    case 'location':
      chartTypes.value.location = chartTypes.value.location === 'bar' ? 'pie' : 'bar'
      break
  }
}

function exportDashboard() {
  console.log('Export dashboard')
}

function generateReport(config: any) {
  console.log('Generate report:', config)
  showReportBuilder.value = false
}

function viewReport(id: string) {
  console.log('View report:', id)
}

function downloadReport(id: string) {
  console.log('Download report:', id)
}

function shareReport(id: string) {
  console.log('Share report:', id)
}

function formatDate(date: Date): string {
  return format(date, 'dd.MM.yyyy', { locale: de })
}

function getBadgeEmoji(badge: string): string {
  const badges: Record<string, string> = {
    champion: '🏆',
    streak: '🔥',
    perfect: '⭐',
    fast: '⚡',
    collaborative: '🤝'
  }
  return badges[badge] || '🎯'
}

function getBadgeTitle(badge: string): string {
  const titles: Record<string, string> = {
    champion: 'Sicherheitschampion',
    streak: 'Streak-Meister',
    perfect: 'Perfektionist',
    fast: 'Blitzschnell',
    collaborative: 'Team Player'
  }
  return titles[badge] || badge
}

// Load data on mount
onMounted(() => {
  // Load analytics data
})
</script>

<style scoped>
.reports-page {
  @apply max-w-7xl mx-auto;
}

.page-header {
  @apply flex items-start justify-between mb-6;
}

.header-actions {
  @apply flex items-center gap-3;
}

.date-range-selector {
  @apply flex items-center gap-2 mb-6;
  @apply bg-surface-secondary rounded-lg p-2;
}

.range-btn {
  @apply px-4 py-2 rounded-lg transition-all;
  @apply text-sm font-medium text-text-secondary;
  @apply hover:bg-surface-tertiary;
}

.range-btn.active {
  @apply bg-accent-primary text-white;
}

.custom-range {
  @apply ml-auto flex items-center;
}

.date-input {
  @apply px-3 py-1.5 bg-surface-tertiary rounded-lg;
  @apply text-sm border border-transparent;
  @apply focus:border-accent-primary outline-none;
}

.metrics-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8;
}

.metric-card {
  @apply bg-surface-secondary rounded-lg p-6;
  @apply border border-surface-tertiary;
}

.metric-card.metric-primary {
  @apply border-accent-primary border-opacity-50;
  background: linear-gradient(to bottom right, var(--surface-secondary), rgba(255, 149, 0, 0.1));
}

.metric-header {
  @apply flex items-center justify-between mb-2;
}

.metric-header h3 {
  @apply text-sm font-medium text-text-secondary;
}

.metric-badge {
  @apply px-2 py-0.5 rounded-full text-xs font-medium;
  @apply bg-accent-success bg-opacity-20 text-accent-success;
}

.metric-value {
  @apply flex items-baseline gap-1 mb-2;
}

.value-main {
  @apply text-3xl font-bold text-text-primary;
}

.value-suffix {
  @apply text-xl text-text-secondary;
}

.metric-subtext {
  @apply text-sm text-text-secondary;
}

.metric-breakdown {
  @apply space-y-1 mt-3;
}

.breakdown-item {
  @apply flex items-center gap-2 text-sm;
}

.dot {
  @apply w-2 h-2 rounded-full;
}

.dot.critical {
  @apply bg-accent-error;
}

.dot.major {
  @apply bg-accent-warning;
}

.dot.minor {
  @apply bg-status-pending;
}

.metric-progress {
  @apply mt-3;
}

.progress-label {
  @apply flex items-center justify-between text-sm;
}

.charts-section {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8;
}

.chart-card {
  @apply bg-surface-secondary rounded-lg p-6;
  @apply border border-surface-tertiary;
}

.chart-card.col-span-2 {
  @apply lg:col-span-2;
}

.chart-header {
  @apply flex items-center justify-between mb-4;
}

.chart-header h3 {
  @apply text-lg font-semibold;
}

.chart-subtitle {
  @apply text-sm text-text-secondary;
}

.chart-toggle {
  @apply p-2 rounded-lg hover:bg-surface-tertiary;
  @apply transition-colors;
}

.chart-legend {
  @apply flex items-center gap-4;
}

.legend-item {
  @apply flex items-center gap-1 text-sm;
}

.legend-dot {
  @apply w-3 h-3 rounded-full;
}

.legend-dot.passed {
  @apply bg-accent-success;
}

.legend-dot.failed {
  @apply bg-accent-error;
}

.legend-dot.score {
  @apply bg-accent-primary;
}

.chart-container {
  @apply h-64;
}

.section-title {
  @apply text-lg font-semibold mb-4;
}

.performers-section {
  @apply mb-8;
}

.performers-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.performer-card {
  @apply flex items-center gap-4 p-4;
  @apply bg-surface-secondary rounded-lg;
  @apply border border-surface-tertiary;
}

.performer-rank {
  @apply text-2xl font-bold text-accent-primary;
}

.performer-info {
  @apply flex-1;
}

.performer-name {
  @apply font-medium;
}

.performer-stats {
  @apply text-sm text-text-secondary;
}

.performer-badges {
  @apply flex gap-1;
}

.badge {
  @apply text-xl;
}

.recent-reports {
  @apply mb-8;
}

.reports-list {
  @apply space-y-3;
}

.report-item {
  @apply flex items-center gap-4 p-4;
  @apply bg-surface-secondary rounded-lg;
  @apply hover:bg-surface-tertiary transition-colors;
}

.report-icon {
  @apply w-10 h-10 rounded-lg bg-surface-tertiary;
  @apply flex items-center justify-center;
}

.report-info {
  @apply flex-1;
}

.report-name {
  @apply font-medium;
}

.report-meta {
  @apply text-sm text-text-secondary;
}

.report-actions {
  @apply flex items-center gap-2;
}

.action-btn {
  @apply p-2 rounded-lg hover:bg-surface-tertiary;
  @apply transition-colors;
}
</style>
