import { Handler } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { questionnaireTemplates } from '../../src/data/questionnaire-templates'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { id } = event.queryStringParameters || {}
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Template ID required' })
      }
    }

    // For now, return from static data
    // In production, fetch from Netlify Blobs
    const template = questionnaireTemplates.find(t => t.id === id)
    
    if (!template) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Template not found' })
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: template
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
