$(document).ready(function() {
    // Структура данных для хранения задач
    let tasks = {
        all: [],
        today: [],
        completed: []
    };

    // Обработчик добавления новой задачи
    $('input[type="text"]').keypress(function(e) {
        if (e.which === 13 && $(this).val().trim() !== '') {
            addTask($(this).val());
            $(this).val('');
        }
    });

    // Обработчик изменения статуса задачи
    $(document).on('change', '.task-item input[type="checkbox"]', function() {
        const taskId = $(this).closest('.task-item').data('id');
        const task = tasks.all.find(t => t.id === taskId);
        if (task) {
            task.completed = $(this).is(':checked');
            if (task.completed) {
                tasks.completed.push(task);
                $(this).closest('.task-item').fadeOut(300, function() {
                    $(this).remove();
                });
            }
            updateCounters();
            saveTasks(); // Сохраняем после изменения статуса
        }
    });

    // Обработчик удаления задачи
    $(document).on('click', '.delete-task', function() {
        const taskItem = $(this).closest('.task-item');
        const taskId = taskItem.data('id');
        
        // Удаляем задачу из всех массивов
        tasks.all = tasks.all.filter(t => t.id !== taskId);
        tasks.today = tasks.today.filter(t => t.id !== taskId);
        tasks.completed = tasks.completed.filter(t => t.id !== taskId);
        
        taskItem.fadeOut(300, function() {
            $(this).remove();
        });
        
        updateCounters();
        saveTasks(); // Сохраняем после удаления
    });

    // Инициализация при загрузке страницы
    loadTasks();

    // Добавление тестовых задач только если список пустой
    if (tasks.all.length === 0) {
        addTask('Сохранять и загружать файлы js web', 'today', 'Education', '10:00');
        addTask('Пройти урок по android', 'today', 'Education', '17:30');
        addTask('Прочитать статью', 'today', 'Education', '20:30');
    }
});

// Загрузка задач из localStorage при старте
async function loadTasks() {
    try {
        if (isAuthorized()) {
            const driveTasks = await loadFromGoogleDrive();
            if (driveTasks) {
                tasks = driveTasks;
                renderAllTasks();
                console.log('Задачи загружены из Google Drive');
            }
        } else {
            // Если нет авторизации, используем localStorage
            const savedTasks = localStorage.getItem('tasks');
            if (savedTasks) {
                tasks = JSON.parse(savedTasks);
                renderAllTasks();
            }
        }
    } catch (err) {
        console.error('Ошибка загрузки задач:', err);
        // Используем localStorage как резервный вариант
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
            renderAllTasks();
        }
    }
}

// Сохранение задач в localStorage
async function saveTasks() {
    try {
        // Всегда сохраняем в localStorage как резервную копию
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        if (isAuthorized()) {
            await saveToGoogleDrive(tasks);
            console.log('Задачи сохранены в Google Drive');
        }
    } catch (err) {
        console.error('Ошибка сохранения задач:', err);
    }
}

// Функция для добавления новой задачи
function addTask(text, list = 'inbox', tag = '', time = '') {
    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        tag: tag,
        time: time,
        created: new Date().toISOString(),
        list: list
    };

    tasks.all.push(task);
    if (list === 'today') {
        tasks.today.push(task);
    }

    renderTask(task);
    updateCounters();
    saveTasks(); // Сохраняем после добавления
}

// Функция для отображения задачи в списке
function renderTask(task) {
    const taskHtml = `
        <div class="task-item" data-id="${task.id}">
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            ${task.tag ? `<span class="task-tag">${task.tag}</span>` : ''}
            ${task.time ? `<span class="task-time">${task.time}</span>` : ''}
            <button class="delete-task">❌</button>
        </div>
    `;
    $('.tasks-list').append(taskHtml);
}

// Обновление счетчиков в сайдбаре
function updateCounters() {
    const activeTasks = tasks.all.filter(t => !t.completed).length;
    const completedTasks = tasks.all.filter(t => t.completed).length;
    
    $('.menu-item:contains("All") .count').text(tasks.all.length);
    $('.menu-item:contains("Today") .count').text(activeTasks);
    $('.section-header:contains("Today") .task-count').text(activeTasks);
    $('.section-header:contains("Completed") .task-count').text(completedTasks);
}

// Очистка всех задач (полезно для разработки)
function clearAllTasks() {
    localStorage.removeItem('tasks');
    tasks = {
        all: [],
        today: [],
        completed: []
    };
    $('.tasks-list').empty();
    updateCounters();
}

function renderAllTasks() {
    $('.tasks-list').empty();
    tasks.all.forEach(task => renderTask(task));
    updateCounters();
}