// tests/setup.ts
import { config } from '@vue/test-utils'
import { vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Setup Pinia
beforeEach(() => {
  setActivePinia(createPinia())
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock navigator
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue('')
  },
  writable: true
})

// Mock fetch
global.fetch = vi.fn()

// Vue Test Utils global config
config.global.stubs = {
  teleport: true,
  transition: true
}

// Mock router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  }),
  useRoute: () => ({
    params: {},
    query: {},
    path: '/'
  }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
}))

// Mock i18n if used
vi.mock('@/i18n', () => ({
  i18n: {
    global: {
      t: (key: string) => key,
      locale: { value: 'de' }
    }
  }
}))

// Helper functions for tests
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

export const createTestingPinia = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

export const mockApiResponse = (data: any, options: { delay?: number } = {}) => {
  return new Promise(resolve => {
    setTimeout(() => resolve({ data }), options.delay || 0)
  })
}
