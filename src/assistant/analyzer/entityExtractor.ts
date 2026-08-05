import {
  normalizeText,
  matchWord,
  extractScreen,
  extractCategory,
  extractOrdinal,
  extractNumber,
} from '../engine/aliasResolver';

import brandsData from '../../../assets/assistant/brands.json';
import productsData from '../../../assets/assistant/products.json';
import type { ScreenName } from '../types';

export interface ExtractedEntities {
  query?: string;
  screen?: ScreenName;
  category?: string;
  productRef?: number;
  limit?: number;
  sort?: 'best_selling' | 'newest' | 'price_asc' | 'price_desc';
  products?: string[];
  brands?: string[];
  sizes?: string[];
}

/**
 * Parses and extracts entities from normalized text query.
 */
export const extractEntities = (rawText: string): ExtractedEntities => {
  const normalized = normalizeText(rawText);
  const tokens = normalized.split(/\s+/).filter(Boolean);

  const matchedBrands: string[] = [];
  const matchedProducts: string[] = [];
  const matchedSizes: string[] = [];

  // 1. Extract Brands from JSON
  for (const brand of brandsData) {
    const isBrandPresent = brand.names.some((name: string) => {
      const normName = normalizeText(name);
      if (normName.includes(' ')) {
        return normalized.includes(normName);
      }
      return tokens.some(t => matchWord(t, normName, false));
    });
    if (isBrandPresent) {
      matchedBrands.push(brand.id);
    }
  }

  // 2. Extract Products from JSON
  for (const product of productsData) {
    const isProductPresent = product.names.some((name: string) => {
      const normName = normalizeText(name);
      if (normName.includes(' ')) {
        return normalized.includes(normName);
      }
      return tokens.some(t => matchWord(t, normName, false));
    });
    if (isProductPresent) {
      matchedProducts.push(product.id);
    }
  }

  // 3. Extract Sizes / Specifications (e.g., "55 inch", "55 بوصة", "50ml", "100ml", "50 مل", "55")
  // Regex to match numbers followed by optional volume/dimension units
  const sizeRegex = /(\d+)\s*(ml|ml\b|مل|g|جرام|غرام|inch|بوصه|بوصة|cm|سم|px|dhs|dh|درهم|دج)/gi;
  let match;
  while ((match = sizeRegex.exec(normalized)) !== null) {
    matchedSizes.push(match[0].trim());
  }

  // Fallback size check: if there is a raw number like "55" and it represents a size context (e.g. screen sizes)
  if (matchedSizes.length === 0) {
    const num = extractNumber(normalized);
    if (num !== undefined) {
      // If we see words like "بوصة", "شاشة", "حجم", "مقاس", "سعة", "قد", "تلفاز"
      const sizeIndicators = ['بوصه', 'بوصة', 'حجم', 'مقاس', 'سعة', 'سعه', 'قد', 'تلفاز', 'تلفزة', 'تلفزيون', 'شامبو', 'سيروم', 'كريم', 'مل', 'غرام', 'جرام', 'ml', 'g'];
      if (sizeIndicators.some(ind => normalized.includes(ind))) {
        matchedSizes.push(String(num));
      }
    }
  }

  // 4. Reuse legacy helper functions for Screen, Category, Ordinal, Limit/Number
  const screen = extractScreen(normalized);
  const category = extractCategory(normalized);
  const productRef = extractOrdinal(normalized);
  
  // Extract limit
  let limit: number | undefined;
  if (normalized.includes('توصيات') || normalized.includes('اقترح') || normalized.includes('افضل')) {
    limit = extractNumber(normalized) ?? 5;
  } else {
    limit = extractNumber(normalized);
  }

  // Extract sort option
  let sort: ExtractedEntities['sort'];
  if (normalized.includes('ارخص') || normalized.includes('اقل ثمن') || normalized.includes('شحال رخيص') || normalized.includes('cheap')) {
    sort = 'price_asc';
  } else if (normalized.includes('اغلى') || normalized.includes('اغلي') || normalized.includes('اكثر ثمن') || normalized.includes('expensive')) {
    sort = 'price_desc';
  } else if (normalized.includes('اجدد') || normalized.includes('جديد') || normalized.includes('اخر ما كاين') || normalized.includes('new')) {
    sort = 'newest';
  } else if (normalized.includes('اكثر مبيعا') || normalized.includes('احسن مبيعا') || normalized.includes('الافضل مبيعا') || normalized.includes('best seller')) {
    sort = 'best_selling';
  }

  // Build clean search query (removing verbs, stopwords etc.)
  // If products are extracted, the query could be the primary product name, or we can use extractProductQuery helper
  let query: string | undefined;
  const rawQuery = normalized;
  // If the intent is likely navigation, don't set product search query
  if (!screen && !category) {
    const stripped = tokens
      .filter(t => !['في', 'من', 'على', 'ال', 'مع', 'ب', 'ل', 'ديال', 'غير', 'فقط', 'بغيت', 'عافاك', 'شوف', 'وريني'].includes(t))
      .join(' ');
    query = stripped || undefined;
  }

  return {
    query,
    screen,
    category,
    productRef,
    limit,
    sort,
    products: matchedProducts.length > 0 ? matchedProducts : undefined,
    brands: matchedBrands.length > 0 ? matchedBrands : undefined,
    sizes: matchedSizes.length > 0 ? matchedSizes : undefined,
  };
};
