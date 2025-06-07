class TaskInterface {
  id: string;                 // UUID
  title: string;              // Заголовок
  description?: string;       // Описание
  createdAt: Date;            // Дата создания
  updatedAt: Date;            // Дата изменения
  dueDate?: Date;             // Срок выполнения
  priority: 'low' | 'medium' | 'high'; // Приоритет
  completed: boolean;         // Статус
  completedAt?: Date;         // Дата завершения
  parentId: string | null;    // ID родительской задачи
  children: string[];         // ID дочерних задач
  tags: string[];             // Связанные метки
}