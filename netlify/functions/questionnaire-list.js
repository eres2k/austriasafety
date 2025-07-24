const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
  try {
    const questionnaireStore = getStore('questionnaires', {
      siteId: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });
    const { blobs } = await questionnaireStore.list();
    return {
      statusCode: 200,
      body: JSON.stringify(blobs)
    };
  } catch (err) {
    console.error(err.stack || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || err })
    };
  }
};
