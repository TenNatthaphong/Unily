import { create } from 'zustand';

type Locale = 'th' | 'en';

interface LocaleState {
  locale: Locale;
  toggle: () => void;
  setLocale: (locale: Locale) => void;
}

function getInitialLocale(): Locale {
  const stored = localStorage.getItem('locale') as Locale | null;
  return stored === 'en' ? 'en' : 'th';
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: getInitialLocale(),

  toggle: () => set((state) => {
    const next = state.locale === 'th' ? 'en' : 'th';
    localStorage.setItem('locale', next);
    document.documentElement.setAttribute('data-locale', next);
    return { locale: next };
  }),

  setLocale: (locale) => {
    localStorage.setItem('locale', locale);
    document.documentElement.setAttribute('data-locale', locale);
    set({ locale });
  },
}));

// Apply locale on load
const initial = getInitialLocale();
document.documentElement.setAttribute('data-locale', initial);
