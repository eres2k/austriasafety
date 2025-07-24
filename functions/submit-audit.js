import { Blob } from '@netlify/blobs';

export async function handler(event) {
  const data = JSON.parse(event.body);
  const id = `audit-${Date.now()}`;
  await Blob.upload({ id: `${id}.json`, data: JSON.stringify(data) });
  return { statusCode: 200, body: JSON.stringify({ id }) };
}