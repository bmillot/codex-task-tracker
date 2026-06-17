const STORAGE_KEY = "task-tracker-tasks";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const emptyMessage = document.querySelector("#empty-message");
const taskCount = document.querySelector("#task-count");

let tasks = loadTasks();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = input.value.trim();
  if (!title) {
    return;
  }

  tasks.push({
    id: createTaskId(),
    title,
    completed: false,
  });

  input.value = "";
  saveAndRender();
});

list.addEventListener("click", (event) => {
  const taskItem = event.target.closest("[data-task-id]");
  if (!taskItem) {
    return;
  }

  const taskId = taskItem.dataset.taskId;

  if (event.target.matches(".toggle-task")) {
    toggleTask(taskId);
  }

  if (event.target.matches(".delete-task")) {
    deleteTask(taskId);
  }
});

renderTasks();

function loadTasks() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);

  if (!savedTasks) {
    return [];
  }

  try {
    return JSON.parse(savedTasks);
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function saveAndRender() {
  saveTasks();
  renderTasks();
}

function createTaskId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toggleTask(taskId) {
  tasks = tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    return {
      ...task,
      completed: !task.completed,
    };
  });

  saveAndRender();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveAndRender();
}

function renderTasks() {
  list.innerHTML = "";

  tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = task.completed ? "task-item completed" : "task-item";
    item.dataset.taskId = task.id;

    const checkbox = document.createElement("input");
    checkbox.className = "toggle-task";
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Marquer "${task.title}" comme terminée`);

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-task";
    deleteButton.type = "button";
    deleteButton.textContent = "Supprimer";
    deleteButton.setAttribute("aria-label", `Supprimer "${task.title}"`);

    item.append(checkbox, title, deleteButton);
    list.append(item);
  });

  updateEmptyState();
  updateTaskCount();
}

function updateEmptyState() {
  emptyMessage.classList.toggle("hidden", tasks.length > 0);
}

function updateTaskCount() {
  const count = tasks.length;
  const label = count > 1 ? "tâches" : "tâche";
  taskCount.textContent = `${count} ${label}`;
}
