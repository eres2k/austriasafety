const fs = require('fs').promises;
const path = require('path');

exports.handler = async function(event, context) {
  const dataPath = path.join(__dirname, '../data/db.json');
  try {
    const audit = JSON.parse(event.body);
    let db = { users: [], audits: [] };

    // Read existing data
    try {
      const data = await fs.readFile(dataPath, 'utf8');
      db = JSON.parse(data);
    } catch (err) {
      // File doesn't exist yet, we'll create it
    }

    db.audits.push(audit);
    await fs.writeFile(dataPath, JSON.stringify(db, null, 2));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Audit saved' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save audit' })
    };
  }
};
