const fs = require('fs').promises;
const path = require('path');

// Reuse token verification from auth
function verifyToken(token) {
  const crypto = require('crypto');
  try {
    const [header, body, signature] = token.split('.');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'your-secret-key')
      .update(`${header}.${body}`)
      .digest('base64');
    
    if (signature !== expectedSignature) return null;
    
    return JSON.parse(Buffer.from(body, 'base64').toString());
  } catch {
    return null;
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
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

  const dataDir = path.join('/tmp', 'audit-data');
  const auditsFile = path.join(dataDir, 'audits.json');

  // Initialize data directory
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (e) {}

  // Initialize audits file if not exists
  try {
    await fs.access(auditsFile);
  } catch {
    await fs.writeFile(auditsFile, JSON.stringify([]));
  }

  // Handle different paths
  const pathSegments = event.path.split('/').filter(Boolean);
  
  if (pathSegments[pathSegments.length - 1] === 'stats') {
    // GET /audits/stats
    try {
      const audits = JSON.parse(await fs.readFile(auditsFile, 'utf8'));
      const today = new Date().toDateString();
      const todayAudits = audits.filter(a => new Date(a.date).toDateString() === today);
      
      const stats = {
        todayCount: todayAudits.length,
        totalCount: audits.length,
        avgScore: audits.length > 0 ? Math.round(audits.reduce((sum, a) => sum + a.score, 0) / audits.length) : 0,
        criticalCount: audits.reduce((sum, a) => sum + a.criticalFailures, 0)
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(stats)
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server error' })
      };
    }
  } else if (pathSegments[pathSegments.length - 1] === 'export') {
    // GET /audits/export
    try {
      const audits = JSON.parse(await fs.readFile(auditsFile, 'utf8'));
      const JSZip = require('jszip');
      const zip = new JSZip();
      
      // Add JSON data
      zip.file('audits_data.json', JSON.stringify(audits, null, 2));
      
      // Add individual audit files
      audits.forEach(audit => {
        zip.file(
          `audit_${audit.location}_${new Date(audit.date).toISOString().split('T')[0]}_${audit.id}.json`,
          JSON.stringify(audit, null, 2)
        );
      });
      
      const content = await zip.generateAsync({ type: 'base64' });
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename=audits_export_${new Date().toISOString().split('T')[0]}.zip`
        },
        body: content,
        isBase64Encoded: true
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server error' })
      };
    }
  } else if (pathSegments.length > 3) {
    // GET /audits/:id
    const auditId = pathSegments[pathSegments.length - 1];
    try {
      const audits = JSON.parse(await fs.readFile(auditsFile, 'utf8'));
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
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server error' })
      };
    }
  }

  if (event.httpMethod === 'GET') {
    // GET /audits
    try {
      const audits = JSON.parse(await fs.readFile(auditsFile, 'utf8'));
      const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : null;
      
      let result = audits;
      if (limit) {
        result = audits.slice(-limit).reverse();
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server error' })
      };
    }
  } else if (event.httpMethod === 'POST') {
    // POST /audits
    try {
      const audits = JSON.parse(await fs.readFile(auditsFile, 'utf8'));
      const newAudit = JSON.parse(event.body);
      
      // Add server timestamp
      newAudit.serverDate = new Date().toISOString();
      newAudit.uploadedBy = user.username;
      
      audits.push(newAudit);
      await fs.writeFile(auditsFile, JSON.stringify(audits));
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newAudit)
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server error' })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};