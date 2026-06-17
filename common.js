// Loads saved tasks from local storage and returns only valid unique tasks.
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

// Saves the current in-memory tasks and updates the storage error state.
function saveTasks() {
  const saved = saveTasksToStorage(tasks);
  storageError.classList.toggle("hidden", saved);
}

// Saves the task list to local storage and reports whether it succeeded.
function saveTasksToStorage(tasksToSave) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
    return true;
  } catch {
    return false;
  }
}

// Removes the saved task list from local storage.
function clearSavedTasks() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // L'application reste utilisable même si le stockage local est indisponible.
  }
}

// Saves the current tasks and refreshes the displayed list.
function saveAndRender() {
  saveTasks();
  renderTasks();
}

// Creates a unique identifier for a new task.
function createTaskId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Toggles the completion state of the matching task.
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

// Deletes the task matching the given identifier.
function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveAndRender();
}

// Renders the currently visible tasks in the task list.
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

// Returns the tasks that match the active filter.
function getVisibleTasks() {
  if (currentFilter === "active") {
    return tasks.filter((task) => !task.completed);
  }

  if (currentFilter === "completed") {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

// Checks whether a filter value is supported.
function isValidFilter(filter) {
  return filter === "all" || filter === "active" || filter === "completed";
}

// Updates filter button states to match the active filter.
function updateFilterButtons() {
  filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === currentFilter));
  });
}

// Updates the empty-state message for the current task view.
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

// Updates the task counter text for the current view.
function updateTaskCount(count) {
  const label = count > 1 ? "tâches" : "tâche";
  const filterLabel = getTaskCountFilterLabel(count);
  taskCount.textContent = `${count} ${label}${filterLabel}`;
}

// Returns the filter-specific suffix for the task counter.
function getTaskCountFilterLabel(count) {
  if (currentFilter === "active") {
    return count > 1 ? " actives" : " active";
  }

  if (currentFilter === "completed") {
    return count > 1 ? " terminées" : " terminée";
  }

  return "";
}

// Builds the accessible label for a task toggle control.
function getToggleLabel(task) {
  if (task.completed) {
    return `Marquer la tâche "${task.title}" comme non terminée`;
  }

  return `Marquer la tâche "${task.title}" comme terminée`;
}

// Checks whether a task has the expected data shape.
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

// Removes tasks with duplicate identifiers from a task list.
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
