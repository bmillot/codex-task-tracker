const STORAGE_KEY = "task-tracker-tasks";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const emptyMessage = document.querySelector("#empty-message");
const taskCount = document.querySelector("#task-count");
const filterButtons = document.querySelectorAll(".filter-button");
const storageError = document.querySelector("#storage-error");
const deleteAllButton = document.querySelector("#delete-all-button");

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

deleteAllButton.addEventListener("click", deleteAllTasks);

renderTasks();
