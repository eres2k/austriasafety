const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
  const siteId = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  console.log('Questionnaire-list env:', { siteId, tokenPresent: Boolean(token) });
  try {
    if (!siteId || !token) {
      throw new Error(`Missing env variables: siteId=${siteId}, tokenPresent=${Boolean(token)}`);
    }
    const questionnaireStore = getStore('questionnaires', { siteId, token });
    const { blobs } = await questionnaireStore.list();
    return {
      statusCode: 200,
      body: JSON.stringify(blobs)
    };
  } catch (err) {
    console.error('Error in questionnaire-list:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: err.message, 
        stack: err.stack 
      })
    };
  }
};
