import { EventEmitter } from 'events';

// Event types
export interface BaseEvent {
  id: string;
  type: string;
  timestamp: Date;
  source: string;
  version: string;
}

export interface UserEvent extends BaseEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted' | 'user.profile_updated';
  data: {
    user_id: string;
    organization_id: string;
    [key: string]: any;
  };
}

export interface AuthEvent extends BaseEvent {
  type: 'auth.login' | 'auth.logout' | 'auth.password_reset' | 'auth.email_verified';
  data: {
    user_id: string;
    ip_address?: string;
    user_agent?: string;
    [key: string]: any;
  };
}

export interface OrganizationEvent extends BaseEvent {
  type: 'organization.created' | 'organization.updated' | 'organization.settings_changed';
  data: {
    organization_id: string;
    [key: string]: any;
  };
}

export interface SubscriptionEvent extends BaseEvent {
  type: 'subscription.created' | 'subscription.updated' | 'subscription.cancelled' | 'subscription.payment_failed';
  data: {
    subscription_id: string;
    organization_id: string;
    [key: string]: any;
  };
}

export type DomainEvent = UserEvent | AuthEvent | OrganizationEvent | SubscriptionEvent;

// Event Publisher
export class EventPublisher {
  private eventEmitter: EventEmitter;
  private serviceName: string;

  constructor(serviceName: string) {
    this.eventEmitter = new EventEmitter();
    this.serviceName = serviceName;
  }

  async publish(eventType: string, data: any): Promise<void> {
    const event: BaseEvent = {
      id: this.generateEventId(),
      type: eventType,
      timestamp: new Date(),
      source: this.serviceName,
      version: '1.0',
      ...data,
    };

    console.log(`📢 Publishing event: ${eventType}`, event);

    // Emit locally
    this.eventEmitter.emit(eventType, event);

    // TODO: Publish to message broker (Redis, RabbitMQ, etc.)
    // await this.publishToMessageBroker(event);
  }

  subscribe(eventType: string, handler: (event: DomainEvent) => void): void {
    this.eventEmitter.on(eventType, handler);
  }

  unsubscribe(eventType: string, handler: (event: DomainEvent) => void): void {
    this.eventEmitter.off(eventType, handler);
  }

  private generateEventId(): string {
    return `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // TODO: Implement message broker publishing
  // private async publishToMessageBroker(event: BaseEvent): Promise<void> {
  //   // Redis Pub/Sub implementation
  //   // RabbitMQ implementation
  //   // Apache Kafka implementation
  // }
}

// Event Subscriber
export class EventSubscriber {
  private eventEmitter: EventEmitter;
  private serviceName: string;

  constructor(serviceName: string) {
    this.eventEmitter = new EventEmitter();
    this.serviceName = serviceName;
  }

  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
    this.eventEmitter.on(eventType, async (event: DomainEvent) => {
      try {
        console.log(`📥 Received event: ${eventType} in ${this.serviceName}`, event);
        await handler(event);
      } catch (error) {
        console.error(`❌ Error handling event ${eventType} in ${this.serviceName}:`, error);
        // TODO: Implement dead letter queue or retry mechanism
      }
    });
  }

  // TODO: Implement message broker subscription
  // async startListening(): Promise<void> {
  //   // Redis Pub/Sub subscription
  //   // RabbitMQ subscription
  //   // Apache Kafka subscription
  // }
}

// Event Store (for event sourcing)
export interface EventStore {
  append(streamId: string, events: DomainEvent[]): Promise<void>;
  getEvents(streamId: string, fromVersion?: number): Promise<DomainEvent[]>;
  getAllEvents(fromTimestamp?: Date): Promise<DomainEvent[]>;
}

// In-memory event store implementation (for development)
export class InMemoryEventStore implements EventStore {
  private events: Map<string, DomainEvent[]> = new Map();

  async append(streamId: string, events: DomainEvent[]): Promise<void> {
    const existingEvents = this.events.get(streamId) || [];
    this.events.set(streamId, [...existingEvents, ...events]);
  }

  async getEvents(streamId: string, fromVersion?: number): Promise<DomainEvent[]> {
    const events = this.events.get(streamId) || [];
    return fromVersion ? events.slice(fromVersion) : events;
  }

  async getAllEvents(fromTimestamp?: Date): Promise<DomainEvent[]> {
    const allEvents: DomainEvent[] = [];
    
    for (const events of this.events.values()) {
      allEvents.push(...events);
    }

    const sortedEvents = allEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    if (fromTimestamp) {
      return sortedEvents.filter(event => event.timestamp >= fromTimestamp);
    }
    
    return sortedEvents;
  }
}

// Event Bus (combines publisher and subscriber)
export class EventBus {
  private publisher: EventPublisher;
  private subscriber: EventSubscriber;
  private eventStore?: EventStore;

  constructor(serviceName: string, eventStore?: EventStore) {
    this.publisher = new EventPublisher(serviceName);
    this.subscriber = new EventSubscriber(serviceName);
    this.eventStore = eventStore;
  }

  async publish(eventType: string, data: any): Promise<void> {
    await this.publisher.publish(eventType, data);
    
    // Store event if event store is configured
    if (this.eventStore) {
      const event = {
        id: `${eventType}-${Date.now()}`,
        type: eventType,
        timestamp: new Date(),
        source: 'event-bus',
        version: '1.0',
        data,
      } as DomainEvent;
      
      await this.eventStore.append(eventType, [event]);
    }
  }

  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
    this.subscriber.subscribe(eventType, handler);
  }

  getEventHistory(streamId: string, fromVersion?: number): Promise<DomainEvent[]> {
    if (!this.eventStore) {
      throw new Error('Event store not configured');
    }
    return this.eventStore.getEvents(streamId, fromVersion);
  }
}

// Utility functions
export function createEventBus(serviceName: string, withEventStore = false): EventBus {
  const eventStore = withEventStore ? new InMemoryEventStore() : undefined;
  return new EventBus(serviceName, eventStore);
}

export function isUserEvent(event: DomainEvent): event is UserEvent {
  return event.type.startsWith('user.');
}

export function isAuthEvent(event: DomainEvent): event is AuthEvent {
  return event.type.startsWith('auth.');
}

export function isOrganizationEvent(event: DomainEvent): event is OrganizationEvent {
  return event.type.startsWith('organization.');
}

export function isSubscriptionEvent(event: DomainEvent): event is SubscriptionEvent {
  return event.type.startsWith('subscription.');
}

