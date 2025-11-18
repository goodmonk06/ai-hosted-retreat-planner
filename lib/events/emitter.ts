import { RetreatEvent, DomainEvent } from "./types";
import { logger } from "../logger";
import { metrics } from "../metrics";

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

class EventEmitter {
  private handlers: Map<string, EventHandler[]> = new Map();

  on<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as EventHandler);
    logger.debug(`Event handler registered for ${eventType}`);
  }

  off<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler as EventHandler);
      if (index > -1) {
        handlers.splice(index, 1);
        logger.debug(`Event handler unregistered for ${eventType}`);
      }
    }
  }

  async emit(event: RetreatEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];

    logger.info(`Emitting event: ${event.type}`, {
      eventType: event.type,
      handlerCount: handlers.length,
    });

    metrics.recordCounter("events.emitted", 1, { type: event.type });

    const promises = handlers.map(async (handler) => {
      try {
        await handler(event);
        metrics.recordCounter("events.handled", 1, {
          type: event.type,
          status: "success",
        });
      } catch (error) {
        logger.error(`Error handling event ${event.type}`, error);
        metrics.recordCounter("events.handled", 1, {
          type: event.type,
          status: "error",
        });
      }
    });

    await Promise.all(promises);
  }

  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
      logger.debug(`All handlers removed for ${eventType}`);
    } else {
      this.handlers.clear();
      logger.debug("All event handlers removed");
    }
  }
}

export const eventEmitter = new EventEmitter();
