// netlify/functions/lib/auth-utils.js
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

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
    return null;
  }
}

module.exports = { verifyToken, JWT_SECRET };
