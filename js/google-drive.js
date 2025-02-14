// Конфигурация Google Drive API
const CLIENT_ID = 'ВАШ_CLIENT_ID';
const API_KEY = 'ВАШ_API_KEY';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
// Расширяем область доступа для работы с файлами пользователя
const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata'
].join(' ');

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Добавляем кнопку для авторизации
function createAuthButton() {
    const button = $('<button>', {
        text: 'Подключить Google Drive',
        class: 'auth-button',
        click: handleAuthClick
    });
    $('.header').append(button);
}

// Обработчик авторизации
async function handleAuthClick() {
    try {
        // Запрашиваем доступ к Google Drive
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                throw resp;
            }
            $('.auth-button').text('Google Drive подключен');
            // Загружаем данные после успешной авторизации
            await loadTasks();
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
        console.error('Ошибка авторизации:', err);
    }
}

// Инициализация Google API
function initializeGoogleApi() {
    gapi.load('client', async () => {
        try {
            await gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: DISCOVERY_DOCS,
            });
            gapiInited = true;
            initializeGoogleIdentity();
        } catch (err) {
            console.error('Ошибка инициализации GAPI:', err);
        }
    });
}

function initializeGoogleIdentity() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // Будет определен позже
    });
    gisInited = true;
    createAuthButton();
}

// Функция для создания/обновления файла в Google Drive
async function saveToGoogleDrive(data, filename = 'tasks.json') {
    try {
        const fileId = await findFile(filename);
        const file = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const metadata = {
            name: filename,
            mimeType: 'application/json',
        };

        if (fileId) {
            // Обновляем существующий файл
            await gapi.client.drive.files.update({
                fileId: fileId,
                media: file,
                fields: 'id'
            });
        } else {
            // Создаем новый файл
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);

            await gapi.client.drive.files.create({
                resource: metadata,
                media: file,
                fields: 'id'
            });
        }
        
        console.log('Файл успешно сохранен в Google Drive');
    } catch (err) {
        console.error('Ошибка сохранения в Google Drive:', err);
        throw err;
    }
}

// Загрузка файла из Google Drive
async function loadFromGoogleDrive(filename = 'tasks.json') {
    try {
        const fileId = await findFile(filename);
        if (!fileId) {
            console.log('Файл не найден в Google Drive');
            return null;
        }

        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });

        return JSON.parse(response.body);
    } catch (err) {
        console.error('Ошибка загрузки из Google Drive:', err);
        throw err;
    }
}

// Поиск файла по имени
async function findFile(filename) {
    try {
        const response = await gapi.client.drive.files.list({
            q: `name='${filename}' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name)',
        });

        const files = response.result.files;
        return files && files.length > 0 ? files[0].id : null;
    } catch (err) {
        console.error('Ошибка поиска файла:', err);
        throw err;
    }
}

// Проверка статуса авторизации
function isAuthorized() {
    return gapi.client.getToken() !== null;
} 