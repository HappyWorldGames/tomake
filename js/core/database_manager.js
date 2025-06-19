export class DatabaseManager {

    constructor(showError = (text) => {}) {
        this.dbName = 'ToMake';
        this.storeName = 'tasks';
        this.db = null;

        this.showError = showError
    }

    initDB() {
        let request = indexedDB.open(this.dbName, 1);

        request.onblocked = (event) => {
            showError('Upgrade blocked - Please close other tabs displaying this site.');
        }
        
        request.onupgradeneeded = (event) => {
            let db = event.target.result;

            db.onerror = (event) => {
                showError('Error loading database.')
            }
            
            if (!db.objectStoreNames.contains(this.storeName)) {
                const store = db.createObjectStore(this.storeName, { keyPath: 'tastId', autoIncrement: true });

                store.createIndex('listName', 'listName', { unique: false });
                store.createIndex('title', 'title', { unique: false });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('tags', 'tags', { unique: false });
                store.createIndex('content', 'content', { unique: false });
                store.createIndex('startDate', 'startDate', { unique: false });
                store.createIndex('dueDate', 'dueDate', { unique: false });
                store.createIndex('reminder', 'reminder', { unique: false });
                store.createIndex('repeat', 'repeat', { unique: false });
                store.createIndex('priority', 'priority', { unique: false });
                store.createIndex('status', 'status', { unique: false });
                store.createIndex('createdTime', 'createdTime', { unique: false });
                store.createIndex('completedTime', 'completedTime', { unique: false });
                store.createIndex('timezone', 'timezone', { unique: false });
                store.createIndex('viewMode', 'viewMode', { unique: false });
                store.createIndex('parentId', 'parentId', { unique: false });
            }
        }

        request.onsuccess = (event) => {
            this.db = event.target.result;
        }

        request.onerror = (event) => {
            showError('Error init db');
        }
    }

    getAll() {
        // ToDo
    }

    addTask(task) {
        // ToDo
    }
}