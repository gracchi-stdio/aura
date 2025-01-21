import type { string } from "astro:schema";

type EventCallback = (...args: any[]) => void;

class EventManager {
  private listener: Map<string, EventCallback[]> = new Map();
  private completedEvents: Set<string> = new Set();

  on(event: string, callback: EventCallback) {
    if (!this.listener.has(event)) {
      this.listener.set(event, []);
    }

    this.listener.get(event)?.push(callback);

    // callback immediately if completed
    if (this.completedEvents.has(event)) {
      callback();
    }
  }

  emit(event: string) {
    this.completedEvents.add(event);
    this.listener.get(event)?.forEach((callback) => callback());
  }

  reset() {
    this.completedEvents.clear();
  }

  waitFor(event: string) {
    if (this.completedEvents.has(event)) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.on(event, resolve);
    });
  }
}

export const eventManager = new EventManager();
