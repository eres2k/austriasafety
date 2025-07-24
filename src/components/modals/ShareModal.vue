<!-- src/components/modals/ShareModal.vue -->
<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="text-lg font-semibold">Inspektion teilen</h2>
        <button @click="close" class="close-btn">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="modal-body">
        <!-- Share Link -->
        <div class="share-section">
          <h3 class="section-title">Freigabelink</h3>
          <div class="share-link-container">
            <input
              :value="shareLink"
              readonly
              class="share-link-input"
              ref="linkInput"
            />
            <button
              @click="copyLink"
              class="copy-btn"
              :class="{ copied: linkCopied }"
            >
              <ClipboardDocumentIcon v-if="!linkCopied" class="w-5 h-5" />
              <CheckIcon v-else class="w-5 h-5" />
            </button>
          </div>
          <p class="text-xs text-text-secondary mt-2">
            Dieser Link ermöglicht nur Lesezugriff auf die Inspektion
          </p>
        </div>

        <!-- Access Control -->
        <div class="share-section">
          <h3 class="section-title">Zugriffsberechtigungen</h3>
          <div class="access-options">
            <label class="access-option">
              <input
                v-model="shareSettings.viewOnly"
                type="radio"
                name="access"
                :value="true"
              />
              <div class="option-content">
                <EyeIcon class="w-5 h-5 text-text-secondary" />
                <div>
                  <div class="font-medium">Nur anzeigen</div>
                  <div class="text-xs text-text-secondary">
                    Kann die Inspektion nur ansehen
                  </div>
                </div>
              </div>
            </label>
            
            <label class="access-option">
              <input
                v-model="shareSettings.viewOnly"
                type="radio"
                name="access"
                :value="false"
              />
              <div class="option-content">
                <PencilIcon class="w-5 h-5 text-text-secondary" />
                <div>
                  <div class="font-medium">Bearbeiten</div>
                  <div class="text-xs text-text-secondary">
                    Kann die Inspektion bearbeiten
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Share with Users -->
        <div class="share-section">
          <h3 class="section-title">Mit Benutzern teilen</h3>
          <div class="user-search">
            <input
              v-model="searchQuery"
              @input="searchUsers"
              type="text"
              placeholder="Name oder E-Mail eingeben..."
              class="search-input"
            />
          </div>

          <!-- Search Results -->
          <div v-if="searchResults.length > 0" class="search-results">
            <button
              v-for="user in searchResults"
              :key="user.id"
              @click="addUser(user)"
              class="user-result"
            >
              <div class="user-avatar" :style="{ backgroundColor: user.color }">
                {{ getInitials(user.name) }}
              </div>
              <div class="user-info">
                <div class="font-medium">{{ user.name }}</div>
                <div class="text-xs text-text-secondary">{{ user.email }}</div>
              </div>
              <PlusIcon class="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          <!-- Shared Users -->
          <div class="shared-users">
            <div
              v-for="user in sharedUsers"
              :key="user.id"
              class="shared-user"
            >
              <div class="user-avatar" :style="{ backgroundColor: user.color }">
                {{ getInitials(user.name) }}
              </div>
              <div class="user-info flex-1">
                <div class="font-medium">{{ user.name }}</div>
                <div class="text-xs text-text-secondary">{{ user.email }}</div>
              </div>
              <select
                v-model="user.permission"
                class="permission-select"
                @click.stop
              >
                <option value="view">Anzeigen</option>
                <option value="edit">Bearbeiten</option>
              </select>
              <button
                @click="removeUser(user.id)"
                class="remove-btn"
              >
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Additional Options -->
        <div class="share-section">
          <h3 class="section-title">Weitere Optionen</h3>
          <label class="toggle-option">
            <input
              v-model="shareSettings.allowDownload"
              type="checkbox"
              class="toggle-checkbox"
            />
            <span>PDF-Download erlauben</span>
          </label>
          <label class="toggle-option">
            <input
              v-model="shareSettings.requireAuth"
              type="checkbox"
              class="toggle-checkbox"
            />
            <span>Anmeldung erforderlich</span>
          </label>
          <label class="toggle-option">
            <input
              v-model="shareSettings.expiresEnabled"
              type="checkbox"
              class="toggle-checkbox"
            />
            <span>Link läuft ab am</span>
          </label>
          <input
            v-if="shareSettings.expiresEnabled"
            v-model="shareSettings.expiryDate"
            type="date"
            class="expiry-input"
            :min="tomorrow"
          />
        </div>
      </div>

      <div class="modal-footer">
        <button @click="close" class="btn-secondary">
          Schließen
        </button>
        <button @click="saveSettings" class="btn-primary">
          <CheckIcon class="w-4 h-4" />
          Einstellungen speichern
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  XMarkIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'

interface Props {
  inspectionId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'close': []
}>()

// State
const linkCopied = ref(false)
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const sharedUsers = ref<any[]>([])
const linkInput = ref<HTMLInputElement>()

const shareSettings = reactive({
  viewOnly: true,
  allowDownload: true,
  requireAuth: false,
  expiresEnabled: false,
  expiryDate: ''
})

