<!-- src/components/modals/NoteModal.vue -->
<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="text-lg font-semibold">Notiz hinzufügen</h2>
        <button @click="close" class="close-btn">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="modal-body">
        <textarea
          v-model="localNote"
          @input="handleInput"
          placeholder="Fügen Sie hier Ihre Notizen oder Beobachtungen hinzu..."
          class="note-textarea"
          :maxlength="maxLength"
          rows="6"
          ref="textareaRef"
        />

        <!-- Quick Insert Buttons -->
        <div class="quick-inserts">
          <span class="text-xs text-text-secondary">Schnelleinfügung:</span>
          <div class="insert-buttons">
            <button
              v-for="insert in quickInserts"
              :key="insert.text"
              @click="insertText(insert.text)"
              class="insert-btn"
              :title="insert.tooltip"
            >
              <component :is="insert.icon" class="w-3 h-3" />
              <span>{{ insert.label }}</span>
            </button>
          </div>
        </div>

        <!-- Character Count -->
        <div class="char-count">
          <span :class="{ 'text-accent-error': localNote.length > maxLength - 50 }">
            {{ localNote.length }} / {{ maxLength }}
          </span>
        </div>

        <!-- Templates -->
        <div v-if="noteTemplates.length > 0" class="templates-section">
          <h3 class="text-sm font-medium mb-2">Vorlagen:</h3>
          <div class="templates-grid">
            <button
              v-for="template in noteTemplates"
              :key="template.id"
              @click="applyTemplate(template)"
              class="template-btn"
            >
              <component :is="template.icon" class="w-4 h-4" />
              <span>{{ template.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="close" class="btn-secondary">
          Abbrechen
        </button>
        <button @click="save" class="btn-primary">
          <CheckIcon class="w-4 h-4" />
          Speichern
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import {
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon
} from '@heroicons/vue/24/outline'

interface Props {
  modelValue: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'save': []
  'close': []
}>()

// State
const localNote = ref(props.modelValue || '')
const textareaRef = ref<HTMLTextAreaElement>()
const maxLength = 1000

// Quick insert options
const quickInserts = [
  { 
    text: `[${new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}]`,
    label: 'Zeit',
    icon: ClockIcon,
    tooltip: 'Aktuelle Uhrzeit einfügen'
  },
  {
    text: '[Person: ]',
    label: 'Person',
    icon: UserIcon,
    tooltip: 'Person markieren'
  },
  {
    text: '[Ort: ]',
    label: 'Ort',
    icon: MapPinIcon,
    tooltip: 'Ort markieren'
  },
  {
    text: '⚠️ ',
    label: 'Warnung',
    icon: ExclamationTriangleIcon,
    tooltip: 'Warnung hinzufügen'
  },
  {
    text: 'ℹ️ ',
    label: 'Info',
    icon: InformationCircleIcon,
    tooltip: 'Information hinzufügen'
  },
  {
    text: '💡 ',
    label: 'Idee',
    icon: LightBulbIcon,
    tooltip: 'Idee/Vorschlag hinzufügen'
  }
]

// Note templates based on context
const noteTemplates = [
  {
    id: 'safety-violation',
    name: 'Sicherheitsverstoß',
    icon: ExclamationTriangleIcon,
    text: 'Sicherheitsverstoß beobachtet:\n- Person: [Name]\n- Zeit: [Zeit]\n- Verstoß: \n- Maßnahme: '
  },
  {
    id: 'maintenance-needed',
    name: 'Wartung erforderlich',
    icon: InformationCircleIcon,
    text: 'Wartung erforderlich für:\n- Gerät/Bereich: \n- Problem: \n- Priorität: [Hoch/Mittel/Niedrig]\n- Empfohlene Maßnahme: '
  },
  {
    id: 'best-practice',
    name: 'Best Practice',
    icon: LightBulbIcon,
    text: 'Positive Beobachtung:\n- Bereich: \n- Beschreibung: \n- Empfehlung zur Übernahme in anderen Bereichen'
  }
]

// Methods
function handleInput() {
  emit('update:modelValue', localNote.value)
}

function insertText(text: string) {
  if (!textareaRef.value) return
  
  const textarea = textareaRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  
  const newValue = 
    localNote.value.substring(0, start) + 
    text + 
    localNote.value.substring(end)
  
  localNote.value = newValue
  handleInput()
  
  // Set cursor position after inserted text
  nextTick(() => {
    textarea.focus()
    const newPosition = start + text.length
    textarea.setSelectionRange(newPosition, newPosition)
  })
}

function applyTemplate(template: any) {
  localNote.value = template.text.replace('[Zeit]', new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' }))
  handleInput()
  
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

function save() {
  emit('save')
}

function close() {
  emit('close')
}

// Focus textarea on mount
onMounted(() => {
  textareaRef.value?.focus()
})
</script>

<style scoped>
.modal-backdrop {
  @apply fixed inset-0 bg-black bg-opacity-50 z-50;
  @apply flex items-center justify-center p-4;
}

.modal-content {
  @apply bg-surface-secondary rounded-lg;
  @apply w-full max-w-2xl max-h-[80vh];
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
}

.note-textarea {
  @apply w-full p-4;
  @apply bg-surface-tertiary rounded-lg;
  @apply border-2 border-transparent;
  @apply text-text-primary placeholder-text-tertiary;
  @apply focus:border-accent-primary focus:bg-surface-primary;
  @apply outline-none transition-all resize-none;
}

.quick-inserts {
  @apply mt-4 space-y-2;
}

.insert-buttons {
  @apply flex flex-wrap gap-2;
}

.insert-btn {
  @apply flex items-center gap-1 px-2 py-1;
  @apply bg-surface-tertiary rounded text-xs;
  @apply hover:bg-accent-primary hover:bg-opacity-20;
  @apply transition-all;
}

.char-count {
  @apply text-right text-xs text-text-tertiary mt-2;
}

.templates-section {
  @apply mt-6 pt-4 border-t border-surface-tertiary;
}

.templates-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-2;
}

.template-btn {
  @apply flex items-center gap-2 p-3;
  @apply bg-surface-tertiary rounded-lg text-sm text-left;
  @apply hover:bg-accent-primary hover:bg-opacity-20;
  @apply transition-all;
}

.modal-footer {
  @apply flex items-center justify-end gap-3;
  @apply p-4 border-t border-surface-tertiary;
}
</style>
