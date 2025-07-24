<template>
  <header class="app-header">
    <div class="header-content">
      <h1 class="logo">WHS SIFA</h1>
      <div class="user-menu">
        <span class="user-name">{{ user?.name }}</span>
        <button @click="logout" class="logout-btn">
          <ArrowRightOnRectangleIcon class="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const user = authStore.user

async function logout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-header {
  @apply bg-surface-secondary border-b border-surface-tertiary;
  @apply px-6 py-4;
}

.header-content {
  @apply flex items-center justify-between;
}

.logo {
  @apply text-xl font-bold text-accent-primary;
}

.user-menu {
  @apply flex items-center gap-4;
}

.user-name {
  @apply text-sm text-text-secondary;
}

.logout-btn {
  @apply p-2 rounded-lg hover:bg-surface-tertiary;
  @apply text-text-secondary hover:text-text-primary;
  @apply transition-colors;
}
</style>