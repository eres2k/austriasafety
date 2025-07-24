<!-- src/components/reports/IssueCategoriesChart.vue -->
<template>
  <div class="issue-categories-chart">
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
    type: 'doughnut',
    data: props.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#FAFAFA',
            padding: 10,
            usePointStyle: true
          }
        }
      }
    }
  })
})
</script>

<style scoped>
.issue-categories-chart {
  @apply w-full h-full;
}
</style>
