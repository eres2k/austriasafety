const crypto = require('crypto');

// Use environment variable for JWT secret
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Simple password hashing (in production, use bcrypt)
function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(password + JWT_SECRET)
    .digest('hex');
}

// JWT implementation with expiry
function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  const body = Buffer.from(JSON.stringify({ ...payload, exp: expiresAt })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    if (!token) return null;
    
    const [header, body, signature] = token.split('.');
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    
    // Check expiry
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// In-memory storage for demo (use a database in production)
const DEMO_USERS = [
  { 
    username: 'admin@amazon.at', 
    password: hashPassword('admin123'), 
    role: 'admin',
    name: 'Admin User'
  },
  { 
    username: 'safety@amazon.at', 
    password: hashPassword('safety123'), 
    role: 'auditor',
    name: 'Safety Officer'
  },
  { 
    username: 'manager@amazon.at', 
    password: hashPassword('manager123'), 
    role: 'viewer',
    name: 'Area Manager'
  }
];

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'POST') {
    // Login
    try {
      const { username, password } = JSON.parse(event.body);
      
      if (!username || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Username and password required' })
        };
      }
      
      const hashedPassword = hashPassword(password);
      const user = DEMO_USERS.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === hashedPassword
      );
      
      if (user) {
        const token = createToken({ 
          username: user.username, 
          role: user.role,
          name: user.name 
        });
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            token,
            user: { 
              username: user.username, 
              role: user.role,
              name: user.name 
            }
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
      console.error('Login error:', error);
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
        body: JSON.stringify({ 
          username: payload.username, 
          role: payload.role,
          name: payload.name,
          expiresAt: payload.exp 
        })
      };
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
