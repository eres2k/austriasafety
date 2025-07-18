const fs = require('fs').promises;
const path = require('path');

exports.handler = async function(event, context) {
  const dataPath = path.join(__dirname, '../data/db.json');
  try {
    const { auditId, username } = event.queryStringParameters;
    let db = { users: [], audits: [] };

    // Read existing data
    try {
      const data = await fs.readFile(dataPath, 'utf8');
      db = JSON.parse(data);
    } catch (err) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No audits found' })
      };
    }

    const audit = db.audits.find(a => a.id === auditId && a.username === username);
    if (!audit) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Audit not found or unauthorized' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(audit)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
