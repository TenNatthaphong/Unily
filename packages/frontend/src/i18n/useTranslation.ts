import { useLocaleStore } from '../stores/locale.store';
import th from './th.json';
import en from './en.json';

const translations: Record<string, typeof th> = { th, en };

type NestedKeyOf<T, Prefix extends string = ''> = T extends object
  ? { [K in keyof T & string]: NestedKeyOf<T[K], Prefix extends '' ? K : `${Prefix}.${K}`> }[keyof T & string]
  : Prefix;

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  const dict = translations[locale] || th;

  function t(key: string): string {
    const keys = key.split('.');
    let result: unknown = dict;
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = (result as Record<string, unknown>)[k];
      } else {
        return key; // fallback: return key if not found
      }
    }
    return typeof result === 'string' ? result : key;
  }

  return { t, locale };
}
