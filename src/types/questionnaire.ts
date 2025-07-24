export interface Questionnaire {
  id: string
  name: string
  description?: string
  version: string
  location?: LocationCode
  category: string
  sections: QuestionnaireSection[]
  active: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  tags?: string[]
}

export interface QuestionnaireSection {
  id: string
  title: string
  description?: string
  order: number
  questions: Question[]
}

export interface Question {
  id: string
  type: QuestionType
  title: string
  description?: string
  required: boolean
  order: number
  options?: QuestionOption[]
  validation?: ValidationRule[]
  conditionalLogic?: ConditionalRule[]
  mediaRequired?: boolean
  category?: string
  weight?: number
}

export type QuestionType = 
  | 'checkbox'
  | 'radio'
  | 'text'
  | 'number'
  | 'date'
  | 'scale'
  | 'media'
  | 'signature'

export interface QuestionOption {
  id: string
  label: string
  value: any
  color?: string
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message: string
}

export interface ConditionalRule {
  questionId: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
  action: 'show' | 'hide' | 'require'
}

import { LocationCode } from './inspection'