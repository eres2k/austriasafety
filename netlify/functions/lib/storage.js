// netlify/functions/lib/storage.js
// Persistent storage service using Netlify Blobs or fallback options

const { getStore } = require("@netlify/blobs");

class StorageService {
  constructor(context) {
    this.context = context;
    this.store = null;
  }

  async initialize() {
    try {
      // Try to use Netlify Blobs if available
      if (this.context && this.context.blobs) {
        this.store = getStore("whs-audit-data");
        this.storageType = 'netlify-blobs';
      } else {
        // Fallback to environment variable storage for demo
        this.storageType = 'env-fallback';
      }
    } catch (error) {
      console.error('Storage initialization error:', error);
      this.storageType = 'memory';
    }
  }

  async get(key) {
    if (this.storageType === 'netlify-blobs' && this.store) {
      try {
        const data = await this.store.get(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Blob get error:', error);
        return null;
      }
    } else if (this.storageType === 'env-fallback') {
      // Use environment variables for demo data
      const envKey = `DATA_${key.toUpperCase()}`;
      const data = process.env[envKey];
      return data ? JSON.parse(data) : this.getDefaultData(key);
    } else {
      // Memory fallback
      return this.getDefaultData(key);
    }
  }

  async set(key, value) {
    if (this.storageType === 'netlify-blobs' && this.store) {
      try {
        await this.store.set(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Blob set error:', error);
        return false;
      }
    } else {
      // In demo mode, we can't persist but we return success
      console.log(`Would store ${key}:`, value);
      return true;
    }
  }

  async append(key, item) {
    const data = (await this.get(key)) || [];
    data.push(item);
    return await this.set(key, data);
  }

  getDefaultData(key) {
    const defaults = {
      audits: [],
      users: [
        { 
          id: '1',
          username: 'admin@amazon.at',
          role: 'admin',
          name: 'Admin User'
        }
      ],
      metadata: {
        version: '1.0.0',
        lastSync: new Date().toISOString()
      }
    };
    return defaults[key] || null;
  }
}

// Helper function for use in functions
async function getStorage(context) {
  const storage = new StorageService(context);
  await storage.initialize();
  return storage;
}

module.exports = { StorageService, getStorage };
