import { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

async function getTemplateStats() {
  const statsStore = process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN
    ? getStore('template-stats', { siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN })
    : getStore('template-stats');
  const { blobs } = await statsStore.list();
  return Promise.all(blobs.map(blob => statsStore.get(blob.key)));
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const stats = await getTemplateStats();
    return { statusCode: 200, body: JSON.stringify(stats) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
