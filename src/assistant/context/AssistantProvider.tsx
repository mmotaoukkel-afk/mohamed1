import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { AssistantProduct, VoiceStatus, ChatMessage, AssistantContext } from '../types';

export interface ActiveContext {
  screen: string;
  category?: string;
  focusedProduct?: AssistantProduct;
  /** Action to trigger on the active screen (cleared after execution) */
  triggerAction?: string;
  /** Named registry of screen elements the assistant can reference and click */
  screenElements?: Record<string, string>;
}

export interface AssistantContextType {
  overlayVisible: boolean;
  status: VoiceStatus;
  activeContext: ActiveContext;
  focusedProduct: AssistantProduct | undefined;
  messages: ChatMessage[];
  isTyping: boolean;
  lastCommand: string | null;
  sessionContextRef: React.MutableRefObject<AssistantContext>;
  setOverlayVisible: (visible: boolean) => void;
  setActiveContext: React.Dispatch<React.SetStateAction<ActiveContext>>;
  setFocusedProduct: (product: AssistantProduct | undefined) => void;
  setStatus: (status: VoiceStatus) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsTyping: (isTyping: boolean) => void;
  setLastCommand: (command: string | null) => void;
  triggerAssistant: () => void;
  closeAssistant: () => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [activeContext, setActiveContext] = useState<ActiveContext>({ screen: 'Home' });
  const [focusedProduct, setFocusedProductState] = useState<AssistantProduct | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);

  // ── الذاكرة قصيرة المدى المشتركة لجميع مستهلكي الهوك ────────────────────
  const sessionContextRef = useRef<AssistantContext>({
    lastSearchResults: [],
    lastIntent: undefined,
    lastQuery: undefined,
    lastCategory: undefined,
    lastRecommendations: [],
    currentScreen: 'Home',
    currentFocusedProduct: undefined,
    pendingAction: undefined,
    screenHistory: [], // Track route history
  });

  const setFocusedProduct = useCallback((product: AssistantProduct | undefined) => {
    setFocusedProductState(product);
    sessionContextRef.current.currentFocusedProduct = product;
    if (product) {
      setActiveContext(prev => ({ ...prev, focusedProduct: product }));
    }
  }, []);

  const triggerAssistant = useCallback(() => {
    setOverlayVisible(true);
    setStatus('idle');
  }, []);

  const closeAssistant = useCallback(() => {
    setOverlayVisible(false);
    setStatus('idle');
  }, []);

  return (
    <AssistantContext.Provider
      value={{
        overlayVisible,
        status,
        activeContext,
        focusedProduct,
        messages,
        isTyping,
        lastCommand,
        sessionContextRef,
        setOverlayVisible,
        setActiveContext,
        setFocusedProduct,
        setStatus,
        setMessages,
        setIsTyping,
        setLastCommand,
        triggerAssistant,
        closeAssistant,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
};

export const useAssistantContext = () => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistantContext must be used within an AssistantProvider');
  }
  return context;
};
