import { IMemorySystem, IWorkingMemory, ISessionMemory, ILongTermMemory, ISemanticMemory, IEpisodicMemory } from '../core/types';
import { WorkingMemory } from './workingMemory';
import { SessionMemory } from './sessionMemory';
import { LongTermMemory } from './longTermMemory';
import { SemanticMemory } from './semanticMemory';
import { EpisodicMemory } from './episodicMemory';

export class MemorySystem implements IMemorySystem {
  private static instance: MemorySystem;
  
  public working: IWorkingMemory;
  public session: ISessionMemory;
  public longTerm: ILongTermMemory;
  public semantic: ISemanticMemory;
  public episodic: IEpisodicMemory;

  private constructor() {
    this.working = new WorkingMemory();
    this.session = new SessionMemory();
    this.longTerm = new LongTermMemory();
    this.semantic = new SemanticMemory();
    this.episodic = new EpisodicMemory();
  }

  public static getInstance(): MemorySystem {
    if (!MemorySystem.instance) {
      MemorySystem.instance = new MemorySystem();
    }
    return MemorySystem.instance;
  }

  /**
   * مسح جميع البيانات المرتبطة بالجلسة والذاكرة العاملة (إعادة تهيئة كاملة للجلسة)
   */
  public resetSession(): void {
    this.working.clear();
    (this.session as SessionMemory).clear();
  }
}
