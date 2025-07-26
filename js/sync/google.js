export class GoogleSyncManager {
    constructor(dbManager) {
        this.FILE_NAME = 'ToMake.json';
        this.GOOGLE_FILE_URL = `https://www.googleapis.com/drive/v3/files?q=name="${this.FILE_NAME}"`;
        this.dbManager = dbManager;
        this.token = null;
    }
    initAuth() {
        if (typeof google === 'undefined') {
            alert("Google is unavailable. Try again later...");
            return;
        }
        google.accounts.id.initialize({
            client_id: GoogleSyncManager.GOOGLE_CLIENT_ID,
            callback: (response) => {
                if (!response.credential) {
                    console.error('Auth error:', response);
                    return;
                }
                this.token = response.credential;
                this.sync();
            },
            use_fedcm_for_prompt: true
        });
        this.requestToken();
    }
    async sync() {
        try {
            if (!this.token) {
                await this.requestToken();
                return;
            }
            this.dbManager.merge(await this.fetchDriveData());
            await this.uploadToDrive(await this.dbManager.exportDataToJsonString());
            alert('✅ Синхронизация завершена!');
        }
        catch (error) {
            console.error('Ошибка синхронизации:', error);
            alert('❌ Ошибка: ' + error.message);
        }
    }
    requestToken() {
        return new Promise((resolve, reject) => {
            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: GoogleSyncManager.GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.file',
                callback: (response) => {
                    if (response.error)
                        reject(new Error(response.error));
                    this.token = response.access_token;
                    sessionStorage.setItem('google_token', this.token);
                    resolve();
                }
            });
            tokenClient.requestAccessToken();
        });
    }
    async fetchDriveData() {
        const searchResponse = await fetch(this.GOOGLE_FILE_URL, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const { files } = await searchResponse.json();
        if (files.length === 0)
            return '';
        const fileContent = await fetch(`https://www.googleapis.com/drive/v3/files/${files[0].id}?alt=media`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return await fileContent.json();
    }
    async uploadToDrive(data) {
        const searchResponse = await fetch(this.GOOGLE_FILE_URL, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const { files } = await searchResponse.json();
        const fileExists = files.length > 0;
        const url = fileExists
            ? `https://www.googleapis.com/upload/drive/v3/files/${files[0].id}?uploadType=multipart`
            : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        const metadata = {
            name: this.FILE_NAME,
            mimeType: 'application/json'
        };
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', new Blob([data], { type: 'application/json' }));
        await fetch(url, {
            method: fileExists ? 'PATCH' : 'POST',
            headers: { 'Authorization': `Bearer ${this.token}` },
            body: formData
        });
    }
}
GoogleSyncManager.GOOGLE_CLIENT_ID = '774036925552-vubfh392de99c3kafcv1d8dut6t1gvd5.apps.googleusercontent.com';
