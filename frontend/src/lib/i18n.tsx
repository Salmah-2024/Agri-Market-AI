import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/**
 * Lugha ya mfumo / App language.
 * Chaguo-msingi ni Kiswahili ('sw'). Mtumiaji anaweza kubadili kwenda Kiingereza ('en').
 * Default is Swahili ('sw'); users can switch to English ('en').
 */
export type Lang = 'sw' | 'en'

const KEY = 'agri_lang'

function read(): Lang {
  try {
    return localStorage.getItem(KEY) === 'en' ? 'en' : 'sw'
  } catch {
    return 'sw'
  }
}

type Ctx = {
  lang: Lang
  setLang: (l: Lang) => void
  toggle: () => void
}

const LanguageContext = createContext<Ctx>({ lang: 'sw', setLang: () => {}, toggle: () => {} })

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(read)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)
  const toggle = () => setLangState((l) => (l === 'sw' ? 'en' : 'sw'))

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle }}>{children}</LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}

/**
 * Hook ya kutafsiri. Tumia hivi:  const t = useT();  t('Kiswahili', 'English')
 * Translation hook. Usage:  const t = useT();  t('Swahili text', 'English text')
 * Kiswahili huwa hoja ya kwanza (default). Swahili is always the first argument.
 */
export function useT() {
  const { lang } = useLang()
  return (sw: string, en: string) => (lang === 'sw' ? sw : en)
}
