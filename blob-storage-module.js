// blob-storage.js - Client-side blob storage module
// Handles secure data persistence with Netlify Blobs

export default class BlobStorage {
  constructor() {
    this.baseUrl = '/.netlify/functions/blob';
    this.syncQueue = [];
    this.isSyncing = false;
    this.db = null;
  }

  // Get current user token
  async getAuthToken() {
    const user = window.netlifyIdentity?.currentUser();
    if (!user) {
      // Demo mode fallback
      if (window.state?.user?.id === 'demo-user-001') {
        return 'demo-token';
      }
      throw new Error('User not authenticated');
    }
    return await user.jwt();
  }

  // Generic request wrapper with auth
  async request(method, path, data = null, params = {}) {
    try {
      const token = await this.getAuthToken();
      const url = new URL(this.baseUrl, window.location.origin);
      
      // Add path and query parameters
      if (path) {
        url.searchParams.append('path', path);
      }
      
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if (data && (method === 'PUT' || method === 'POST')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url.toString(), options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Blob storage request failed:', error);
      
      // If offline, queue for later
      if (!navigator.onLine && (method === 'PUT' || method === 'POST' || method === 'DELETE')) {
        this.queueForSync({ method, path, data, params });
        throw new Error('Offline: Operation queued for sync');
      }
      
      throw error;
    }
  }

  // Queue operations for offline sync
  queueForSync(operation) {
    const queueItem = {
      ...operation,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      retries: 0
    };
    
    this.syncQueue.push(queueItem);
    this.saveQueueToLocal();
    
    // Register for background sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.sync.register('sync-blob-operations').catch(err => {
          console.warn('Background sync registration failed:', err);
        });
      });
    }
  }

  // Save sync queue to IndexedDB
  async saveQueueToLocal() {
    const db = await this.getDB();
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    
    // Clear and re-add all items
    await store.clear();
    
    for (const item of this.syncQueue) {
      await store.add(item);
    }
  }

  // Load sync queue from IndexedDB
  async loadQueueFromLocal() {
    const db = await this.getDB();
    const tx = db.transaction('syncQueue', 'readonly');
    const items = await tx.objectStore('syncQueue').getAll();
    this.syncQueue = items || [];
  }

  // Process sync queue
  async processSyncQueue() {
    if (this.isSyncing || !navigator.onLine) return;
    
    this.isSyncing = true;
    console.log('🔄 Processing sync queue...');
    
    await this.loadQueueFromLocal();
    
    const processed = [];
    
    for (const item of this.syncQueue) {
      try {
        console.log(`Syncing ${item.method} ${item.path}`);
        await this.request(item.method, item.path, item.data, item.params);
        processed.push(item.id);
        
        // Notify UI of successful sync
        this.notifySync('success', item);
      } catch (error) {
        console.error('Sync error:', error);
        item.retries++;
        
        if (item.retries > 3) {
          processed.push(item.id);
          this.notifySync('failed', item);
        }
      }
    }
    
    // Remove processed items
    this.syncQueue = this.syncQueue.filter(item => !processed.includes(item.id));
    await this.saveQueueToLocal();
    
    this.isSyncing = false;
    console.log(`✅ Sync complete. Processed: ${processed.length}, Remaining: ${this.syncQueue.length}`);
  }

  // Notify UI about sync status
  notifySync(status, item) {
    window.dispatchEvent(new CustomEvent('blob-sync', {
      detail: { status, item }
    }));
  }

  // Initialize IndexedDB
  async getDB() {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AuroraBlobSync', 1);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('cache')) {
          const cache = db.createObjectStore('cache', { keyPath: 'path' });
          cache.createIndex('expires', 'expires');
        }
      };
      
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
    });
  }

  // Public API Methods

  // Save inspection
  async saveInspection(inspection) {
    const userId = window.state?.user?.id || inspection.auditorId;
    const path = `inspections/${userId}/${inspection.id}`;
    
    // Add user context
    inspection.userId = userId;
    
    return await this.request('PUT', path, inspection);
  }

  // Get inspection
  async getInspection(id) {
    const userId = window.state?.user?.id;
    const path = `inspections/${userId}/${id}`;
    
    try {
      // Try cache first
      const cached = await this.getCachedData(path);
      if (cached) return cached;
      
      // Fetch from server
      const data = await this.request('GET', path);
      
      // Cache the result
      await this.cacheData(path, data);
      
      return data;
    } catch (error) {
      // Try to find in any user path (for shared inspections)
      const altPath = `inspections/${id}`;
      return await this.request('GET', altPath);
    }
  }

  // List user's inspections
  async listInspections(filters = {}) {
    const user = window.state?.user;
    if (!user) throw new Error('User not authenticated');
    
    const path = `inspections/${user.id}/`;
    
    try {
      const result = await this.request('GET', path, null, { list: 'true', ...filters });
      
      // Cache the list
      await this.cacheData('user-inspections', result, 300000); // 5 minutes
      
      return result;
    } catch (error) {
      // Return cached data if available
      const cached = await this.getCachedData('user-inspections');
      if (cached) return cached;
      throw error;
    }
  }

  // Save template (admin only)
  async saveTemplate(template) {
    const path = `templates/public/${template.id}`;
    return await this.request('PUT', path, template);
  }

  // Get template
  async getTemplate(id) {
    const path = `templates/public/${id}`;
    
    try {
      // Check cache
      const cached = await this.getCachedData(path);
      if (cached) return cached;
      
      // Fetch
      const data = await this.request('GET', path);
      
      // Cache for 1 hour
      await this.cacheData(path, data, 3600000);
      
      return data;
    } catch (error) {
      // Try private templates
      const privatePath = `templates/private/${id}`;
      return await this.request('GET', privatePath);
    }
  }

  // List templates
  async listTemplates() {
    const publicPath = 'templates/public/';
    
    try {
      const result = await this.request('GET', publicPath, null, { list: 'true' });
      
      // Cache templates
      await this.cacheData('templates-list', result, 3600000); // 1 hour
      
      return result;
    } catch (error) {
      const cached = await this.getCachedData('templates-list');
      if (cached) return cached;
      throw error;
    }
  }

  // Save report
  async saveReport(report) {
    const userId = window.state?.user?.id || report.generatedBy;
    const path = `reports/${userId}/${report.id}`;
    
    report.userId = userId;
    
    return await this.request('PUT', path, report);
  }

  // List reports
  async listReports(filters = {}) {
    const user = window.state?.user;
    if (!user) throw new Error('User not authenticated');
    
    const path = `reports/${user.id}/`;
    
    try {
      const result = await this.request('GET', path, null, { list: 'true', ...filters });
      
      // Parse the blob list to get actual report data
      const reports = await Promise.all(
        result.items.map(async (item) => {
          try {
            const reportData = await this.request('GET', item.key);
            return reportData;
          } catch (err) {
            console.error('Error loading report:', err);
            return null;
          }
        })
      );
      
      return {
        items: reports.filter(r => r !== null),
        count: reports.length
      };
    } catch (error) {
      console.error('Error listing reports:', error);
      return { items: [], count: 0 };
    }
  }

  // Delete inspection
  async deleteInspection(id) {
    const userId = window.state?.user?.id;
    const path = `inspections/${userId}/${id}`;
    return await this.request('DELETE', path);
  }

  // Utility methods
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Setup auto-sync
  setupAutoSync(interval = 30000) {
    console.log('⚙️ Setting up auto-sync with interval:', interval);
    
    // Initial sync
    if (navigator.onLine) {
      setTimeout(() => this.processSyncQueue(), 5000); // Wait 5s for app init
    }
    
    // Clear existing interval if any
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Periodic sync
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, interval);
    
    // Sync on online
    window.addEventListener('online', () => {
      console.log('📶 Back online, syncing...');
      this.processSyncQueue();
    });
    
    // Listen for sync events from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_REQUESTED') {
          this.processSyncQueue();
        }
      });
    }
  }

  // Cache management
  async cacheData(path, data, ttl = 3600000) { // 1 hour default
    try {
      const db = await this.getDB();
      const tx = db.transaction('cache', 'readwrite');
      const store = tx.objectStore('cache');
      
      await store.put({
        path,
        data,
        expires: Date.now() + ttl,
        cached: new Date().toISOString()
      });
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  async getCachedData(path) {
    try {
      const db = await this.getDB();
      const tx = db.transaction('cache', 'readonly');
      const cached = await tx.objectStore('cache').get(path);
      
      if (cached && cached.expires > Date.now()) {
        console.log('📦 Using cached data for:', path);
        return cached.data;
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    
    return null;
  }

  async clearExpiredCache() {
    try {
      const db = await this.getDB();
      const tx = db.transaction('cache', 'readwrite');
      const store = tx.objectStore('cache');
      const index = store.index('expires');
      
      const range = IDBKeyRange.upperBound(Date.now());
      const cursor = await index.openCursor(range);
      
      const deleted = [];
      while (cursor) {
        deleted.push(cursor.value.path);
        await cursor.delete();
        await cursor.continue();
      }
      
      if (deleted.length > 0) {
        console.log(`🗑️ Cleared ${deleted.length} expired cache entries`);
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      queueLength: this.syncQueue.length,
      isSyncing: this.isSyncing,
      isOnline: navigator.onLine
    };
  }
}

// Make available globally for service worker communication
if (typeof window !== 'undefined') {
  window.BlobStorage = BlobStorage;
}
