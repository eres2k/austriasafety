import { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const payload = JSON.parse(event.body || '{}');
    const questionnaireStore = process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN
      ? getStore('questionnaires', { siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN })
      : getStore('questionnaires');
    const metaStore = process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN
      ? getStore('metadata', { siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN })
      : getStore('metadata');

    const id = payload.id;
    await questionnaireStore.put({ key: id, data: JSON.stringify(payload) });
    await metaStore.put({ key: 'questionnaire-list', data: JSON.stringify([...await questionnaireStore.list().then(r => r.blobs.map(b => b.key))]) });

    return { statusCode: 201, body: JSON.stringify({ id }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
