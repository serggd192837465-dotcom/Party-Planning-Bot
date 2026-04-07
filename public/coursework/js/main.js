import { addItem } from "./modules/addItem.js";
import { deleteItem } from "./modules/deleteItem.js";
import { editItem } from "./modules/editItem.js";
import { sortItems } from "./modules/sortItems.js";
import { reset } from "./modules/reset.js";

const STORAGE_KEY = "party-planner-coursework";

const initialState = {
  guests: [],
  preferences: [],
  budget: {
    limit: 0,
    expenses: [],
  },
  tasks: [],
};

let state = loadState();

const guestForm = document.getElementById("guest-form");
const guestName = document.getElementById("guest-name");
const guestEmail = document.getElementById("guest-email");
const guestStatus = document.getElementById("guest-status");
const guestTable = document.getElementById("guest-table");

const prefForm = document.getElementById("pref-form");
const prefGuest = document.getElementById("pref-guest");
const prefMusic = document.getElementById("pref-music");
const prefFood = document.getElementById("pref-food");
const prefTheme = document.getElementById("pref-theme");
const prefSummary = document.getElementById("pref-summary");

const budgetLimitForm = document.getElementById("budget-limit-form");
const budgetLimitInput = document.getElementById("budget-limit");
const expenseForm = document.getElementById("expense-form");
const expenseCategory = document.getElementById("expense-category");
const expenseAmount = document.getElementById("expense-amount");
const expenseDate = document.getElementById("expense-date");
const expenseTable = document.getElementById("expense-table");
const budgetStats = document.getElementById("budget-stats");

const taskForm = document.getElementById("task-form");
const taskTitle = document.getElementById("task-title");
const taskDeadline = document.getElementById("task-deadline");
const taskStatus = document.getElementById("task-status");
const taskFilter = document.getElementById("task-filter");
const sortTasksBtn = document.getElementById("sort-tasks-btn");
const resetTasksBtn = document.getElementById("reset-tasks-btn");
const taskTable = document.getElementById("task-table");

guestForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = guestName.value.trim();
  const email = guestEmail.value.trim();

  if (!name || !isValidEmail(email)) {
    alert("Проверьте имя и email гостя");
    return;
  }

  state.guests = addItem(state.guests, {
    id: Date.now().toString(),
    name,
    email,
    status: guestStatus.value,
  });

  guestForm.reset();
  saveAndRender();
});

prefForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const music = splitTags(prefMusic.value);
  const food = splitTags(prefFood.value);

  state.preferences = addItem(state.preferences, {
    id: Date.now().toString(),
    guest: prefGuest.value.trim(),
    music,
    food,
    theme: prefTheme.value.trim(),
  });

  prefForm.reset();
  saveAndRender();
});

budgetLimitForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const limit = Number(budgetLimitInput.value);
  if (limit < 0 || Number.isNaN(limit)) {
    alert("Лимит должен быть не меньше 0");
    return;
  }

  state.budget.limit = limit;
  saveAndRender();
});

expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number(expenseAmount.value);
  if (!expenseCategory.value.trim() || amount <= 0 || !expenseDate.value) {
    alert("Введите корректные данные расхода");
    return;
  }

  state.budget.expenses = addItem(state.budget.expenses, {
    id: Date.now().toString(),
    category: expenseCategory.value.trim(),
    amount,
    date: expenseDate.value,
  });

  expenseForm.reset();
  saveAndRender();
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!taskTitle.value.trim() || !taskDeadline.value) {
    alert("Введите задачу и дедлайн");
    return;
  }

  state.tasks = addItem(state.tasks, {
    id: Date.now().toString(),
    title: taskTitle.value.trim(),
    deadline: taskDeadline.value,
    status: taskStatus.value,
  });

  taskForm.reset();
  saveAndRender();
});

taskFilter.addEventListener("change", renderTasks);

sortTasksBtn.addEventListener("click", () => {
  state.tasks = sortItems(state.tasks, "deadline");
  saveAndRender();
});

resetTasksBtn.addEventListener("click", () => {
  state.tasks = reset();
  saveAndRender();
});

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return initialState;

  try {
    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      ...parsed,
      budget: {
        ...initialState.budget,
        ...(parsed.budget || {}),
      },
    };
  } catch (error) {
    return initialState;
  }
}

