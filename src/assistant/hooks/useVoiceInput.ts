/**
 * useVoiceInput — إدخال صوتي حقيقي باستخدام @jamsch/expo-speech-recognition
 *
 * الميزات:
 *  - دعم العربية (ar-MA دارجة مغربية / ar-SA فصحى) + English
 *  - عرض النتائج المؤقتة في real-time (interim results)
 *  - دورة حياة كاملة: idle → listening → processing → idle
 *  - طلب الأذونات تلقائياً عند أول ضغطة
 *  - Fallback آمن إذا كانت البيئة لا تدعم الميكروفون (Expo Go على الويب)
 *  - Auto-stop بعد صمت 4 ثوانٍ
 */

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from '@jamsch/expo-speech-recognition';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { VoiceStatus } from '../types';
import voiceOutputService from '../services/voiceOutputService';

// ─── اللغات المدعومة بالترتيب ─────────────────────────────────────────────────

/** اللغة الأساسية — العربية المغربية / الدارجة */
const PRIMARY_LANG   = 'ar-MA';
/** البديل — عربية فصحى */
const FALLBACK_LANG  = 'ar-SA';
/** بديل ثانٍ — إنجليزي */
const ENGLISH_LANG   = 'en-US';

// ─── الكلمات السياقية للمساعد ─────────────────────────────────────────────────
// تحسّن دقة التعرف على مصطلحات التطبيق
const CONTEXT_STRINGS = [
  // تنقل
  'افتح', 'روح', 'انقلني', 'الرئيسية', 'السلة', 'المفضلة', 'الطلبات', 'البروفايل',
  // بحث
  'أرني', 'وريني', 'ابحث', 'عندي', 'أريد', 'بغيت', 'جيبلي',
  // منتجات
  'سيروم', 'كريم', 'شامبو', 'عطر', 'ماسك', 'تونر', 'مكياج',
  // إجراءات
  'اضف', 'ضيف', 'احذف', 'فرغ', 'أفضل', 'احسن', 'توصيتك',
  // علامات
  'كاتارا', 'Kataraa',
];

// ─── الأنواع ──────────────────────────────────────────────────────────────────

export interface UseVoiceInputOptions {
  status: VoiceStatus;
  setStatus: (status: VoiceStatus) => void;
  /** يُستدعى عندما يكتمل الكلام بنتيجة نهائية */
  onResult: (transcript: string) => void;
  /** يُستدعى مع كل حرف مؤقت لعرضه في Input */
  onInterimResult?: (transcript: string) => void;
  /** يُستدعى عند خطأ */
  onError?: (message: string) => void;
}

