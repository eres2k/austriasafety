const fs = require('fs').promises;
const path = require('path');

exports.handler = async function(event, context) {
  const dataPath = path.join(__dirname, '../data/db.json');
  try {
    const { username, password, isRegister } = JSON.parse(event.body);
    let db = { users: [], audits: [] };

    // Read existing data
    try {
      const data = await fs.readFile(dataPath, 'utf8');
      db = JSON.parse(data);
    } catch (err) {
      // File doesn't exist yet, we'll create it
    }

    if (isRegister) {
      // Check if username exists
      if (db.users.find(u => u.username === username)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Username already exists' })
        };
      }
      // Simple password hashing (for demo purposes, not secure for production)
      db.users.push({ username, password }); // In production, use proper hashing (e.g., bcrypt)
      await fs.writeFile(dataPath, JSON.stringify(db, null, 2));
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'User registered' })
      };
    } else {
      // Login
      const user = db.users.find(u => u.username === username && u.password === password);
      if (!user) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Login successful' })
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
