const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/*
 * Netlify Function: registerUser
 * Creates a new user account. Stores users in a JSON file in the data
 * directory. Passwords are hashed with SHA-256 for basic security.
 */
exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const body = JSON.parse(event.body);
    const { username, password, role } = body;
    if (!username || !password || !role) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
    }
    const dir = path.join(__dirname, '..', '..', 'data');
    const usersFile = path.join(dir, 'users.json');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let users = [];
    if (fs.existsSync(usersFile)) {
      users = JSON.parse(fs.readFileSync(usersFile));
    }
    if (users.find((u) => u.username === username)) {
      return { statusCode: 409, body: JSON.stringify({ error: 'Username already exists' }) };
    }
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    users.push({ username, password: hash, role });
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    return { statusCode: 200, body: JSON.stringify({ message: 'User registered' }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};