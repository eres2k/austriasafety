// netlify/functions/store-data.js
// Bulk data storage endpoint for offline sync

const { getStorage } = require('./lib/storage');
const { verifyToken } = require('./lib/auth-utils');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Verify authentication
  const token = event.headers.authorization?.replace('Bearer ', '');
  const user = verifyToken(token);
  
  if (!user) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const storage = await getStorage(context);
    
    // Validate data structure
    if (!data.audits && !data.users && !data.metadata) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid data format' })
      };
    }

    const results = {
      stored: [],
      failed: [],
      timestamp: new Date().toISOString()
    };

    // Store audits if provided
    if (data.audits && Array.isArray(data.audits)) {
      try {
        // Add server metadata to each audit
        const auditsWithMeta = data.audits.map(audit => ({
          ...audit,
          syncedAt: new Date().toISOString(),
          syncedBy: user.username,
          syncStatus: 'synced'
        }));
        
        await storage.set('audits', auditsWithMeta);
        results.stored.push({ type: 'audits', count: auditsWithMeta.length });
      } catch (error) {
        results.failed.push({ type: 'audits', error: error.message });
      }
    }

    // Store users if provided (admin only)
    if (data.users && Array.isArray(data.users) && user.role === 'admin') {
      try {
        await storage.set('users', data.users);
        results.stored.push({ type: 'users', count: data.users.length });
      } catch (error) {
        results.failed.push({ type: 'users', error: error.message });
      }
    }

    // Update metadata
    try {
      const metadata = {
        lastSync: new Date().toISOString(),
        lastSyncBy: user.username,
        auditCount: data.audits ? data.audits.length : 0,
        userCount: data.users ? data.users.length : 0,
        ...(data.metadata || {})
      };
      
      await storage.set('metadata', metadata);
      results.stored.push({ type: 'metadata', success: true });
    } catch (error) {
      results.failed.push({ type: 'metadata', error: error.message });
    }

    const success = results.failed.length === 0;
    
    return {
      statusCode: success ? 200 : 207, // 207 = Multi-Status
      headers,
      body: JSON.stringify({
        success,
        message: success ? 'Data stored successfully' : 'Partial success',
        results
      })
    };
  } catch (error) {
    console.error('Store data error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to store data', 
        details: error.message 
      })
    };
  }
};
