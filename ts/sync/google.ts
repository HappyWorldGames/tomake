import { DatabaseManager } from "../core/database_manager.js";
import { showSnackbar } from "../utils/notification.js";

// Class to manage Google Drive synchronization for ToMake app
export class GoogleSyncManager {
    // Static variable to store the Google Client ID
    private static readonly GOOGLE_CLIENT_ID = '774036925552-vubfh392de99c3kafcv1d8dut6t1gvd5.apps.googleusercontent.com';

    // Variables to store file name and Google Drive file URL
    private readonly FILE_NAME = 'ToMake.json';
    private readonly GOOGLE_FILE_URL = `https://www.googleapis.com/drive/v3/files?q=name="${this.FILE_NAME}"`;

    // DatabaseManager instance and token variable
    private dbManager: DatabaseManager;
    private token: string | null;

    // Constructor to initialize the GoogleSyncManager with a DatabaseManager instance
    constructor(dbManager: DatabaseManager) {
        this.dbManager = dbManager;
        this.token = null;
    }

    // Method to initiate authentication with Google
    initAuth = () => {
        if (typeof google === 'undefined') {
            showSnackbar("Google is unavailable. Try again later...");
            return;
        }

        google.accounts.id.initialize({
            client_id: GoogleSyncManager.GOOGLE_CLIENT_ID,
            callback: (response: google.accounts.id.CredentialResponse) => {
                if (!response.credential) {
                    showSnackbar('Auth error');
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

    // Method to synchronize data with Google Drive
    sync = async (): Promise<void> => {
        try {
            await this.requestToken();
            if (!this.token) return;

            const jsonString = await this.fetchDriveData();
            if (!jsonString) return;

            this.dbManager.merge(jsonString);
            await this.uploadToDrive(await this.dbManager.exportDataToJsonString());

            showSnackbar('✅ Sync done!')
            location.reload();
        } catch (error: any) {
            console.error('Error sync:', error);
            showSnackbar('❌ Error: ' + error.message);
        }
    }

    // private isAccessTokenValid = () => {
    //     credentials
    // }

    // Method to request a token from Google
    private requestToken = (): Promise<void> => {
        this.token = localStorage.getItem('google_token');
        if (this.token) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: GoogleSyncManager.GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.file',
                callback: (tokenResponse: google.accounts.oauth2.TokenResponse) => {
                    if (tokenResponse.error) reject(new Error(tokenResponse.error));
                    this.token = tokenResponse.access_token;

                    const expiresIn = Number(tokenResponse.expires_in);
                    const receivedAt = Date.now();
                    const expiresAt = receivedAt + (expiresIn * 1000);

                    localStorage.setItem('google_token', this.token);
                    localStorage.setItem('google_expires_at', expiresAt.toString());

                    if (tokenResponse.refresh_token) {
                        localStorage.setItem('google_refresh_token', tokenResponse.refresh_token);
                    }

                    resolve();
                }
            });
            tokenClient.requestAccessToken();
        });
    }

    // Method to fetch data from Google Drive
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

    // Method to upload data to Google Drive
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