// Computed
const shareLink = computed(() => {
  const baseUrl = window.location.origin
  return `${baseUrl}/shared/${props.inspectionId}`
})

const tomorrow = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
})

// Methods
async function copyLink() {
  if (!linkInput.value) return
  
  linkInput.value.select()
  await navigator.clipboard.writeText(shareLink.value)
  
  linkCopied.value = true
  setTimeout(() => {
    linkCopied.value = false
  }, 2000)
}

function searchUsers() {
  if (!searchQuery.value) {
    searchResults.value = []
    return
  }
  
  // Mock user search
  searchResults.value = [
    {
      id: '1',
      name: 'Max Mustermann',
      email: 'max.mustermann@amazon.at',
      color: '#3B82F6'
    },
    {
      id: '2',
      name: 'Anna Schmidt',
      email: 'anna.schmidt@amazon.at',
      color: '#8B5CF6'
    }
  ].filter(user => 
    user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
}

function addUser(user: any) {
  if (!sharedUsers.value.find(u => u.id === user.id)) {
    sharedUsers.value.push({
      ...user,
      permission: 'view'
    })
  }
  searchQuery.value = ''
  searchResults.value = []
}

function removeUser(userId: string) {
  sharedUsers.value = sharedUsers.value.filter(u => u.id !== userId)
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

function saveSettings() {
  console.log('Saving share settings:', {
    settings: shareSettings,
    users: sharedUsers.value
  })
  
  // Show success message
  alert('Freigabeeinstellungen wurden gespeichert')
}

function close() {
  emit('close')
}
</script>

<style scoped>
.modal-backdrop {
  @apply fixed inset-0 bg-black bg-opacity-50 z-50;
  @apply flex items-center justify-center p-4;
}

.modal-content {
  @apply bg-surface-secondary rounded-lg;
  @apply w-full max-w-2xl max-h-[90vh];
  @apply flex flex-col;
}

.modal-header {
  @apply flex items-center justify-between;
  @apply p-4 border-b border-surface-tertiary;
}

.close-btn {
  @apply p-2 rounded-lg hover:bg-surface-tertiary;
  @apply transition-colors;
}

.modal-body {
  @apply flex-1 p-4 overflow-y-auto;
  @apply space-y-6;
}

.share-section {
  @apply space-y-3;
}

.section-title {
  @apply text-sm font-medium text-text-secondary;
}

.share-link-container {
  @apply flex gap-2;
}

.share-link-input {
  @apply flex-1 px-3 py-2;
  @apply bg-surface-tertiary rounded-lg;
  @apply text-sm text-text-secondary;
  @apply outline-none;
}

.copy-btn {
  @apply px-3 py-2 rounded-lg;
  @apply bg-surface-tertiary hover:bg-accent-primary hover:bg-opacity-20;
  @apply transition-all;
}

.copy-btn.copied {
  @apply bg-accent-success bg-opacity-20 text-accent-success;
}

.access-options {
  @apply space-y-2;
}

.access-option {
  @apply flex items-center p-3;
  @apply bg-surface-tertiary rounded-lg;
  @apply cursor-pointer hover:bg-opacity-80;
}

.access-option input[type="radio"] {
  @apply mr-3;
}

.option-content {
  @apply flex items-center gap-3;
}

.search-input {
  @apply w-full px-4 py-2;
  @apply bg-surface-tertiary rounded-lg;
  @apply text-sm placeholder-text-tertiary;
  @apply outline-none;
}

.search-results {
  @apply mt-2 space-y-1;
  @apply max-h-40 overflow-y-auto;
}

.user-result {
  @apply w-full flex items-center gap-3 p-2;
  @apply hover:bg-surface-tertiary rounded-lg;
  @apply transition-colors;
}

.user-avatar {
  @apply w-8 h-8 rounded-full;
  @apply flex items-center justify-center;
  @apply text-xs font-bold text-white;
}

.user-info {
  @apply flex-1 text-left;
}

.shared-users {
  @apply mt-3 space-y-2;
}

.shared-user {
  @apply flex items-center gap-3 p-2;
  @apply bg-surface-tertiary rounded-lg;
}

.permission-select {
  @apply px-2 py-1 text-xs;
  @apply bg-surface-primary rounded;
  @apply outline-none;
}

.remove-btn {
  @apply p-1 rounded hover:bg-surface-primary;
  @apply text-text-tertiary hover:text-accent-error;
  @apply transition-colors;
}

.toggle-option {
  @apply flex items-center gap-3 p-2;
  @apply cursor-pointer;
}

.toggle-checkbox {
  @apply w-4 h-4 rounded;
  @apply bg-surface-tertiary border-surface-tertiary;
  @apply text-accent-primary focus:ring-accent-primary;
}

.expiry-input {
  @apply mt-2 px-3 py-2;
  @apply bg-surface-tertiary rounded-lg;
  @apply text-sm outline-none;
}

.modal-footer {
  @apply flex items-center justify-end gap-3;
  @apply p-4 border-t border-surface-tertiary;
}
</style>
