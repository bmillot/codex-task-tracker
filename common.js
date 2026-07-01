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
    const normalizedTasks = uniqueTasks.map(normalizeTaskDates);
    if (
      normalizedTasks.length !== parsedTasks.length ||
      JSON.stringify(normalizedTasks) !== JSON.stringify(uniqueTasks)
    ) {
      saveTasksToStorage(normalizedTasks);
    }

    return normalizedTasks;
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

// Creates a timestamp that can be safely saved in local storage.
function createTaskTimestamp() {
  return new Date().toISOString();
}

// Toggles the completion state of the matching task.
function toggleTask(taskId) {
  tasks = tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    const completed = !task.completed;

    return {
      ...task,
      completed,
      completedAt: completed ? createTaskTimestamp() : null,
    };
  });

  saveAndRender();
}

// Deletes the task matching the given identifier.
function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveAndRender();
}

// Opens the confirmation dialog before deleting all tasks.
function openDeleteAllDialog() {
  if (tasks.length === 0) {
    return;
  }

  deleteAllDialog.showModal();
}

// Closes the bulk delete confirmation dialog.
function closeDeleteAllDialog() {
  deleteAllDialog.close();
}

// Deletes all tasks after user confirmation.
function confirmDeleteAllTasks() {
  tasks = [];
  closeDeleteAllDialog();
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

    const taskMain = document.createElement("div");
    taskMain.className = "task-main";

    const title = document.createElement("label");
    title.className = "task-title";
    title.htmlFor = checkboxId;
    title.textContent = task.title;

    const dates = document.createElement("span");
    dates.className = "task-dates";

    const createdDate = document.createElement("span");
    createdDate.textContent = `créée le ${formatTaskDate(task.createdAt)}`;
    dates.append(createdDate);

    if (task.completedAt) {
      const completedDate = document.createElement("span");
      completedDate.textContent = `terminée le ${formatTaskDate(task.completedAt)}`;
      dates.append(completedDate);
    }

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-task";
    deleteButton.type = "button";
    deleteButton.textContent = "Supprimer";
    deleteButton.setAttribute("aria-label", `Supprimer la tâche "${task.title}"`);

    taskMain.append(title, dates);
    item.append(checkbox, taskMain, deleteButton);
    list.append(item);
  });

  updateFilterButtons();
  updateEmptyState(visibleTasks.length);
  updateTaskCount(visibleTasks.length);
  updateDeleteAllButton();
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

// Disables the bulk delete button when there are no tasks.
function updateDeleteAllButton() {
  deleteAllButton.disabled = tasks.length === 0;
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

// Formats a saved timestamp for French task metadata.
function formatTaskDate(timestamp) {
  return new Intl.DateTimeFormat("fr-FR").format(new Date(timestamp));
}

// Checks whether a task has the expected data shape.
function isValidTask(task) {
  return (
    task &&
    typeof task.id === "string" &&
    task.id.trim() !== "" &&
    typeof task.title === "string" &&
    task.title.trim() !== "" &&
    typeof task.completed === "boolean" &&
    (task.createdAt === undefined || isValidOptionalDate(task.createdAt)) &&
    (
      task.completedAt === undefined ||
      task.completedAt === null ||
      isValidOptionalDate(task.completedAt)
    )
  );
}

// Adds missing date fields to tasks saved before date management existed.
function normalizeTaskDates(task) {
  const createdAt = task.createdAt || createTaskTimestamp();

  return {
    ...task,
    createdAt,
    completedAt: task.completed ? task.completedAt || createdAt : null,
  };
}

// Checks whether an optional saved date can be rendered.
function isValidOptionalDate(date) {
  return typeof date === "string" && date.trim() !== "" && !Number.isNaN(Date.parse(date));
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
