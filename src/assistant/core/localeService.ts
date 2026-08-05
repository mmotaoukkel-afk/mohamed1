import i18n from '../../i18n';

export type AssistantLocale = 'ar' | 'en';

/**
 * Gets the current active locale of the application from i18n
 */
export function getAssistantLocale(): AssistantLocale {
  // Forced to 'ar' to disable English support from the assistant completely
  return 'ar';
}
