<!-- src/views/Settings.vue -->
<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="text-2xl font-bold">Einstellungen</h1>
      <p class="text-text-secondary mt-1">
        Passen Sie die Anwendung an Ihre Bedürfnisse an
      </p>
    </div>

    <!-- Settings Navigation -->
    <div class="settings-layout">
      <nav class="settings-nav">
        <button
          v-for="section in settingsSections"
          :key="section.id"
          @click="activeSection = section.id"
          class="nav-item"
          :class="{ active: activeSection === section.id }"
        >
          <component :is="section.icon" class="w-5 h-5" />
          <span>{{ section.name }}</span>
        </button>
      </nav>

      <!-- Settings Content -->
      <div class="settings-content">
        <!-- Profile Settings -->
        <div v-if="activeSection === 'profile'" class="settings-section">
          <h2 class="section-title">Profil</h2>
          
          <div class="setting-group">
            <div class="avatar-section">
              <div class="current-avatar" :style="{ backgroundColor: user?.color || '#FF9500' }">
                {{ getInitials(user?.name || '') }}
              </div>
              <div>
                <h3 class="font-medium">{{ user?.name }}</h3>
                <p class="text-sm text-text-secondary">{{ user?.email }}</p>
                <button class="text-sm text-accent-primary hover:underline mt-2">
                  Avatar ändern
                </button>
              </div>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">Name</label>
            <input
              v-model="profileForm.name"
              type="text"
              class="setting-input"
            />
          </div>

          <div class="setting-group">
            <label class="setting-label">E-Mail</label>
            <input
              v-model="profileForm.email"
              type="email"
              class="setting-input"
              disabled
            />
            <p class="setting-hint">
              E-Mail-Adresse kann nicht geändert werden
            </p>
          </div>

          <div class="setting-group">
            <label class="setting-label">Abteilung</label>
            <input
              v-model="profileForm.department"
              type="text"
              class="setting-input"
            />
          </div>

          <div class="setting-group">
            <label class="setting-label">Zertifizierungen</label>
            <div class="certifications-list">
              <div
                v-for="cert in profileForm.certifications"
                :key="cert.number"
                class="certification-item"
              >
                <div>
                  <div class="font-medium">{{ cert.type }}</div>
                  <div class="text-sm text-text-secondary">
                    Nr. {{ cert.number }} • Gültig bis {{ formatDate(cert.expiryDate) }}
                  </div>
                </div>
                <button class="text-accent-error hover:underline">
                  Entfernen
                </button>
              </div>
            </div>
            <button class="btn-secondary mt-2">
              <PlusIcon class="w-4 h-4" />
              Zertifizierung hinzufügen
            </button>
          </div>
        </div>

        <!-- Preferences -->
        <div v-if="activeSection === 'preferences'" class="settings-section">
          <h2 class="section-title">Präferenzen</h2>

          <div class="setting-group">
            <label class="setting-label">Sprache</label>
            <select v-model="preferences.language" class="setting-select">
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label">Standard-Standort</label>
            <select v-model="preferences.defaultLocation" class="setting-select">
              <option value="">Keiner</option>
              <option value="DVI1">DVI1 - Wien 1</option>
              <option value="DVI2">DVI2 - Wien 2</option>
              <option value="DVI3">DVI3 - Wien 3</option>
              <option value="DAP5">DAP5 - Graz</option>
              <option value="DAP8">DAP8 - Linz</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label">Design</label>
            <div class="theme-options">
              <label class="theme-option">
                <input
                  v-model="preferences.theme"
                  type="radio"
                  value="dark"
                  class="theme-radio"
                />
                <div class="theme-preview dark">
                  <MoonIcon class="w-5 h-5" />
                  <span>Dunkel</span>
                </div>
              </label>
              <label class="theme-option">
                <input
                  v-model="preferences.theme"
                  type="radio"
                  value="light"
                  class="theme-radio"
                />
                <div class="theme-preview light">
                  <SunIcon class="w-5 h-5" />
                  <span>Hell</span>
                </div>
              </label>
              <label class="theme-option">
                <input
                  v-model="preferences.theme"
                  type="radio"
                  value="auto"
                  class="theme-radio"
                />
                <div class="theme-preview auto">
                  <ComputerDesktopIcon class="w-5 h-5" />
                  <span>System</span>
                </div>
              </label>
            </div>
          </div>

          <div class="setting-group">
            <h3 class="setting-label">Eingabeoptionen</h3>
            <label class="toggle-setting">
              <input
                v-model="preferences.enableVoiceInput"
                type="checkbox"
                class="toggle-checkbox"
              />
              <span>Spracheingabe aktivieren</span>
            </label>
            <label class="toggle-setting">
              <input
                v-model="preferences.enableHapticFeedback"
                type="checkbox"
                class="toggle-checkbox"
              />
              <span>Haptisches Feedback (Mobile)</span>
            </label>
            <label class="toggle-setting">
              <input
                v-model="preferences.autoSave"
                type="checkbox"
                class="toggle-checkbox"
              />
              <span>Automatisches Speichern</span>
            </label>
          </div>
        </div>

        <!-- Notifications -->
        <div v-if="activeSection === 'notifications'" class="settings-section">
          <h2 class="section-title">Benachrichtigungen</h2>

          <div class="setting-group">
            <h3 class="setting-label">Benachrichtigungskanäle</h3>
            <label class="toggle-setting">
              <input
                v-model="notifications.email"
                type="checkbox"
                class="toggle-checkbox"
              />
              <span>E-Mail-Benachrichtigungen</span>
            </label>
            <label class="toggle-setting">
              <input
                v-model="notifications.push"
                type="checkbox"
                class="toggle-checkbox"
              />
              <span>Push-Benachrichtigungen</span>
            </label>
            <label class="toggle-setting">
              <input
                v-model="notifications.inApp"
                type="checkbox"
                class="toggle-checkbox"
              />
              <span>In-App-Benachrichtigungen</span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-label">Benachrichtigungsfrequenz</label>
            <select v-model="notifications.frequency" class="setting-select">
              <option value="realtime">Echtzeit</option>
              <option value="hourly">Stündlich</option>
              <option value="daily">Täglich</option>
              <option value="weekly">Wöchentlich</option>
            </select>
          </div>

          <div class="setting-group">
            <h3 class="setting-label">Benachrichtigungen für</h3>
            <label class="toggle-setting">
              <input
                v-model="notifications.inspectionCompleted"
                type="checkbox"
                class="toggle-checkbox"
              />
              <span>Inspektion abgeschlossen</span>
            </label>
            <label class="toggle-setting">
              <input
                v-model="notifications.inspectionAssigned"
                type="checkbox"
                class="toggle-checkbox"
              />
              <span>Neue Inspektion zugewiesen</span>
            </label>
            <label class="toggle-setting">
              <input
                v-model="notifications.criticalFindings"
                type="checkbox"
                class="toggle-checkbox"
              />
              <span>Kritische Befunde</span>
            </label>
            <label class="toggle-setting">
              <input
                v-model="notifications.reportGenerated"
                type="checkbox"
                class="toggle-checkbox"
              />
              <span>Bericht erstellt</span>
            </label>
          </div>
        </div>

        <!-- Privacy -->
        <div v-if="activeSection === 'privacy'" class="settings-section">
          <h2 class="section-title">Datenschutz & Sicherheit</h2>

          <div class="setting-group">
            <h3 class="setting-label">Zwei-Faktor-Authentifizierung</h3>
            <div class="two-factor-status">
              <div class="flex items-center gap-2">
                <ShieldCheckIcon class="w-5 h-5 text-accent-success" />
                <span>2FA ist aktiviert</span>
              </div>
              <button class="text-sm text-accent-primary hover:underline">
                Verwalten
              </button>
            </div>
          </div>

          <div class="setting-group">
            <h3 class="setting-label">Sitzungen</h3>
            <div class="sessions-list">
              <div class="session-item">
                <div>
                  <div class="font-medium">Chrome auf Windows</div>
                  <div class="text-sm text-text-secondary">
                    Wien, Österreich • Aktuelle Sitzung
                  </div>
                </div>
                <span class="text-accent-success text-sm">Aktiv</span>
              </div>
            </div>
            <button class="text-sm text-accent-error hover:underline mt-2">
              Alle anderen Sitzungen abmelden
            </button>
          </div>

          <div class="setting-group">
            <h3 class="setting-label">Datenexport</h3>
            <p class="text-sm text-text-secondary mb-3">
              Exportieren Sie alle Ihre Daten gemäß DSGVO
            </p>
            <button class="btn-secondary">
              <DocumentArrowDownIcon class="w-4 h-4" />
              Daten exportieren
            </button>
          </div>

          <div class="setting-group">
            <h3 class="setting-label text-accent-error">Gefahrenzone</h3>
            <div class="danger-zone">
              <div>
                <h4 class="font-medium">Konto löschen</h4>
                <p class="text-sm text-text-secondary">
                  Diese Aktion kann nicht rückgängig gemacht werden
                </p>
              </div>
              <button class="btn-danger">
                Konto löschen
              </button>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div class="settings-footer">
          <button @click="saveSettings" class="btn-primary">
            <CheckIcon class="w-4 h-4" />
            Änderungen speichern
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { format } from 'date-fns'
import {
  UserIcon,
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  PlusIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  DocumentArrowDownIcon,
  CheckIcon
} from '@heroicons/vue/24/outline'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const user = authStore.user

