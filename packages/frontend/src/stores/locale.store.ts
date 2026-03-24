import { create } from 'zustand';

type Locale = 'th';

interface LocaleState {
  locale: Locale;
  toggle: () => void;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>(() => ({
  locale: 'th',
  toggle: () => { /* ระบบใช้ภาษาไทยเท่านั้น */ },
  setLocale: () => { /* ระบบใช้ภาษาไทยเท่านั้น */ },
}));

// Lock locale on load
localStorage.setItem('locale', 'th');
document.documentElement.setAttribute('data-locale', 'th');
