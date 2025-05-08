document.addEventListener('DOMContentLoaded', async () => {
  const DB_NAME = 'TaskDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'tasks';
  let db;

  // Элементы DOM
  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  const themeToggle = document.getElementById('themeToggle');

  // Инициализация базы данных
  const initDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

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

      request.onerror = (e) => reject(e.target.error);
    });
  };

  // CRUD операции
  const dbOperation = (mode, data = null) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      
      let request;
      if (mode === 'readonly') {
        request = store.getAll();
      } else if (mode === 'readwrite' && data) {
        request = data.id ? store.put(data) : store.add(data);
      } else if (mode === 'readwrite' && !data) {
        request = store.clear();
      }

      transaction.oncomplete = () => resolve(request?.result);
      transaction.onerror = (e) => reject(e.target.error);
    });
  };

  // Сохранение задачи
  const saveTask = async (task) => {
    task.lastModified = new Date().toISOString();
    await dbOperation('readwrite', task);
    await renderTasks();
  };

  // Удаление задачи
  const deleteTask = async (id) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
    await renderTasks();
  };

  // Рендер задач
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
        await deleteTask(taskId);
      });
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', async (e) => {
        const taskId = e.target.closest('.task-item').dataset.id;
        const tasks = await dbOperation('readonly');
        const task = tasks.find(t => t.id === taskId);
        task.completed = e.target.checked;
        await saveTask(task);
      });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        const titleSpan = taskItem.querySelector('.task-title');
        const newTitle = prompt('Редактировать задачу:', titleSpan.textContent);
        
        if (newTitle) {
          titleSpan.textContent = newTitle;
          const taskId = taskItem.dataset.id;
          updateTaskTitle(taskId, newTitle);
        }
      });
    });
  };

  // Обновление заголовка задачи
  const updateTaskTitle = async (id, newTitle) => {
    const tasks = await dbOperation('readonly');
    const task = tasks.find(t => t.id === id);
    task.title = newTitle;
    await saveTask(task);
  };

  // Инициализация приложения
  try {
    db = await initDB();
    await renderTasks();
    
    // Добавление новой задачи
    taskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = taskInput.value.trim();
      
      if (title) {
        await saveTask({
          id: Date.now().toString(),
          title,
          completed: false,
          lastModified: new Date().toISOString()
        });
        taskInput.value = '';
      }
    });

    // Переключение темы
    themeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-theme');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // Восстановление темы
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');

  } catch (error) {
    console.error('Ошибка приложения:', error);
  }
  
  // Конфигурация Google API
const GOOGLE_CLIENT_ID = '774036925552-vubfh392de99c3kafcv1d8dut6t1gvd5.apps.googleusercontent.com'; //'ВАШ_CLIENT_ID';
const GOOGLE_API_KEY = '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'; //'ВАШ_API_KEY';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let googleAuth = null;
let isOnline = navigator.onLine;

// Элементы для синхронизации
const syncButton = document.createElement('button');
syncButton.textContent = '🔄 Синхронизировать';
syncButton.id = 'syncButton';
document.querySelector('.container').appendChild(syncButton);

// Инициализация Google API
function initGoogleAPI() {
  return new Promise((resolve) => {
    gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        clientId: GOOGLE_CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      }).then(() => {
        googleAuth = gapi.auth2.getAuthInstance();
        resolve();
      });
    });
  });
}

// Авторизация
async function handleAuth() {
  if (!googleAuth.isSignedIn.get()) {
    await googleAuth.signIn();
  }
  return googleAuth.currentUser.get().getAuthResponse().access_token;
}

// Загрузка файла с Google Drive
async function downloadFromDrive() {
  const response = await gapi.client.drive.files.list({
    q: "name='tasks.json'",
    fields: 'files(id, modifiedTime)'
  });
  
  if (response.result.files.length === 0) return null;
  
  const file = response.result.files[0];
  const content = await gapi.client.drive.files.get({
    fileId: file.id,
    alt: 'media'
  });
  
  return {
    data: content.body,
    lastModified: file.modifiedTime
  };
}

// Сохранение файла на Google Drive
async function uploadToDrive(data) {
  const file = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const metadata = {
    name: 'tasks.json',
    mimeType: 'application/json'
  };
  
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + gapi.auth.getToken().access_token }),
    body: formData
  });
  
  return response.json();
}

// Логика синхронизации
async function syncData() {
  if (!isOnline) {
    alert('Нет интернет-соединения!');
    return;
  }

  try {
    await initGoogleAPI();
    const token = await handleAuth();
    
    // Получаем данные из Drive
    const driveData = await downloadFromDrive();
    const localData = await dbOperation('readonly');
    
    // Слияние данных
    const merged = mergeTasks(localData, driveData?.data || []);
    
    // Сохраняем объединенные данные
    await dbOperation('readwrite', null); // Очистка
    await Promise.all(merged.map(task => dbOperation('readwrite', task)));
    
    // Загружаем на Drive
    await uploadToDrive(merged);
    
    alert('Синхронизация завершена!');
  } catch (error) {
    console.error('Ошибка синхронизации:', error);
    alert('Ошибка! Проверьте консоль.');
  }
}

// Обработчик кнопки синхронизации
document.getElementById('syncButton').addEventListener('click', syncData);
});