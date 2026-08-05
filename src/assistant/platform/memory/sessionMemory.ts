import { ISessionMemory } from '../core/types';

export class SessionMemory implements ISessionMemory {
  public lastSearchResults: any[] = [];
  public lastIntent?: string;
  public lastQuery?: string;
  public currentFocusedProduct?: any;
  public conversationHistory: Array<{ role: string; content: string }> = [];

  public push(entry: { role: string; content: string }): void {
    this.conversationHistory.push(entry);
    // نقوم بتحديد حجم المحادثات المحفوظة لمنع تراكم الذاكرة (مثال: آخر 20 رسالة)
    if (this.conversationHistory.length > 20) {
      this.conversationHistory.shift();
    }
  }

  public clear(): void {
    this.lastSearchResults = [];
    this.lastIntent = undefined;
    this.lastQuery = undefined;
    this.currentFocusedProduct = undefined;
    this.conversationHistory = [];
  }
}
