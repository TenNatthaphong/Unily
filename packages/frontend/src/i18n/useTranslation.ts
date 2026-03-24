import th from './th.json';

export function useTranslation() {
  function t(key: string): string {
    const keys = key.split('.');
    let result: unknown = th;
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = (result as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    return typeof result === 'string' ? result : key;
  }

  return { t, locale: 'th' as const };
}
