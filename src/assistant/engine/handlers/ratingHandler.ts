/**
 * RatingHandler — معالج التقييم الديناميكي
 */

import { InteractionRegistry } from '../interactionRegistry';
import type { RegistryContext } from '../interactionRegistry';

const detectRatingField = (elements?: Record<string, string>): string | undefined => {
  if (!elements) return undefined;
  const targetKeys = ['ratingBar', 'stars', 'rating', 'starRating', 'score', 'التقييم', 'تقييم', 'نجوم', 'rate', 'star', 'review'];
  const foundKey = Object.keys(elements).find(key => 
    targetKeys.some(target => key.toLowerCase().includes(target.toLowerCase()))
  );
  return foundKey ? elements[foundKey] : undefined;
};

const detectOpenRatingBtn = (elements?: Record<string, string>): string | undefined => {
  if (!elements) return undefined;
  const targetKeys = ['اضافة تقييم', 'أضف تقييم', 'اضف تقييم', 'قيم المنتج', 'rate product', 'write review', 'add rating', 'add review'];
  const foundKey = Object.keys(elements).find(key => 
    targetKeys.some(target => key.toLowerCase().includes(target.toLowerCase()))
  );
  return foundKey ? elements[foundKey] : undefined;
};

export const RatingHandler = async (
  ctx: RegistryContext,
  payload: Record<string, any>
): Promise<void> => {
  ctx.setStatus('executing');
  const locale = ctx.locale;
  const interactionAction = payload.interactionAction || 'rate';
  const ratingValue = payload.ratingValue;

  // 1. حالة حذف التقييم
  if (interactionAction === 'delete') {
    ctx.setActiveContext((prev: any) => ({
      ...prev,
      pendingInteraction: {
        type: 'rating',
        payload: { rating: 0, action: 'delete' },
        status: 'submitted',
      },
    }));

    const raw = locale === 'ar' ? 'تم حذف تقييمك بنجاح. 🗑️' : 'Your rating has been deleted. 🗑️';
    const response = ctx.guardResponse(raw, 'RATING');
    ctx.appendMsg(ctx.makeAssistantMsg(response));
    ctx.setStatus('speaking');
    await ctx.voiceOutputService.speak(response);
    ctx.setStatus('idle');
    return;
  }

  // 2. التحقق من صحة عدد النجوم (Validation)
  if (ratingValue === -1) {
    const raw = locale === 'ar' ? 'التقييم الأقصى هو خمس نجوم ⭐' : 'Maximum rating is 5 stars ⭐';
    const response = ctx.guardResponse(raw, 'RATING');
    ctx.appendMsg(ctx.makeAssistantMsg(response));
    ctx.setStatus('speaking');
    await ctx.voiceOutputService.speak(response);
    ctx.setStatus('idle');
    return;
  }

  // 3. حالة عدم توفر عدد نجوم محدد (Short Memory)
  if (ratingValue === undefined) {
    ctx.setActiveContext((prev: any) => ({
      ...prev,
      pendingInteraction: {
        type: 'rating',
        payload: { action: 'rate' },
        status: 'awaiting_input',
        awaitingInputType: 'stars',
      },
    }));

    const raw = locale === 'ar'
      ? 'كم نجمة تريد تقييم المنتج؟ (من 1 إلى 5) ⭐'
      : 'How many stars would you like to rate the product? (1 to 5) ⭐';
    const response = ctx.guardResponse(raw, 'RATING');
    ctx.appendMsg(ctx.makeAssistantMsg(response));
    ctx.setStatus('speaking');
    await ctx.voiceOutputService.speak(response);
    ctx.setStatus('idle');
    return;
  }

  // 4. تنفيذ التقييم (1-5)
  const elements = ctx.activeContext?.screenElements || {};
  let targetField = detectRatingField(elements);
  if (!targetField && (ctx.activeContext?.screen === 'Product' || ctx.activeContext?.screen === 'product')) {
    targetField = 'rating_input';
  }
  const openBtnKey = detectOpenRatingBtn(elements);

  if (targetField) {
    // تم العثور على حقل التقييم مباشرة
    ctx.setActiveContext((prev: any) => ({
      ...prev,
      pendingInteraction: {
        type: 'rating',
        payload: { rating: ratingValue, action: 'rate' },
        targetField,
        status: 'done',
      },
    }));

    const raw = locale === 'ar'
      ? `قمت بتقييم المنتج بـ ${ratingValue} نجوم. ⭐`
      : `Rated the product ${ratingValue} stars. ⭐`;
    const response = ctx.guardResponse(raw, 'RATING');
    ctx.appendMsg(ctx.makeAssistantMsg(response));
    ctx.setStatus('speaking');
    await ctx.voiceOutputService.speak(response);
    ctx.setStatus('idle');
  } else if (openBtnKey) {
    // وجدنا زر فتح نافذة التقييم
    ctx.setActiveContext((prev: any) => ({
      ...prev,
      triggerAction: elements[openBtnKey],
      pendingInteraction: {
        type: 'rating',
        payload: { rating: ratingValue, action: 'rate' },
        status: 'pending',
      },
    }));

    const raw = locale === 'ar'
      ? `لم أجد خيار التقييم مباشرة، قمت بالنقر على زر إضافة تقييم لتحديد ${ratingValue} نجوم. ⭐`
      : `Could not find rating directly, so I clicked the Add Review button to set ${ratingValue} stars. ⭐`;
    const response = ctx.guardResponse(raw, 'RATING');
    ctx.appendMsg(ctx.makeAssistantMsg(response));
    ctx.setStatus('speaking');
    await ctx.voiceOutputService.speak(response);
    ctx.setStatus('idle');
  } else {
    // لم نجد شيئاً
    const raw = locale === 'ar'
      ? 'لم أجد خيار التقييم في هذه الصفحة 🔍'
      : 'Could not find the rating option on this page 🔍';
    const response = ctx.guardResponse(raw, 'RATING');
    ctx.appendMsg(ctx.makeAssistantMsg(response));
    ctx.setStatus('speaking');
    await ctx.voiceOutputService.speak(response);
    ctx.setStatus('idle');
  }
};

// تسجيل المعالج تلقائياً في Registry عند استيراده
InteractionRegistry.register('RATING', RatingHandler);
