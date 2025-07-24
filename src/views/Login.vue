<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1 class="text-3xl font-bold text-accent-primary">WHS SIFA</h1>
        <p class="text-text-secondary mt-2">Anmelden</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email" class="label">E-Mail</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="input"
            placeholder="ihre.email@amazon.at"
            required
          />
        </div>

        <div class="form-group">
          <label for="password" class="label">Passwort</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="input"
            placeholder="••••••••"
            required
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button
          type="submit"
          class="btn-primary w-full"
          :disabled="loading"
        >
          {{ loading ? 'Anmelden...' : 'Anmelden' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''

  const result = await authStore.login(email.value, password.value)
  
  if (result.success) {
    const redirect = route.query.redirect as string || '/dashboard'
    router.push(redirect)
  } else {
    error.value = result.error || 'Anmeldung fehlgeschlagen'
  }
  
  loading.value = false
}
</script>

<style scoped>
.login-page {
  @apply min-h-screen flex items-center justify-center bg-surface-primary;
  @apply px-4 py-12;
}

.login-container {
  @apply w-full max-w-md;
  @apply bg-surface-secondary rounded-lg p-8;
  @apply border border-surface-tertiary;
}

.login-header {
  @apply text-center mb-8;
}

.login-form {
  @apply space-y-6;
}

.form-group {
  @apply space-y-2;
}

.label {
  @apply block text-sm font-medium text-text-secondary;
}

.error-message {
  @apply text-sm text-accent-error;
  @apply bg-accent-error bg-opacity-10 p-3 rounded;
}
</style>