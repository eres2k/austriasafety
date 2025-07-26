const fs = require('fs');
const path = require('path');

/*
 * Netlify Function: getAudits
 *
 * Returns a JSON array of stored audits. Each entry includes minimal
 * information about the audit (id, location, type, date). The full
 * audit details can be fetched by reading the individual JSON files
 * saved by saveAudit.js. This function demonstrates reading from
 * serverless filesystem storage. In a real Netlify environment you
 * might implement pagination or restrict access via authentication.
 */
exports.handler = async function (event) {
  try {
    const dir = path.join(__dirname, '..', '..', 'data');
    if (!fs.existsSync(dir)) {
      return {
        statusCode: 200,
        body: JSON.stringify([]),
      };
    }
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
    const audits = files.map((file) => {
      const content = JSON.parse(fs.readFileSync(path.join(dir, file)));
      return {
        id: content.id,
        location: content.location,
        inspectionType: content.inspectionType,
        date: content.inspectionDate,
      };
    });
    return {
      statusCode: 200,
      body: JSON.stringify(audits),
    };
  } catch (err) {
    console.error('Error reading audits:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to read audits' }),
    };
  }
};