<!-- src/components/reports/MiniLineChart.vue -->
<template>
  <div class="mini-line-chart" ref="chartContainer">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface Props {
  data: number[]
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: '#FF9500'
})

const chartContainer = ref<HTMLDivElement>()
const chartCanvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

const createChart = () => {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: props.data.map((_, i) => i + 1),
      datasets: [{
        data: props.data,
        borderColor: props.color,
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  })
}

onMounted(() => {
  createChart()
})

watch(() => props.data, () => {
  if (chart) {
    chart.data.datasets[0].data = props.data
    chart.update()
  }
})
</script>

<style scoped>
.mini-line-chart {
  @apply w-full h-full;
}
</style>
