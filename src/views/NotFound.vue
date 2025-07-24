<!-- src/views/NotFound.vue -->
<template>
  <div class="not-found-page">
    <div class="error-container">
      <!-- Animated 404 -->
      <div class="error-code">
        <span class="digit">4</span>
        <div class="gear-container">
          <Cog6ToothIcon class="gear gear-1" />
          <Cog6ToothIcon class="gear gear-2" />
        </div>
        <span class="digit">4</span>
      </div>

      <h1 class="error-title">Seite nicht gefunden</h1>
      <p class="error-description">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>

      <!-- Suggestions -->
      <div class="suggestions">
        <p class="suggestion-title">Vielleicht suchen Sie nach:</p>
        <div class="suggestion-links">
          <router-link to="/dashboard" class="suggestion-link">
            <HomeIcon class="w-5 h-5" />
            Dashboard
          </router-link>
          <router-link to="/inspections" class="suggestion-link">
            <ClipboardDocumentListIcon class="w-5 h-5" />
            Inspektionen
          </router-link>
          <router-link to="/reports" class="suggestion-link">
            <DocumentTextIcon class="w-5 h-5" />
            Berichte
          </router-link>
        </div>
      </div>

      <!-- Fun fact -->
      <div class="fun-fact">
        <SparklesIcon class="w-5 h-5 text-accent-primary" />
        <p class="text-sm text-text-secondary">
          <strong>Wussten Sie?</strong> Die HTTP-Fehlercode 404 wurde nach Raum 404 im CERN benannt,
          wo der erste Webserver stand.
        </p>
      </div>

      <!-- Action buttons -->
      <div class="action-buttons">
        <button @click="goBack" class="btn-secondary">
          <ArrowLeftIcon class="w-4 h-4" />
          Zurück
        </button>
        <router-link to="/" class="btn-primary">
          <HomeIcon class="w-4 h-4" />
          Zur Startseite
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  Cog6ToothIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  SparklesIcon,
  ArrowLeftIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()

function goBack() {
  router.back()
}
</script>

<style scoped>
.not-found-page {
  @apply min-h-screen flex items-center justify-center p-4;
  @apply bg-surface-primary;
}

.error-container {
  @apply max-w-lg w-full text-center;
}

.error-code {
  @apply flex items-center justify-center gap-2 mb-8;
  @apply text-8xl font-bold text-text-tertiary;
}

.digit {
  @apply inline-block;
}

.gear-container {
  @apply relative w-20 h-20;
}

.gear {
  @apply absolute w-full h-full text-accent-primary;
  animation: rotate 4s linear infinite;
}

.gear-1 {
  @apply w-12 h-12 top-0 left-1/2 -translate-x-1/2;
}

.gear-2 {
  @apply w-10 h-10 bottom-0 right-0;
  animation-direction: reverse;
  animation-duration: 3s;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.error-title {
  @apply text-2xl font-bold mb-2;
}

.error-description {
  @apply text-text-secondary mb-8;
}

.suggestions {
  @apply bg-surface-secondary rounded-lg p-6 mb-6;
  @apply border border-surface-tertiary;
}

.suggestion-title {
  @apply text-sm font-medium mb-4;
}

.suggestion-links {
  @apply flex flex-wrap justify-center gap-3;
}

.suggestion-link {
  @apply flex items-center gap-2 px-4 py-2;
  @apply bg-surface-tertiary rounded-lg;
  @apply hover:bg-accent-primary hover:bg-opacity-20;
  @apply transition-all;
}

.fun-fact {
  @apply flex items-start gap-2 mb-8;
  @apply bg-accent-primary bg-opacity-10 rounded-lg p-4;
}

.action-buttons {
  @apply flex items-center justify-center gap-3;
}
</style>
