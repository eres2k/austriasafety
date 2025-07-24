<!-- src/components/reports/ComplianceMatrix.vue -->
<template>
  <div class="compliance-matrix">
    <div class="matrix-grid">
      <div class="matrix-corner"></div>
      <div
        v-for="category in data.categories"
        :key="category"
        class="matrix-header-cell"
      >
        {{ category }}
      </div>
      
      <template v-for="(location, locationIndex) in data.locations" :key="location">
        <div class="matrix-row-header">{{ location }}</div>
        <div
          v-for="(category, categoryIndex) in data.categories"
          :key="`${location}-${category}`"
          class="matrix-cell"
          :class="getCellClass(data.data[locationIndex][categoryIndex])"
        >
          {{ data.data[locationIndex][categoryIndex] }}%
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  data: {
    locations: string[]
    categories: string[]
    data: number[][]
  }
}

const props = defineProps<Props>()

function getCellClass(value: number): string {
  if (value >= 90) return 'cell-excellent'
  if (value >= 80) return 'cell-good'
  if (value >= 70) return 'cell-warning'
  return 'cell-poor'
}
</script>

<style scoped>
.matrix-grid {
  @apply grid gap-2;
  grid-template-columns: 100px repeat(4, 1fr);
}

.matrix-corner {
  @apply hidden md:block;
}

.matrix-header-cell {
  @apply text-center text-sm font-medium text-text-secondary;
  @apply p-2 bg-surface-tertiary rounded;
}

.matrix-row-header {
  @apply text-sm font-medium text-text-secondary;
  @apply p-2 bg-surface-tertiary rounded;
  @apply flex items-center;
}

.matrix-cell {
  @apply text-center p-3 rounded font-medium;
  @apply transition-all duration-200;
}

.cell-excellent {
  @apply bg-accent-success bg-opacity-20 text-accent-success;
}

.cell-good {
  @apply bg-accent-primary bg-opacity-20 text-accent-primary;
}

.cell-warning {
  @apply bg-accent-warning bg-opacity-20 text-accent-warning;
}

.cell-poor {
  @apply bg-accent-error bg-opacity-20 text-accent-error;
}
</style>
