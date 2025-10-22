const termkit = require("terminal-kit");
const term = termkit.terminal;

const MIN_COLS = 162;
const MIN_ROWS = 48;

function createMainLayout(document) {
  return new termkit.Layout({
    parent: document,
    x: 0,
    y: 0,
    width: () => term.width,
    height: () => term.height,
    layout: {
      direction: "vertical",
      children: [
        {
          id: "header",
          height: 3,
          children: [
            { id: "header-top", height: 1 },
            { id: "header-main", height: 1 },
            { id: "header-bottom", height: 1 },
          ],
        },
        {
          direction: "horizontal",
          height: () => term.height - 7,
          children: [
            { id: "leftbar", width: 54 },
            {
              id: "main-content",
              width: () => term.width - 54 - 54,
              direction: "vertical",
              children: [
                {
                  id: "content",
                  height: () => Math.floor((term.height - 7 - 1) * 1.0),
                  direction: "vertical",
                  children: [
                    {
                      id: "logs",
                      height: () => Math.floor((term.height - 7 - 1) * 0.65),
                    },
                    {
                      id: "news",
                      height: () => Math.floor((term.height - 7 - 1) * 0.35),
                    },
                  ],
                },
                { id: "statusbar", height: 1 },
              ],
            },
            { id: "rightbar", width: 54 },
          ],
        },
        {
          id: "footer",
          height: 3,
          children: [
            { id: "footer-top", height: 1 },
            { id: "footer-main", height: 1 },
            { id: "footer-bottom", height: 1 },
          ],
        },
      ],
    },
  });
}

function layoutApp() {
  term.fullscreen(true);
  term.clear();
  term.grabInput({ mouse: "button" });

  const document = term.createDocument();
  let layout = createMainLayout(document);

  // Игнорируем мышиные события (если не хочешь их обрабатывать)
  term.on("mouse", () => {});

  // Корректный безопасный выход
  let exited = false;
  function cleanExit() {
    if (exited) return;
    exited = true;

    // ВАЖНО! В этой последовательности:
    try {
      term.grabInput(false);
    } catch (e) {}
    try {
      term.hideCursor(false);
    } catch (e) {}
    try {
      term.styleReset();
    } catch (e) {}
    try {
      if (layout) layout.destroy();
    } catch (e) {}
    try {
      if (document) document.destroy();
    } catch (e) {}

    // ГАРАНТИЯ: term.processExit(0) полностью сбрасывает состояние
    try {
      term.processExit(0);
    } catch (e) {
      process.exit(0);
    }
  }

  // Перерисовка при ресайзе
  term.on("resize", () => {
    if (term.width < MIN_COLS || term.height < MIN_ROWS) {
      term.clear();
      term.red.bold(
        `\n[!] Минимальный размер терминала: ${MIN_COLS}x${MIN_ROWS}\n`
      );
      term.white("Увеличьте окно для отображения интерфейса.\n");
      return;
    }
    layout.destroy();
    layout = createMainLayout(document);
    document.draw();
  });

  if (term.width < MIN_COLS || term.height < MIN_ROWS) {
    term.clear();
    term.red.bold(
      `\n[!] Минимальный размер терминала: ${MIN_COLS}x${MIN_ROWS}\n`
    );
    term.white("Увеличьте окно для отображения интерфейса.\n");
    return;
  }

  document.draw();

  term.on("key", (key) => {
    if (key === "CTRL_C") cleanExit();
  });
  process.on("SIGINT", cleanExit);
  process.on("SIGTERM", cleanExit);
  process.on("exit", cleanExit);
}

module.exports = { layoutApp };
