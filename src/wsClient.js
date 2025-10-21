/**
 * wsClient.js
 * Модуль Ядра. Отвечает за WebSocket-соединение.
 * Вся коммуникация с UI идет через EventBus.
 */
require("dotenv").config();
const WebSocket = require("ws");
const EventBus = require("./EventBus");

const WSS_URL = process.env.WSS_URL;

class WsClient {
  constructor(url) {
    if (!url) {
      EventBus.publish("ws:error", {
        message: "Критическая ошибка: WSS_URL не определен в .env",
      });
      return;
    }
    this.url = url;
    this.ws = null;
    this.isReady = false;

    // Подписываемся на команды, которые нужно отправить на сервер (например, от UI-модулей)
    this.setupBusListeners();
  }

  setupBusListeners() {
    // Команда: Отправить сообщение серверу (например, подписаться/отписаться)
    EventBus.subscribe("ws:command:send", this.sendCommand.bind(this));
  }

  /**
   * Отправляет сообщение на WebSocket сервер.
   */
  sendCommand(messageObject) {
    if (this.ws && this.isReady) {
      try {
        this.ws.send(JSON.stringify(messageObject));
        EventBus.publish("ws:log", {
          level: "debug",
          category: "core",
          message: `Отправлен запрос: ${messageObject.type}`,
        });
      } catch (error) {
        EventBus.publish("ws:error", {
          message: `Ошибка при отправке: ${error.message}`,
        });
      }
    } else {
      EventBus.publish("ws:warning", {
        message: `Команда не отправлена. Соединение не готово.`,
      });
    }
  }

  /**
   * Инициирует подключение.
   */
  connect() {
    EventBus.publish("ws:log", {
      level: "info",
      category: "core",
      message: `Попытка подключения к: ${this.url}`,
    });

    this.ws = new WebSocket(this.url);

    // Назначаем обработчики событий WS и публикуем их в шину
    this.ws.on("open", this.onOpen.bind(this));
    this.ws.on("message", this.onMessage.bind(this));
    this.ws.on("close", this.onClose.bind(this));
    this.ws.on("error", this.onError.bind(this));
  }

  onOpen() {
    this.isReady = true;
    EventBus.publish("ws:open"); // Уведомляем UI о готовности

    // 🎯 Требование: Подписаться на канал 'logs'
    const subscribeMessage = {
      type: "subscribe",
      channels: ["logs"],
      timestamp: Date.now(),
    };
    this.sendCommand(subscribeMessage);
  }

  onMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      // Публикуем все сообщения, чтобы другие модули могли их обработать
      EventBus.publish("ws:message", message);

      // Дополнительная публикация для конкретных типов (логи)
      if (message.type === "log") {
        EventBus.publish("data:log:incoming", message);
      }
    } catch (error) {
      EventBus.publish("ws:error", {
        message: `Ошибка парсинга JSON: ${data.toString().substring(0, 50)}...`,
      });
    }
  }

  onClose(code, reason) {
    this.isReady = false;
    EventBus.publish("ws:close", { code, reason: reason.toString() });
  }

  onError(err) {
    this.isReady = false;
    EventBus.publish("ws:error", {
      message: `Критическая ошибка: ${err.message}`,
    });
  }
}

module.exports = {
  connect: () => new WsClient(WSS_URL),
};
