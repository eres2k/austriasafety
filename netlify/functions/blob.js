// netlify/functions/blob.js
// Simplified blob handler with extensive error checking

exports.handler = async (event, context) => {
  console.log('Blob function started');
  
  // CORS headers
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
  
  // Check if we have the blobs module
  let getStore;
  try {
    const blobsModule = require('@netlify/blobs');
    getStore = blobsModule.getStore;
    console.log('Blobs module loaded successfully');
  } catch (error) {
    console.error('Failed to load @netlify/blobs:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Module not found',
        message: '@netlify/blobs package is not installed. Please check netlify/functions/package.json',
        details: error.message
      })
    };
  }
  
  // Check authentication
  const user = context.clientContext?.user;
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
  
  console.log(`Request: ${event.httpMethod} ${path} (list: ${isList})`);
  
  // Initialize store
  let store;
  try {
    store = getStore('aurora-audit-data');
    console.log('Store initialized');
  } catch (error) {
    console.error('Failed to initialize store:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Storage initialization failed',
        message: 'Could not connect to blob storage',
        details: error.message
      })
    };
  }
  
  // Handle requests
  try {
    switch (event.httpMethod) {
      case 'GET':
        if (isList) {
          // List blobs
          console.log('Listing blobs with prefix:', path);
          const listResult = await store.list({ prefix: path });
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              blobs: listResult.blobs || []
            })
          };
        } else {
          // Get blob
          console.log('Getting blob:', path);
          const data = await store.get(path, { type: 'json' });
          
          if (data === null) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ 
                error: 'Not found',
                message: 'Data not found at path: ' + path
              })
            };
          }
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
          };
        }
        
      case 'PUT':
        // Save blob
        console.log('Saving blob:', path);
        const body = JSON.parse(event.body);
        await store.setJSON(path, body);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true,
            path: path
          })
        };
        
      case 'DELETE':
        // Delete blob
        console.log('Deleting blob:', path);
        await store.delete(path);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true
          })
        };
        
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ 
            error: 'Method not allowed'
          })
        };
    }
  } catch (error) {
    console.error('Operation failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Operation failed',
        message: error.message,
        operation: event.httpMethod,
        path: path
      })
    };
  }
};
