// netlify/functions/blob.js
// Blob storage handler using Netlify Blobs

const { getStore } = require('@netlify/blobs');

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
  
  // Get the blob store
  let store;
  try {
    store = getStore('aurora-audit-data');
  } catch (error) {
    console.error('Failed to get store:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to initialize storage',
        message: error.message
      })
    };
  }
  
  try {
    switch (event.httpMethod) {
      case 'GET':
        if (isList) {
          // List blobs with prefix
          console.log('List request for prefix:', path);
          
          try {
            const { blobs } = await store.list({ prefix: path });
            console.log(`Found ${blobs.length} blobs`);
            
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                blobs: blobs.map(blob => ({ 
                  path: blob.key,
                  size: blob.size,
                  etag: blob.etag
                }))
              })
            };
          } catch (listError) {
            console.error('List error:', listError);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ 
                error: 'List failed',
                message: listError.message
              })
            };
          }
          
        } else {
          // Get specific blob
          console.log('Get request for:', path);
          
          try {
            const data = await store.get(path, { type: 'json' });
            
            if (data === null) {
              console.log('Blob not found:', path);
              return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ 
                  error: 'Not found',
                  message: 'The requested data does not exist',
                  path: path
                })
              };
            }
            
            console.log('Successfully retrieved blob');
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify(data)
            };
            
          } catch (getError) {
            console.error('Get error:', getError);
            
            // Check if it's a not found error
            if (getError.message?.includes('not found') || getError.code === 'NotFound') {
              return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ 
                  error: 'Not found',
                  message: 'The requested data does not exist',
                  path: path
                })
              };
            }
            
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ 
                error: 'Get failed',
                message: getError.message
              })
            };
          }
        }
        
      case 'PUT':
        console.log('Put request for:', path);
        
        try {
          let data;
          
          // Parse the body
          try {
            data = JSON.parse(event.body);
          } catch (parseError) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ 
                error: 'Invalid JSON',
                message: 'Request body must be valid JSON'
              })
            };
          }
          
          // Store the data
          await store.setJSON(path, data);
          console.log('Successfully stored blob at:', path);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              success: true,
              message: 'Data saved successfully',
              path: path
            })
          };
          
        } catch (putError) {
          console.error('Put error:', putError);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: 'Save failed',
              message: putError.message
            })
          };
        }
        
      case 'DELETE':
        console.log('Delete request for:', path);
        
        try {
          await store.delete(path);
          console.log('Successfully deleted blob at:', path);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              success: true,
              message: 'Data deleted successfully'
            })
          };
          
        } catch (deleteError) {
          console.error('Delete error:', deleteError);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: 'Delete failed',
              message: deleteError.message
            })
          };
        }
        
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ 
            error: 'Method not allowed',
            allowed: ['GET', 'PUT', 'DELETE', 'OPTIONS']
          })
        };
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        type: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
