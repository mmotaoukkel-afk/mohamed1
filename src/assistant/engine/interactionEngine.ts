/**
 * InteractionEngine — طبقة التفاعل الشاملة
 *
 * يعالج: COMMENT و RATING والطلبات المركّبة (Pipeline)
 * ويُرجع ParsedIntent كامل مع entities محددة ومستويات ثقة ذكية.
 */

import type { ParsedIntent, AssistantContext } from '../types';
import {
  containsAny,
  COMMENT_WRITE_ALIASES,
  COMMENT_SUBMIT_ALIASES,
  COMMENT_DELETE_ALIASES,
  RATING_ALIASES,
  RATING_REMOVE_ALIASES,
  FAVORITES_ALIASES,
  ADD_ALIASES,
  extractCommentText,
  extractCommentTone,
  extractCommentLength,
  extractCommentChainedAction,
  extractRatingValue,
} from './aliasResolver';

/**
 * يكتشف نية التفاعل ويقوم ببناء النتيجة المناسبة (يدعم الطلبات الفردية والمركّبة)
 */
export const detectInteractionIntent = (
  normalized: string,
  rawText: string,
  context?: AssistantContext
): ParsedIntent | null => {
  // ── 1. فحص المكونات المختلفة للمساعدة في كشف الطلبات المركّبة ──
  
  // أ. تفاصيل التعليق
  const isCommentSubmit = containsAny(normalized, COMMENT_SUBMIT_ALIASES, false);
  const isCommentDelete = containsAny(normalized, COMMENT_DELETE_ALIASES, false);
  const isCommentWrite = containsAny(normalized, COMMENT_WRITE_ALIASES, false);
  const commentText = extractCommentText(rawText);
  const hasCommentIntent = isCommentSubmit || isCommentDelete || isCommentWrite || commentText !== undefined;

  // ب. تفاصيل التقييم
  const isRatingDelete = containsAny(normalized, RATING_REMOVE_ALIASES, false);
  const isRatingRate = containsAny(normalized, RATING_ALIASES, false);
  const ratingVal = extractRatingValue(rawText);

  // لمنع التعارض مع الكلمات الرقمية العامة (مثل "واحد" في "أضف المنتج الأول" أو "500" في "أقل من 500")، 
  // نشترط وجود كلمة دالة على التقييم (مؤشر) لربط الرقم بالتقييم.
  const ratingIndicators = [
    'قيم', 'تقييم', 'نجوم', 'نجمة', 'نجمات', 
    'rate', 'rating', 'star', 'stars', 'review', 
    'أعطه', 'أعطيه', 'اعطه', 'عطيه', 'عطيليه', 'يستاحق', 'score'
  ];
  const hasRatingIndicator = containsAny(normalized, ratingIndicators, false);

  const hasRatingIntent = isRatingDelete || 
    (isRatingRate && ratingVal !== undefined) || 
    (hasRatingIndicator && ratingVal !== undefined) || 
    (isRatingRate && ratingVal === undefined);

  // ج. تفاصيل المفضلة (للمركّب)
  const isFavAdd = containsAny(normalized, FAVORITES_ALIASES, false) && (
    containsAny(normalized, ADD_ALIASES, false) || 
    containsAny(normalized, ['ضفه', 'ضيفه', 'اضف', 'ضيف'], false)
  );
  const hasFavIntent = isFavAdd;

  // ── 2. كشف ومعالجة الطلبات المركّبة (Pipeline) ──
  const activeIntentsCount = (hasCommentIntent ? 1 : 0) + (hasRatingIntent ? 1 : 0) + (hasFavIntent ? 1 : 0);

  if (activeIntentsCount > 1) {
    const pipelineSteps: Array<{ intent: string; payload: Record<string, any> }> = [];

    // إضافة خطوة التعليق
    if (hasCommentIntent) {
      if (isCommentDelete) {
        pipelineSteps.push({
          intent: 'COMMENT',
          payload: { interactionAction: 'delete' }
        });
      } else if (isCommentSubmit) {
        pipelineSteps.push({
          intent: 'COMMENT',
          payload: { 
            interactionAction: 'submit',
            commentText: context?.pendingInteraction?.payload?.text
          }
        });
      } else {
        const tone = extractCommentTone(normalized);
        const length = extractCommentLength(normalized);
        const chained = extractCommentChainedAction(normalized);
        pipelineSteps.push({
          intent: 'COMMENT',
          payload: {
            interactionAction: commentText !== undefined ? 'write' : 'generate',
            commentText,
            commentTone: tone,
            commentLength: length,
            chainedAction: chained,
          }
        });
      }
    }

    // إضافة خطوة التقييم
    if (hasRatingIntent) {
      if (isRatingDelete) {
        pipelineSteps.push({
          intent: 'RATING',
          payload: { interactionAction: 'delete' }
        });
      } else {
        pipelineSteps.push({
          intent: 'RATING',
          payload: {
            interactionAction: 'rate',
            ratingValue: ratingVal,
          }
        });
      }
    }

    // إضافة خطوة المفضلة
    if (hasFavIntent) {
      pipelineSteps.push({
        intent: 'ADD_TO_FAVORITES',
        payload: {
          action: 'add',
        }
      });
    }

    // نرجع النية الأساسية كـ COMMENT أو RATING لكن مع pipelineSteps
    const primaryIntent = hasCommentIntent ? 'COMMENT' : 'RATING';
    const primaryAction = hasCommentIntent ? 'WRITE_COMMENT' : 'RATE_PRODUCT';

    return {
      category: 'ACTION',
      intent: primaryIntent,
      action: primaryAction,
      confidence: 0.97, // ثقة عالية جداً للطلبات المركبة المحددة
      entities: {
        pipelineSteps,
        commentText: commentText,
        ratingValue: ratingVal === -1 ? undefined : ratingVal,
      },
      raw: rawText,
      matchedPattern: 'compound_interaction_pipeline',
    };
  }

  // ── 3. معالجة طلب التقييم الفردي ──
  if (hasRatingIntent) {
    if (isRatingDelete) {
      return {
        category: 'ACTION',
        intent: 'RATING',
        action: 'REMOVE_RATING',
        confidence: 0.95,
        entities: {
          interactionAction: 'delete',
        },
        raw: rawText,
        matchedPattern: 'rating_delete',
      };
    }

    let confidence = 0.88; // ثقة افتراضية مثل "قيم المنتج"
    if (ratingVal !== undefined && ratingVal !== -1) {
      confidence = 0.95; // ثقة أعلى لوجود النجوم محددة بدقة
    }

    // كلمة مفردة مبهمة مثل "قيم" أو "rate"
    const tokens = normalized.split(' ');
    const isSingleWord = tokens.length === 1 && (tokens[0] === 'قيم' || tokens[0] === 'rate');
    if (isSingleWord) {
      confidence = 0.40;
    }

    return {
      category: 'ACTION',
      intent: 'RATING',
      action: 'RATE_PRODUCT',
      confidence,
      entities: {
        interactionAction: 'rate',
        ratingValue: ratingVal,
      },
      raw: rawText,
      matchedPattern: ratingVal !== undefined ? 'rating_direct_value' : 'rating_request_no_value',
    };
  }

  // ── 4. معالجة طلب التعليق الفردي ──
  if (isCommentSubmit) {
    const hasComment = !!context?.pendingInteraction?.payload?.text;
    return {
      category: 'ACTION',
      intent: 'COMMENT',
      action: 'SUBMIT_COMMENT',
      confidence: 0.95,
      entities: {
        interactionAction: 'submit',
        commentText: context?.pendingInteraction?.payload?.text,
      },
      raw: rawText,
      matchedPattern: hasComment ? 'comment_submit_valid' : 'comment_submit_no_comment',
    };
  }

  if (isCommentDelete) {
    return {
      category: 'ACTION',
      intent: 'COMMENT',
      action: 'WRITE_COMMENT',
      confidence: 0.92,
      entities: {
        interactionAction: 'delete',
      },
      raw: rawText,
      matchedPattern: 'comment_delete',
    };
  }

  if (isCommentWrite || commentText !== undefined) {
    const tone = extractCommentTone(normalized);
    const length = extractCommentLength(normalized);
    const chainedAction = extractCommentChainedAction(normalized);

    let confidence = 0.88;
    let action: 'write' | 'generate' = 'generate';

    if (commentText !== undefined) {
      confidence = 0.99;
      action = 'write';
    } else if (tone || length) {
      confidence = 0.93;
      action = 'generate';
    }

    return {
      category: 'ACTION',
      intent: 'COMMENT',
      action: 'WRITE_COMMENT',
      confidence,
      entities: {
        interactionAction: action,
        commentText,
        commentTone: tone,
        commentLength: length,
        chainedAction,
      },
      raw: rawText,
      matchedPattern: commentText !== undefined ? 'comment_write_direct' : 'comment_generate_request',
    };
  }

  const tokens = normalized.split(' ');
  const isGenericWriteWord = tokens.length === 1 && (tokens[0] === 'اكتب' || tokens[0] === 'comment');
  if (isGenericWriteWord) {
    return {
      category: 'ACTION',
      intent: 'COMMENT',
      action: 'WRITE_COMMENT',
      confidence: 0.40,
      entities: {
        interactionAction: 'generate',
      },
      raw: rawText,
      matchedPattern: 'comment_generic_write_word',
    };
  }

  const isGenericCommentWord = tokens.length === 1 && tokens[0] === 'علق';
  if (isGenericCommentWord) {
    return {
      category: 'ACTION',
      intent: 'COMMENT',
      action: 'WRITE_COMMENT',
      confidence: 0.88,
      entities: {
        interactionAction: 'generate',
      },
      raw: rawText,
      matchedPattern: 'comment_generic_comment_word',
    };
  }

  return null;
};

