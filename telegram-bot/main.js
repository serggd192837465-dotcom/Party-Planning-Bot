import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import TelegramBot from "node-telegram-bot-api";
import { addItem } from "./modules/addItem.js";
import { deletItem } from "./modules/deletItem.js";
import { editItem } from "./modules/editItem.js";
import { sortItems } from "./modules/sortItems.js";
import { reset } from "./modules/reset.js";

const BOT_TOKEN = "8503373295:AAGx1ROxDXFSVt4AZJmC6gZmbPCEvDXod5o";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, "data", "store.json");

const initialState = {
  guests: [],
  preferences: [],
  budget: { limit: 0, expenses: [] },
  tasks: [],
};

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

await ensureDataFile();

bot.onText(/^\/start$/, (msg) => {
  bot.sendMessage(msg.chat.id, "Привет. Я бот для курсовой. Напиши /help");
});

bot.onText(/^\/help$/, (msg) => {
  bot.sendMessage(msg.chat.id, HELP_TEXT);
});

bot.onText(/^\/guest_add (.+)$/i, async (msg, match) => {
  const parts = splitBySemicolon(match[1], 3);
  if (!parts) return bot.sendMessage(msg.chat.id, "Формат: /guest_add Имя;email;статус");

  const [name, email, status] = parts;
  if (!name || !isValidEmail(email)) {
    return bot.sendMessage(msg.chat.id, "Ошибка. Неверный email или имя.");
  }

  const state = await loadState();
  state.guests = addItem(state.guests, {
    id: createId(),
    name,
    email,
    status: status || "отправлено",
  });
  await saveState(state);
  bot.sendMessage(msg.chat.id, "Гость добавлен.");
});

bot.onText(/^\/guest_list$/, async (msg) => {
  const state = await loadState();
  if (state.guests.length === 0) return bot.sendMessage(msg.chat.id, "Гостей пока нет.");

  const text = state.guests
    .map((item, index) => `${index + 1}. ${item.name} | ${item.email} | ${item.status} | ${item.id}`)
    .join("\n");
  bot.sendMessage(msg.chat.id, text);
});

bot.onText(/^\/guest_del (.+)$/i, async (msg, match) => {
  const id = match[1].trim();
  const state = await loadState();
  const nextGuests = deletItem(state.guests, id);

  if (nextGuests.length === state.guests.length) {
    return bot.sendMessage(msg.chat.id, "id не найден.");
  }

  state.guests = nextGuests;
  await saveState(state);
  bot.sendMessage(msg.chat.id, "Гость удален.");
});

bot.onText(/^\/pref_add (.+)$/i, async (msg, match) => {
  const parts = splitBySemicolon(match[1], 4);
  if (!parts) return bot.sendMessage(msg.chat.id, "Формат: /pref_add Имя;pop,rock;pizza,sushi;retro");

  const [guestName, musicRaw, foodRaw, theme] = parts;
  const state = await loadState();
  state.preferences = addItem(state.preferences, {
    id: createId(),
    guestName,
    music: splitByComma(musicRaw),
    food: splitByComma(foodRaw),
    theme,
  });
  await saveState(state);
  bot.sendMessage(msg.chat.id, "Предпочтения сохранены.");
});

bot.onText(/^\/pref_top$/, async (msg) => {
  const state = await loadState();
  if (state.preferences.length === 0) return bot.sendMessage(msg.chat.id, "Пока нет анкет.");

  const topMusic = getTop3(state.preferences.flatMap((x) => x.music));
  const topFood = getTop3(state.preferences.flatMap((x) => x.food));
  const topTheme = getTop3(state.preferences.map((x) => x.theme));

  bot.sendMessage(
    msg.chat.id,
    [
      `Анкет: ${state.preferences.length}`,
      `Музыка: ${topMusic.join(", ") || "-"}`,
      `Еда: ${topFood.join(", ") || "-"}`,
      `Тема: ${topTheme.join(", ") || "-"}`,
    ].join("\n")
  );
});

bot.onText(/^\/budget_set (.+)$/i, async (msg, match) => {
  const limit = Number(match[1].trim());
  if (Number.isNaN(limit) || limit < 0) return bot.sendMessage(msg.chat.id, "Формат: /budget_set 50000");

  const state = await loadState();
  state.budget.limit = limit;
  await saveState(state);
  bot.sendMessage(msg.chat.id, `Лимит установлен: ${limit}`);
});

bot.onText(/^\/expense_add (.+)$/i, async (msg, match) => {
  const parts = splitBySemicolon(match[1], 3);
  if (!parts) return bot.sendMessage(msg.chat.id, "Формат: /expense_add Категория;2500;2026-05-18");

  const [category, amountRaw, date] = parts;
  const amount = Number(amountRaw);
  if (!category || Number.isNaN(amount) || amount <= 0 || !isValidDate(date)) {
    return bot.sendMessage(msg.chat.id, "Ошибка в данных.");
  }

  const state = await loadState();
  state.budget.expenses = addItem(state.budget.expenses, {
    id: createId(),
    category,
    amount,
    date,
  });
  await saveState(state);
  bot.sendMessage(msg.chat.id, "Расход добавлен.");
});

bot.onText(/^\/budget$/, async (msg) => {
  const state = await loadState();
  const total = state.budget.expenses.reduce((sum, item) => sum + item.amount, 0);
  const left = state.budget.limit - total;
  const warning = left < 0 ? "\nВнимание: лимит превышен" : "";

  bot.sendMessage(msg.chat.id, `Лимит: ${state.budget.limit}\nПотрачено: ${total}\nОстаток: ${left}${warning}`);
});

