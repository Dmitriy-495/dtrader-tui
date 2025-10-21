/**
 * src/index.js
 * Главный файл приложения. Инициализирует все модули.
 */
// Модули Ядра (Core)
const WsClient = require("./wsClient");
const EventBus = require("./EventBus");

// Модули Представления (UI)
const UILog = require("./ui/uiLog");

// Инициализируем UI модуль (он сразу подписывается на события)
UILog.init();

// Инициализируем и запускаем Core модуль (он начинает подключение)
WsClient.connect();

// Чистое завершение работы по Ctrl+C
process.on("SIGINT", () => {
  EventBus.publish("ws:log", {
    level: "info",
    category: "core",
    message: "Получен сигнал SIGINT. Завершение работы клиента.",
  });
  process.exit(0);
});
