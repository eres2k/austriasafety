// blob-storage.js - Client-side blob storage integration
// Add this to your app or include as a separate module

class BlobStorage {
  constructor() {
    this.baseUrl = '/.netlify/functions/blob';
    this.syncQueue = [];
    this.isSyncing = false;
  }

  // Get current user token
  async getAuthToken() {
    const user = window.netlifyIdentity?.currentUser();
    if (!user) {
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
        reg.sync.register('sync-blob-operations');
      });
    }
  }

  // Save sync queue to IndexedDB
  async saveQueueToLocal() {
    const db = await this.getDB();
    const tx = db.transaction('syncQueue', 'readwrite');
    await tx.objectStore('syncQueue').clear();
    
    for (const item of this.syncQueue) {
      await tx.objectStore('syncQueue').add(item);
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
    await this.loadQueueFromLocal();
    
    const processed = [];
    
    for (const item of this.syncQueue) {
      try {
        await this.request(item.method, item.path, item.data, item.params);
        processed.push(item.id);
        
        // Notify UI of successful sync
        this.notifySync('success', item);
      } catch (error) {
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
      
      request.onerror = reject;
    });
  }

  // Public API Methods

  // Save inspection
  async saveInspection(inspection) {
    const path = `inspections/${inspection.id}`;
    return await this.request('PUT', path, inspection);
  }

  // Get inspection
  async getInspection(id) {
    const path = `inspections/${id}`;
    return await this.request('GET', path);
  }

  // List user's inspections
  async listInspections(filters = {}) {
    const user = window.netlifyIdentity?.currentUser();
    if (!user) throw new Error('User not authenticated');
    
    const path = `inspections/${user.id}/`;
    return await this.request('GET', path, null, { list: 'true', ...filters });
  }

  // Save template (admin only)
  async saveTemplate(template) {
    const path = `templates/${template.id}`;
    return await this.request('PUT', path, template);
  }

  // Get template
  async getTemplate(id) {
    const path = `templates/${id}`;
    return await this.request('GET', path);
  }

  // List templates
  async listTemplates() {
    return await this.request('GET', 'templates/', null, { list: 'true' });
  }

  // Save report
  async saveReport(report) {
    const path = `reports/${report.id}`;
    return await this.request('PUT', path, report);
  }

  // Delete inspection
  async deleteInspection(id) {
    const path = `inspections/${id}`;
    return await this.request('DELETE', path);
  }

  // Utility methods
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Setup auto-sync
  setupAutoSync(interval = 30000) {
    // Initial sync
    if (navigator.onLine) {
      this.processSyncQueue();
    }
    
    // Periodic sync
    setInterval(() => {
      if (navigator.onLine) {
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
        if (event.data.type === 'SYNC_REQUESTED') {
          this.processSyncQueue();
        }
      });
    }
  }

  // Cache management
  async cacheData(path, data, ttl = 3600000) { // 1 hour default
    const db = await this.getDB();
    const tx = db.transaction('cache', 'readwrite');
    
    await tx.objectStore('cache').put({
      path,
      data,
      expires: Date.now() + ttl,
      cached: new Date().toISOString()
    });
  }

  async getCachedData(path) {
    const db = await this.getDB();
    const tx = db.transaction('cache', 'readonly');
    const cached = await tx.objectStore('cache').get(path);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    return null;
  }

  async clearExpiredCache() {
    const db = await this.getDB();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    const index = store.index('expires');
    
    const expired = await index.getAllKeys(IDBKeyRange.upperBound(Date.now()));
    for (const key of expired) {
      await store.delete(key);
    }
  }
}

// Integration with your app.js
// Add this to your initialization:

// Create global blob storage instance
window.blobStorage = new BlobStorage();

// Setup auto-sync
window.blobStorage.setupAutoSync();

// Example usage in your app:

// Save inspection with offline support
async function saveInspectionWithBlob(inspectionData) {
  try {
    // Show saving indicator
    showNotification('Saving inspection...', 'info');
    
    // Add metadata
    const dataToSave = {
      ...inspectionData,
      id: inspectionData.id || window.blobStorage.generateId(),
      lastModified: new Date().toISOString(),
      syncStatus: 'pending'
    };
    
    // Try to save to blob storage
    const result = await window.blobStorage.saveInspection(dataToSave);
    
    // Update local state
    dataToSave.syncStatus = 'synced';
    await saveToLocalDB('inspections', dataToSave);
    
    showNotification('Inspection saved successfully!', 'success');
    return result;
  } catch (error) {
    if (error.message.includes('Offline')) {
      // Save locally and queue for sync
      dataToSave.syncStatus = 'queued';
      await saveToLocalDB('inspections', dataToSave);
      showNotification('Saved locally - will sync when online', 'warning');
    } else {
      showNotification(`Error: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Load inspections with caching
async function loadInspectionsWithCache() {
  try {
    // Check cache first
    const cached = await window.blobStorage.getCachedData('user-inspections');
    if (cached) {
      displayInspections(cached);
    }
    
    // Fetch fresh data
    const inspections = await window.blobStorage.listInspections();
    
    // Update cache
    await window.blobStorage.cacheData('user-inspections', inspections);
    
    // Update UI
    displayInspections(inspections);
  } catch (error) {
    // Fall back to local data
    const localInspections = await loadFromLocalDB('inspections');
    displayInspections(localInspections);
    
    if (navigator.onLine) {
      showNotification('Unable to load latest data', 'error');
    }
  }
}

// Listen for sync events
window.addEventListener('blob-sync', (event) => {
  const { status, item } = event.detail;
  
  if (status === 'success') {
    console.log('✅ Synced:', item.path);
    // Update UI to show synced status
    updateSyncStatus(item.path, 'synced');
  } else if (status === 'failed') {
    console.error('❌ Sync failed:', item.path);
    showNotification('Some items failed to sync', 'error');
  }
});

// Helper function to update sync status in UI
function updateSyncStatus(path, status) {
  // Find the corresponding UI element and update its sync indicator
  const id = path.split('/').pop();
  const element = document.querySelector(`[data-inspection-id="${id}"]`);
  
  if (element) {
    const syncIndicator = element.querySelector('.sync-status');
    if (syncIndicator) {
      syncIndicator.className = `sync-status ${status}`;
      syncIndicator.title = status === 'synced' ? 'Synced to cloud' : 'Pending sync';
    }
  }
}

// Periodic cache cleanup
setInterval(() => {
  window.blobStorage.clearExpiredCache();
}, 3600000); // Every hour