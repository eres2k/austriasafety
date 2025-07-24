import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Inspection } from '@/types'
import api from '@/utils/api'

export const useInspectionStore = defineStore('inspection', () => {
  const inspections = ref<Inspection[]>([])
  const pendingInspections = ref<Inspection[]>([])
  const recentInspections = ref<Inspection[]>([])
  const loading = ref(false)

  async function loadInspections() {
    loading.value = true
    try {
      const response = await api.get('/inspection-list')
      inspections.value = response.data.data
    } finally {
      loading.value = false
    }
  }

  async function loadInspection(id: string) {
    const response = await api.get(`/inspection-get?id=${id}`)
    return response.data.data
  }

  async function createInspection(data: any) {
    const response = await api.post('/inspection-create', data)
    return response.data.data
  }

  async function updateInspection(id: string, updates: any) {
    const response = await api.patch(`/inspection-update`, { id, ...updates })
    return response.data.data
  }

  async function loadRecentInspections() {
    const response = await api.get('/inspection-list?limit=5')
    recentInspections.value = response.data.data
  }

  return {
    inspections,
    pendingInspections,
    recentInspections,
    loading,
    loadInspections,
    loadInspection,
    createInspection,
    updateInspection,
    loadRecentInspections
  }
})