// State
const activeSection = ref('profile')

const settingsSections = [
  { id: 'profile', name: 'Profil', icon: UserIcon },
  { id: 'preferences', name: 'Präferenzen', icon: Cog6ToothIcon },
  { id: 'notifications', name: 'Benachrichtigungen', icon: BellIcon },
  { id: 'privacy', name: 'Datenschutz', icon: ShieldCheckIcon }
]

// Form data
const profileForm = reactive({
  name: user?.name || '',
  email: user?.email || '',
  department: user?.department || '',
  certifications: user?.certifications || []
})

const preferences = reactive({
  language: user?.preferences?.language || 'de',
  theme: user?.preferences?.theme || 'dark',
  defaultLocation: user?.preferences?.defaultLocation || '',
  enableVoiceInput: true,
  enableHapticFeedback: true,
  autoSave: true
})

const notifications = reactive({
  email: user?.preferences?.notifications?.email ?? true,
  push: user?.preferences?.notifications?.push ?? true,
  inApp: true,
  frequency: user?.preferences?.notifications?.frequency || 'daily',
  inspectionCompleted: true,
  inspectionAssigned: true,
  criticalFindings: true,
  reportGenerated: true
})

// Methods
function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

function formatDate(date: string | undefined): string {
  if (!date) return 'N/A'
  return format(new Date(date), 'dd.MM.yyyy')
}

