import { Share } from 'react-native';
import type { ActionType, AssistantProduct, ChatMessage, HistoricAction } from '../types';
import { generateComment } from './commentGenerator';

export interface ActionExecutionContext {
  locale: 'ar' | 'en';
  router: any;
  cart: {
    items: any[];
    add: (product: any, source?: any) => void;
    remove: (id: any) => void;
    updateQty: (id: any, qty: number) => void;
    clear: () => void;
  };
  favorites: {
    items: any[];
    toggle: (product: any) => void;
    isFav: (id: any) => boolean;
    clear: () => void;
  };
  activeContext: any;
  setActiveContext: React.Dispatch<React.SetStateAction<any>>;
  focusedProduct: AssistantProduct | undefined;
  setFocusedProduct: (product: AssistantProduct | undefined) => void;
  appendMsg: (msg: ChatMessage) => void;
  makeAssistantMsg: (content: string, products?: AssistantProduct[]) => ChatMessage;
  setStatus: (status: any) => void;
  setIsTyping: (typing: boolean) => void;
  closeAssistant: () => void;
  guardResponse: (text: string, intent: any, retry?: any) => string;
  voiceOutputService: any;
  contextRef: any;
  
  // History stack methods
  pushActionToHistory: (action: Omit<HistoricAction, 'timestamp'>) => void;
  popActionFromHistory: () => HistoricAction | undefined;
  peekActionFromHistory: () => HistoricAction | undefined;
  
  // Helpers
  searchProducts: (query: string) => Promise<AssistantProduct[]>;
  formatForState: (product: AssistantProduct, qty?: number) => any;
  fuzzyMatchProduct: (name: string, query: string) => boolean;
}

const translateActionName = (action: ActionType): string => {
  const map: Record<string, string> = {
    ADD_TO_CART: 'إضافة إلى السلة',
    REMOVE_FROM_CART: 'إزالة من السلة',
    ADD_TO_FAVORITES: 'إضافة إلى المفضلة',
    REMOVE_FROM_FAVORITES: 'إزالة من المفضلة',
    INCREASE_QUANTITY: 'زيادة الكمية',
    DECREASE_QUANTITY: 'تقليل الكمية',
    CLEAR_CART: 'تفريغ السلة',
    CLEAR_FAVORITES: 'مسح المفضلات',
    SHARE_PRODUCT: 'مشاركة المنتج',
  };
  return map[action] || action;
};

const detectCommentField = (elements?: Record<string, string>): string | undefined => {
  if (!elements) return undefined;
  const targetKeys = ['ReviewInput', 'CommentBox', 'TextField', 'Feedback', 'opinion', 'تعليق', 'تقييم', 'التعليق', 'مراجعة'];
  const foundKey = Object.keys(elements).find(key => 
    targetKeys.some(target => key.toLowerCase().includes(target.toLowerCase()))
  );
  return foundKey ? elements[foundKey] : undefined;
};

export const ActionRegistry: Record<
  string,
  (ctx: ActionExecutionContext, params: {
    productRef?: number;
    query?: string;
    isRepeat?: boolean;
    amount?: number;
    commentText?: string;
    commentTone?: 'positive' | 'negative' | 'neutral';
    commentLength?: 'short' | 'long';
    interactionAction?: 'write' | 'generate' | 'submit' | 'edit' | 'delete';
    chainedAction?: 'submit' | 'edit';
  }) => Promise<void>
