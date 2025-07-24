<!-- src/components/reports/TrendIndicator.vue -->
<template>
  <div class="trend-indicator" :class="trendClass">
    <component :is="trendIcon" class="w-4 h-4" />
    <span>{{ formattedValue }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon
} from '@heroicons/vue/24/solid'

interface Props {
  value: number
}

const props = defineProps<Props>()

const trendClass = computed(() => {
  if (props.value > 0) return 'trend-up'
  if (props.value < 0) return 'trend-down'
  return 'trend-neutral'
})

const trendIcon = computed(() => {
  if (props.value > 0) return ArrowTrendingUpIcon
  if (props.value < 0) return ArrowTrendingDownIcon
  return MinusIcon
})

const formattedValue = computed(() => {
  const sign = props.value > 0 ? '+' : ''
  return `${sign}${props.value}%`
})
</script>

<style scoped>
.trend-indicator {
  @apply flex items-center gap-1 text-sm font-medium;
}

.trend-up {
  @apply text-accent-success;
}

.trend-down {
  @apply text-accent-error;
}

.trend-neutral {
  @apply text-text-secondary;
}
</style>