async function saveSettings() {
  // Save settings to backend
  console.log('Saving settings...', {
    profile: profileForm,
    preferences,
    notifications
  })
  
  // Show success message
  alert('Einstellungen wurden gespeichert')
}
</script>

<style scoped>
.page-header {
  @apply mb-6;
}

.settings-layout {
  @apply flex gap-6;
}

.settings-nav {
  @apply w-64 flex-shrink-0;
  @apply bg-surface-secondary rounded-lg p-2;
  @apply border border-surface-tertiary;
  @apply h-fit sticky top-4;
}

.nav-item {
  @apply w-full flex items-center gap-3 px-3 py-2;
  @apply text-text-secondary rounded-lg;
  @apply hover:bg-surface-tertiary transition-colors;
}

.nav-item.active {
  @apply bg-surface-tertiary text-text-primary;
}

.settings-content {
  @apply flex-1;
}

.settings-section {
  @apply bg-surface-secondary rounded-lg p-6;
  @apply border border-surface-tertiary;
}

.section-title {
  @apply text-xl font-semibold mb-6;
}

.setting-group {
  @apply mb-6;
}

.setting-label {
  @apply block text-sm font-medium mb-2;
}

.setting-input {
  @apply w-full px-4 py-2;
  @apply bg-surface-tertiary rounded-lg;
  @apply border-2 border-transparent;
  @apply focus:border-accent-primary outline-none;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.setting-select {
  @apply w-full px-4 py-2;
  @apply bg-surface-tertiary rounded-lg;
  @apply border-2 border-transparent;
  @apply focus:border-accent-primary outline-none;
}

.setting-hint {
  @apply text-xs text-text-tertiary mt-1;
}

.avatar-section {
  @apply flex items-center gap-4;
}

.current-avatar {
  @apply w-20 h-20 rounded-full;
  @apply flex items-center justify-center;
  @apply text-2xl font-bold text-white;
}

.certifications-list {
  @apply space-y-2;
}

.certification-item {
  @apply flex items-center justify-between;
  @apply p-3 bg-surface-tertiary rounded-lg;
}

.theme-options {
  @apply grid grid-cols-3 gap-3;
}

.theme-option {
  @apply cursor-pointer;
}

.theme-radio {
  @apply sr-only;
}

.theme-preview {
  @apply flex flex-col items-center gap-2 p-4;
  @apply bg-surface-tertiary rounded-lg;
  @apply border-2 border-transparent;
  @apply transition-all;
}

.theme-radio:checked + .theme-preview {
  @apply border-accent-primary bg-accent-primary bg-opacity-10;
}

.theme-preview.light {
  @apply bg-white text-gray-900;
}

.toggle-setting {
  @apply flex items-center gap-3 p-3;
  @apply bg-surface-tertiary rounded-lg mb-2;
  @apply cursor-pointer hover:bg-opacity-80;
}

.toggle-checkbox {
  @apply w-4 h-4 rounded;
  @apply bg-surface-primary border-surface-tertiary;
  @apply text-accent-primary focus:ring-accent-primary;
}

.two-factor-status {
  @apply flex items-center justify-between;
  @apply p-3 bg-surface-tertiary rounded-lg;
}

.sessions-list {
  @apply space-y-2;
}

.session-item {
  @apply flex items-center justify-between;
  @apply p-3 bg-surface-tertiary rounded-lg;
}

.danger-zone {
  @apply flex items-center justify-between;
  @apply p-4 border-2 border-accent-error border-opacity-30 rounded-lg;
  @apply bg-accent-error bg-opacity-5;
}

.btn-danger {
  @apply px-4 py-2 bg-accent-error text-white rounded-lg;
  @apply hover:bg-opacity-90 transition-all;
}

.settings-footer {
  @apply mt-6 flex justify-end;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .settings-layout {
    @apply flex-col;
  }

  .settings-nav {
    @apply w-full flex overflow-x-auto;
    @apply sticky top-0 z-10;
  }

  .nav-item {
    @apply whitespace-nowrap;
  }

  .theme-options {
    @apply grid-cols-1;
  }
}
</style>
