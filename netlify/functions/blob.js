// netlify/functions/blob.js
// Secure blob storage with authentication and proper data organization

const { getStore } = require('@netlify/blobs');

// Verify JWT token from Netlify Identity
async function verifyToken(token) {
  if (!token) return null;
  
  try {
    // In production, verify the JWT properly
    // For now, decode the payload (implement proper verification)
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Main handler
exports.handler = async (event, context) => {
  // CORS headers for PWA
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Extract and verify auth token
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'No authorization token provided' })
    };
  }

  const token = authHeader.substring(7);
  const user = await verifyToken(token);
  
  if (!user) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid or expired token' })
    };
  }

  // Parse request
  const { path, action } = event.queryStringParameters || {};
  const method = event.httpMethod;

  try {
    // Get the appropriate store based on path
    let storeName = 'inspections'; // default
    
    if (path?.startsWith('templates/')) {
      storeName = 'templates';
    } else if (path?.startsWith('reports/')) {
      storeName = 'reports';
    } else if (path?.startsWith('users/')) {
      storeName = 'users';
    }

    const store = getStore(storeName);

    // Route based on HTTP method
    switch (method) {
      case 'GET':
        return await handleGet(store, path, user, headers, event.queryStringParameters);
        
      case 'PUT':
      case 'POST':
        return await handleWrite(store, path, user, event.body, headers);
        
      case 'DELETE':
        return await handleDelete(store, path, user, headers);
        
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Blob operation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      })
    };
  }
};

// GET handler - retrieve data or list items
async function handleGet(store, path, user, headers, params) {
  try {
    // Special case for listing
    if (params?.list === 'true') {
      return await handleList(store, path, user, headers);
    }

    // For user-specific data, enforce access control
    if (path && !isAuthorizedPath(path, user)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access denied' })
      };
    }

    if (!path) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Path parameter required' })
      };
    }

    // Get the blob
    const data = await store.get(path, { type: 'json' });
    
    if (!data) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Not found' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('GET error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to retrieve data' })
    };
  }
}

// LIST handler - list items with optional filtering
async function handleList(store, path, user, headers) {
  try {
    const prefix = path || '';
    const options = {
      prefix,
      paginate: true
    };

    // For user-specific stores, filter by user
    if (prefix.startsWith('inspections/') || prefix.startsWith('reports/')) {
      options.prefix = `${prefix}${user.sub}/`;
    }

    const { blobs, cursor } = await store.list(options);
    
    // Map blob keys to metadata
    const items = blobs.map(blob => ({
      key: blob.key,
      url: blob.url,
      size: blob.size,
      etag: blob.etag
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items,
        cursor,
        count: items.length
      })
    };
  } catch (error) {
    console.error('LIST error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to list items' })
    };
  }
}

// PUT/POST handler - write data
async function handleWrite(store, path, user, body, headers) {
  try {
    if (!path) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Path parameter required' })
      };
    }

    if (!body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body required' })
      };
    }

    // Parse and validate data
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    // Add metadata
    const enrichedData = {
      ...data,
      _metadata: {
        createdBy: user.sub,
        createdAt: data._metadata?.createdAt || new Date().toISOString(),
        updatedBy: user.sub,
        updatedAt: new Date().toISOString(),
        version: (data._metadata?.version || 0) + 1
      }
    };

    // For user-specific data, enforce path structure
    const finalPath = ensureUserPath(path, user);

    // Store the data
    await store.setJSON(finalPath, enrichedData);

    // If this is an inspection, also update indices
    if (finalPath.startsWith('inspections/')) {
      await updateInspectionIndices(store, finalPath, enrichedData, user);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        path: finalPath,
        version: enrichedData._metadata.version
      })
    };
  } catch (error) {
    console.error('WRITE error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to write data' })
    };
  }
}

// DELETE handler
async function handleDelete(store, path, user, headers) {
  try {
    if (!path) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Path parameter required' })
      };
    }

    // Check authorization
    if (!isAuthorizedPath(path, user)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access denied' })
      };
    }

    await store.delete(path);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, deleted: path })
    };
  } catch (error) {
    console.error('DELETE error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete data' })
    };
  }
}

// Helper functions

// Check if user is authorized for path
function isAuthorizedPath(path, user) {
  // Templates are public read
  if (path.startsWith('templates/') && !path.includes('/private/')) {
    return true;
  }
  
  // User-specific paths must match user ID
  const userPaths = ['inspections/', 'reports/', 'drafts/'];
  for (const prefix of userPaths) {
    if (path.startsWith(prefix)) {
      return path.includes(user.sub);
    }
  }
  
  // Admin check (implement based on your user roles)
  if (user.app_metadata?.roles?.includes('admin')) {
    return true;
  }
  
  return false;
}

// Ensure user-specific paths include user ID
function ensureUserPath(path, user) {
  const userPaths = ['inspections/', 'reports/', 'drafts/'];
  
  for (const prefix of userPaths) {
    if (path.startsWith(prefix) && !path.includes(user.sub)) {
      // Insert user ID after prefix
      const parts = path.split('/');
      parts.splice(1, 0, user.sub);
      return parts.join('/');
    }
  }
  
  return path;
}

// Update inspection indices for faster queries
async function updateInspectionIndices(store, path, data, user) {
  try {
    // Update user's inspection index
    const indexPath = `indices/users/${user.sub}/inspections`;
    const index = await store.get(indexPath, { type: 'json' }) || { items: [] };
    
    // Add or update entry
    const entry = {
      id: data.id,
      path: path,
      type: data.type,
      location: data.location,
      status: data.status,
      date: data.date,
      updatedAt: data._metadata.updatedAt
    };
    
    const existingIndex = index.items.findIndex(item => item.id === data.id);
    if (existingIndex >= 0) {
      index.items[existingIndex] = entry;
    } else {
      index.items.push(entry);
    }
    
    // Sort by date descending
    index.items.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Store updated index
    await store.setJSON(indexPath, index);
    
    // Update location-based index
    if (data.location) {
      const locationIndexPath = `indices/locations/${data.location}/inspections`;
      const locationIndex = await store.get(locationIndexPath, { type: 'json' }) || { items: [] };
      
      const locationEntry = { ...entry, auditor: user.email };
      const existingLocationIndex = locationIndex.items.findIndex(item => item.id === data.id);
      
      if (existingLocationIndex >= 0) {
        locationIndex.items[existingLocationIndex] = locationEntry;
      } else {
        locationIndex.items.push(locationEntry);
      }
      
      locationIndex.items.sort((a, b) => new Date(b.date) - new Date(a.date));
      await store.setJSON(locationIndexPath, locationIndex);
    }
  } catch (error) {
    console.error('Index update error:', error);
    // Don't fail the main operation if index update fails
  }
}