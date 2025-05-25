// google_sync_manager.js
export class GoogleSyncManager {
  constructor(clientId, dbManager) {
    this.GOOGLE_CLIENT_ID = clientId;
    this.dbManager = dbManager;
    this.token = null;
  }

  initAuth() {
    google.accounts.id.initialize({
      client_id: this.GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.error) {
          console.error('Auth error:', response.error);
          return;
        }
        this.token = response.access_token;
        this.sync();
      },
      use_fedcm_for_prompt: true
    });
    
    const token = sessionStorage.getItem('google_token');
    if (!token) _requestToken();
  }

  async sync() {
    try {
      if (!this.token) {
        await this._requestToken();
        return;
      }
      
      const driveData = await this._fetchDriveData();
      const localData = await this.dbManager.operation('readonly');
      const merged = this._mergeData(localData, driveData);
      
      await this.dbManager.operation('readwrite', null);
      await Promise.all(merged.map(task => this.dbManager.operation('readwrite', task)));
      
      await this._uploadToDrive(merged);
      alert('✅ Синхронизация завершена!');
      
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      alert('❌ Ошибка: ' + error.message);
    }
  }

  async _requestToken() {
    return new Promise((resolve, reject) => {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
          if (response.error) reject(new Error(response.error));
          this.token = response.access_token;
          sessionStorage.setItem('google_token', this.token);
          resolve();
        }
      });
      tokenClient.requestAccessToken();
    });
  }

  async _fetchDriveData() {
    const searchResponse = await fetch('https://www.googleapis.com/drive/v3/files?q=name="tasks.json"', {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    
    const { files } = await searchResponse.json();
    if (files.length === 0) return [];
    
    const fileContent = await fetch(`https://www.googleapis.com/drive/v3/files/${files[0].id}?alt=media`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    
    return await fileContent.json();
  }

  _mergeData(local, remote) {
    const taskMap = new Map();

    remote.forEach(task => {
      if (task.deleted === undefined) task.deleted = false;
    });

    [...local, ...remote].forEach(task => {
      if (task.deleted && Date.now() - task.lastModified > 30 * 86400000) return;
      const existing = taskMap.get(task.id);
      if (!existing || task.lastModified > existing.lastModified) {
        taskMap.set(task.id, task);
      }
    });
    
    return Array.from(taskMap.values());
  }

  async _uploadToDrive(data) {
    const searchResponse = await fetch('https://www.googleapis.com/drive/v3/files?q=name="tasks.json"', {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    
    const { files } = await searchResponse.json();
    const url = files.length > 0 
      ? `https://www.googleapis.com/upload/drive/v3/files/${files[0].id}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify({
      name: 'tasks.json',
      mimeType: 'application/json'
    })], { type: 'application/json' }));
    
    formData.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));

    await fetch(url, {
      method: files.length > 0 ? 'PATCH' : 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: formData
    });
  }
}