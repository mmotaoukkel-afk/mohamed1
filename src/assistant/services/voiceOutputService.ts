import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

// الخيارات الافتراضية لقراءة الصوت
const DEFAULT_SPEECH_OPTIONS: Speech.SpeechOptions = {
  pitch: 1.05,       // طبقة صوت ناعمة ولطيفة
  rate: 0.88,        // سرعة هادئة ومفهومة
};

// قوائم اللغات المفضلة مع ترتيب البدائل
const ARABIC_PREFERRED = ['ar-SA', 'ar-AE', 'ar-EG', 'ar'];
const ENGLISH_PREFERRED = ['en-US', 'en-GB', 'en-AU', 'en'];

let cachedVoices: Speech.Voice[] = [];

/**
 * جلب قائمة اللغات المتوفرة على الجهاز بشكل آمن
 */
const getAvailableVoicesSafe = async (): Promise<Speech.Voice[]> => {
  if (Platform.OS === 'web') return [];
  if (cachedVoices.length > 0) return cachedVoices;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    cachedVoices = voices || [];
    return cachedVoices;
  } catch (e) {
    console.warn('[VoiceOutputService] Failed to fetch voices:', e);
    return [];
  }
};

/**
 * تحديد أفضل كود لغة متوفر على الجهاز بناءً على التفضيلات
 */
const selectBestLanguage = async (preferredList: string[]): Promise<string> => {
  const voices = await getAvailableVoicesSafe();
  if (voices.length === 0) {
    return preferredList[0];
  }

  for (const preferred of preferredList) {
    const match = voices.find(
      (v) =>
        v.language.toLowerCase() === preferred.toLowerCase() ||
        v.language.toLowerCase().replace('_', '-').startsWith(preferred.toLowerCase() + '-')
    );
    if (match) {
      return match.language;
    }
  }

  // البحث المباشر عن رمز اللغة الأساسي (مثل ar أو en)
  const baseLang = preferredList[preferredList.length - 1];
  const fallbackMatch = voices.find((v) =>
    v.language.toLowerCase().startsWith(baseLang.toLowerCase())
  );
  if (fallbackMatch) {
    return fallbackMatch.language;
  }

  return preferredList[0];
};

/**
 * نطق نص معين صوتاً على الويب باستخدام speechSynthesis المباشر
 */
const speakWeb = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }

      // إيقاف أي نطق جارٍ أولاً
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = DEFAULT_SPEECH_OPTIONS.rate || 0.88;
      utterance.pitch = DEFAULT_SPEECH_OPTIONS.pitch || 1.05;

      const isEnglish = /^[a-zA-Z]/.test(text);
      utterance.lang = isEnglish ? 'en-US' : 'ar-SA';

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('[VoiceOutputService] Web Speech error:', e);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[VoiceOutputService] Web Speech exception:', e);
      resolve();
    }
  });
};

/**
 * نطق نص معين صوتاً
 * @param text النص المراد نطقه
 * @param options خيارات إضافية للتخصيص
 * @returns Promise ينتهي بانتهاء النطق أو حدوث خطأ
 */
export const speak = async (text: string, options?: Speech.SpeechOptions): Promise<void> => {
  // تنظيف النص من الرموز التعبيرية (Emoji) أو الروابط لتسريع النطق وجعله طبيعياً
  const cleanText = text
    .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83C[\uDDE6-\uDDFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .trim();

  if (!cleanText) {
    return;
  }

  if (Platform.OS === 'web') {
    return speakWeb(cleanText);
  }

  return new Promise(async (resolve) => {
    // إيقاف أي نطق جارٍ أولاً لمنع التداخل
    try {
      Speech.stop();
    } catch (e) {
      console.warn('[VoiceOutputService] Failed to stop speech:', e);
    }

    // تحديد اللغة تلقائياً بناءً على الحروف المستخدمة في النص
    const isEnglish = /^[a-zA-Z]/.test(cleanText);
    const preferredList = isEnglish ? ENGLISH_PREFERRED : ARABIC_PREFERRED;
    const selectedLanguage = await selectBestLanguage(preferredList);

    try {
      Speech.speak(cleanText, {
        ...DEFAULT_SPEECH_OPTIONS,
        language: selectedLanguage,
        ...options,
        onDone: () => resolve(),
        onError: (err) => {
          console.warn('[VoiceOutputService] Native Speech error caught gracefully:', err);
          resolve();
        },
      });
    } catch (err) {
      console.warn('[VoiceOutputService] Native Speech synthesis call failed:', err);
      resolve();
    }
  });
};

/**
 * إيقاف النطق الجاري فوراً
 */
export const stop = (): void => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } else {
      Speech.stop();
    }
  } catch (e) {
    console.warn('[VoiceOutputService] Failed to stop speech:', e);
  }
};

/**
 * التحقق مما إذا كان المساعد يتحدث حالياً
 */
export const isSpeaking = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        return window.speechSynthesis.speaking;
      }
      return false;
    }
    return await Speech.isSpeakingAsync();
  } catch (e) {
    return false;
  }
};

export default {
  speak,
  stop,
  isSpeaking,
};
