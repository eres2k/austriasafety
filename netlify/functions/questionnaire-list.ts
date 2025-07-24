// netlify/functions/questionnaire-list.ts
import { Handler } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { questionnaireTemplates } from '../../src/data/questionnaire-templates'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { location, category, active } = event.queryStringParameters || {}
    
    // For now, return static templates
    // In production, these would be stored in Netlify Blobs
    let templates = [...questionnaireTemplates]
    
    // Apply filters
    if (location) {
      templates = templates.filter(t => t.location === location)
    }
    
    if (category) {
      templates = templates.filter(t => t.category === category)
    }
    
    if (active !== undefined) {
      templates = templates.filter(t => t.active === (active === 'true'))
    }
    
    // Add usage statistics
    const enhancedTemplates = await Promise.all(
      templates.map(async (template) => {
        const stats = await getTemplateStats(template.id)
        return {
          ...template,
          stats
        }
      })
    )

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: enhancedTemplates
      })
    }
  } catch (error) {
    console.error('List error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}

async function getTemplateStats(templateId: string) {
  const statsStore = getStore('template-stats')
  const statsData = await statsStore.get(templateId)
  
  if (!statsData) {
    return {
      usageCount: 0,
      lastUsed: null,
      averageCompletionTime: 0,
      averageScore: 0
    }
  }
  
  return JSON.parse(statsData)
}
