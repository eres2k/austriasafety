const fs = require('fs');
const path = require('path');

/*
 * Netlify Function: saveAudit
 *
 * Receives a POST request containing an audit record with responses and
 * attachments. The function writes the record to a local JSON file on
 * the Netlify function file system. In a production environment you
 * should consider using Netlify Blobs (via @netlify/blobs) or a
 * persistent external store. However, this implementation avoids
 * external databases and demonstrates how serverless persistence could
 * work with simple filesystem writes.
 */
exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }
  try {
    const data = JSON.parse(event.body);
    const dir = path.join(__dirname, '..', '..', 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, `${data.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('Error saving audit:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save audit' }),
    };
  }
};