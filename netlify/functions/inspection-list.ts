import { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const inspectionStore = process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN
      ? getStore('inspections', { siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN })
      : getStore('inspections');
    const { blobs } = await inspectionStore.list();
    const data = await Promise.all(blobs.map(blob => inspectionStore.get(blob.key)));
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
