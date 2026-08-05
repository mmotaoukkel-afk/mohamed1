import { normalizeText } from '../engine/aliasResolver';

/**
 * Detects the language of a query.
 * Categorizes as:
 * - 'darija' (if Arabic character set is detected and contains Moroccan Darija keywords)
 * - 'ar' (if Arabic character set is detected but no strong Darija markers)
 * - 'en' (default fallback)
 */
export const detectLanguage = (text: string): 'ar' | 'en' | 'darija' => {
  const normalized = text.toLowerCase().trim();
  const hasArabicCharacters = /[\u0600-\u06FF]/.test(normalized);

  if (!hasArabicCharacters) {
    return 'en';
  }

  // Common Moroccan Darija stopwords or words
  const darijaKeywords = [
    'ديال', 'شنو', 'كنقلب', 'خوي', 'بانيي', 'كيداير', 'كيدايره', 'زوين', 'زوينه',
    'بغيت', 'حيد', 'سيفط', 'صيفط', 'شكون', 'بلاش', 'فين', 'شحال', 'بشhall',
    'عافاك', 'كنفتش', 'ديني', 'سير', 'امشي', 'بلاتي', 'واخا', 'اه', 'لااس', 'صافي',
    'وريني'
  ];

  const words = normalized.split(/\s+/);
  const matchesDarija = words.some(w => {
    if (darijaKeywords.includes(w)) return true;
    // Strip common Arabic prefixes (waw, lam, beh) and check again
    const stripped = w.replace(/^[ولب]/, '');
    return darijaKeywords.includes(stripped);
  });

  return matchesDarija ? 'darija' : 'ar';
};

/**
 * Cleans the input query, normalizes letters, and splits into lowercase tokens.
 */
export const tokenize = (text: string): string[] => {
  const clean = normalizeText(text);
  return clean.split(/\s+/).filter(Boolean);
};
