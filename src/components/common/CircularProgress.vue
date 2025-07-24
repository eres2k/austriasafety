<!-- src/components/common/CircularProgress.vue -->
<template>
  <div class="circular-progress" :style="containerStyle">
    <svg
      class="progress-svg"
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
    >
      <!-- Background circle -->
      <circle
        class="progress-bg"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
      />
      
      <!-- Progress circle -->
      <circle
        class="progress-fill"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashoffset"
        :style="{ stroke: progressColor }"
      />
      
      <!-- Optional gradient -->
      <defs v-if="gradient">
        <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="gradient.start" />
          <stop offset="100%" :stop-color="gradient.end" />
        </linearGradient>
      </defs>
    </svg>
    
    <!-- Center content -->
    <div class="progress-content">
      <slot>
        <span class="progress-value">{{ displayValue }}%</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number
  size?: number
  strokeWidth?: number
  showValue?: boolean
  animated?: boolean
  gradient?: {
    start: string
    end: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  size: 48,
  strokeWidth: 4,
  showValue: true,
  animated: true
})

// Generate unique gradient ID
const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`

// Computed
const center = computed(() => props.size / 2)
const radius = computed(() => center.value - props.strokeWidth / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

const strokeDashoffset = computed(() => {
  const progress = Math.min(100, Math.max(0, props.value))
  return circumference.value - (progress / 100) * circumference.value
})

const displayValue = computed(() => Math.round(props.value))

const progressColor = computed(() => {
  if (props.gradient) {
    return `url(#${gradientId})`
  }
  
  // Default color based on value
  if (props.value >= 80) return '#10B981' // Success
  if (props.value >= 60) return '#F59E0B' // Warning
  if (props.value >= 40) return '#3B82F6' // Info
  return '#EF4444' // Error
})

const containerStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`
}))
</script>

<style scoped>
.circular-progress {
  @apply relative inline-flex items-center justify-center;
}

.progress-svg {
  @apply transform -rotate-90;
}

.progress-bg {
  @apply fill-none stroke-surface-tertiary;
}

.progress-fill {
  @apply fill-none;
  @apply transition-all duration-1000 ease-out;
  stroke-linecap: round;
}

.progress-content {
  @apply absolute inset-0 flex items-center justify-center;
}

.progress-value {
  @apply text-sm font-bold text-text-primary;
}

/* Animation on mount */
@keyframes progress-appear {
  from {
    stroke-dashoffset: var(--circumference);
  }
}

.progress-fill {
  animation: progress-appear 1s ease-out;
}
</style>
