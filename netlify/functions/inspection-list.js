import { HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

export const handler = async (event: any, context: HandlerContext) => {
  try {
    const inspectionStore = getStore('inspections', {
      siteId: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });
    const { blobs } = await inspectionStore.list();
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
