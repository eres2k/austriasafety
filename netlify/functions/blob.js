// netlify/functions/blob.js
// Unified handler for Netlify Blob Storage operations
// Handles all blob operations through a single function endpoint

// Note: This is a simplified implementation for local development
// In production, Netlify provides the actual Blobs API

const crypto = require('crypto');

// Simple in-memory storage for development
// In production, this would use Netlify's actual Blob storage
const storage = new Map();

exports.handler = async (event, context) => {
  // Verify user is authenticated
  const user = context.clientContext?.user;
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  const { httpMethod, headers } = event;
  const blobPath = headers['x-blob-path'] || '';
  
  try {
    if (httpMethod === 'GET') {
      // Handle both individual blob fetch and listing
      const isListing = event.queryStringParameters?.list === 'true';
      
      if (isListing) {
        // List blobs under a prefix
        const prefix = blobPath;
        const blobs = [];
        
        for (const [key, value] of storage.entries()) {
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
        // Fetch individual blob
        const data = storage.get(blobPath);
        
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
          body: data.isJson ? JSON.stringify(data.content) : data.content,
          isBase64Encoded: data.isBase64 || false
        };
      }
    } else if (httpMethod === 'PUT') {
      // Store blob
      const contentType = headers['content-type'] || 'application/octet-stream';
      const isJson = contentType.includes('json');
      const isBase64 = headers['content-encoding'] === 'base64';
      
      let content = event.body;
      if (isJson && typeof content === 'string') {
        try {
          content = JSON.parse(content);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
      
      storage.set(blobPath, {
        content,
        contentType,
        isJson,
        isBase64,
        timestamp: new Date().toISOString()
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } else if (httpMethod === 'DELETE') {
      // Delete blob or all blobs under a prefix
      if (blobPath.endsWith('/')) {
        // Delete all under prefix
        const prefix = blobPath;
        for (const key of storage.keys()) {
          if (key.startsWith(prefix)) {
            storage.delete(key);
          }
        }
      } else {
        // Delete single blob
        storage.delete(blobPath);
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
  } catch (error) {
    console.error('Blob operation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// For production deployment, you would use Netlify's actual Blob Storage API
// This implementation is for local development and testing purposes
