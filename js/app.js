document.addEventListener('DOMContentLoaded', async () => {
  // Конфигурация
  const GOOGLE_CLIENT_ID = '774036925552-vubfh392de99c3kafcv1d8dut6t1gvd5.apps.googleusercontent.com';
  const DB_NAME = 'TaskDB';
  const STORE_NAME = 'tasks';
  let db;
  let googleToken = null;

  // Элементы DOM
  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  const themeToggle = document.getElementById('themeToggle');
  const syncButton = document.getElementById('syncButton');

  // 1. Инициализация IndexedDB
  const initDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 2);

      request.onupgradeneeded = (e) => {
        db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by_lastModified', 'lastModified', { unique: false });
        }
      };

      request.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };

      request.onerror = reject;
    });
  };

  // 2. CRUD операции
  const dbOperation = async (mode, data) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    
    if (mode === 'readonly') return store.getAll();
    if (data) return data.id ? store.put(data) : store.add(data);
    return store.clear();
  };

  // 3. Рендер задач
  const renderTasks = async () => {
    const tasks = await dbOperation('readonly');
    taskList.innerHTML = tasks.map(task => `
      <li class="task-item" data-id="${task.id}">
        <input type="checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-title">${task.title}</span>
        <div class="task-actions">
          <button class="edit-btn">✎</button>
          <button class="delete-btn">×</button>
        </div>
      </li>
    `).join('');

    // Обработчики событий
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const taskId = e.target.closest('.task-item').dataset.id;
        await dbOperation('readwrite', { id: taskId });
        await renderTasks();
      });
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', async (e) => {
        const taskId = e.target.closest('.task-item').dataset.id;
        const tasks = await dbOperation('readonly');
        const task = tasks.find(t => t.id === taskId);
        task.completed = e.target.checked;
        task.lastModified = new Date().toISOString();
        await dbOperation('readwrite', task);
      });
    });
  };

  // 4. Google Drive синхронизация
  const syncWithDrive = async () => {
    try {
      // Загрузка данных с Drive
      const driveResponse = await fetch('https://www.googleapis.com/drive/v3/files?q=name="tasks.json"', {
        headers: { Authorization: `Bearer ${googleToken}` }
      });
      
      const { files } = await driveResponse.json();
      const driveData = files[0] 
        ? await (await fetch(`https://www.googleapis.com/drive/v3/files/${files[0].id}?alt=media`, {
            headers: { Authorization: `Bearer ${googleToken}` }
          })).json()
        : [];

      // Слияние данных
      const localData = await dbOperation('readonly');
      const merged = [...localData, ...driveData].reduce((acc, task) => {
        const existing = acc.find(t => t.id === task.id);
        return existing?.lastModified > task.lastModified ? acc : [...acc.filter(t => t.id !== task.id), task];
      }, []);

      // Сохранение и синхронизация
      await dbOperation('readwrite', null);
      await Promise.all(merged.map(task => dbOperation('readwrite', task)));
      
      const blob = new Blob([JSON.stringify(merged)], { type: 'application/json' });
      const metadata = { name: 'tasks.json', mimeType: 'application/json' };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', blob);

      await fetch(files[0] 
        ? `https://www.googleapis.com/upload/drive/v3/files/${files[0].id}?uploadType=multipart`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: files[0] ? 'PATCH' : 'POST',
          headers: { Authorization: `Bearer ${googleToken}` },
          body: formData
        });

      alert('Синхронизация завершена!');
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      alert('Ошибка синхронизации!');
    }
  };

  // 5. Инициализация приложения
  try {
    // База данных
    db = await initDB();
    await renderTasks();

    // Google Identity
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        googleToken = response.access_token;
        syncButton.disabled = false;
      }
    });

    // Обработчики событий
    taskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = taskInput.value.trim();
      if (title) {
        await dbOperation('readwrite', {
          id: Date.now().toString(),
          title,
          completed: false,
          lastModified: new Date().toISOString()
        });
        taskInput.value = '';
        await renderTasks();
      }
    });

    syncButton.addEventListener('click', async () => {
      if (!googleToken) {
        google.accounts.id.prompt();
      } else {
        await syncWithDrive();
      }
    });

    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });

    // Восстановление темы
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-theme');
    }

    // Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW зарегистрирован'))
        .catch(err => console.error('Ошибка SW:', err));
    }
  } catch (error) {
    console.error('Ошибка инициализации:', error);
  }
});