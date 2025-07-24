import { Handler } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const inspectionStore = getStore('inspections')
    const { blobs } = await inspectionStore.list()

    const inspections = []
    for (const blob of blobs) {
      const data = await inspectionStore.get(blob.key)
      if (data) {
        inspections.push(JSON.parse(data))
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: inspections
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}