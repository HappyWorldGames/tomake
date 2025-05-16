export default class GoogleSync {
  constructor() {
    console.log("Test");
  }

  initGoogleAuth(GOOGLE_CLIENT_ID) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.error) {
          console.error('Ошибка авторизации:', response.error);
          return;
        }
        googleToken = response.access_token;
        elements.syncButton.disabled = false;
        syncWithDrive(); // Автоматическая синхронизация после авторизации
      },
      use_fedcm_for_prompt: true // Включаем FedCM
    });
  }

  async syncWithDrive() {
		try {
			if (!googleToken) {
				const tokenClient = google.accounts.oauth2.initTokenClient({
					client_id: GOOGLE_CLIENT_ID,
					scope: 'https://www.googleapis.com/auth/drive.file',
					callback: (response) => {
						if (response.error) throw new Error(response.error);
						googleToken = response.access_token;
						syncWithDrive(); // Рекурсивный вызов после авторизации
					}
				});
				tokenClient.requestAccessToken();
				return;
			}
			
			// 1. Поиск файла в Google Drive
			const searchResponse = await fetch('https://www.googleapis.com/drive/v3/files?q=name="tasks.json"', {
				headers: { 'Authorization': `Bearer ${googleToken}` }
			});
			
			const { files } = await searchResponse.json();
			let driveData = [];
			
			// 2. Загрузка данных из Google Drive
			if (files.length > 0) {
				const fileContent = await fetch(`https://www.googleapis.com/drive/v3/files/${files[0].id}?alt=media`, {
					headers: { 'Authorization': `Bearer ${googleToken}` }
				});
				driveData = await fileContent.json();
			}

			// 3. Слияние данных
			const localData = await dbOperation('readonly');
			const merged = mergeTasks(localData, driveData);
			
			// 4. Сохранение объединенных данных
			await dbOperation('readwrite', null); // Очистка БД
			await Promise.all(merged.map(task => dbOperation('readwrite', task)));
			
			// 5. Загрузка обновленных данных в Drive
			await uploadToDrive(merged);
			
			alert('✅ Синхронизация завершена!');
			await renderTasks();
			
		} catch (error) {
			console.error('Ошибка синхронизации:', error);
			alert('❌ Ошибка: ' + error.message);
		}
	}
	
	mergeTasks(local, remote) {
		const taskMap = new Map();

		remote.map(task => {
			if (task.deleted === undefined) {
				task.deleted = false;
			}
		});

		[...local, ...remote].forEach(task => {
			// Если задача удалена больше 30 дней, выкинуть из списка
			if (task.deleted && Date.now() - task.lastModified > 30 * 86400000) return;
			const existing = taskMap.get(task.id);
			if (!existing || task.lastModified > existing.lastModified) {
				taskMap.set(task.id, task);
			}
		});
		
		return Array.from(taskMap.values());
	}

	async uploadToDrive(data) {
		const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
		
		// Поиск существующего файла
		const searchResponse = await fetch('https://www.googleapis.com/drive/v3/files?q=name="tasks.json"', {
			headers: { 'Authorization': `Bearer ${googleToken}` }
		});
		const { files } = await searchResponse.json();
		
		// Обновление или создание файла
		const url = files.length > 0 
			? `https://www.googleapis.com/upload/drive/v3/files/${files[0].id}?uploadType=multipart`
			: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
		
		const formData = new FormData();
		formData.append('metadata', new Blob([JSON.stringify({
			name: 'tasks.json',
			mimeType: 'application/json'
		})], { type: 'application/json' }));
		
		formData.append('file', blob);

		await fetch(url, {
			method: files.length > 0 ? 'PATCH' : 'POST',
			headers: { 'Authorization': `Bearer ${googleToken}` },
			body: formData
		});
	}

}