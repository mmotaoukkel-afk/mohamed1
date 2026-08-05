import { detectLanguage, tokenize } from './keywordParser';
import { extractEntities } from './entityExtractor';
import type { AnalyzedMessage } from '../types';

/**
 * Parses a raw user message into a structured AnalyzedMessage object.
 */
export const analyzeMessage = (text: string): AnalyzedMessage => {
  const originalText = text;
  const language = detectLanguage(text);
  const tokens = tokenize(text);
  const entities = extractEntities(text);

  return {
    originalText,
    language,
    tokens,
    entities,
  };
};