function renderAll() {
  renderGuests();
  renderPreferences();
  renderBudget();
  renderTasks();
}

function renderGuests() {
  guestTable.innerHTML = "";

  state.guests.forEach((guest) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${guest.name}</td>
      <td>${guest.email}</td>
      <td>${guest.status}</td>
      <td><button data-id="${guest.id}" data-type="delete-guest">Удалить</button></td>
    `;
    guestTable.appendChild(row);
  });
}

function renderPreferences() {
  const topMusic = getTopValues(state.preferences.flatMap((item) => item.music));
  const topFood = getTopValues(state.preferences.flatMap((item) => item.food));
  const topThemes = getTopValues(state.preferences.map((item) => item.theme));

  prefSummary.textContent = [
    `Всего анкет: ${state.preferences.length}`,
    `Топ музыка: ${topMusic.join(", ") || "-"}`,
    `Топ еда: ${topFood.join(", ") || "-"}`,
    `Топ тематика: ${topThemes.join(", ") || "-"}`,
  ].join("\n");
}

function renderBudget() {
  expenseTable.innerHTML = "";
  let total = 0;

  state.budget.expenses.forEach((expense) => {
    total += expense.amount;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${expense.category}</td>
      <td>${expense.amount.toFixed(2)}</td>
      <td>${expense.date}</td>
      <td><button data-id="${expense.id}" data-type="delete-expense">Удалить</button></td>
    `;
    expenseTable.appendChild(row);
  });

  const remain = state.budget.limit - total;
  budgetStats.innerHTML = `Лимит: ${state.budget.limit.toFixed(2)} | Расходы: ${total.toFixed(
    2
  )} | Остаток: <span class="${remain < 0 ? "danger" : ""}">${remain.toFixed(2)}</span>`;
}

function renderTasks() {
  taskTable.innerHTML = "";

  const filtered = applyTaskFilter(state.tasks, taskFilter.value);

  filtered.forEach((task) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${task.title}</td>
      <td>${task.deadline}</td>
      <td>
        <select data-id="${task.id}" data-type="task-status">
          <option value="в работе" ${task.status === "в работе" ? "selected" : ""}>в работе</option>
          <option value="готово" ${task.status === "готово" ? "selected" : ""}>готово</option>
        </select>
      </td>
      <td>
        <button data-id="${task.id}" data-type="task-edit">Редактировать</button>
        <button data-id="${task.id}" data-type="task-delete">Удалить</button>
      </td>
    `;
    taskTable.appendChild(row);
  });
}

document.body.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const id = target.dataset.id;
  const type = target.dataset.type;

  if (!id || !type) return;

  if (type === "delete-guest") {
    state.guests = deleteItem(state.guests, id);
  }

  if (type === "delete-expense") {
    state.budget.expenses = deleteItem(state.budget.expenses, id);
  }

  if (type === "task-delete") {
    state.tasks = deleteItem(state.tasks, id);
  }

  if (type === "task-edit") {
    const newTitle = prompt("Новое название задачи:");
    if (newTitle && newTitle.trim()) {
      state.tasks = editItem(state.tasks, id, { title: newTitle.trim() });
    }
  }

  saveAndRender();
});

document.body.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) return;

  const id = target.dataset.id;
  const type = target.dataset.type;

  if (type === "task-status" && id) {
    state.tasks = editItem(state.tasks, id, { status: target.value });
    saveAndRender();
  }
});

function splitTags(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getTopValues(list) {
  const map = {};

  list.forEach((item) => {
    map[item] = (map[item] || 0) + 1;
  });

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((item) => item[0]);
}

function applyTaskFilter(tasks, filterType) {
  if (filterType === "done") {
    return tasks.filter((task) => task.status === "готово");
  }

  if (filterType === "today") {
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter((task) => task.deadline === today);
  }

  if (filterType === "3days") {
    const now = new Date();
    const inThreeDays = new Date();
    inThreeDays.setDate(now.getDate() + 3);

    return tasks.filter((task) => {
      const deadline = new Date(task.deadline);
      return deadline >= now && deadline <= inThreeDays;
    });
  }

  return tasks;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

renderAll();