// functions/save-audit.js (Netlify Function)
exports.handler = async (event) => {
  const { getStore } = require("@netlify/blobs");
  const store = getStore("sifa-audits");

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    await store.setJSON(data.id, data);
    return { statusCode: 200, body: 'Audit saved' };
  } catch (error) {
    return { statusCode: 500, body: `Error: ${error.message}` };
  }
};
