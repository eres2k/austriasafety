const fs = require('fs');
const path = require('path');

/*
 * Netlify Function: saveTemplate
 * Updates or creates a questionnaire for a given location and inspection
 * type. It reads the existing JSON template file, modifies the
 * specified inspectionType with the provided questions, and writes
 * the updated file back to the templates directory. This allows
 * administrators to manage templates via the builder UI without
 * requiring an external database.
 */
exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const { location, inspectionType, questions } = JSON.parse(event.body);
    if (!location || !inspectionType || !Array.isArray(questions)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid payload' }) };
    }
    const templatesDir = path.join(__dirname, '..', '..', 'templates');
    const filePath = path.join(templatesDir, `${location}.json`);
    let template = { inspectionTypes: {} };
    if (fs.existsSync(filePath)) {
      template = JSON.parse(fs.readFileSync(filePath));
    }
    if (!template.inspectionTypes) template.inspectionTypes = {};
    template.inspectionTypes[inspectionType] = questions;
    fs.writeFileSync(filePath, JSON.stringify(template, null, 2));
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};