// netlify/functions/blob.js
// Minimal blob handler with extensive error handling

exports.handler = async (event, context) => {
  console.log('=== Blob Function Called ===');
  console.log('Method:', event.httpMethod);
  console.log('Path:', event.queryStringParameters?.path);
  console.log('Has Auth:', !!event.headers.authorization);
  
  // CORS headers for all responses
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS'
  };
  
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  // Check authentication
  const user = context.clientContext?.user;
  console.log('User:', user ? user.email : 'none');
  
  if (!user) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Please log in to access this resource'
      })
    };
  }
  
  // Get parameters
  const path = event.queryStringParameters?.path || '';
  const isList = event.queryStringParameters?.list === 'true';
  
  // For now, use a simple in-memory store for testing
  // This will reset on each function invocation, but helps test the connection
  const mockData = {
    [`questions/${user.id}/questions.json`]: JSON.stringify([
      { id: 'test-1', type: 'boolean', question: 'Test question 1', required: true, category: 'Test' },
      { id: 'test-2', type: 'text', question: 'Test question 2', required: false, category: 'Test' }
    ])
  };
  
  try {
    switch (event.httpMethod) {
      case 'GET':
        if (isList) {
          // Mock list response
          console.log('List request for:', path);
          
          // Return empty list for now
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ blobs: [] })
          };
          
        } else {
          // Get specific item
          console.log('Get request for:', path);
          
          // Check mock data first
          if (mockData[path]) {
            return {
              statusCode: 200,
              headers,
              body: mockData[path]
            };
          }
          
          // Return 404 for everything else
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: 'Not found',
              message: 'This is expected for new users'
            })
          };
        }
        
      case 'PUT':
        console.log('Put request for:', path);
        
        // Mock successful save
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true,
            message: 'Data saved (in mock mode)',
            path: path
          })
        };
        
      case 'DELETE':
        console.log('Delete request for:', path);
        
        // Mock successful delete
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true,
            message: 'Data deleted (in mock mode)'
          })
        };
        
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ 
            error: 'Method not allowed',
            allowed: ['GET', 'PUT', 'DELETE']
          })
        };
    }
    
  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        type: error.constructor.name
      })
    };
  }
};
