<!-- src/components/modals/CaptionModal.vue -->
<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="text-lg font-semibold">Bildbeschriftung hinzufügen</h2>
        <button @click="close" class="close-btn">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="modal-body">
        <input
          v-model="localCaption"
          @input="handleInput"
          @keyup.enter="save"
          type="text"
          placeholder="Beschreiben Sie, was auf dem Bild zu sehen ist..."
          class="caption-input"
          ref="inputRef"
          maxlength="200"
        />

        <div class="suggestions">
          <span class="text-xs text-text-secondary">Vorschläge:</span>
          <div class="suggestion-chips">
            <button
              v-for="suggestion in suggestions"
              :key="suggestion"
              @click="applySuggestion(suggestion)"
              class="suggestion-chip"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>

        <div class="char-count">
          <span :class="{ 'text-accent-error': localCaption.length > 180 }">
            {{ localCaption.length }} / 200
          </span>
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
import { ref, onMounted } from 'vue'
import { XMarkIcon, CheckIcon } from '@heroicons/vue/24/outline'

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
const localCaption = ref(props.modelValue || '')
const inputRef = ref<HTMLInputElement>()

// Contextual suggestions
const suggestions = [
  'Fehlende PSA',
  'Blockierter Fluchtweg',
  'Beschädigte Ausrüstung',
  'Sicherheitsverstoß',
  'Ordnungsgemäßer Zustand',
  'Wartung erforderlich'
]

// Methods
function handleInput() {
  emit('update:modelValue', localCaption.value)
}

function applySuggestion(suggestion: string) {
  if (localCaption.value) {
    localCaption.value += ' - ' + suggestion
  } else {
    localCaption.value = suggestion
  }
  handleInput()
}

function save() {
  emit('save')
}

function close() {
  emit('close')
}

// Focus input on mount
onMounted(() => {
  inputRef.value?.focus()
  inputRef.value?.select()
})
</script>

<style scoped>
.modal-backdrop {
  @apply fixed inset-0 bg-black bg-opacity-50 z-50;
  @apply flex items-center justify-center p-4;
}

.modal-content {
  @apply bg-surface-secondary rounded-lg;
  @apply w-full max-w-md;
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
  @apply p-4;
}

.caption-input {
  @apply w-full px-4 py-3;
  @apply bg-surface-tertiary rounded-lg;
  @apply border-2 border-transparent;
  @apply text-text-primary placeholder-text-tertiary;
  @apply focus:border-accent-primary focus:bg-surface-primary;
  @apply outline-none transition-all;
}

.suggestions {
  @apply mt-4 space-y-2;
}

.suggestion-chips {
  @apply flex flex-wrap gap-2;
}

.suggestion-chip {
  @apply px-3 py-1 text-xs;
  @apply bg-surface-tertiary rounded-full;
  @apply hover:bg-accent-primary hover:bg-opacity-20;
  @apply transition-all;
}

.char-count {
  @apply text-right text-xs text-text-tertiary mt-2;
}

.modal-footer {
  @apply flex items-center justify-end gap-3;
  @apply p-4 border-t border-surface-tertiary;
}
</style>
