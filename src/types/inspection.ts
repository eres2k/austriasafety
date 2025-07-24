export interface Inspection {
  id: string
  templateId: string
  location: LocationCode
  name: string
  description?: string
  status: InspectionStatus
  responses: Record<string, QuestionResponse>
  progress: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  createdBy: string
  assignedTo?: string[]
  tags?: string[]
  metadata?: Record<string, any>
}

export type LocationCode = 'DVI1' | 'DVI2' | 'DVI3' | 'DAP5' | 'DAP8'

export type InspectionStatus = 
  | 'draft'
  | 'in-progress'
  | 'pending-review'
  | 'completed'
  | 'archived'

export interface QuestionResponse {
  questionId: string
  status?: ResponseStatus
  value?: any
  note?: string
  media?: MediaAttachment[]
  updatedAt: string
  updatedBy?: string
}

export type ResponseStatus = 'passed' | 'failed' | 'na' | 'pending'

export interface MediaAttachment {
  id: string
  type: 'image' | 'video' | 'audio'
  url?: string
  data?: string
  thumbnail?: string
  caption?: string
  createdAt: string
}