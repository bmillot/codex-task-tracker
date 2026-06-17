const STORAGE_KEY = "task-tracker-tasks";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const emptyMessage = document.querySelector("#empty-message");
const taskCount = document.querySelector("#task-count");
const storageError = document.querySelector("#storage-error");

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
  let savedTasks;

  try {
    savedTasks = localStorage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }

  if (!savedTasks) {
    return [];
  }

  try {
    const parsedTasks = JSON.parse(savedTasks);
    if (!Array.isArray(parsedTasks)) {
      clearSavedTasks();
      return [];
    }

    const validTasks = parsedTasks.filter(isValidTask);
    if (validTasks.length !== parsedTasks.length) {
      saveTasksToStorage(validTasks);
    }

    return validTasks;
  } catch {
    clearSavedTasks();
    return [];
  }
}

function saveTasks() {
  const saved = saveTasksToStorage(tasks);
  storageError.classList.toggle("hidden", saved);
}

function saveTasksToStorage(tasksToSave) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
    return true;
  } catch {
    return false;
  }
}

function clearSavedTasks() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // L'application reste utilisable même si le stockage local est indisponible.
  }
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

    const checkboxId = `task-toggle-${task.id}`;

    const checkbox = document.createElement("input");
    checkbox.className = "toggle-task";
    checkbox.id = checkboxId;
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", getToggleLabel(task));

    const title = document.createElement("label");
    title.className = "task-title";
    title.htmlFor = checkboxId;
    title.textContent = task.title;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-task";
    deleteButton.type = "button";
    deleteButton.textContent = "Supprimer";
    deleteButton.setAttribute("aria-label", `Supprimer la tâche "${task.title}"`);

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

function getToggleLabel(task) {
  if (task.completed) {
    return `Marquer la tâche "${task.title}" comme non terminée`;
  }

  return `Marquer la tâche "${task.title}" comme terminée`;
}

function isValidTask(task) {
  return (
    task &&
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.completed === "boolean"
  );
}
