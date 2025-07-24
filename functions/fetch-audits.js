import { list } from '@netlify/blobs';

export async function handler() {
  const files = await list();
  const audits = files.filter(f => f.id.endsWith('.json')).map(f => JSON.parse(await f.text()));
  return { statusCode: 200, body: JSON.stringify(audits) };
}