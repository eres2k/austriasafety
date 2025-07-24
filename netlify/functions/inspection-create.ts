import { Handler } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import crypto from 'crypto'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const inspectionStore = getStore('inspections')
    const data = JSON.parse(event.body || '{}')
    
    const inspectionId = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    const inspection = {
      id: inspectionId,
      ...data,
      status: 'in-progress',
      createdAt: timestamp,
      updatedAt: timestamp
    }

    await inspectionStore.setJSON(inspectionId, inspection)

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: inspection
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}