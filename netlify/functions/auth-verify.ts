import { Handler } from '@netlify/functions'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { token } = JSON.parse(event.body || '{}')
    
    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Token required' })
      }
    }

    jwt.verify(token, JWT_SECRET)

    return {
      statusCode: 200,
      body: JSON.stringify({ valid: true })
    }
  } catch (error) {
    return {
      statusCode: 200,
      body: JSON.stringify({ valid: false })
    }
  }
}