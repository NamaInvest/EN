// NamaSoft POS IndexedDB Manager
const DB_NAME = 'NamaPOS';
const DB_VERSION = 2;

class PosDB {
  constructor() {
    this.db = null;
  }

  async open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        // Offline queue for pending transactions
        if (!db.objectStoreNames.contains('offlineQueue')) {
          const qStore = db.createObjectStore('offlineQueue', { keyPath: 'id' });
          qStore.createIndex('status', 'status', { unique: false });
          qStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        // Cached products for offline POS
        if (!db.objectStoreNames.contains('products')) {
          const pStore = db.createObjectStore('products', { keyPath: 'id' });
          pStore.createIndex('barcode', 'barcode', { unique: false });
          pStore.createIndex('name', 'name', { unique: false });
        }
        // Cached customers
        if (!db.objectStoreNames.contains('customers')) {
          db.createObjectStore('customers', { keyPath: 'id' });
        }
        // Offline sales (completed locally)
        if (!db.objectStoreNames.contains('offlineSales')) {
          const sStore = db.createObjectStore('offlineSales', { keyPath: 'id' });
          sStore.createIndex('synced', 'synced', { unique: false });
          sStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
      req.onsuccess = (e) => { this.db = e.target.result; resolve(this.db); };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async addToQueue(item) {
    await this._ensureDB();
    return this._tx('offlineQueue', 'readwrite', (store) => store.put(item));
  }

  async getQueue() {
    await this._ensureDB();
    return this._txGetAll('offlineQueue');
  }

  async getPendingQueue() {
    await this._ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('offlineQueue', 'readonly');
      const store = tx.objectStore('offlineQueue');
      const idx = store.index('status');
      const req = idx.getAll('pending');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async updateQueueItem(id, updates) {
    await this._ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('offlineQueue', 'readwrite');
      const store = tx.objectStore('offlineQueue');
      const req = store.get(id);
      req.onsuccess = () => {
        const item = { ...req.result, ...updates };
        store.put(item);
        resolve(item);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async removeFromQueue(id) {
    await this._ensureDB();
    return this._tx('offlineQueue', 'readwrite', (store) => store.delete(id));
  }

  async clearSyncedQueue() {
    await this._ensureDB();
    const all = await this.getQueue();
    const synced = all.filter(i => i.status === 'synced');
    for (const item of synced) {
      await this.removeFromQueue(item.id);
    }
    return synced.length;
  }

  // Products cache
  async cacheProducts(products) {
    await this._ensureDB();
    const tx = this.db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    store.clear();
    for (const p of products) store.put(p);
    return new Promise((resolve) => { tx.oncomplete = () => resolve(products.length); });
  }

  async getProducts() {
    await this._ensureDB();
    return this._txGetAll('products');
  }

  async findProductByBarcode(barcode) {
    await this._ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('products', 'readonly');
      const idx = tx.objectStore('products').index('barcode');
      const req = idx.get(barcode);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Offline sales
  async saveOfflineSale(sale) {
    await this._ensureDB();
    const item = { ...sale, id: sale.id || `offline-${Date.now()}-${Math.random().toString(36).substr(2,6)}`, synced: false, createdAt: new Date().toISOString() };
    return this._tx('offlineSales', 'readwrite', (store) => store.put(item));
  }

  async getUnsyncedSales() {
    await this._ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('offlineSales', 'readonly');
      const idx = tx.objectStore('offlineSales').index('synced');
      const req = idx.getAll(false);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async markSaleSynced(id) {
    await this._ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('offlineSales', 'readwrite');
      const store = tx.objectStore('offlineSales');
      const req = store.get(id);
      req.onsuccess = () => { const s = req.result; s.synced = true; s.syncedAt = new Date().toISOString(); store.put(s); resolve(s); };
      req.onerror = () => reject(req.error);
    });
  }

  // Helpers
  async _ensureDB() { if (!this.db) await this.open(); }
  _tx(storeName, mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, mode);
      fn(tx.objectStore(storeName));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  _txGetAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

// Export globally
if (typeof window !== 'undefined') window.PosDB = PosDB;
