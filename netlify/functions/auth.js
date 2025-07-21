const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Simple JWT implementation
function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'your-secret-key')
    .update(`${header}.${body}`)
    .digest('base64');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
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
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  const dataDir = path.join('/tmp', 'audit-data');
  const usersFile = path.join(dataDir, 'users.json');

  // Initialize data directory
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (e) {}

  // Initialize default users if not exists
  try {
    await fs.access(usersFile);
  } catch {
    const defaultUsers = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'user', password: 'user123', role: 'user' }
    ];
    await fs.writeFile(usersFile, JSON.stringify(defaultUsers));
  }

  if (event.httpMethod === 'POST') {
    // Login
    try {
      const { username, password } = JSON.parse(event.body);
      const users = JSON.parse(await fs.readFile(usersFile, 'utf8'));
      
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        const token = createToken({ username: user.username, role: user.role });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            token,
            user: { username: user.username, role: user.role }
          })
        };
      } else {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server error' })
      };
    }
  } else if (event.httpMethod === 'GET') {
    // Verify token
    const token = event.headers.authorization?.replace('Bearer ', '');
    const payload = verifyToken(token);
    
    if (payload) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ username: payload.username, role: payload.role })
      };
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};