bot.onText(/^\/task_add (.+)$/i, async (msg, match) => {
  const parts = splitBySemicolon(match[1], 3);
  if (!parts) return bot.sendMessage(msg.chat.id, "Формат: /task_add Название;2026-05-20;в работе");

  const [title, deadline, status] = parts;
  if (!title || !isValidDate(deadline)) return bot.sendMessage(msg.chat.id, "Ошибка в названии или дате.");

  const state = await loadState();
  state.tasks = addItem(state.tasks, {
    id: createId(),
    title,
    deadline,
    status: status || "в работе",
  });
  await saveState(state);
  bot.sendMessage(msg.chat.id, "Задача добавлена.");
});

bot.onText(/^\/task_list(?:\s+(.+))?$/i, async (msg, match) => {
  const mode = (match[1] || "all").trim().toLowerCase();
  const state = await loadState();
  const tasks = filterTasks(state.tasks, mode);

  if (tasks.length === 0) return bot.sendMessage(msg.chat.id, "Задач нет.");

  const text = tasks
    .map((item, index) => `${index + 1}. ${item.title} | ${item.deadline} | ${item.status} | ${item.id}`)
    .join("\n");
  bot.sendMessage(msg.chat.id, text);
});

bot.onText(/^\/task_edit (.+)$/i, async (msg, match) => {
  const parts = splitBySemicolon(match[1], 4);
  if (!parts) return bot.sendMessage(msg.chat.id, "Формат: /task_edit id;Название;2026-05-20;готово");

  const [id, title, deadline, status] = parts;
  if (!id || !title || !isValidDate(deadline)) return bot.sendMessage(msg.chat.id, "Ошибка в данных.");

  const state = await loadState();
  state.tasks = editItem(state.tasks, id, { title, deadline, status });
  await saveState(state);
  bot.sendMessage(msg.chat.id, "Задача изменена.");
});

bot.onText(/^\/task_done (.+)$/i, async (msg, match) => {
  const id = match[1].trim();
  const state = await loadState();
  state.tasks = editItem(state.tasks, id, { status: "готово" });
  await saveState(state);
  bot.sendMessage(msg.chat.id, "Статус: готово.");
});

bot.onText(/^\/task_del (.+)$/i, async (msg, match) => {
  const id = match[1].trim();
  const state = await loadState();
  const nextTasks = deletItem(state.tasks, id);

  if (nextTasks.length === state.tasks.length) return bot.sendMessage(msg.chat.id, "id не найден.");

  state.tasks = nextTasks;
  await saveState(state);
  bot.sendMessage(msg.chat.id, "Задача удалена.");
});

bot.onText(/^\/task_sort$/, async (msg) => {
  const state = await loadState();
  state.tasks = sortItems(state.tasks, "deadline");
  await saveState(state);
  bot.sendMessage(msg.chat.id, "Сортировка выполнена.");
});

bot.onText(/^\/task_reset$/, async (msg) => {
  const state = await loadState();
  state.tasks = reset();
  await saveState(state);
  bot.sendMessage(msg.chat.id, "Список задач очищен.");
});

bot.on("polling_error", (err) => {
  console.log("Ошибка polling:", err.message);
});

console.log("Bot started");

async function ensureDataFile() {
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(initialState, null, 2), "utf-8");
  }
}

async function loadState() {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  const parsed = JSON.parse(raw);

  return {
    ...initialState,
    ...parsed,
    budget: {
      ...initialState.budget,
      ...(parsed.budget || {}),
    },
  };
}

async function saveState(state) {
  await fs.writeFile(DATA_PATH, JSON.stringify(state, null, 2), "utf-8");
}

function splitBySemicolon(value, minParts) {
  const parts = value.split(";").map((x) => x.trim());
  if (parts.length < minParts) return null;
  return parts;
}

function splitByComma(value) {
  return value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function getTop3(list) {
  const map = {};
  list.forEach((item) => {
    const key = String(item || "").trim();
    if (!key) return;
    map[key] = (map[key] || 0) + 1;
  });

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0]);
}

function filterTasks(tasks, mode) {
  const today = new Date();
  const todayStr = formatDate(today);
  const plus3 = new Date(today);
  plus3.setDate(plus3.getDate() + 3);

  if (mode === "today") return tasks.filter((task) => task.deadline === todayStr);
  if (mode === "done") return tasks.filter((task) => task.status.toLowerCase() === "готово");
  if (mode === "3days") {
    return tasks.filter((task) => {
      const date = new Date(task.deadline);
      return date >= new Date(todayStr) && date <= plus3;
    });
  }

  return tasks;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function createId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

const HELP_TEXT = [
  "Команды:",
  "/guest_add Имя;email;статус",
  "/guest_list",
  "/guest_del id",
  "/pref_add Имя;pop,rock;pizza,sushi;retro",
  "/pref_top",
  "/budget_set 50000",
  "/expense_add Еда;2500;2026-05-18",
  "/budget",
  "/task_add Название;2026-05-20;в работе",
  "/task_list all",
  "/task_list today",
  "/task_list 3days",
  "/task_list done",
  "/task_edit id;Название;2026-05-20;готово",
  "/task_done id",
  "/task_del id",
  "/task_sort",
  "/task_reset",
].join("\n");