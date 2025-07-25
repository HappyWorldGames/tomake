export class GoogleSyncManager {
    constructor(dbManager) {
        this.GOOGLE_CLIENT_ID = '774036925552-vubfh392de99c3kafcv1d8dut6t1gvd5.apps.googleusercontent.com';
        this.FILE_NAME = 'ToMake.json';
        this.GOOGLE_FILE_URL = `https://www.googleapis.com/drive/v3/files?q=name="${this.FILE_NAME}"`;
        this.dbManager = dbManager;
        this.token = null;
    }
    initAuth() {
        google.accounts.id.initialize({
            client_id: this.GOOGLE_CLIENT_ID,
            callback: (response) => {
                if (!response.credential) {
                    console.error('Auth error:', response);
                    return;
                }
                this.token = response.credential;
                this.sync(this.dbManager);
            },
            use_fedcm_for_prompt: true
        });
        this.token = sessionStorage.getItem('google_token');
        if (!this.token)
            this.requestToken();
    }
    async sync(dbManager) {
        try {
            if (!this.token) {
                await this.requestToken();
                return;
            }
            dbManager.merge(await this.fetchDriveData());
            await this.uploadToDrive(await dbManager.exportDataToJsonString());
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
                client_id: this.GOOGLE_CLIENT_ID,
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
