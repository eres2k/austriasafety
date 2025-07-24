<template>
  <div class="loading-spinner">
    <div class="spinner"></div>
  </div>
</template>

<style scoped>
.loading-spinner {
  @apply flex items-center justify-center p-8;
}

.spinner {
  @apply w-8 h-8 border-4 border-surface-tertiary rounded-full;
  @apply border-t-accent-primary animate-spin;
}
</style>