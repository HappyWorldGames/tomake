// data_manager.js
export class DataManager {
  constructor(dbManager, elements) {
    this.dbManager = dbManager;
    this.elements = elements;
    this._init();
  }

  _init() {
    document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
    document.getElementById('importBtn').addEventListener('click', () => this.importData());
  }

  async exportData() {
    if (!confirm('Export all tasks to file?')) return;
    
    try {
      const tasks = await this.dbManager.operation('readonly');
      if (tasks.length === 0) {
        alert('No data to export!');
        return;
      }

      const dataStr = JSON.stringify(tasks, null, 2);
      this._downloadFile(
        dataStr,
        `tasks_backup_${new Date().toISOString().slice(0,10)}.json`,
        'application/json'
      );
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed!');
    }
  }

  async importData() {
    if (!confirm('Current data will be replaced. Continue?')) return;
    
    const file = await this._selectFile('.json');
    if (!file) return;

    try {
      const tasks = await this._readFile(file);
      await this.dbManager.operation('readwrite', null); // Clear DB
      await Promise.all(tasks.map(task => this.dbManager.operation('readwrite', task)));
      alert('Data imported successfully!');
      return true; // For potential chaining
    } catch (error) {
      console.error('Import error:', error);
      alert('Invalid file format!');
      return false;
    }
  }

  _downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  _selectFile(accept) {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      
      input.onchange = (e) => {
        resolve(e.target.files[0] || null);
      };
      
      input.click();
    });
  }

  _readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          resolve(JSON.parse(e.target.result));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}