// functions/get-audits.js (Netlify Function)
exports.handler = async () => {
  const { getStore } = require("@netlify/blobs");
  const store = getStore("sifa-audits");

  try {
    const { keys } = await store.list();
    const audits = await Promise.all(keys.map(key => store.getJSON(key)));
    return {
      statusCode: 200,
      body: JSON.stringify(audits.filter(Boolean))
    };
  } catch (error) {
    return { statusCode: 500, body: `Error: ${error.message}` };
  }
};
