// app.js
import { DatabaseManager } from './database_manager.js';
import { TaskRenderer } from './task_renderer.js';
import { GoogleSyncManager } from './google_sync_manager.js';
import { ThemeManager } from './theme_manager.js';
import { DataManager } from './data_manager.js';

export class App {
  constructor() {
    this.GOOGLE_CLIENT_ID = '774036925552-vubfh392de99c3kafcv1d8dut6t1gvd5.apps.googleusercontent.com';
    this.DB_NAME = 'TaskDB';
    this.STORE_NAME = 'tasks';
    
    this.elements = {
      taskForm: document.getElementById('taskForm'),
      taskInput: document.getElementById('taskInput'),
      taskList: document.getElementById('taskList'),
      themeToggle: document.getElementById('themeToggle'),
      syncButton: document.getElementById('syncButton')
    };
  }

  async init() {
    try {
      // Инициализация основных компонентов
      this.dbManager = new DatabaseManager(this.DB_NAME, this.STORE_NAME);
      await this.dbManager.init();
      
      this.taskRenderer = new TaskRenderer(this.dbManager, this.elements);
      this.googleSync = new GoogleSyncManager(this.GOOGLE_CLIENT_ID, this.dbManager);
      this.themeManager = new ThemeManager(this.elements.themeToggle);
      this.dataManager = new DataManager(this.dbManager, this.elements);

      // Первоначальная загрузка данных
      await this.taskRenderer.render();
      this.googleSync.initAuth();
      
      // Настройка обработчиков
      this._setupCoreHandlers();
      this._registerServiceWorker();
      
    } catch (error) {
      console.error('App init error:', error);
    }
  }

  _setupCoreHandlers() {
    // Добавление новой задачи
    this.elements.taskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = this.elements.taskInput.value.trim();
      if (title) {
        await this.dbManager.operation('readwrite', {
          id: Date.now().toString(),
          title,
          completed: false,
          deleted: false,
          lastModified: Date.now()
        });
        this.elements.taskInput.value = '';
        await this.taskRenderer.render();
      }
    });

    // Синхронизация с Google Drive
    this.elements.syncButton.addEventListener('click', () => this.googleSync.sync());
  }

  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./js/sw.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.error('SW error:', err));
    }
  }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});