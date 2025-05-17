export class DatabaseManager {
  constructor(dbName, storeName) {
    this.DB_NAME = dbName;
    this.STORE_NAME = storeName;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 3);
      
      request.onupgradeneeded = (e) => {
        this.db = e.target.result;
        if (!this.db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = this.db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('by_modified', 'lastModified');
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = reject;
    });
  }

  async operation(mode, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.STORE_NAME, mode);
      const store = transaction.objectStore(this.STORE_NAME);
      
      let request;
      if (mode === 'readonly') {
        request = store.getAll();
      } else if (data) {
        request = data.id ? store.put(data) : store.add(data);
      } else {
        request = store.clear();
      }

      transaction.oncomplete = () => resolve(request?.result);
      transaction.onerror = (e) => reject(e.target.error);
    });
  }
}