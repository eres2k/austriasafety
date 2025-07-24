import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/api'

export const useAnalyticsStore = defineStore('analytics', () => {
  const metrics = ref({
    safetyScore: 85,
    safetyTrend: '+5%',
    monthlyInspections: 124,
    openIssues: 23,
    criticalFindings: 2
  })
  
  const safetyTrendsData = ref({
    labels: [],
    datasets: []
  })

  async function loadDashboardMetrics() {
    // Simulated data - replace with API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(metrics.value)
      }, 100)
    })
  }

  return {
    metrics,
    safetyTrendsData,
    loadDashboardMetrics
  }
})