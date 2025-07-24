import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Questionnaire } from '@/types'
import api from '@/utils/api'

export const useQuestionnaireStore = defineStore('questionnaire', () => {
  const questionnaires = ref<Questionnaire[]>([])
  const loading = ref(false)

  async function loadQuestionnaires() {
    loading.value = true
    try {
      const response = await api.get('/questionnaire-list')
      questionnaires.value = response.data.data
    } finally {
      loading.value = false
    }
  }

  async function loadTemplate(id: string) {
    const response = await api.get(`/questionnaire-get?id=${id}`)
    return response.data.data
  }

  async function createQuestionnaire(data: any) {
    const response = await api.post('/questionnaire-create', data)
    return response.data.data
  }

  return {
    questionnaires,
    loading,
    loadQuestionnaires,
    loadTemplate,
    createQuestionnaire
  }
})