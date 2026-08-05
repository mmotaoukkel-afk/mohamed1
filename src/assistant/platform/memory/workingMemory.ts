import { IWorkingMemory } from '../core/types';

export class WorkingMemory implements IWorkingMemory {
  private store: Map<string, any> = new Map();

  public set(key: string, value: any): void {
    this.store.set(key, value);
  }

  public get<T>(key: string): T | undefined {
    return this.store.get(key) as T;
  }

  public clear(): void {
    this.store.clear();
  }
}
