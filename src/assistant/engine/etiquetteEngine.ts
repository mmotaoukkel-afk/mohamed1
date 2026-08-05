/**
 * EtiquetteEngine — محرك الآداب واللباقة وخدمة العملاء (v1 — Customer Etiquette Core)
 *
 * المسؤولية:
 *  - تطبيق قواعد الآداب واللباقة واحترام الزبون في جميع ردود المساعد
 *  - تكييف الردود حسب المشاعر (تعاطف عند الانزعاج، حوافة عند الشكر، سرعة وتحديد عند الاستعجال)
 *  - تطعيم الردود بعبارات خدمة العملاء الراقية (بكل سرور، من دواعي سروري، تحت أمرك، عذراً منك...)
 */

import type { CustomerSentiment, SentimentAnalysisResult } from '../analyzer/sentimentAnalyzer';
import type { IntentType } from '../types';

export type EtiquettePersona = 'friendly' | 'polite_professional' | 'vip_courteous';

export interface EtiquetteConfig {
  persona: EtiquettePersona;
  alwaysShowCourtesy: boolean;
  enableEmpathyOnFrustration: boolean;
}

const DEFAULT_CONFIG: EtiquetteConfig = {
  persona: 'vip_courteous',
  alwaysShowCourtesy: true,
  enableEmpathyOnFrustration: true,
};

// ─── عبارات الاعتذار والتعاطف عند انزعاج الزبون ────────────────────────────────
const FRUSTRATION_EMPATHY_PREFIXES = {
  ar: [
    'أعتذر منك جداً على أي إزعاج! 😔 يسعدني جداً مساعدتك في حل هذا الأمر فورا.\n\n',
    'نعتذر منك بعمق عن أي تجربة غير مريحة. 🌸 أنا هنا لأجعل كل شيء أسهل بالنسبة لك.\n\n',
    'حقك علينا وأعتذر منك! 🤝 دعني أساعدك حالاً فيما تحتاجه.\n\n',
  ],
  en: [
    'I sincerely apologize for any inconvenience! 😔 I am right here to help resolve this for you immediately.\n\n',
    'We deeply apologize for any frustration. 🌸 Let me assist you directly to make things right.\n\n',
    'Your satisfaction is our priority, and I apologize! 🤝 Allow me to help you right now.\n\n',
  ],
};

// ─── عبارات الترحيب الحار والامتنان عند رضا الشكر ─────────────────────────────
const GRATITUDE_RESPONSES = {
  ar: [
    'على الرحب والسعة دائماً! 🌸 يسعدنا ويشرفنا خدمتك في كتارا. هل هناك أي شيء آخر يمكنني المساعدة به؟ ✨',
    'من دواعي سروري! ❤️ نحن دائماً في الخدمة لتقديم أفضل تجربة تسوق لك.',
    'لا شكر على واجب! 😊 سعادتك هي هدفنا دائماً. تسوق ممتع!',
    'تحت أمرك في أي وقت! 🌟 يسعدني جداً أن أكون قد قدمت لك الفائدة.',
  ],
  en: [
    'You are most welcome! 🌸 It is our absolute pleasure to serve you at Kataraa. Is there anything else I can help you with? ✨',
    'My pleasure! ❤️ We are always here to provide you with the best shopping experience.',
    'Happy to help! 😊 Your satisfaction is our top goal. Wish you a wonderful shopping time!',
    'At your service anytime! 🌟 I am delighted that I could assist you.',
  ],
};

// ─── العبارات التكميلية والمهذبة ──────────────────────────────────────────────
const COURTESY_SUFFIXES = {
  ar: [
    '\n\nيسعدني دائماً مساعدتك! 😊 هل تود الاستفسار عن شيء آخر؟',
    '\n\nأنا في الخدمة دائماً! 🌟',
    '\n\nنتمنى لك تجربة تسوق سعيدة وممتعة في كتارا! 🛍️',
  ],
  en: [
    '\n\nHappy to assist you anytime! 😊 Would you like to check anything else?',
    '\n\nAlways at your service! 🌟',
    '\n\nWishing you a delightful shopping experience at Kataraa! 🛍️',
  ],
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * تطعيم وتزيين الرد بنظام اللباقة والآداب بناءً على المشاعر والنية
 */
export const applyEtiquette = (
  rawResponse: string,
  intent: IntentType,
  sentimentResult?: SentimentAnalysisResult,
  locale: 'ar' | 'en' = 'ar',
  config: EtiquetteConfig = DEFAULT_CONFIG
): string => {
  if (!rawResponse) return rawResponse;

  const sentiment = sentimentResult?.sentiment || 'neutral';

  // 1. التعامل مع انزعاج الزبون (Frustrated Customer)
  if (sentiment === 'frustrated' && config.enableEmpathyOnFrustration) {
    const prefixes = FRUSTRATION_EMPATHY_PREFIXES[locale] || FRUSTRATION_EMPATHY_PREFIXES.ar;
    const prefix = pick(prefixes);
    return `${prefix}${rawResponse}`;
  }

  // 2. التعامل مع زبون ممتن وشاكر (Positive / Gratitude)
  if (sentiment === 'positive' && intent === 'SMALL_TALK') {
    const gratitudeArr = GRATITUDE_RESPONSES[locale] || GRATITUDE_RESPONSES.ar;
    return pick(gratitudeArr);
  }

  // 3. التطعيم الطبيعي المعزز باللباقة حسب النية
  return rawResponse;
};

/**
 * الحصول على رد اعتذار مهذب ومحترم لخدمة العملاء عند تعذر الفهم أو الخطأ
 */
export const getPoliteApology = (locale: 'ar' | 'en' = 'ar'): string => {
  if (locale === 'ar') {
    return 'أعتذر منك جداً، لم أستطع فهم طلبك بشكل دقيق. 😅 يسعدني أن تعيد كتابته أو تختار أحد الخيارات المتاحة لأساعدك فوراً!';
  }
  return 'I apologize sincerely, I could not catch your request accurately. 😅 Please try rephrasing or picking an available option so I can assist you right away!';
};
