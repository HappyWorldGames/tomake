document.addEventListener('DOMContentLoaded', async () => {
    const GOOGLE_CLIENT_ID = '774036925552-vubfh392de99c3kafcv1d8dut6t1gvd5.apps.googleusercontent.com';
    const DB_NAME = 'TaskDB';
    const STORE_NAME = 'tasks';
    let db;
    let googleToken = null;

    // Элементы DOM
    const elements = {
        taskForm: document.getElementById('taskForm'),
        taskInput: document.getElementById('taskInput'),
        taskList: document.getElementById('taskList'),
        themeToggle: document.getElementById('themeToggle'),
        syncButton: document.getElementById('syncButton')
    };

    // 1. Инициализация IndexedDB
    const initDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 3);
            
            request.onupgradeneeded = (e) => {
                db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('by_modified', 'lastModified');
                }
            };

            request.onsuccess = (e) => {
                db = e.target.result;
                resolve(db);
            };

            request.onerror = reject;
        });
    };

    // 2. CRUD операции
    const dbOperation = (mode, data) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, mode);
            const store = transaction.objectStore(STORE_NAME);
            
            let request;
            if (mode === 'readonly') {
                request = store.getAll();
            } else if (data) {
                request = data.id ? store.put(data) : store.add(data);
            } else {
                request = store.clear();
            }

            transaction.oncomplete = () => resolve(request?.result);
            transaction.onerror = (e) => reject(e.target.error);
        });
    };

    // 3. Рендер задач
    const renderTasks = async () => {
        try {
            const preFiltredTasks = await dbOperation('readonly');
            const tasks = preFiltredTasks.filter(task => !task.deleted); // Фильтрация

            elements.taskList.innerHTML = tasks.map(task => `
                <li class="task-item" data-id="${task.id}">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-title">${task.title}</span>
                    <div class="task-actions">
                        <button class="edit-btn">✎</button>
                        <button class="delete-btn">×</button>
                    </div>
                </li>
            `).join('');

            // Обработчики событий
            document.querySelectorAll('.delete-btn').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                const tasks = await dbOperation('readonly');
                const task = tasks.find(t => t.id === taskId);
                task.deleted = true; // Помечаем как удаленную
                task.lastModified = Date.now();
                await dbOperation('readwrite', task);
                await renderTasks();
              });
            });

            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', async (e) => {
                    const taskId = e.target.closest('.task-item').dataset.id;
                    const tasks = await dbOperation('readonly');
                    const task = tasks.find(t => t.id === taskId);
                    task.completed = e.target.checked;
                    task.lastModified = Date.now();
                    await dbOperation('readwrite', task);
                });
            });

            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const taskItem = e.target.closest('.task-item');
                    const titleSpan = taskItem.querySelector('.task-title');
                    const newTitle = prompt('Редактировать:', titleSpan.textContent);
                    
                    if (newTitle) {
                        const tasks = await dbOperation('readonly');
                        const task = tasks.find(t => t.id === taskItem.dataset.id);
                        task.title = newTitle;
                        task.lastModified = Date.now();
                        await dbOperation('readwrite', task);
                        await renderTasks();
                    }
                });
            });

        } catch (error) {
            console.error('Ошибка рендера:', error);
        }
    };

    // 4. Google Drive синхронизация
    const initGoogleAuth = () => {
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
  	};

    const syncWithDrive = async () => {
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
                console.log("files: " + files.length)
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
	};
	
	const mergeTasks = (local, remote) => {
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
	};

	const uploadToDrive = async (data) => {
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
	};

    // Функция экспорта
    const exportData = async () => {
        if (!confirm('Экспортировать все задачи в файл?')) return;
        try {
            const tasks = await dbOperation('readonly');
            
            if (tasks.length === 0) {
                alert('Нет данных для экспорта!');
                return;
            }

            // Форматирование данных
            const dataStr = JSON.stringify(tasks, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            
            // Создание ссылки для скачивания
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tasks_backup_${new Date().toISOString().slice(0,10)}.json`;
            
            // Автоматическое скачивание
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Ошибка экспорта:', error);
            alert('Не удалось экспортировать данные!');
        }
    };

    const importData = async () => {
        if (!confirm('Текущие данные будут заменены. Продолжить?')) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const tasks = JSON.parse(e.target.result);
                    await dbOperation('readwrite', null);
                    await Promise.all(tasks.map(task => dbOperation('readwrite', task)));
                    await renderTasks();
                    alert('Данные успешно импортированы!');
                };
                reader.readAsText(file);
            } catch (error) {
                console.error('Ошибка импорта:', error);
                alert('Некорректный файл!');
            }
        };
        
        input.click();
    };

    // 5. Инициализация приложения
    try {
        db = await initDB();
        await renderTasks();
        initGoogleAuth();

        // Обработчики событий
        elements.taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = elements.taskInput.value.trim();
            if (title) {
                await dbOperation('readwrite', {
                    id: Date.now().toString(),
                    title,
                    completed: false,
                    deleted: false,
                    lastModified: Date.now()
                });
                elements.taskInput.value = '';
                await renderTasks();
            }
        });

        elements.syncButton.addEventListener('click', syncWithDrive);
        document.getElementById('exportBtn').addEventListener('click', exportData);
        document.getElementById('importBtn').addEventListener('click', importData);
        elements.themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', 
                document.body.classList.contains('dark-theme') ? 'dark' : 'light'
            );
        });

        // Восстановление темы
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-theme');
        }

        // Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./js/sw.js')
                .then(reg => console.log('Service Worker зарегистрирован'))
                .catch(err => console.error('Ошибка SW:', err));
        }

    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
});