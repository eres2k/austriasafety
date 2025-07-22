// netlify/functions/audits.js
const { getStorage } = require('./lib/storage');
const { verifyToken } = require('./lib/auth-utils');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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

  // Initialize storage
  const storage = await getStorage(context);

  // Parse path to determine action
  // Remove /api/ prefix if present due to redirect
  const cleanPath = event.path.replace(/^\/api\//, '');
  const pathSegments = cleanPath.split('/').filter(Boolean);
  
  // The path structure after /api/ redirect would be: audits/[action or id]
  const isStats = pathSegments[pathSegments.length - 1] === 'stats';
  const isExport = pathSegments[pathSegments.length - 1] === 'export';
  const auditId = pathSegments.length >= 2 && !isStats && !isExport ? pathSegments[pathSegments.length - 1] : null;

  try {
    if (event.httpMethod === 'GET') {
      if (isStats) {
        // GET /api/audits/stats
        const audits = (await storage.get('audits')) || [];
        const today = new Date().toDateString();
        const todayAudits = audits.filter(a => new Date(a.date).toDateString() === today);
        
        const stats = {
          todayCount: todayAudits.length,
          totalCount: audits.length,
          avgScore: audits.length > 0 
            ? Math.round(audits.reduce((sum, a) => sum + (a.score || 0), 0) / audits.length) 
            : 0,
          criticalCount: audits.reduce((sum, a) => sum + (a.criticalFailures || 0), 0),
          lastSync: new Date().toISOString()
        };
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(stats)
        };
      } else if (isExport) {
        // GET /api/audits/export
        const audits = (await storage.get('audits')) || [];
        
        // For simplicity, return JSON. In production, you'd create a ZIP
        const exportData = {
          exportDate: new Date().toISOString(),
          exportedBy: user.username,
          auditCount: audits.length,
          audits: audits
        };
        
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename=audits_export_${new Date().toISOString().split('T')[0]}.json`
          },
          body: JSON.stringify(exportData, null, 2)
        };
      } else if (auditId) {
        // GET /api/audits/:id
        const audits = (await storage.get('audits')) || [];
        const audit = audits.find(a => a.id === auditId);
        
        if (audit) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(audit)
          };
        } else {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Audit not found' })
          };
        }
      } else {
        // GET /api/audits
        const audits = (await storage.get('audits')) || [];
        const limit = event.queryStringParameters?.limit 
          ? parseInt(event.queryStringParameters.limit) 
          : null;
        
        let result = audits;
        if (limit && limit > 0) {
          result = audits.slice(-limit).reverse();
        } else {
          result = audits.reverse(); // Most recent first
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result)
        };
      }
    } else if (event.httpMethod === 'POST') {
      // POST /api/audits
      const newAudit = JSON.parse(event.body);
      
      // Validate required fields
      if (!newAudit.location || !newAudit.date) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }
      
      // Add server metadata
      newAudit.id = newAudit.id || Date.now().toString();
      newAudit.serverDate = new Date().toISOString();
      newAudit.uploadedBy = user.username;
      newAudit.syncStatus = 'synced';
      
      // Save audit
      const success = await storage.append('audits', newAudit);
      
      if (success) {
        // Update metadata
        await storage.set('metadata', {
          lastSync: new Date().toISOString(),
          lastAuditId: newAudit.id,
          totalAudits: ((await storage.get('audits')) || []).length
        });
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newAudit)
        };
      } else {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to save audit' })
        };
      }
    } else if (event.httpMethod === 'DELETE' && auditId) {
      // DELETE /api/audits/:id
      if (user.role !== 'admin') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Forbidden' })
        };
      }
      
      const audits = (await storage.get('audits')) || [];
      const filteredAudits = audits.filter(a => a.id !== auditId);
      
      if (filteredAudits.length < audits.length) {
        await storage.set('audits', filteredAudits);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Audit deleted' })
        };
      } else {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Audit not found' })
        };
      }
    }
  } catch (error) {
    console.error('Audits function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Server error', 
        message: error.message 
      })
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
