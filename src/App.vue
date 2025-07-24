<template>
  <div class="app-container">
    <!-- Desktop Layout -->
    <div class="hidden md:flex h-screen">
      <AppSidebar />
      <div class="flex-1 flex flex-col">
        <AppHeader />
        <main class="flex-1 overflow-y-auto bg-surface-primary p-6">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </div>
    </div>

    <!-- Mobile Layout -->
    <div class="md:hidden flex flex-col h-screen">
      <AppHeader :mobile="true" />
      <main class="flex-1 overflow-y-auto bg-surface-primary p-4 pb-20">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
      <MobileNav />
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import MobileNav from './components/layout/MobileNav.vue'
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>