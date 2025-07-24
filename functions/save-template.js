import { Blob } from '@netlify/blobs';

export async function handler(event) {
  const template = JSON.parse(event.body);
  const id = `template-${Date.now()}`;
  await Blob.upload({ id: `${id}.json`, data: JSON.stringify(template) });
  return { statusCode: 200, body: JSON.stringify({ id }) };
}