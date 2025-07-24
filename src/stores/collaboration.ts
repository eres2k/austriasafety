// src/stores/collaboration.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CollaboratorInfo {
  userId: string
  name: string
  email: string
  avatar?: string
  status: 'online' | 'offline' | 'away'
  currentSection?: number
  currentQuestion?: string
  lastActivity: string
  color: string
}

export interface CollaborationEvent {
  type: 'join' | 'leave' | 'update' | 'answer' | 'comment' | 'complete'
  userId: string
  inspectionId: string
  data?: any
  timestamp: string
}

export interface LiveCursor {
  userId: string
  x: number
  y: number
  questionId?: string
}

export const useCollaborationStore = defineStore('collaboration', () => {
  // State
  const collaborators = ref<Map<string, CollaboratorInfo>>(new Map())
  const cursors = ref<Map<string, LiveCursor>>(new Map())
  const events = ref<CollaborationEvent[]>([])
  const isConnected = ref(false)
  const ws = ref<WebSocket | null>(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  
  // Current inspection being collaborated on
  const currentInspectionId = ref<string | null>(null)
  const currentUserId = ref<string | null>(null)

  // Computed
  const activeCollaborators = computed(() => {
    return Array.from(collaborators.value.values()).filter(
      c => c.status === 'online' && c.userId !== currentUserId.value
    )
  })

  const collaboratorColors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
  ]

  // Methods
  function connect(inspectionId: string, userId: string, userInfo: any) {
    currentInspectionId.value = inspectionId
    currentUserId.value = userId

    // For demo purposes, we'll use a mock WebSocket
    // In production, this would connect to a real WebSocket server
    simulateWebSocketConnection(inspectionId, userId, userInfo)
  }

  function disconnect() {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    
    collaborators.value.clear()
    cursors.value.clear()
    isConnected.value = false
    currentInspectionId.value = null
  }

  function sendEvent(event: Omit<CollaborationEvent, 'timestamp'>) {
    if (!isConnected.value || !ws.value) return

    const fullEvent: CollaborationEvent = {
      ...event,
      timestamp: new Date().toISOString()
    }

    // Send via WebSocket
    ws.value.send(JSON.stringify(fullEvent))
    
    // Add to local events
    events.value.push(fullEvent)
  }

  function updateCursor(x: number, y: number, questionId?: string) {
    if (!currentUserId.value) return

    const cursor: LiveCursor = {
      userId: currentUserId.value,
      x,
      y,
      questionId
    }

    sendEvent({
      type: 'update',
      userId: currentUserId.value,
      inspectionId: currentInspectionId.value!,
      data: { cursor }
    })
  }

  function updateActivity(section?: number, question?: string) {
    if (!currentUserId.value) return

    sendEvent({
      type: 'update',
      userId: currentUserId.value,
      inspectionId: currentInspectionId.value!,
      data: { 
        currentSection: section,
        currentQuestion: question,
        lastActivity: new Date().toISOString()
      }
    })
  }

  function broadcastAnswer(questionId: string, answer: any) {
    if (!currentUserId.value) return

    sendEvent({
      type: 'answer',
      userId: currentUserId.value,
      inspectionId: currentInspectionId.value!,
      data: { questionId, answer }
    })
  }

  // Mock WebSocket implementation for demo
  function simulateWebSocketConnection(inspectionId: string, userId: string, userInfo: any) {
    isConnected.value = true

    // Add self as collaborator
    const selfInfo: CollaboratorInfo = {
      userId,
      name: userInfo.name,
      email: userInfo.email,
      status: 'online',
      lastActivity: new Date().toISOString(),
      color: collaboratorColors[collaborators.value.size % collaboratorColors.length]
    }
    
    collaborators.value.set(userId, selfInfo)

    // Simulate other collaborators joining
    setTimeout(() => {
      if (Math.random() > 0.5) {
        const mockCollaborator: CollaboratorInfo = {
          userId: 'mock-user-1',
          name: 'Max Mustermann',
          email: 'max.mustermann@amazon.at',
          status: 'online',
          currentSection: 0,
          lastActivity: new Date().toISOString(),
          color: collaboratorColors[collaborators.value.size % collaboratorColors.length]
        }
        
        collaborators.value.set(mockCollaborator.userId, mockCollaborator)
        
        // Simulate cursor movement
        setInterval(() => {
          if (isConnected.value && Math.random() > 0.7) {
            cursors.value.set(mockCollaborator.userId, {
              userId: mockCollaborator.userId,
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight
            })
          }
        }, 2000)
      }
    }, 2000)
  }

  // Presence indicators
  function setUserStatus(status: 'online' | 'away') {
    if (!currentUserId.value) return

    const user = collaborators.value.get(currentUserId.value)
    if (user) {
      user.status = status
      sendEvent({
        type: 'update',
        userId: currentUserId.value,
        inspectionId: currentInspectionId.value!,
        data: { status }
      })
    }
  }

  // Auto-away detection
  let awayTimeout: NodeJS.Timeout | null = null
  
  function resetAwayTimer() {
    if (awayTimeout) clearTimeout(awayTimeout)
    
    setUserStatus('online')
    
    awayTimeout = setTimeout(() => {
      setUserStatus('away')
    }, 5 * 60 * 1000) // 5 minutes
  }

  // Listen for user activity
  if (typeof window !== 'undefined') {
    ['mousedown', 'keydown', 'touchstart'].forEach(event => {
      window.addEventListener(event, resetAwayTimer)
    })
  }

  return {
    // State
    collaborators,
    cursors,
    events,
    isConnected,
    currentInspectionId,
    
    // Computed
    activeCollaborators,
    
    // Methods
    connect,
    disconnect,
    sendEvent,
    updateCursor,
    updateActivity,
    broadcastAnswer,
    setUserStatus
  }
})
