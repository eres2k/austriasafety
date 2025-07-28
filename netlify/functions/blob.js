// netlify/functions/blob.js
// Fixed implementation with proper Netlify Blobs configuration

const { getStore } = require('@netlify/blobs');

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
  
  // Initialize store with context from Netlify
  let store;
  try {
    // Option 1: Try using the context provided by Netlify
    if (context.clientContext?.custom?.netlify) {
      console.log('Using Netlify context');
      const { siteID, token } = context.clientContext.custom.netlify;
      store = getStore({
        name: 'aurora-audit-data',
        siteID,
        token
      });
    } 
    // Option 2: Try using environment variables
    else if (process.env.SITE_ID) {
      console.log('Using environment variables');
      store = getStore({
        name: 'aurora-audit-data',
        siteID: process.env.SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN || context.clientContext?.identity?.token
      });
    }
    // Option 3: Try default (this might work in some Netlify contexts)
    else {
      console.log('Trying default store initialization');
      store = getStore('aurora-audit-data');
    }
    
    console.log('Store initialized successfully');
  } catch (error) {
    console.error('Failed to initialize store:', error);
    
    // Fallback to in-memory storage for development/testing
    console.log('Using in-memory fallback storage');
    
    // Create a simple in-memory store
    if (!global._tempStorage) {
      global._tempStorage = new Map();
    }
    
    store = {
      get: async (key) => {
        const data = global._tempStorage.get(key);
        return data ? JSON.parse(data) : null;
      },
      setJSON: async (key, value) => {
        global._tempStorage.set(key, JSON.stringify(value));
      },
      delete: async (key) => {
        global._tempStorage.delete(key);
      },
      list: async ({ prefix }) => {
        const blobs = [];
        for (const [key] of global._tempStorage) {
          if (key.startsWith(prefix)) {
            blobs.push({ key });
          }
        }
        return { blobs };
      }
    };
  }
  
  // Handle requests
  try {
    switch (event.httpMethod) {
      case 'GET':
        if (isList) {
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
          console.log('Getting blob:', path);
          const data = await store.get(path);
          
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
