type EventCallback = (data?: any) => void;
type DefaultFactory<T> = () => T;

export function guarantee<K, V>(map: Map<K, V>, key: K, factory: DefaultFactory<V>): V {
  let value = map.get(key);
  if (value === undefined) {
    value = factory();
    map.set(key, value);
  }
  return value;
}

export class EventfulGroup {
  private readonly key: any;
  private readonly parent: Eventful;
  private registered: Array<[string, EventCallback]> = [];

  public constructor(name: any, parent: Eventful) {
    this.key = name;
    this.parent = parent;
  }

  public on(event: string, listener: EventCallback): EventfulGroup {
    this.parent.on(event, listener);
    this.registered.push([event, listener]);
    return this;
  }

  public off(): void {
    for (const [event, callback] of this.registered) {
      this.parent.off(event, callback);
    }
  }
}

/** Custom event manager plugin.
 *
 * This implementation also offers a group tag so that an object,
 * typically a component, can off from further event callbacks
 * and avoid any destroyed views being modified.
 */
export class Eventful {
  private listeners: Map<string, Array<EventCallback>> = new Map();
  private groups: Map<any, EventfulGroup> = new Map();

  public group(key: any): EventfulGroup {
    return guarantee(this.groups, key, () => new EventfulGroup(key, this));
  }

  public on(event: string, listener: EventCallback): this {
    guarantee(this.listeners, event, () => []).push(listener);
    return this;
  }

  public once(event: string, listener: EventCallback): this {
    guarantee(this.listeners, event, () => []).push((data?: any) => {
      listener(data);
      this.off(event, listener);
    });
    return this;
  }

  public off(event: string, listener: EventCallback): this {
    const listeners = this.listeners.get(event);
    if (listeners !== undefined) {
      let i = listeners.indexOf(listener);
      while (i >= 0) {
        listeners.splice(i, i + 1);
        i = listeners.indexOf(listener);
      }
    }
    return this;
  }

  public emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners !== undefined) {
      for (const listener of listeners) {
        listener(data);
      }
    }
  }
}
