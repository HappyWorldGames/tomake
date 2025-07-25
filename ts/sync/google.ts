import { DatabaseManager } from "../core/database_manager.js";

export class GoogleSyncManager {
    private readonly GOOGLE_CLIENT_ID = '774036925552-vubfh392de99c3kafcv1d8dut6t1gvd5.apps.googleusercontent.com';
    private readonly FILE_NAME = 'ToMake.json';
    private readonly GOOGLE_FILE_URL = `https://www.googleapis.com/drive/v3/files?q=name="${this.FILE_NAME}"`;

    private dbManager: DatabaseManager;
    private token: string | null;

    constructor(dbManager: DatabaseManager) {
        this.dbManager = dbManager;
        this.token = null;
    }

    initAuth() {
        google.accounts.id.initialize({
            client_id: this.GOOGLE_CLIENT_ID,
            callback: (response: google.accounts.id.CredentialResponse) => {
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
        if (!this.token) this.requestToken();
    }

    async sync(dbManager: DatabaseManager): Promise<void> {
        try {
            if (!this.token) {
                await this.requestToken();
                return;
            }

            dbManager.merge(await this.fetchDriveData());
            await this.uploadToDrive(await dbManager.exportDataToJsonString());

            alert('✅ Синхронизация завершена!');
        } catch (error: any) {
            console.error('Ошибка синхронизации:', error);
            alert('❌ Ошибка: ' + error.message);
        }
    }

    private requestToken(): Promise<void> {
        return new Promise((resolve, reject) => {
            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.file',
                callback: (response: google.accounts.oauth2.TokenResponse) => {
                if (response.error) reject(new Error(response.error));
                this.token = response.access_token;
                sessionStorage.setItem('google_token', this.token);
                resolve();
                }
            });
            tokenClient.requestAccessToken();
        });
    }

    private async fetchDriveData(): Promise<string> {
        const searchResponse = await fetch(this.GOOGLE_FILE_URL, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });

        const { files }: { files: { id: string }[] } = await searchResponse.json();
        if (files.length === 0) return '';

        const fileContent = await fetch(`https://www.googleapis.com/drive/v3/files/${files[0].id}?alt=media`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });

        return await fileContent.json();
    }

    private async uploadToDrive(data: string): Promise<void> {
        const searchResponse = await fetch(this.GOOGLE_FILE_URL, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });

        const { files }: { files: { id: string }[] } = await searchResponse.json();
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