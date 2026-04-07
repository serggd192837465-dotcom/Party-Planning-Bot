export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden px-6 py-12 md:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.23),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.2),transparent_35%),linear-gradient(to_bottom,rgba(15,23,42,0.8),rgba(2,6,23,1))]" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">PartyPlan Coursework</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-white md:text-6xl">
            Курсовой проект: бот для планирования вечеринок
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            Ниже встроена рабочая веб-версия проекта. Telegram-бот тоже добавлен в папку
            <code className="mx-1 rounded bg-slate-800 px-1 py-0.5 text-cyan-300">telegram-bot</code>
            и запускается отдельной командой в Node.js.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <a
              href="/coursework/index.html"
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              Открыть в новой вкладке
            </a>
            <a
              href="/coursework/js/main.js"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-400 hover:text-white"
            >
              Посмотреть main.js
            </a>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Запуск бота: задай TELEGRAM_BOT_TOKEN и выполни <code>node telegram-bot/main.js</code>.
          </p>
        </div>
      </section>

      <section className="px-6 pb-8 md:px-10">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <iframe
            title="coursework-preview"
            src="/coursework/index.html"
            className="h-[78vh] w-full bg-white"
          />
        </div>
      </section>
    </main>
  );
}