> = {
  // ── 1. ADD_TO_CART ──────────────────────────────────────────────────────────
  ADD_TO_CART: async (ctx, { productRef, query, isRepeat }) => {
    ctx.setStatus('executing');
    let product: AssistantProduct | null = null;

    // Check page context
    if (!query && productRef === undefined && ctx.activeContext.focusedProduct && ctx.activeContext.screen === 'Product') {
      ctx.setActiveContext((prev: any) => ({ ...prev, triggerAction: 'add_to_cart' }));
      product = ctx.activeContext.focusedProduct;
      ctx.closeAssistant();
    } else if (query) {
      product = ctx.contextRef.current.lastSearchResults.find((p: any) => 
        ctx.fuzzyMatchProduct(p.name, query)
      ) || null;

      if (!product) {
        ctx.setIsTyping(true);
        try {
          const results = await ctx.searchProducts(query);
          if (results && results.length > 0) {
            product = results[0];
          }
        } catch {} finally {
          ctx.setIsTyping(false);
        }
      }
    } else {
      const products = ctx.contextRef.current.lastSearchResults;
      const index = productRef ?? 0;
      product = products[index];
    }

    if (!product) {
      const raw = ctx.locale === 'ar' ? `لم أجد المنتج لإضافته للسلة. 😕` : `Could not find product to add to cart. 😕`;
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
      return;
    }

    try {
      const cartItem = ctx.formatForState(product);
      
      // If we didn't trigger page action (already handled above), execute back-end action
      if (ctx.activeContext.screen !== 'Product' || query || productRef !== undefined) {
        ctx.cart.add(cartItem);
      }

      ctx.setFocusedProduct(product);

      // Push to history for UNDO
      if (!isRepeat) {
        ctx.pushActionToHistory({
          type: 'ADD_TO_CART',
          productId: product.id,
          undo: async (context) => {
            context.cart.remove(product!.id);
          }
        });
      }

      const raw = ctx.locale === 'ar'
        ? `تمت إضافة "${product.name}" إلى السلة. 🛒`
        : `Added "${product.name}" to cart. 🛒`;
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
    } catch {
      const raw = ctx.locale === 'ar' ? 'فشلت الإضافة للسلة.' : 'Failed to add to cart.';
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
    }
  },

  // ── 2. REMOVE_FROM_CART ─────────────────────────────────────────────────────
  REMOVE_FROM_CART: async (ctx, { productRef, query, isRepeat }) => {
    ctx.setStatus('executing');
    if (ctx.cart.items.length === 0) {
      const raw = ctx.locale === 'ar' ? 'السلة فارغة بالفعل.' : 'Cart is already empty.';
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
      return;
    }

    let itemToRemove: any = null;

    if (!query && productRef === undefined && ctx.activeContext.focusedProduct) {
      const focused = ctx.activeContext.focusedProduct;
      itemToRemove = ctx.cart.items.find((item) => item.id === focused.id);
    } else if (query) {
      itemToRemove = ctx.cart.items.find((item) => ctx.fuzzyMatchProduct(item.name, query));
    } else {
      const index = productRef ?? 0;
      itemToRemove = ctx.cart.items[index];
    }

    if (!itemToRemove) {
      const raw = ctx.locale === 'ar' ? 'لم أجد هذا المنتج في السلة.' : 'Could not find this product in your cart.';
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
      return;
    }

    try {
      ctx.cart.remove(itemToRemove.id);

      // Push to history for UNDO
      if (!isRepeat) {
        ctx.pushActionToHistory({
          type: 'REMOVE_FROM_CART',
          productId: itemToRemove.id,
          quantity: itemToRemove.quantity,
          undo: async (context) => {
            context.cart.add({ ...itemToRemove });
          }
        });
      }

      const raw = ctx.locale === 'ar'
        ? `تمت إزالة "${itemToRemove.name}" من السلة. 🗑️`
        : `Removed "${itemToRemove.name}" from cart. 🗑️`;
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
    } catch {
      const raw = ctx.locale === 'ar' ? 'تعذر إزالة المنتج.' : 'Failed to remove product.';
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
    }
  },

  // ── 3. ADD_TO_FAVORITES ─────────────────────────────────────────────────────
  ADD_TO_FAVORITES: async (ctx, { productRef, query, isRepeat }) => {
    ctx.setStatus('executing');
    let product: AssistantProduct | null = null;

    if (!query && productRef === undefined) {
      // Priority 1: focused product from active context or sessionRef
      const focused = ctx.activeContext.focusedProduct ?? ctx.contextRef.current.currentFocusedProduct;
      if (focused) {
        product = focused;
        // If on the Product screen, trigger the page-level toggle and close
        if (ctx.activeContext.screen === 'Product') {
          ctx.setActiveContext((prev: any) => ({ ...prev, triggerAction: 'toggle_favorite' }));
          ctx.closeAssistant();
          return; // Page will handle the actual toggle
        }
      } else {
        // Priority 2: fallback to lastSearchResults
        const products = ctx.contextRef.current.lastSearchResults;
        product = products[0] ?? null;
      }
    } else if (query) {
      product = ctx.contextRef.current.lastSearchResults.find((p: any) => 
        ctx.fuzzyMatchProduct(p.name, query)
      ) || null;

      if (!product) {
        try {
          ctx.setIsTyping(true);
          const results = await ctx.searchProducts(query);
          if (results && results.length > 0) {
            product = results[0];
          }
        } catch {} finally {
          ctx.setIsTyping(false);
        }
      }
    } else {
      const products = ctx.contextRef.current.lastSearchResults;
      const index = productRef ?? 0;
      product = products[index] ?? null;
    }

    if (!product) {
      const raw = ctx.locale === 'ar' ? 'لم أجد هذا المنتج لإضافته للمفضلة.' : 'Could not find this product to add to favorites.';
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
      return;
    }

    try {
      const isAlreadyFav = ctx.favorites.isFav(product.id);
      
      // Always execute directly here (we already returned early if on Product screen above)
      if (!isAlreadyFav) {
        ctx.favorites.toggle(ctx.formatForState(product));
      }

      // Check if this is an "instead of cart" command
      const isInstead = query?.includes('بدل') || query?.includes('instead') || ctx.contextRef.current.lastQuery?.includes('بدل');
      let wasRemovedFromCart = false;
      let cartItemBackup: any = null;

      if (isInstead) {
        cartItemBackup = ctx.cart.items.find(item => item.id === product!.id);
        if (cartItemBackup) {
          ctx.cart.remove(product.id);
          wasRemovedFromCart = true;
        }
      }

      // Push to history for UNDO
      if (!isRepeat) {
        ctx.pushActionToHistory({
          type: 'ADD_TO_FAVORITES',
          productId: product.id,
          undo: async (context) => {
            if (context.favorites.isFav(product!.id)) {
              context.favorites.toggle(product);
            }
            if (wasRemovedFromCart && cartItemBackup) {
              context.cart.add(cartItemBackup);
            }
          }
        });
      }

      const raw = ctx.locale === 'ar'
        ? `تمت إضافة "${product.name}" للمفضلة. 💜${wasRemovedFromCart ? ' وحذفته من السلة.' : ''}`
        : `Added "${product.name}" to favorites. 💜${wasRemovedFromCart ? ' And removed it from cart.' : ''}`;
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
    } catch {
      const raw = ctx.locale === 'ar' ? 'تعذر إضافة المنتج للمفضلة.' : 'Failed to add to favorites.';
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
    }
  },

  // ── 4. REMOVE_FROM_FAVORITES ─────────────────────────────────────────────────
  REMOVE_FROM_FAVORITES: async (ctx, { productRef, query, isRepeat }) => {
    ctx.setStatus('executing');
    let product: AssistantProduct | null = null;

    if (!query && productRef === undefined) {
      // Priority 1: focused product from active context or sessionRef
      const focused = ctx.activeContext.focusedProduct ?? ctx.contextRef.current.currentFocusedProduct;
      if (focused) {
        product = focused;
        // If on the Product screen, trigger the page-level toggle and close
        if (ctx.activeContext.screen === 'Product') {
          ctx.setActiveContext((prev: any) => ({ ...prev, triggerAction: 'toggle_favorite' }));
          ctx.closeAssistant();
          return; // Page will handle the actual toggle
        }
      } else {
        // Priority 2: fallback to favorites list
        product = ctx.favorites.items[0] ?? null;
      }
    } else if (query) {
      product = ctx.favorites.items.find((item: any) => ctx.fuzzyMatchProduct(item.name, query)) || null;
    } else {
      const index = productRef ?? 0;
      product = ctx.favorites.items[index] ?? null;
    }

    if (!product) {
      const raw = ctx.locale === 'ar' ? 'لم أجد هذا المنتج في المفضلة.' : 'Could not find this product in favorites.';
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
      return;
    }

    try {
      const isFav = ctx.favorites.isFav(product.id);
      // Always execute directly here (we already returned early if on Product screen above)
      if (isFav) {
        ctx.favorites.toggle(product);
      }

      // Push to history for UNDO
      if (!isRepeat) {
        ctx.pushActionToHistory({
          type: 'REMOVE_FROM_FAVORITES',
          productId: product.id,
          undo: async (context) => {
            if (!context.favorites.isFav(product!.id)) {
              context.favorites.toggle(ctx.formatForState(product!));
            }
          }
        });
      }

      const raw = ctx.locale === 'ar'
        ? `تمت إزالة "${product.name}" من المفضلة. 💜`
        : `Removed "${product.name}" from favorites. 💜`;
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
    } catch {
      const raw = ctx.locale === 'ar' ? 'تعذر إزالة المنتج من المفضلة.' : 'Failed to remove from favorites.';
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
    }
  },


  // ── 5. INCREASE_QUANTITY ────────────────────────────────────────────────────
  INCREASE_QUANTITY: async (ctx, { productRef, query, isRepeat, amount = 1 }) => {
    ctx.setStatus('executing');
    let item: any = null;

    if (!query && productRef === undefined && ctx.activeContext.focusedProduct) {
      const focused = ctx.activeContext.focusedProduct;
      item = ctx.cart.items.find((p) => p.id === focused.id);
    } else if (query) {
      item = ctx.cart.items.find((p) => ctx.fuzzyMatchProduct(p.name, query));
    } else {
      const index = productRef ?? 0;
      item = ctx.cart.items[index];
    }

    // If on product details screen and item not in cart yet, increment product page local qty
    if (!item && ctx.activeContext.screen === 'Product' && ctx.activeContext.focusedProduct) {
      ctx.setActiveContext((prev: any) => ({ ...prev, triggerAction: 'increase_qty' }));
      
      const raw = ctx.locale === 'ar' ? 'تمت زيادة الكمية على الصفحة. 📈' : 'Increased quantity on page. 📈';
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
      return;
    }

    if (!item) {
      const raw = ctx.locale === 'ar' ? 'هذا المنتج غير موجود في سلتك حالياً. 😕' : 'This product is not in your cart. 😕';
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
      return;
    }

    try {
      const oldQty = item.quantity;
      const newQty = oldQty + amount;
      ctx.cart.updateQty(item.id, newQty);

      // Push to history for UNDO
      if (!isRepeat) {
        ctx.pushActionToHistory({
          type: 'INCREASE_QUANTITY',
          productId: item.id,
          quantity: oldQty,
          undo: async (context) => {
            context.cart.updateQty(item.id, oldQty);
          }
        });
      }

      const raw = ctx.locale === 'ar'
        ? `تمت زيادة كمية "${item.name}" إلى ${newQty}. 📈`
        : `Increased quantity of "${item.name}" to ${newQty}. 📈`;
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
    } catch {
      const raw = ctx.locale === 'ar' ? 'تعذر تعديل الكمية.' : 'Failed to update quantity.';
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
    }
  },

  // ── 6. DECREASE_QUANTITY ────────────────────────────────────────────────────
  DECREASE_QUANTITY: async (ctx, { productRef, query, isRepeat, amount = 1 }) => {
    ctx.setStatus('executing');
    let item: any = null;

    if (!query && productRef === undefined && ctx.activeContext.focusedProduct) {
      const focused = ctx.activeContext.focusedProduct;
      item = ctx.cart.items.find((p) => p.id === focused.id);
    } else if (query) {
      item = ctx.cart.items.find((p) => ctx.fuzzyMatchProduct(p.name, query));
    } else {
      const index = productRef ?? 0;
      item = ctx.cart.items[index];
    }

    if (!item && ctx.activeContext.screen === 'Product' && ctx.activeContext.focusedProduct) {
      ctx.setActiveContext((prev: any) => ({ ...prev, triggerAction: 'decrease_qty' }));
      
      const raw = ctx.locale === 'ar' ? 'تم إنقاص الكمية على الصفحة. 📉' : 'Decreased quantity on page. 📉';
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
      return;
    }

    if (!item) {
      const raw = ctx.locale === 'ar' ? 'هذا المنتج غير موجود في سلتك حالياً. 😕' : 'This product is not in your cart. 😕';
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
      return;
    }

    try {
      const oldQty = item.quantity;
      const newQty = Math.max(0, oldQty - amount);
      ctx.cart.updateQty(item.id, newQty);

      // Push to history for UNDO
      if (!isRepeat) {
        ctx.pushActionToHistory({
          type: 'DECREASE_QUANTITY',
          productId: item.id,
          quantity: oldQty,
          undo: async (context) => {
            context.cart.updateQty(item.id, oldQty);
          }
        });
      }

      let raw = '';
      if (newQty <= 0) {
        raw = ctx.locale === 'ar'
          ? `تمت إزالة "${item.name}" من السلة. 🗑️`
          : `Removed "${item.name}" from your cart. 🗑️`;
      } else {
        raw = ctx.locale === 'ar'
          ? `تم تقليل كمية "${item.name}" إلى ${newQty}. 📉`
          : `Decreased quantity of "${item.name}" to ${newQty}. 📉`;
      }
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
    } catch {
      const raw = ctx.locale === 'ar' ? 'تعذر تعديل الكمية.' : 'Failed to update quantity.';
      const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
    }
  },

  // ── 7. SHARE_PRODUCT ────────────────────────────────────────────────────────
  SHARE_PRODUCT: async (ctx) => {
    ctx.setStatus('executing');
    const product = ctx.activeContext.focusedProduct;
    if (!product) {
      const raw = ctx.locale === 'ar' ? 'لا يوجد منتج حالي لمشاركته.' : 'No active product to share.';
      const response = ctx.guardResponse(raw, 'SHARE_PRODUCT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
      return;
    }

    try {
      const url = `https://kataraa.com/product/${product.id}`;
      await Share.share({
        message: `${product.name}\n${url}`,
        title: product.name,
      });

      const raw = ctx.locale === 'ar' ? 'تم فتح خيارات المشاركة.' : 'Sharing options opened.';
      const response = ctx.guardResponse(raw, 'SHARE_PRODUCT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
      ctx.closeAssistant();
    } catch (e) {
      console.error('Error sharing product:', e);
      ctx.setStatus('idle');
    }
  },

  // ── 8. CLEAR_CART ───────────────────────────────────────────────────────────
  CLEAR_CART: async (ctx) => {
    ctx.setStatus('executing');
    const oldItems = [...ctx.cart.items];
    ctx.cart.clear();

    ctx.pushActionToHistory({
      type: 'CLEAR_CART',
      undo: async (context) => {
        for (const item of oldItems) {
          context.cart.add(item);
        }
      }
    });

    const raw = ctx.locale === 'ar' ? 'تم إفراغ السلة بالكامل. 🗑️' : 'Cart emptied completely. 🗑️';
    const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
    ctx.appendMsg(ctx.makeAssistantMsg(response));
    ctx.setStatus('speaking');
    await ctx.voiceOutputService.speak(response);
    ctx.setStatus('idle');
  },

  // ── 9. CLEAR_FAVORITES ──────────────────────────────────────────────────────
  CLEAR_FAVORITES: async (ctx) => {
    ctx.setStatus('executing');
    const oldFavs = [...ctx.favorites.items];
    ctx.favorites.clear();

    ctx.pushActionToHistory({
      type: 'CLEAR_FAVORITES',
      undo: async (context) => {
        for (const item of oldFavs) {
          context.favorites.toggle(context.formatForState(item));
        }
      }
    });

    const raw = ctx.locale === 'ar' ? 'تم مسح قائمة المفضلات. 💜' : 'Wishlist cleared. 💜';
    const response = ctx.guardResponse(raw, 'CART_MANAGEMENT');
    ctx.appendMsg(ctx.makeAssistantMsg(response));
    ctx.setStatus('speaking');
    await ctx.voiceOutputService.speak(response);
    ctx.setStatus('idle');
  },

  // ── 10. CLICK_ELEMENT ───────────────────────────────────────────────────────
  CLICK_ELEMENT: async (ctx, { query }) => {
    ctx.setStatus('executing');
    const name = query || '';
    const elements = ctx.activeContext.screenElements || {};
    
    let trigger = null;
    let key = '';

    if (name === '__default__' || !name) {
      // Resolve default primary action based on the screen context
      if (ctx.activeContext.screen === 'Product' || ctx.activeContext.screen === 'product') {
        trigger = 'add_to_cart';
        key = ctx.locale === 'ar' ? 'زر إضافة إلى السلة' : 'Add to Cart';
      } else if (Object.keys(elements).length > 0) {
        // Fallback to the first registered element on the screen
        key = Object.keys(elements)[0];
        trigger = elements[key];
      }
    } else {
      const foundKey = Object.keys(elements).find(k => 
        name.toLowerCase().includes(k.toLowerCase()) || 
        k.toLowerCase().includes(name.toLowerCase())
      );
      if (foundKey) {
        trigger = elements[foundKey];
        key = foundKey;
      }
    }

    if (!trigger) {
      const raw = ctx.locale === 'ar'
        ? `لم أجد عنصراً تفاعلياً مناسباً على الشاشة حالياً. 😕`
        : `Could not find a suitable interactive element on the screen. 😕`;
      const response = ctx.guardResponse(raw, 'CLICK_ELEMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
      return;
    }

    ctx.setActiveContext((prev: any) => ({ ...prev, triggerAction: trigger }));
    
    const raw = ctx.locale === 'ar' ? `حسناً، قمت بالنقر على ${key}.` : `Sure, clicked ${key}.`;
    const response = ctx.guardResponse(raw, 'CLICK_ELEMENT');
    ctx.appendMsg(ctx.makeAssistantMsg(response));
    ctx.setStatus('speaking');
    await ctx.voiceOutputService.speak(response);
    ctx.setStatus('idle');
    ctx.closeAssistant();
  },

  // ── 11. UNDO ────────────────────────────────────────────────────────────────
  UNDO: async (ctx) => {
    const lastAction = ctx.popActionFromHistory();
    if (!lastAction || !lastAction.undo) {
      const raw = ctx.locale === 'ar' ? 'لا يوجد إجراء للتراجع عنه حالياً. 😕' : 'No action to undo. 😕';
      const response = ctx.guardResponse(raw, 'UNDO');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
      return;
    }

    try {
      ctx.setStatus('executing');
      await lastAction.undo(ctx);

      const raw = ctx.locale === 'ar'
        ? `تم التراجع عن: ${translateActionName(lastAction.type)}.`
        : `Undone last action: ${lastAction.type}.`;
      const response = ctx.guardResponse(raw, 'UNDO');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
    } catch {
      ctx.setStatus('idle');
    }
  },

  // ── 12. REPEAT_LAST ──────────────────────────────────────────────────────────
  REPEAT_LAST: async (ctx) => {
    const lastAction = ctx.peekActionFromHistory();
    if (!lastAction) {
      const raw = ctx.locale === 'ar' ? 'لا يوجد إجراء سابق لتكراره. 😕' : 'No action to repeat. 😕';
      const response = ctx.guardResponse(raw, 'REPEAT_LAST');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
      return;
    }

    // Call execution directly
    await ActionRegistry[lastAction.type](ctx, { productRef: undefined, query: undefined, isRepeat: true });
  }
};

