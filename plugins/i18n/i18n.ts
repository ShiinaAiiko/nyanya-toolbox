import i18next from 'i18next'
import { getI18n, initReactI18next } from 'react-i18next'
import enUS from './en-us.json'
import zhCN from './zh-cn.json'
import zhTW from './zh-tw.json'
import store from '../../store'

export const resources = {
  'zh-CN': {
    ...zhCN,
  },
  'zh-TW': {
    ...zhTW,
  },
  'en-US': {
    ...enUS,
  },
}

export const languages: Languages[] = Object.keys(resources).map((v: any) => {
  return v
})

export type Languages = keyof typeof resources
export let defaultLanguage: Languages = process.env.DEFAULT_LANGUAGE as any

export let i18n = i18next
export let t = i18n.t
export const initI18n = (res: typeof resources) => {
  console.log('SakiI18n', defaultLanguage)
  i18next
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
      resources: res,
      ns: ['common'],
      defaultNS: 'common',
      fallbackLng: defaultLanguage,
      lng: defaultLanguage,
      // fallbackLng: 'en-US',
      // lng: 'en-US',

      keySeparator: false, // we do not use keys in form messages.welcome

      interpolation: {
        escapeValue: false, // react already safes from xss
      },
    })

  setTimeout(() => {
    const { config } = store.getState()
    config.lang && changeLanguage(config.lang as any)
  })
}
initI18n(resources)

export const detectionLanguage = () => {
  if (languages.indexOf(navigator.language as any) >= 0) {
    // getI18n().changeLanguage(navigator.language)
    return navigator.language
  } else {
    switch (navigator.language.substring(0, 2)) {
      case 'ja':
        // getI18n().changeLanguage('en-US')
        return 'ja-JP'
      case 'zh':
        // getI18n().changeLanguage('en-US')
        return 'zh-CN'
        break
      case 'en':
        // getI18n().changeLanguage('en-US')
        return 'en-US'
        break

      default:
        // getI18n().changeLanguage('en-US')
        return 'en-US'
        break
    }
  }
}
export const changeLanguage = (language: Languages) => {
  // console.log(
  // 	'----------------changeLanguage lang',
  // 	defaultLanguage,
  // 	i18n.language,
  // 	language
  // )
  console.log('SakiI18n store', language)

  process.env.OUTPUT === 'export' && (defaultLanguage = language)
  getI18n().changeLanguage(language)
  // console.log(
  // 	'----------------changeLanguage lang',
  // 	defaultLanguage,
  // 	i18n.language,
  // 	language
  // )
}

export default i18n
