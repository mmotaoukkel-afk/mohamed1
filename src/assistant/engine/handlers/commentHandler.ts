/**
 * CommentHandler — معالج التعليقات الديناميكي
 */

import { InteractionRegistry } from '../interactionRegistry';
import type { RegistryContext } from '../interactionRegistry';
import { generateComment } from '../commentGenerator';

const detectCommentField = (elements?: Record<string, string>): string | undefined => {
  if (!elements) return undefined;
  const targetKeys = ['ReviewInput', 'CommentBox', 'TextField', 'Feedback', 'opinion', 'تعليق', 'تقييم', 'التعليق', 'مراجعة'];
  const foundKey = Object.keys(elements).find(key => 
    targetKeys.some(target => key.toLowerCase().includes(target.toLowerCase()))
  );
  return foundKey ? elements[foundKey] : undefined;
};

export const CommentHandler = async (
  ctx: RegistryContext,
  payload: Record<string, any>
): Promise<void> => {
  ctx.setStatus('executing');
  const locale = ctx.locale;
  const interactionAction = payload.interactionAction || 'write';
  const commentText = payload.commentText;
  const commentTone = payload.commentTone;
  const commentLength = payload.commentLength;
  const chainedAction = payload.chainedAction;

  // 1. حالة الحذف
  if (interactionAction === 'delete') {
    ctx.setActiveContext((prev: any) => ({
      ...prev,
      pendingInteraction: {
        type: 'comment',
        payload: { text: '' },
        targetField: detectCommentField(ctx.activeContext?.screenElements) ||
          ((ctx.activeContext?.screen === 'Product' || ctx.activeContext?.screen === 'product') ? 'comment_input' : undefined),
        status: 'injected',
      },
    }));
    
    const raw = locale === 'ar' ? 'تم حذف التعليق من الحقل. 🗑️' : 'Comment cleared from the field. 🗑️';
    const response = ctx.guardResponse(raw, 'COMMENT');
    ctx.appendMsg(ctx.makeAssistantMsg(response));
    ctx.setStatus('speaking');
    await ctx.voiceOutputService.speak(response);
    ctx.setStatus('idle');
    return;
  }

  // 2. حالة النشر/الإرسال المباشر
  if (interactionAction === 'submit') {
    const interactionText = commentText || ctx.activeContext?.pendingInteraction?.payload?.text;
    if (!interactionText) {
      const raw = locale === 'ar'
        ? 'لا يوجد تعليق مكتوب للنشر. اكتب تعليقاً أولاً. 📝'
        : 'No comment written yet. Write a comment first. 📝';
      const response = ctx.guardResponse(raw, 'COMMENT');
      ctx.appendMsg(ctx.makeAssistantMsg(response));
      ctx.setStatus('speaking');
      await ctx.voiceOutputService.speak(response);
      ctx.setStatus('idle');
      return;
    }

    ctx.setActiveContext((prev: any) => ({
      ...prev,
      pendingInteraction: {
        type: 'comment',
        payload: { text: interactionText },
        status: 'submitted',
      },
    }));

    const raw = locale === 'ar' ? 'تم نشر تعليقك بنجاح. ✅' : 'Comment posted successfully. ✅';
    const response = ctx.guardResponse(raw, 'COMMENT');
    ctx.appendMsg(ctx.makeAssistantMsg(response));
    ctx.setStatus('speaking');
    await ctx.voiceOutputService.speak(response);
    ctx.setStatus('idle');
    return;
  }

  // 3. حالة طلب كتابة تعليق فارغ (تحتاج إلى Short Memory لسؤال المستخدم)
  if (interactionAction === 'generate' && !commentText && !commentTone && !commentLength) {
    ctx.setActiveContext((prev: any) => ({
      ...prev,
      pendingInteraction: {
        type: 'comment',
        payload: { tone: commentTone, length: commentLength },
        status: 'awaiting_input',
        awaitingInputType: 'text',
      },
    }));

    const raw = locale === 'ar' ? 'ما الذي تريد كتابته في التعليق؟ 📝' : 'What would you like to write in the comment? 📝';
    const response = ctx.guardResponse(raw, 'COMMENT');
    ctx.appendMsg(ctx.makeAssistantMsg(response));
    ctx.setStatus('speaking');
    await ctx.voiceOutputService.speak(response);
    ctx.setStatus('idle');
    return;
  }

  // 4. تحديد النص: مباشر أو توليد
  let text = commentText;
  const isGenerated = interactionAction === 'generate' || !text;
  if (isGenerated) {
    text = generateComment({
      tone: commentTone || 'positive',
      length: commentLength || 'short',
      locale,
      productName: ctx.activeContext?.currentFocusedProduct?.name || ctx.focusedProduct?.name,
    });
  }

  console.log('[CommentHandler] activeContext:', JSON.stringify(ctx.activeContext, null, 2));
  let targetField = detectCommentField(ctx.activeContext?.screenElements);
  if (!targetField && (ctx.activeContext?.screen === 'Product' || ctx.activeContext?.screen === 'product')) {
    targetField = 'comment_input';
  }
  const elements = ctx.activeContext?.screenElements || {};
  const addCommentBtnKey = Object.keys(elements).find(key =>
    ['اضافة تعليق', 'اضف تعليق', 'ضيف تعليق', 'علق', 'add comment', 'write comment', 'new comment', 'feedback', 'review'].some(btn =>
      key.toLowerCase().includes(btn.toLowerCase())
    )
  );

  if (targetField) {
    // تم العثور على الحقل مباشرة
    ctx.setActiveContext((prev: any) => ({
      ...prev,
      pendingInteraction: {
        type: 'comment',
        payload: { text, tone: commentTone, length: commentLength },
        targetField,
        status: chainedAction === 'submit' ? 'submitted' : 'injected',
      },
    }));

    let raw = '';
    if (chainedAction === 'submit') {
      raw = locale === 'ar'
        ? `كتبت لك التعليق ونشرته بنجاح: "${text}" ✅`
        : `Comment typed and posted successfully: "${text}" ✅`;
    } else {
      raw = isGenerated
        ? `أنشأت لك تعليقاً مناسباً وكتبته في الحقل: "${text}" 📝\nلن أنشره حتى تطلب مني ذلك بقول "انشر".`
        : `كتبت لك التعليق داخل الحقل: "${text}" ✍️\nلن أنشره حتى تطلب مني ذلك بقول "انشر".`;
    }

    const response = ctx.guardResponse(raw, 'COMMENT');
    ctx.appendMsg(ctx.makeAssistantMsg(response));
    ctx.setStatus('speaking');
    await ctx.voiceOutputService.speak(response);
    ctx.setStatus('idle');
  } else if (addCommentBtnKey) {
    // لم نجد الحقل ولكن وجدنا زر إضافة تعليق
    ctx.setActiveContext((prev: any) => ({
      ...prev,
      triggerAction: elements[addCommentBtnKey],
      pendingInteraction: {
        type: 'comment',
        payload: { text, tone: commentTone, length: commentLength },
        status: 'pending',
      },
    }));

    const raw = locale === 'ar'
      ? `لم أجد حقل التعليق مباشرة، قمت بالنقر على زر إضافة تعليق لكتابة تعليقك: "${text}" ✍️`
      : `Couldn't find the comment field directly, so I clicked the Add Comment button to write: "${text}" ✍️`;

    const response = ctx.guardResponse(raw, 'COMMENT');
    ctx.appendMsg(ctx.makeAssistantMsg(response));
    ctx.setStatus('speaking');
    await ctx.voiceOutputService.speak(response);
    ctx.setStatus('idle');
  } else {
    // لم نجد الحقل ولا الزر
    const raw = locale === 'ar'
      ? 'لم أجد حقل التعليق أو زر إضافة تعليق. يرجى فتح صفحة التعليقات أولاً. 📝'
      : 'Could not find the comment field or Add Comment button. Please open the comments section first. 📝';

    const response = ctx.guardResponse(raw, 'COMMENT');
    ctx.appendMsg(ctx.makeAssistantMsg(response));
    ctx.setStatus('speaking');
    await ctx.voiceOutputService.speak(response);
    ctx.setStatus('idle');
  }
};

// تسجيل المعالج تلقائياً في Registry عند استيراده
InteractionRegistry.register('COMMENT', CommentHandler);
