import { openDB } from 'idb';

const DB_NAME = 'audit-platform';
const STORE_NAME = 'drafts';

export async function saveDraft(key, data) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) { db.createObjectStore(STORE_NAME); }
  });
  await db.put(STORE_NAME, data, key);
}

export async function loadDraft(key) {
  const db = await openDB(DB_NAME, 1);
  return db.get(STORE_NAME, key);
}

export async function clearDraft(key) {
  const db = await openDB(DB_NAME, 1);
  await db.delete(STORE_NAME, key);
}