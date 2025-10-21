/**
 * uiLog.js
 * Модуль Представления (UI). Отвечает за вывод информации в консоль/TUI.
 * Подписывается на события от Ядра через EventBus.
 */
const EventBus = require("../EventBus");

class UILog {
  constructor() {
    this.startTime = Date.now();
    this.printHeader();
    this.setupBusListeners();
  }

  printHeader() {
    console.log("------------------------------------------");
    console.log("--- dtraderui TUI Client (UI Log Module) ---");
    console.log(
      `--- Запуск: ${new Date(this.startTime).toLocaleTimeString()} ---`
    );
    console.log("------------------------------------------");
  }

  /**
   * Подписывается на необходимые события от ядра.
   */
  setupBusListeners() {
    // События жизненного цикла WS
    EventBus.subscribe("ws:open", this.onConnectionOpen.bind(this));
    EventBus.subscribe("ws:close", this.onConnectionClose.bind(this));

    // Внутренние логи и ошибки Ядра
    EventBus.subscribe("ws:log", this.onCustomLog.bind(this));
    EventBus.subscribe("ws:warning", this.onCustomWarning.bind(this));
    EventBus.subscribe("ws:error", this.onCustomError.bind(this));

    // Входящие сообщения от сервера (разбираем по типу)
    EventBus.subscribe("ws:message", this.onServerMessage.bind(this));
  }

  // --- Обработчики событий ---

  onConnectionOpen() {
    console.log("\n[WS] ✅ СОЕДИНЕНИЕ УСТАНОВЛЕНО. Клиент готов к работе.");
  }

  onConnectionClose({ code, reason }) {
    console.log(
      `\n[WS] 🛑 СОЕДИНЕНИЕ ЗАКРЫТО. Код: ${code}, Причина: ${reason}`
    );
  }

  onCustomLog({ message, category }) {
    if (category !== "debug") {
      // Фильтруем debug логи ядра
      console.log(`[CORE:${category.toUpperCase()}] ${message}`);
    }
  }

  onCustomWarning({ message }) {
    console.warn(`[CORE:WARNING] ⚠️ ${message}`);
  }

  onCustomError({ message }) {
    console.error(`[CORE:ERROR] ❌ ${message}`);
  }

  onServerMessage(message) {
    const time = new Date(message.timestamp || Date.now()).toLocaleTimeString();

    switch (message.type) {
      case "connect":
        console.log(
          `[SERVER:CONNECT] 🤝 ${time} | Приветствие получено. Client ID: ${message.clientId}`
        );
        break;

      case "subscribed":
        console.log(
          `[SERVER:SUBS] ✅ ${time} | Подписка успешна на каналы: ${message.channels.join(
            ", "
          )}`
        );
        break;

      case "log":
        // Сообщение из каналов 'system' или 'logs'
        const { level, message: logMessage, source, category } = message;
        console.log(
          `[LOG:${category.toUpperCase()}] ${time} | [${level.toUpperCase()}] ${logMessage} (Source: ${source})`
        );
        break;

      case "disconnect":
        console.warn(
          `[SERVER:DISC] 🛑 ${time} | Сервер отключил нас. Причина: ${message.reason}`
        );
        break;

      case "pong":
        // Игнорируем служебный pong
        break;

      default:
        console.log(
          `[SERVER:RECV] 📩 ${time} | Неизвестное сообщение типа "${message.type}"`
        );
        break;
    }
  }
}

module.exports = {
  init: () => new UILog(),
};
