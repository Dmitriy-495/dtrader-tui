/**
 * EventBus.js
 * Реализация Шины Событий (Event Bus) на базе EventEmitter из 'events'.
 * Центральный узел для обмена данными между модулями Ядра и UI.
 */
const EventEmitter = require("events");

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Установка лимита слушателей в 0 (бесконечно) для крупных приложений.
    this.setMaxListeners(0);
  }

  /**
   * Подписаться на событие. Алиас для on().
   * @param {string} eventName - Имя события.
   * @param {function} handler - Функция-обработчик.
   */
  subscribe(eventName, handler) {
    this.on(eventName, handler);
  }

  /**
   * Опубликовать событие и передать данные всем подписчикам. Алиас для emit().
   * @param {string} eventName - Имя события.
   * @param {any} data - Данные для передачи.
   */
  publish(eventName, data) {
    this.emit(eventName, data);
    // console.log(`[BUS] 📢 Событие: ${eventName} опубликовано.`); // Отладочная строка
  }
}

// Экспортируем единственный экземпляр Шины Событий (Singleton)
module.exports = new EventBus();
