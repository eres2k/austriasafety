import { Handler } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'PATCH') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const inspectionStore = getStore('inspections')
    const { id, ...updates } = JSON.parse(event.body || '{}')
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Inspection ID required' })
      }
    }

    // Get existing inspection
    const existingData = await inspectionStore.get(id)
    
    if (!existingData) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Inspection not found' })
      }
    }

    const existingInspection = JSON.parse(existingData)
    
    // Merge updates
    const updatedInspection = {
      ...existingInspection,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    // Save updated inspection
    await inspectionStore.setJSON(id, updatedInspection)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: updatedInspection
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
