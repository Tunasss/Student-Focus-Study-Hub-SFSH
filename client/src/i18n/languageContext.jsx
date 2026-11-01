/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'sfsh_lang';

function readInitialLang() {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'vi') return saved;
  } catch {
    // ignore storage errors
  }
  return 'en';
}

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
});

export function LanguageProvider({ children, initialLang }) {
  const [lang, setLangState] = useState(() => initialLang || readInitialLang());

  function setLang(next) {
    const normalized = next === 'vi' ? 'vi' : 'en';
    setLangState(normalized);
    try {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // ignore
    }
  }

  function toggleLang() {
    setLang(lang === 'en' ? 'vi' : 'en');
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

