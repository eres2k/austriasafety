<template>
  <div class="kpi-card" :class="`kpi-${color}`">
    <div class="kpi-header">
      <h3 class="kpi-title">{{ title }}</h3>
      <component :is="trendIcon" v-if="trend" class="trend-icon" />
    </div>
    
    <div class="kpi-value">
      <span class="value">{{ formattedValue }}</span>
      <span v-if="suffix" class="suffix">{{ suffix }}</span>
    </div>
    
    <div v-if="change || trend" class="kpi-footer">
      <span v-if="change" class="change" :class="changeClass">
        {{ change }}
      </span>
    </div>
    
    <div v-if="alert" class="alert-indicator">
      <ExclamationTriangleIcon class="w-5 h-5" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/solid'

interface Props {
  title: string
  value: number | string
  suffix?: string
  change?: string
  trend?: string
  color?: 'primary' | 'success' | 'warning' | 'error'
  alert?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary'
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  return new Intl.NumberFormat('de-AT').format(props.value)
})

const trendIcon = computed(() => {
  if (!props.trend) return null
  return props.trend.includes('+') ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
})

const changeClass = computed(() => {
  if (!props.change) return ''
  return props.change.startsWith('+') ? 'positive' : 'negative'
})
</script>

<style scoped>
.kpi-card {
  @apply relative bg-surface-secondary rounded-lg p-6;
  @apply border border-surface-tertiary;
}

.kpi-header {
  @apply flex items-center justify-between mb-2;
}

.kpi-title {
  @apply text-sm font-medium text-text-secondary;
}

.trend-icon {
  @apply w-5 h-5;
}

.kpi-value {
  @apply flex items-baseline gap-1 mb-1;
}

.value {
  @apply text-3xl font-bold text-text-primary;
}

.suffix {
  @apply text-xl font-medium text-text-secondary;
}

.kpi-footer {
  @apply flex items-center gap-2 text-sm;
}

.change {
  @apply font-medium;
}

.change.positive {
  @apply text-accent-success;
}

.change.negative {
  @apply text-accent-error;
}

.alert-indicator {
  @apply absolute top-4 right-4 text-accent-warning;
}

.kpi-primary {
  @apply border-accent-primary border-opacity-30;
}

.kpi-success {
  @apply border-accent-success border-opacity-30;
}

.kpi-warning {
  @apply border-accent-warning border-opacity-30;
}

.kpi-error {
  @apply border-accent-error border-opacity-30;
}
</style>
