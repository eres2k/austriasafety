import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { User } from '@/types'
import api from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  
  const userRole = computed(() => user.value?.role || null)
  
  const hasRole = computed(() => (role: string | string[]) => {
    if (!user.value) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(user.value.role)
  })

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post('/auth-login', { email, password })
      
      token.value = response.data.token
      user.value = response.data.user
      
      localStorage.setItem('auth_token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      return { success: true }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Login fehlgeschlagen'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    user.value = null
    token.value = null
    
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
  }

  async function verifyToken() {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user')
    
    if (!storedToken || !storedUser) return false
    
    try {
      const response = await api.post('/auth-verify', { token: storedToken })
      
      if (response.data.valid) {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        return true
      }
    } catch (err) {
      await logout()
    }
    
    return false
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    userRole,
    hasRole,
    login,
    logout,
    verifyToken
  }
})