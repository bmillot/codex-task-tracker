const STORAGE_KEY = "task-tracker-tasks";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const emptyMessage = document.querySelector("#empty-message");
const taskCount = document.querySelector("#task-count");
const filterButtons = document.querySelectorAll(".filter-button");
const storageError = document.querySelector("#storage-error");

let currentFilter = "all";
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

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextFilter = button.dataset.filter;
    if (!isValidFilter(nextFilter)) {
      return;
    }

    currentFilter = nextFilter;
    renderTasks();
  });
});

renderTasks();

function loadTasks() {
  let savedTasks;

  try {
    savedTasks = localStorage.getItem(STORAGE_KEY);
  } catch {
    storageError.classList.remove("hidden");
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
    const uniqueTasks = removeDuplicateTaskIds(validTasks);
    if (uniqueTasks.length !== parsedTasks.length) {
      saveTasksToStorage(uniqueTasks);
    }

    return uniqueTasks;
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

  const visibleTasks = getVisibleTasks();

  visibleTasks.forEach((task) => {
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

  updateFilterButtons();
  updateEmptyState(visibleTasks.length);
  updateTaskCount(visibleTasks.length);
}

function getVisibleTasks() {
  if (currentFilter === "active") {
    return tasks.filter((task) => !task.completed);
  }

  if (currentFilter === "completed") {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

function isValidFilter(filter) {
  return filter === "all" || filter === "active" || filter === "completed";
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === currentFilter));
  });
}

function updateEmptyState(visibleTaskCount) {
  emptyMessage.classList.toggle("hidden", visibleTaskCount > 0);

  if (tasks.length === 0) {
    emptyMessage.textContent = "Aucune tâche pour le moment.";
    return;
  }

  if (currentFilter === "active") {
    emptyMessage.textContent = "Aucune tâche active.";
    return;
  }

  if (currentFilter === "completed") {
    emptyMessage.textContent = "Aucune tâche terminée.";
    return;
  }

  emptyMessage.textContent = "Aucune tâche pour ce filtre.";
}

function updateTaskCount(count) {
  const label = count > 1 ? "tâches" : "tâche";
  const filterLabel = getTaskCountFilterLabel(count);
  taskCount.textContent = `${count} ${label}${filterLabel}`;
}

function getTaskCountFilterLabel(count) {
  if (currentFilter === "active") {
    return count > 1 ? " actives" : " active";
  }

  if (currentFilter === "completed") {
    return count > 1 ? " terminées" : " terminée";
  }

  return "";
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
    task.id.trim() !== "" &&
    typeof task.title === "string" &&
    task.title.trim() !== "" &&
    typeof task.completed === "boolean"
  );
}

function removeDuplicateTaskIds(tasksToCheck) {
  const seenIds = new Set();

  return tasksToCheck.filter((task) => {
    if (seenIds.has(task.id)) {
      return false;
    }

    seenIds.add(task.id);
    return true;
  });
}
