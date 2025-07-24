<!-- src/components/reports/LocationChart.vue -->
<template>
  <div class="location-chart">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface Props {
  data: any
  type: 'bar' | 'pie'
}

const props = defineProps<Props>()
const chartCanvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

const createChart = () => {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  const isDark = true // Always dark theme

  chart = new Chart(ctx, {
    type: props.type === 'pie' ? 'doughnut' : 'bar',
    data: props.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: props.type === 'pie',
          position: 'bottom',
          labels: {
            color: isDark ? '#FAFAFA' : '#121212',
            padding: 15
          }
        }
      },
      scales: props.type === 'bar' ? {
        x: {
          grid: { display: false },
          ticks: { color: isDark ? '#B3B3B3' : '#6B7280' }
        },
        y: {
          grid: { color: isDark ? '#2D2D2D' : '#E5E7EB' },
          ticks: { color: isDark ? '#B3B3B3' : '#6B7280' }
        }
      } : undefined
    }
  })
}

onMounted(() => {
  createChart()
})

watch(() => props.type, () => {
  if (chart) {
    chart.destroy()
    createChart()
  }
})
</script>

<style scoped>
.location-chart {
  @apply w-full h-full;
}
</style>