export interface UseVoiceInputReturn {
  interimText:   string;
  toggleVoice:   () => void;
  stopListening: () => void;
  isSupported:   boolean;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useVoiceInput = ({
  status,
  setStatus,
  onResult,
  onInterimResult,
  onError,
  onSilenceTimeout,
}: UseVoiceInputOptions & { onSilenceTimeout?: () => void }): UseVoiceInputReturn => {

  const [interimText, setInterimText] = useState('');

  // Create refs to avoid stale closures of callbacks in native event listeners
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onInterimResultRef = useRef(onInterimResult);
  onInterimResultRef.current = onInterimResult;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onSilenceTimeoutRef = useRef(onSilenceTimeout);
  onSilenceTimeoutRef.current = onSilenceTimeout;

  // منع التداخل بين start/stop
  const isActiveRef       = useRef(false);
  const finalResultRef    = useRef('');
  const silenceTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutCalledRef  = useRef(false);
  const userStoppedRef    = useRef(false);

  // هل الجهاز يدعم Speech Recognition؟
  const isSupported = Platform.OS !== 'web';

  // ─── مستمعو الأحداث ─────────────────────────────────────────────────────────

  useSpeechRecognitionEvent('start', () => {
    isActiveRef.current  = true;
    finalResultRef.current = '';
    timeoutCalledRef.current = false;
    userStoppedRef.current = false;
    setStatus('listening');
    setInterimText('');
  });

  useSpeechRecognitionEvent('end', () => {
    isActiveRef.current = false;

    const wasUserStopped = userStoppedRef.current;
    userStoppedRef.current = false;

    if (finalResultRef.current.trim()) {
      setStatus('processing');
      setInterimText('');
      const text = finalResultRef.current.trim();

      // تأخير قصير ليشوف المستخدم حالة "processing"
      setTimeout(() => {
        onResultRef.current(text);
      }, 400);
    } else {
      // لا نتيجة
      setStatus('idle');
      setInterimText('');
      if (!timeoutCalledRef.current && !wasUserStopped) {
        timeoutCalledRef.current = true;
        onSilenceTimeoutRef.current?.();
      }
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results.map(r => r.transcript).join(' ').trim();
    
    finalResultRef.current = transcript;
    setInterimText(transcript);
    onInterimResultRef.current?.(transcript);
  });

  useSpeechRecognitionEvent('error', (event) => {
    isActiveRef.current = false;
    setStatus('idle');
    setInterimText('');

    if (event.error === 'no-speech') {
      if (!timeoutCalledRef.current) {
        timeoutCalledRef.current = true;
        onSilenceTimeoutRef.current?.();
      }
      return;
    }

    const msg = translateError(event.error);
    if (msg) onErrorRef.current?.(msg);
  });

  // تم إزالة عداد الصمت التلقائي بناء على طلب المستخدم

  // ─── دوال التحكم ─────────────────────────────────────────────────────────────

  const stopNow = () => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (_) { /* ignore */ }
  };

  const stopListening = useCallback(() => {
    stopNow();
    setStatus('idle');
    setInterimText('');
  }, [setStatus]);

  const toggleVoice = useCallback(async () => {
    if (!isSupported) {
      onErrorRef.current?.('التعرف على الكلام غير مدعوم على هذا الجهاز');
      return;
    }

    // INTERRUPT SYSTEM: إذا كان المساعد يتحدث وصدم زر الصوت -> أوقفه فوراً وابدأ الاستماع
    if (status === 'speaking') {
      voiceOutputService.stop();
      setStatus('idle');
      // سنعطي مهلة صغيرة جداً لتفريغ المحرك قبل البدء بالاستماع
      await new Promise(r => setTimeout(r, 100));
    }

    // إذا كان يستمع → أوقف وأرسل (Submit) ما تم التقاطه حتى الآن
    if (isActiveRef.current || status === 'listening') {
      userStoppedRef.current = true;
      if (interimText.trim()) {
        finalResultRef.current = interimText.trim();
      }
      stopNow();
      return;
    }

    // اطلب الأذونات
    const permissions = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permissions.granted) {
      onErrorRef.current?.('يرجى السماح للتطبيق باستخدام الميكروفون');
      return;
    }

    // ابدأ التعرف
    try {
      ExpoSpeechRecognitionModule.start({
        lang:                       PRIMARY_LANG,
        interimResults:             true,
        maxAlternatives:            1,
        continuous:                 true,          // مستمر حتى يتم الضغط على الزر
        requiresOnDeviceRecognition: false,
        addsPunctuation:            false,
        contextualStrings:          CONTEXT_STRINGS,
      });
    } catch (err: any) {
      // إذا فشلت ar-MA جرب ar-SA
      try {
        ExpoSpeechRecognitionModule.start({
          lang:            FALLBACK_LANG,
          interimResults:  true,
          maxAlternatives: 1,
          continuous:      true,
          contextualStrings: CONTEXT_STRINGS,
        });
      } catch (err2: any) {
        onErrorRef.current?.('تعذّر بدء التعرف الصوتي');
        setStatus('idle');
      }
    }
  }, [status, setStatus, isSupported, stopListening]);

  return {
    interimText,
    toggleVoice,
    stopListening,
    isSupported,
  };
};

// ─── ترجمة رموز الأخطاء إلى رسائل عربية ─────────────────────────────────────

function translateError(code: string): string | null {
  switch (code) {
    case 'no-speech':
      return null; // صمت عادي — لا رسالة
    case 'audio-capture':
      return 'تعذّر التقاط الصوت — تحقق من الميكروفون';
    case 'not-allowed':
      return 'لا يوجد إذن لاستخدام الميكروفون';
    case 'network':
      return 'يرجى التحقق من اتصال الإنترنت للتعرف الصوتي';
    case 'aborted':
      return null; // المستخدم أوقف بنفسه
    case 'language-not-supported':
      return 'اللغة العربية غير مدعومة على هذا الجهاز';
    default:
      return null;
  }
}
