import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface OfflineDB extends DBSchema {
  inspections: {
    key: string
    value: any
    indexes: { 'by-status': string; 'by-location': string }
  }
  media: {
    key: string
    value: {
      id: string
      inspectionId: string
      type: string
      data: string
      uploadStatus: 'pending' | 'uploaded' | 'failed'
    }
    indexes: { 'by-inspection': string; 'by-status': string }
  }
  syncQueue: {
    key: string
    value: {
      id: string
      action: string
      data: any
      retries: number
      createdAt: string
    }
  }
}

class OfflineManager {
  private db: IDBPDatabase<OfflineDB> | null = null

  async init() {
    this.db = await openDB<OfflineDB>('whs-audit-offline', 1, {
      upgrade(db) {
        const inspectionStore = db.createObjectStore('inspections', {
          keyPath: 'id'
        })
        inspectionStore.createIndex('by-status', 'status')
        inspectionStore.createIndex('by-location', 'location')

        const mediaStore = db.createObjectStore('media', {
          keyPath: 'id'
        })
        mediaStore.createIndex('by-inspection', 'inspectionId')
        mediaStore.createIndex('by-status', 'uploadStatus')

        db.createObjectStore('syncQueue', {
          keyPath: 'id'
        })
      }
    })
  }

  async saveInspection(inspection: any) {
    if (!this.db) await this.init()
    await this.db!.put('inspections', inspection)
  }

  async getInspection(id: string) {
    if (!this.db) await this.init()
    return await this.db!.get('inspections', id)
  }

  async getAllInspections() {
    if (!this.db) await this.init()
    return await this.db!.getAll('inspections')
  }

  async saveMedia(media: any) {
    if (!this.db) await this.init()
    await this.db!.put('media', media)
  }

  async getPendingMedia() {
    if (!this.db) await this.init()
    const index = this.db!.transaction('media').store.index('by-status')
    return await index.getAll('pending')
  }

  async addToSyncQueue(action: string, data: any) {
    if (!this.db) await this.init()
    
    const item = {
      id: crypto.randomUUID(),
      action,
      data,
      retries: 0,
      createdAt: new Date().toISOString()
    }
    
    await this.db!.add('syncQueue', item)
  }

  async processSyncQueue() {
    if (!this.db) await this.init()
    
    const items = await this.db!.getAll('syncQueue')
    
    for (const item of items) {
      try {
        await this.syncItem(item)
        await this.db!.delete('syncQueue', item.id)
      } catch (error) {
        item.retries++
        
        if (item.retries >= 3) {
          await this.db!.delete('syncQueue', item.id)
        } else {
          await this.db!.put('syncQueue', item)
        }
      }
    }
  }

  private async syncItem(item: any) {
    switch (item.action) {
      case 'create-inspection':
        break
      case 'update-inspection':
        break
      case 'upload-media':
        break
    }
  }
}

export const offlineManager = new OfflineManager()