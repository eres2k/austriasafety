<template>
  <span 
    class="status-badge"
    :class="[`status-${status}`, { small: size === 'small' }]"
  >
    <component :is="icon" class="icon" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArchiveBoxIcon
} from '@heroicons/vue/20/solid'

interface Props {
  status: string
  size?: 'small' | 'normal'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'normal'
})

const statusConfig: Record<string, any> = {
  'passed': {
    label: 'Bestanden',
    icon: CheckCircleIcon,
    class: 'status-passed'
  },
  'failed': {
    label: 'Mangel',
    icon: XCircleIcon,
    class: 'status-failed'
  },
  'pending': {
    label: 'Ausstehend',
    icon: ClockIcon,
    class: 'status-pending'
  },
  'in-progress': {
    label: 'In Bearbeitung',
    icon: ClockIcon,
    class: 'status-in-progress'
  },
  'completed': {
    label: 'Abgeschlossen',
    icon: CheckCircleIcon,
    class: 'status-completed'
  }
}

const config = computed(() => {
  return statusConfig[props.status] || statusConfig['pending']
})

const label = computed(() => config.value.label)
const icon = computed(() => config.value.icon)
</script>

<style scoped>
.status-badge {
  @apply inline-flex items-center gap-1 px-2.5 py-1 rounded-full;
  @apply text-sm font-medium;
}

.status-badge.small {
  @apply text-xs px-2 py-0.5;
}

.icon {
  @apply w-4 h-4;
}

.small .icon {
  @apply w-3 h-3;
}

.status-passed,
.status-completed {
  @apply bg-accent-success bg-opacity-20 text-accent-success;
}

.status-failed {
  @apply bg-accent-error bg-opacity-20 text-accent-error;
}

.status-pending {
  @apply bg-status-pending bg-opacity-20 text-status-pending;
}

.status-in-progress {
  @apply bg-status-in-progress bg-opacity-20 text-status-in-progress;
}
</style>