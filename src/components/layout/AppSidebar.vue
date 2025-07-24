<template>
  <aside class="app-sidebar">
    <nav class="sidebar-nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        active-class="active"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span>{{ item.label }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  Cog6ToothIcon
} from '@heroicons/vue/24/outline'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { path: '/inspections', label: 'Inspektionen', icon: ClipboardDocumentListIcon },
  { path: '/reports', label: 'Berichte', icon: DocumentTextIcon },
  { path: '/settings', label: 'Einstellungen', icon: Cog6ToothIcon }
]
</script>

<style scoped>
.app-sidebar {
  @apply w-64 bg-surface-secondary border-r border-surface-tertiary;
  @apply flex flex-col;
}

.sidebar-nav {
  @apply flex-1 py-4;
}

.nav-item {
  @apply flex items-center gap-3 px-6 py-3;
  @apply text-text-secondary hover:text-text-primary;
  @apply hover:bg-surface-tertiary transition-colors;
}

.nav-item.active {
  @apply text-accent-primary bg-surface-tertiary;
  @apply border-l-2 border-accent-primary;
}
</style>