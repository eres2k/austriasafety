<template>
  <nav class="mobile-nav">
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="nav-item"
      active-class="active"
    >
      <component :is="item.icon" class="w-6 h-6" />
      <span class="text-xs">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline'

const navItems = [
  { path: '/dashboard', label: 'Start', icon: HomeIcon },
  { path: '/inspections', label: 'Inspektionen', icon: ClipboardDocumentListIcon },
  { path: '/inspections/create', label: 'Neu', icon: PlusCircleIcon },
  { path: '/reports', label: 'Berichte', icon: DocumentTextIcon }
]
</script>

<style scoped>
.mobile-nav {
  @apply fixed bottom-0 left-0 right-0 bg-surface-secondary;
  @apply flex justify-around items-center h-16 px-2;
  @apply border-t border-surface-tertiary;
}

.nav-item {
  @apply flex flex-col items-center justify-center;
  @apply p-2 rounded-lg transition-all duration-200;
  @apply text-text-secondary;
}

.nav-item.active {
  @apply text-accent-primary bg-surface-tertiary;
}
</style>