/**
 * دالة مساعدة لحقن النص عندما تكون الحالة هي awaiting_text (Short Memory)
 */
export const injectPendingText = (
  normalized: string,
  rawText: string,
  context: AssistantContext
): ParsedIntent => {
  const tone = context.pendingInteraction?.payload?.tone;
  const length = context.pendingInteraction?.payload?.length;

  return {
    category: 'ACTION',
    intent: 'COMMENT',
    action: 'WRITE_COMMENT',
    confidence: 0.96,
    entities: {
      interactionAction: 'write',
      commentText: rawText,
      commentTone: tone,
      commentLength: length,
    },
    raw: rawText,
    matchedPattern: 'comment_awaiting_text_injection',
  };
};

/**
 * دالة مساعدة لحقن التقييم عندما تكون الحالة هي awaiting_stars (Short Memory)
 */
export const injectPendingRating = (
  normalized: string,
  rawText: string,
  context: AssistantContext
): ParsedIntent => {
  const ratingVal = extractRatingValue(rawText);

  return {
    category: 'ACTION',
    intent: 'RATING',
    action: 'RATE_PRODUCT',
    confidence: 0.96,
    entities: {
      interactionAction: 'rate',
      ratingValue: ratingVal,
    },
    raw: rawText,
    matchedPattern: 'rating_awaiting_stars_injection',
  };
};
