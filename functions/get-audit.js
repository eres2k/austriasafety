import { get } from '@netlify/blobs';

export async function handler(event) {
  const { id } = event.queryStringParameters;
  const blob = await get(`${id}.json`);
  return { statusCode: 200, body: await blob.text() };
}