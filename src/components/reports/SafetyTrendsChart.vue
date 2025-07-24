<!-- src/components/reports/SafetyTrendsChart.vue -->
<template>
  <div class="safety-trends-chart">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface Props {
  data: any
}

const props = defineProps<Props>()
const chartCanvas = ref<HTMLCanvasElement>()

onMounted(() => {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  new Chart(ctx, {
    type: 'line',
    data: props.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#1E1E1E',
          titleColor: '#FAFAFA',
          bodyColor: '#B3B3B3',
          borderColor: '#2D2D2D',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#B3B3B3' }
        },
        y: {
          grid: { color: '#2D2D2D' },
          ticks: { color: '#B3B3B3' }
        }
      }
    }
  })
})
</script>

<style scoped>
.safety-trends-chart {
  @apply w-full h-full;
}
</style>
