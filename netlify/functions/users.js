// netlify/functions/users.js
const { getStorage } = require('./lib/storage');
const { verifyToken } = require('./lib/auth-utils');
const crypto = require('crypto');

// Simple password hashing (same as in auth.js)
function hashPassword(password) {
  const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
  return crypto
    .createHash('sha256')
    .update(password + JWT_SECRET)
    .digest('hex');
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

  // Parse user ID from path if present
  const pathParts = event.path.split('/');
  const usersIndex = pathParts.findIndex(part => part === 'users');
  const userId = pathParts[usersIndex + 1];

  try {
    if (event.httpMethod === 'GET') {
      // GET /api/users
      const users = (await storage.get('users')) || [];
      
      // Remove passwords from response
      const safeUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt
      }));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(safeUsers)
      };
    } else if (event.httpMethod === 'POST') {
      // POST /api/users - Admin only
      if (user.role !== 'admin') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Forbidden - Admin access required' })
        };
      }
      
      const newUser = JSON.parse(event.body);
      
      // Validate required fields
      if (!newUser.username || !newUser.password || !newUser.name || !newUser.role) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }
      
      // Hash password
      newUser.password = hashPassword(newUser.password);
      newUser.id = newUser.id || Date.now().toString();
      newUser.createdAt = new Date().toISOString();
      newUser.createdBy = user.username;
      
      // Save user
      const success = await storage.append('users', newUser);
      
      if (success) {
        // Return user without password
        const { password, ...safeUser } = newUser;
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(safeUser)
        };
      } else {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to create user' })
        };
      }
    } else if (event.httpMethod === 'PUT' && userId) {
      // PUT /api/users/:id - Admin only
      if (user.role !== 'admin') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Forbidden - Admin access required' })
        };
      }
      
      const updateData = JSON.parse(event.body);
      const users = (await storage.get('users')) || [];
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User not found' })
        };
      }
      
      // Update user data
      if (updateData.password) {
        updateData.password = hashPassword(updateData.password);
      }
      
      users[userIndex] = {
        ...users[userIndex],
        ...updateData,
        updatedAt: new Date().toISOString(),
        updatedBy: user.username
      };
      
      await storage.set('users', users);
      
      // Return user without password
      const { password, ...safeUser } = users[userIndex];
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(safeUser)
      };
    } else if (event.httpMethod === 'DELETE' && userId) {
      // DELETE /api/users/:id - Admin only
      if (user.role !== 'admin') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Forbidden - Admin access required' })
        };
      }
      
      const users = (await storage.get('users')) || [];
      const filteredUsers = users.filter(u => u.id !== userId);
      
      if (filteredUsers.length < users.length) {
        await storage.set('users', filteredUsers);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'User deleted' })
        };
      } else {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User not found' })
        };
      }
    }
  } catch (error) {
    console.error('Users function error:', error);
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
