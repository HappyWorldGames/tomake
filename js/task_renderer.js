export class TaskRenderer {
  constructor(dbManager, elements) {
    this.dbManager = dbManager;
    this.elements = elements;

    document.querySelector('.main-side .menu-btn').addEventListener('click', function() {
        document.querySelector('.project-list-side').style.display = "flex";
    })

    const textarea = document.getElementById('task-view-description-input');
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = `${this.scrollHeight}px`;
    });
    document.querySelector('.task-view-side .main .space').addEventListener('click', function() {
      textarea.focus();
    })
  }

  async render() {
    try {
      const preFilteredTasks = await this.dbManager.operation('readonly');
      const tasks = preFilteredTasks.filter(task => !task.deleted);

      this.elements.taskList.innerHTML = tasks.map(task => `
        <li class="task-item" data-id="${task.id}">
          <input type="checkbox" ${task.completed ? 'checked' : ''}>
          <span class="task-title">${task.title}</span>
          <div class="task-actions">
            <button class="edit-btn">✎</button>
            <button class="delete-btn">×</button>
          </div>
        </li>
      `).join('');

      this._attachEventHandlers();
    } catch (error) {
      console.error('Render error:', error);
    }
  }

  _attachEventHandlers() {
    // Delete handlers
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const taskId = e.target.closest('.task-item').dataset.id;
        const tasks = await this.dbManager.operation('readonly');
        const task = tasks.find(t => t.id === taskId);
        task.deleted = true;
        task.lastModified = Date.now();
        await this.dbManager.operation('readwrite', task);
        await this.render();
      });
    });

    // Checkbox handlers
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', async (e) => {
        const taskId = e.target.closest('.task-item').dataset.id;
        const tasks = await this.dbManager.operation('readonly');
        const task = tasks.find(t => t.id === taskId);
        task.completed = e.target.checked;
        task.lastModified = Date.now();
        await this.dbManager.operation('readwrite', task);
      });
    });

    // Edit handlers
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const taskItem = e.target.closest('.task-item');
        const titleSpan = taskItem.querySelector('.task-title');
        const newTitle = prompt('Edit:', titleSpan.textContent);
        
        if (newTitle) {
          const tasks = await this.dbManager.operation('readonly');
          const task = tasks.find(t => t.id === taskItem.dataset.id);
          task.title = newTitle;
          task.lastModified = Date.now();
          await this.dbManager.operation('readwrite', task);
          await this.render();
        }
      });
    });
  }
}