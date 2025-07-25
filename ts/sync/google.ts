import { DatabaseManager } from "../core/database_manager.js";

export class GoogleSyncManager {
    private static readonly GOOGLE_CLIENT_ID = '774036925552-vubfh392de99c3kafcv1d8dut6t1gvd5.apps.googleusercontent.com';
    private readonly FILE_NAME = 'ToMake.json';
    private readonly GOOGLE_FILE_URL = `https://www.googleapis.com/drive/v3/files?q=name="${this.FILE_NAME}"`;

    private dbManager: DatabaseManager;
    private token: string | null;

    constructor(dbManager: DatabaseManager) {
        this.dbManager = dbManager;
        this.token = null;
    }

    initAuth = () => {
        if (typeof google === 'undefined') {
            alert("Google is unavailable. Try again later...");
            return;
        }

        google.accounts.id.initialize({
            client_id: GoogleSyncManager.GOOGLE_CLIENT_ID,
            callback: (response: google.accounts.id.CredentialResponse) => {
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

    sync = async (): Promise<void> => {
        try {
            await this.requestToken();
            if (!this.token) return;

            const jsonString = await this.fetchDriveData();
            if (!jsonString) return;

            this.dbManager.merge(jsonString);
            await this.uploadToDrive(await this.dbManager.exportDataToJsonString());

            alert('✅ Sync done!');
            location.reload();
        } catch (error: any) {
            console.error('Error sync:', error);
            alert('❌ Error: ' + error.message);
        }
    }

    private requestToken = (): Promise<void> => {
        this.token = sessionStorage.getItem('google_token');
        if (this.token) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: GoogleSyncManager.GOOGLE_CLIENT_ID,
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

    private fetchDriveData = async (): Promise<string> => {
        const searchResponse = await fetch(this.GOOGLE_FILE_URL, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });

        const { files }: { files: { id: string }[] } = await searchResponse.json();
        if (files.length === 0) return '';

        const fileContent = await fetch(`https://www.googleapis.com/drive/v3/files/${files[0].id}?alt=media`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });

        return await fileContent.text();
    }

    private uploadToDrive = async (data: string): Promise<void> => {
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