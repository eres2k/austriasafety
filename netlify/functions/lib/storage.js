// netlify/functions/lib/storage.js
// Persistent storage service using Netlify Blobs or fallback options

let getStore;
try {
  const netlifyBlobs = require("@netlify/blobs");
  getStore = netlifyBlobs.getStore;
} catch (error) {
  console.log('Netlify Blobs not available, using fallback storage');
}

class StorageService {
  constructor(context) {
    this.context = context;
    this.store = null;
  }

  async initialize() {
    try {
      // Try to use Netlify Blobs if available
      if (this.context && typeof getStore === 'function') {
        this.store = getStore({
          name: "whs-audit-data",
          consistency: "strong"
        });
        this.storageType = 'netlify-blobs';
        console.log('Using Netlify Blobs storage');
      } else {
        // Fallback to environment variable storage for demo
        this.storageType = 'env-fallback';
        console.log('Using environment variable fallback storage');
      }
    } catch (error) {
      console.error('Storage initialization error:', error);
      this.storageType = 'memory';
      console.log('Using in-memory storage');
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
    
    // Ensure we have an array
    if (!Array.isArray(data)) {
      console.error(`Expected array for key ${key}, got:`, typeof data);
      return false;
    }
    
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
        },
        { 
          id: '2',
          username: 'safety@amazon.at',
          role: 'auditor',
          name: 'Safety Officer'
        },
        { 
          id: '3',
          username: 'manager@amazon.at',
          role: 'viewer',
          name: 'Area Manager'
        }
      ],
      metadata: {
        version: '2.0.0',
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
