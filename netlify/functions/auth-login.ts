import { Handler } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { email, password } = JSON.parse(event.body || '{}')
    
    // Demo user - replace with real user lookup
    const demoUser = {
      id: '1',
      email: 'demo@amazon.at',
      name: 'Demo User',
      role: 'sifa',
      passwordHash: await bcrypt.hash('demo123', 10)
    }

    if (email !== demoUser.email) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Ungültige Anmeldedaten' })
      }
    }

    const token = jwt.sign(
      { userId: demoUser.id, email: demoUser.email, role: demoUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    delete demoUser.passwordHash

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, user: demoUser })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Interner Serverfehler' })
    }
  }
}