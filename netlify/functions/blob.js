// netlify/functions/blob.js
// Fixed blob handler that works with Netlify's blob storage

exports.handler = async (event, context) => {
  // For local development, use in-memory storage
  // In production, Netlify provides the Blobs API
  const isLocal = process.env.NETLIFY_DEV === 'true';
  
  // Get the blob path from query parameters
  const path = event.queryStringParameters?.path || '';
  const isList = event.queryStringParameters?.list === 'true';
  
  console.log('Blob request:', { path, isList, method: event.httpMethod });
  
  // Verify user is authenticated
  const user = context.clientContext?.user;
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }
  
  try {
    if (isLocal) {
      // Local development - use simple in-memory storage
      return handleLocalStorage(event, path, isList);
    } else {
      // Production - use Netlify Blobs
      return await handleNetlifyBlobs(event, path, isList, user);
    }
  } catch (error) {
    console.error('Blob operation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// In-memory storage for local development
const localStorage = new Map();

function handleLocalStorage(event, path, isList) {
  const { httpMethod, body, headers } = event;
  
  if (httpMethod === 'GET') {
    if (isList) {
      // List blobs under a prefix
      const prefix = path.endsWith('/') ? path : path + '/';
      const blobs = [];
      
      for (const [key, value] of localStorage.entries()) {
        if (key.startsWith(prefix)) {
          blobs.push({ path: key });
        }
      }
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blobs })
      };
    } else {
      // Get single blob
      const data = localStorage.get(path);
      
      if (!data) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers: { 
          'Content-Type': data.contentType || 'application/octet-stream'
        },
        body: data.content,
        isBase64Encoded: data.isBase64 || false
      };
    }
  } else if (httpMethod === 'PUT') {
    // Store blob
    const contentType = headers['content-type'] || 'application/octet-stream';
    const isBase64 = headers['content-encoding'] === 'base64';
    
    localStorage.set(path, {
      content: body,
      contentType,
      isBase64,
      timestamp: new Date().toISOString()
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } else if (httpMethod === 'DELETE') {
    // Delete blob
    if (path.endsWith('/')) {
      // Delete all under prefix
      const prefix = path;
      for (const key of localStorage.keys()) {
        if (key.startsWith(prefix)) {
          localStorage.delete(key);
        }
      }
    } else {
      // Delete single blob
      localStorage.delete(path);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } else {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
}

// Production handler using Netlify Blobs API
async function handleNetlifyBlobs(event, path, isList, user) {
  const { httpMethod, body, headers } = event;
  
  // Import Netlify Blobs
  let getStore;
  try {
    const blobsModule = await import('@netlify/blobs');
    getStore = blobsModule.getStore;
  } catch (error) {
    console.error('Failed to import @netlify/blobs:', error);
    // Fallback to local storage in production if blobs not available
    return handleLocalStorage(event, path, isList);
  }
  
  // Get the blob store
  const store = getStore('inspections');
  
  if (httpMethod === 'GET') {
    if (isList) {
      // List blobs
      try {
        const { blobs } = await store.list({ prefix: path });
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blobs: blobs.map(b => ({ path: b.key })) })
        };
      } catch (error) {
        console.error('List error:', error);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blobs: [] })
        };
      }
    } else {
      // Get single blob
      try {
        const data = await store.get(path);
        
        if (!data) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Not found' })
          };
        }
        
        // Handle both string and object responses
        const contentType = headers.accept?.includes('json') ? 'application/json' : 'application/octet-stream';
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': contentType },
          body: typeof data === 'string' ? data : JSON.stringify(data)
        };
      } catch (error) {
        console.error('Get error:', error);
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Not found' })
        };
      }
    }
  } else if (httpMethod === 'PUT') {
    // Store blob
    try {
      const contentType = headers['content-type'] || 'application/octet-stream';
      
      // Parse JSON if needed
      let dataToStore = body;
      if (contentType.includes('json')) {
        try {
          dataToStore = JSON.parse(body);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
      
      await store.set(path, dataToStore);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } catch (error) {
      console.error('Put error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to store blob' })
      };
    }
  } else if (httpMethod === 'DELETE') {
    // Delete blob
    try {
      if (path.endsWith('/')) {
        // Delete all with prefix
        const { blobs } = await store.list({ prefix: path });
        for (const blob of blobs) {
          await store.delete(blob.key);
        }
      } else {
        // Delete single
        await store.delete(path);
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } catch (error) {
      console.error('Delete error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to delete blob' })
      };
    }
  } else {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
}
