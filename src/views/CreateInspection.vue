<template>
  <div class="create-inspection">
    <!-- Progress Steps -->
    <div class="progress-steps">
      <div 
        v-for="(step, index) in steps" 
        :key="step.id"
        class="step"
        :class="{
          active: currentStep === index,
          completed: currentStep > index
        }"
      >
        <div class="step-indicator">
          <CheckIcon v-if="currentStep > index" class="w-4 h-4" />
          <span v-else>{{ index + 1 }}</span>
        </div>
        <span class="step-label">{{ step.label }}</span>
      </div>
    </div>

    <!-- Step Content -->
    <div class="step-content">
      <!-- Step 1: Location Selection -->
      <div v-if="currentStep === 0" class="location-step">
        <h2 class="step-title">Standort auswählen</h2>
        <p class="step-description">
          Wählen Sie den Standort für die Inspektion
        </p>
        
        <div class="location-grid">
          <button
            v-for="location in locations"
            :key="location.code"
            @click="selectLocation(location.code)"
            class="location-card"
            :class="{ selected: formData.location === location.code }"
          >
            <BuildingOfficeIcon class="w-8 h-8 mb-2" />
            <h3 class="font-semibold">{{ location.code }}</h3>
            <p class="text-sm text-text-secondary">{{ location.name }}</p>
          </button>
        </div>
      </div>

      <!-- Step 2: Template Selection -->
      <div v-if="currentStep === 1" class="template-step">
        <h2 class="step-title">Vorlage wählen</h2>
        <p class="step-description">
          Wählen Sie eine Inspektionsvorlage
        </p>

        <div v-if="loadingTemplates" class="loading-state">
          <LoadingSpinner />
        </div>

        <div v-else class="template-grid">
          <div
            v-for="template in availableTemplates"
            :key="template.id"
            @click="selectTemplate(template.id)"
            class="template-card"
            :class="{ selected: formData.templateId === template.id }"
          >
            <div class="template-header">
              <component :is="getTemplateIcon(template.category)" class="w-6 h-6" />
              <StatusBadge 
                v-if="template.version !== '1.0'" 
                :status="`v${template.version}`" 
                size="small" 
              />
            </div>
            <h3 class="font-semibold">{{ template.name }}</h3>
            <p class="text-sm text-text-secondary mt-1">
              {{ template.description }}
            </p>
            <div class="template-meta">
              <span class="meta-item">
                <DocumentTextIcon class="w-4 h-4" />
                {{ template.sections.length }} Abschnitte
              </span>
              <span class="meta-item">
                <ClockIcon class="w-4 h-4" />
                ~{{ estimateTime(template) }} min
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Details -->
      <div v-if="currentStep === 2" class="details-step">
        <h2 class="step-title">Details hinzufügen</h2>
        <p class="step-description">
          Optionale Informationen für die Inspektion
        </p>

        <div class="form-section">
          <label class="form-label">Inspektionsname</label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="z.B. Wöchentliche Sicherheitsbegehung"
            class="form-input"
          />
        </div>

        <div class="form-section">
          <label class="form-label">Beschreibung</label>
          <textarea
            v-model="formData.description"
            placeholder="Zusätzliche Informationen..."
            rows="3"
            class="form-input"
          />
        </div>

        <div class="form-section">
          <label class="form-label">Verantwortliche Personen</label>
          <div class="assignee-selector">
            <button
              v-for="user in availableUsers"
              :key="user.id"
              @click="toggleAssignee(user.id)"
              class="assignee-chip"
              :class="{ selected: formData.assignedTo.includes(user.id) }"
            >
              <div class="assignee-avatar" :style="{ backgroundColor: user.color }">
                {{ getInitials(user.name) }}
              </div>
              <span>{{ user.name }}</span>
            </button>
          </div>
        </div>

        <div class="form-section">
          <label class="toggle-option">
            <input
              v-model="formData.enableCollaboration"
              type="checkbox"
              class="toggle-checkbox"
            />
            <span>Echtzeit-Zusammenarbeit aktivieren</span>
          </label>
          
          <label class="toggle-option">
            <input
              v-model="formData.enableVoiceInput"
              type="checkbox"
              class="toggle-checkbox"
            />
            <span>Spracheingabe aktivieren</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="step-navigation">
      <button
        v-if="currentStep > 0"
        @click="previousStep"
        class="btn-secondary"
      >
        <ArrowLeftIcon class="w-4 h-4" />
        Zurück
      </button>
      
      <div class="ml-auto flex gap-3">
        <button
          @click="saveDraft"
          class="btn-secondary"
        >
          Als Entwurf speichern
        </button>
        
        <button
          v-if="currentStep < steps.length - 1"
          @click="nextStep"
          :disabled="!canProceed"
          class="btn-primary"
        >
          Weiter
          <ArrowRightIcon class="w-4 h-4" />
        </button>
        
        <button
          v-else
          @click="startInspection"
          :disabled="!canProceed"
          class="btn-primary"
        >
          <PlayIcon class="w-4 h-4" />
          Inspektion starten
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
imp
