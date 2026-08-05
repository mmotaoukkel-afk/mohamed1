/**
 * SentimentAnalyzer — تحليل مشاعر ونبرة الزبون
 *
 * المسؤولية:
 *  - تحليل الكلمات التعبيرية لنص الزبون
 *  - تصنيف النية المشاعرية: (positive, neutral, frustrated, urgent)
 *  - تمكين المساعد من الاستجابة بتعاطف ولباقة مناسبة لطلب الزبون
 */

export type CustomerSentiment = 'positive' | 'neutral' | 'frustrated' | 'urgent';

export interface SentimentAnalysisResult {
  sentiment: CustomerSentiment;
  score: number; // -1.0 (شديد الانزعاج) إلى +1.0 (سعيد وممتن جداً)
  isFrustrated: boolean;
  isUrgent: boolean;
  matchedKeywords: string[];
}

// ─── الكلمات الدلالية لمشاعر الانزعاج/الشكوى ─────────────────────────────────
const FRUSTRATED_KEYWORDS = [
  // عربية ومغربية
  'سيء', 'خايب', 'مشكلة', 'مشكل', 'تأخر', 'معطل', 'غالي', 'زبل', 'نصب',
  'ما عجبنيش', 'خايبة', 'ما خداش', 'تأخير', 'بطيء', 'غضب', 'منزعج',
  'ضيعت', 'ما وصلناش', 'خسر', 'كارثة', 'تخربيق', 'مرفوض',
  // إنجليزية
  'bad', 'worst', 'terrible', 'horrible', 'broken', 'late', 'delayed',
  'expensive', 'scam', 'waste', 'slow', 'angry', 'disappointed', 'fail',
];

// ─── الكلمات الدلالية لمشاعر الإيجابية والشكر ───────────────────────────────
const POSITIVE_KEYWORDS = [
  // عربية ومغربية
  'شكرا', 'شكراً', 'تبارك الله', 'واعر', 'ممتاز', 'رائع', 'جميل',
  'غزال', 'يعطيك الصحة', 'شكرا جزيلا', 'الله يحفظك', 'متاز', 'يحفظك',
  'حبّيت', 'عجبني', 'ناضي', 'حلو', 'شكرا بزاف',
  // إنجليزية
  'thanks', 'thank you', 'awesome', 'great', 'excellent', 'amazing',
  'perfect', 'love', 'good', 'wonderful', 'nice',
];

// ─── الكلمات الدلالية للاستعجال ───────────────────────────────────────────────
const URGENT_KEYWORDS = [
  // عربية ومغربية
  'دابا', 'عاجل', 'فورا', 'فوراً', 'بسرعة', 'دغيا', 'ضروري', 'سرع',
  // إنجليزية
  'urgent', 'asap', 'now', 'fast', 'quickly', 'hurry',
];

/**
 * تحليل المشاعر لنص المستخدم
 */
export const analyzeSentiment = (text: string): SentimentAnalysisResult => {
  if (!text || text.trim().length === 0) {
    return {
      sentiment: 'neutral',
      score: 0,
      isFrustrated: false,
      isUrgent: false,
      matchedKeywords: [],
    };
  }

  const lowerText = text.toLowerCase();
  const matchedKeywords: string[] = [];

  let frustrationPoints = 0;
  let positivePoints = 0;
  let urgencyPoints = 0;

  // فحص كلمات الانزعاج
  FRUSTRATED_KEYWORDS.forEach(kw => {
    if (lowerText.includes(kw)) {
      frustrationPoints++;
      matchedKeywords.push(kw);
    }
  });

  // فحص كلمات الإيجابية
  POSITIVE_KEYWORDS.forEach(kw => {
    if (lowerText.includes(kw)) {
      positivePoints++;
      matchedKeywords.push(kw);
    }
  });

  // فحص كلمات الاستعجال
  URGENT_KEYWORDS.forEach(kw => {
    if (lowerText.includes(kw)) {
      urgencyPoints++;
      matchedKeywords.push(kw);
    }
  });

  const isFrustrated = frustrationPoints > 0 && frustrationPoints >= positivePoints;
  const isUrgent = urgencyPoints > 0;

  let sentiment: CustomerSentiment = 'neutral';
  let score = 0;

  if (isFrustrated) {
    sentiment = 'frustrated';
    score = -Math.min(1.0, 0.4 * frustrationPoints);
  } else if (positivePoints > 0) {
    sentiment = 'positive';
    score = Math.min(1.0, 0.4 * positivePoints);
  } else if (isUrgent) {
    sentiment = 'urgent';
    score = 0.1;
  }

  return {
    sentiment,
    score,
    isFrustrated,
    isUrgent,
    matchedKeywords,
  };
};
