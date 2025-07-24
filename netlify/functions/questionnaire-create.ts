// netlify/functions/questionnaire-create.ts
import { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface QuestionnaireData {
  id: string;
  name: string;
  description: string;
  locations: string[];
  sections: Section[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  version: number;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  order: number;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'number' | 'checkbox' | 'radio' | 'select' | 'photo' | 'signature';
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  order: number;
}

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Check method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Verify authentication
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const token = authHeader.substring(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check admin role
    if (decoded.role !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Forbidden: Admin access required' })
      };
    }

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const questionnaireData = JSON.parse(event.body);

    // Validate required fields
    if (!questionnaireData.name || !questionnaireData.locations || !questionnaireData.sections) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Generate ID and timestamps
    const id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Create questionnaire object
    const questionnaire: QuestionnaireData = {
      id,
      name: questionnaireData.name,
      description: questionnaireData.description || '',
      locations: questionnaireData.locations,
      sections: questionnaireData.sections.map((section: any, sIndex: number) => ({
        id: `s_${Date.now()}_${sIndex}`,
        title: section.title,
        description: section.description,
        order: section.order || sIndex,
        questions: section.questions.map((question: any, qIndex: number) => ({
          id: `q_${Date.now()}_${sIndex}_${qIndex}`,
          text: question.text,
          type: question.type,
          required: question.required || false,
          options: question.options,
          validation: question.validation,
          order: question.order || qIndex
        }))
      })),
      createdBy: decoded.email,
      createdAt: timestamp,
      updatedAt: timestamp,
      isActive: true,
      version: 1
    };

    // Store in Netlify Blobs
    const store = getStore('questionnaires');
    await store.set(id, questionnaire);

    // Update questionnaires index
    const indexStore = getStore('metadata');
    const indexData = await indexStore.get('questionnaires_index', { type: 'json' }) || { questionnaires: [] };
    
    indexData.questionnaires.push({
      id,
      name: questionnaire.name,
      locations: questionnaire.locations,
      createdAt: timestamp,
      updatedAt: timestamp,
      isActive: true,
      createdBy: decoded.email
    });

    await indexStore.set('questionnaires_index', indexData);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        data: questionnaire
      })
    };

  } catch (error) {
    console.error('Error creating questionnaire:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
