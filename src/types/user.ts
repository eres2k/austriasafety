import { LocationCode } from './inspection'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  locations: LocationCode[]
  department?: string
  certifications?: Certification[]
  preferences: UserPreferences
  stats?: UserStats
  createdAt: string
  lastActive: string
}

export type UserRole = 'sifa' | 'safety_inspector' | 'safety_manager' | 'leadership_viewer' | 'admin'

export interface Certification {
  type: string
  number: string
  issuedDate: string
  expiryDate?: string
}

export interface UserPreferences {
  language: 'de' | 'en'
  theme: 'dark' | 'light' | 'auto'
  notifications: {
    email: boolean
    push: boolean
    frequency: 'realtime' | 'daily' | 'weekly'
  }
  defaultLocation?: LocationCode
}

export interface UserStats {
  totalInspections: number
  completedInspections: number
  averageCompletionTime: number
  safetyScore: number
  badges: Badge[]
  streak: number
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt: string
  category: 'milestone' | 'achievement' | 'special'
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: {
    page?: number
    total?: number
    timestamp: string
  }
}

export interface ApiError {
  code: string
  message: string
  details?: any
}