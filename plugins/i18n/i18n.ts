import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from './en-us.json'
import zhCN from './zh-cn.json'
import zhTW from './zh-tw.json'

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

export const defaultLanguage: Languages = 'zh-CN'

i18n
	.use(initReactI18next) // passes i18n down to react-i18next
	.init({
		resources,
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

export default i18n
