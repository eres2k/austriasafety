// netlify/functions/questionnaire-create.ts
import { Handler } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import crypto from 'crypto'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const questionnaireStore = getStore('questionnaires')
    const data = JSON.parse(event.body || '{}')
    
    // Validate required fields
    if (!data.name || !data.sections || !Array.isArray(data.sections)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: name, sections' 
        })
      }
    }

    // Validate sections structure
    for (const section of data.sections) {
      if (!section.title || !section.questions || !Array.isArray(section.questions)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            error: 'Invalid section structure' 
          })
        }
      }

      // Validate questions
      for (const question of section.questions) {
        if (!question.type || !question.title) {
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              error: 'Invalid question structure' 
            })
        }
      }
    }

    const questionnaireId = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    // Generate IDs for sections and questions
    const processedSections = data.sections.map((section: any, sIndex: number) => ({
      ...section,
      id: section.id || `section-${sIndex + 1}`,
      order: section.order || sIndex + 1,
      questions: section.questions.map((question: any, qIndex: number) => ({
        ...question,
        id: question.id || `q${sIndex + 1}-${qIndex + 1}`,
        order: question.order || qIndex + 1
      }))
    }))

    const questionnaire = {
      id: questionnaireId,
      name: data.name,
      description: data.description,
      version: data.version || '1.0',
      location: data.location,
      category: data.category || 'custom',
      sections: processedSections,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: data.createdBy || 'system',
      tags: data.tags || []
    }

    await questionnaireStore.setJSON(questionnaireId, questionnaire)

    // Initialize statistics
    const statsStore = getStore('template-stats')
    await statsStore.setJSON(questionnaireId, {
      usageCount: 0,
      lastUsed: null,
      averageCompletionTime: 0,
      averageScore: 0
    })

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: questionnaire
      })
    }
  } catch (error) {
    console.error('Create error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
