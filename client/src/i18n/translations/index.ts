import type { SupportedLanguage, TranslationDict } from '../types.js';
import { en } from './en.js';
import { ru } from './ru.js';
import { es } from './es.js';
import { fr } from './fr.js';
import { pt } from './pt.js';
import { zh } from './zh.js';
import { ja } from './ja.js';
import { de } from './de.js';

export const translations: Record<SupportedLanguage, TranslationDict> = {
  en,
  ru,
  es,
  fr,
  pt,
  zh,
  ja,
  de,
};

export { en, ru, es, fr, pt, zh, ja, de };
