import { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { id, ...payload } = JSON.parse(event.body || '{}');
    const inspectionStore = process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN
      ? getStore('inspections', { siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN })
      : getStore('inspections');
    await inspectionStore.put({ key: id, data: JSON.stringify({ id, ...payload }) });
    return { statusCode: 200, body: JSON.stringify({ id }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
