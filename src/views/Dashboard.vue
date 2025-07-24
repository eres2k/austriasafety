<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="dashboard-header mb-8">
      <h1 class="text-3xl font-bold">Dashboard</h1>
      <p class="text-text-secondary mt-2">
        Willkommen zurück, {{ user?.name }}
      </p>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions mb-8">
      <h2 class="text-xl font-semibold mb-4">Schnellzugriff</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <router-link
          to="/inspections/create"
          class="quick-action-card"
        >
          <PlusCircleIcon class="w-8 h-8 text-accent-primary mb-2" />
          <span>Neue Inspektion</span>
        </router-link>
        
        <router-link
          to="/reports"
          class="quick-action-card"
        >
          <DocumentTextIcon class="w-8 h-8 text-accent-success mb-2" />
          <span>Berichte</span>
        </router-link>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-section mb-8">
      <h2 class="text-xl font-semibold mb-4">Übersicht</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Sicherheitsbewertung"
          :value="metrics.safetyScore"
          suffix="%"
          :trend="metrics.safetyTrend"
          color="success"
        />
        <KPICard
          title="Inspektionen (Monat)"
          :value="metrics.monthlyInspections"
          change="+12%"
          color="primary"
        />
        <KPICard
          title="Offene Mängel"
          :value="metrics.openIssues"
          color="warning"
        />
        <KPICard
          title="Kritische Befunde"
          :value="metrics.criticalFindings"
          color="error"
          :alert="metrics.criticalFindings > 0"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import {
  PlusCircleIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline'

import { useAuthStore } from '@/stores/auth'
import { useAnalyticsStore } from '@/stores/analytics'
import KPICard from '@/components/common/KPICard.vue'

const authStore = useAuthStore()
const analyticsStore = useAnalyticsStore()

const { user } = storeToRefs(authStore)
const { metrics } = storeToRefs(analyticsStore)

onMounted(async () => {
  await analyticsStore.loadDashboardMetrics()
})
</script>

<style scoped>
.quick-action-card {
  @apply flex flex-col items-center justify-center p-6;
  @apply bg-surface-secondary rounded-lg border border-surface-tertiary;
  @apply hover:bg-surface-tertiary transition-colors cursor-pointer;
}

.quick-action-card span {
  @apply text-sm text-text-primary font-medium;
}
</style>