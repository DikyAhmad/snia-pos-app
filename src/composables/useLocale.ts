import en from '@/locales/en'
import id from '@/locales/id'
import { computed } from 'vue'

const getSystemLang = () => {
  if (typeof navigator !== 'undefined') {
    if (navigator.language.startsWith('id')) return 'id'
  }
  return 'en'
}

const lang = getSystemLang()
const locales = { en, id }

export function useLocale() {
  return {
    t: (key: keyof typeof en) => locales[lang][key] || key,
    lang: computed(() => lang),
  }
}
