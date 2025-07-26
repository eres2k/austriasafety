const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/*
 * Netlify Function: loginUser
 * Validates user credentials and returns a simple token payload containing
 * the username and role. Passwords are hashed using SHA-256 for
 * verification. In a production environment you would implement JWT or
 * other robust authentication mechanisms, but this illustrates the
 * concept without external dependencies.
 */
exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const { username, password } = JSON.parse(event.body);
    if (!username || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing credentials' }) };
    }
    const dir = path.join(__dirname, '..', '..', 'data');
    const usersFile = path.join(dir, 'users.json');
    if (!fs.existsSync(usersFile)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }
    const users = JSON.parse(fs.readFileSync(usersFile));
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const user = users.find((u) => u.username === username && u.password === hash);
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }
    // Create a simple token (not secure) – include username and role
    const tokenPayload = { username: user.username, role: user.role, token: crypto.randomBytes(16).toString('hex') };
    return { statusCode: 200, body: JSON.stringify(tokenPayload) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};