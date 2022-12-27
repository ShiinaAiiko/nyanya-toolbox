import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import { getI18n } from 'react-i18next'
import store from '.'

import { Languages, languages, defaultLanguage } from '../plugins/i18n/i18n'
import { storage } from './storage'

export const configMethods = {
	init: createAsyncThunk('config/init', async (_, thunkAPI) => {
		const language = (await storage.global.get('language')) || 'system'
		thunkAPI.dispatch(configMethods.setLanguage(language))
	}),
	setLanguage: createAsyncThunk(
		'config/setLanguage',
		async (language: LanguageType, thunkAPI) => {
			thunkAPI.dispatch(configSlice.actions.setLanguage(language))

			// console.log('navigator.language', language, navigator.language)
			if (language === 'system') {
				const languages = ['zh-CN', 'zh-TW', 'en-US']
				if (languages.indexOf(navigator.language) >= 0) {
					getI18n().changeLanguage(navigator.language)
				} else {
					switch (navigator.language.substring(0, 2)) {
						case 'zh':
							getI18n().changeLanguage('zh-CN')
							break
						case 'en':
							getI18n().changeLanguage('en-US')
							break

						default:
							getI18n().changeLanguage('en-US')
							break
					}
				}
			} else {
				getI18n().changeLanguage(language)
			}

			store.dispatch(configSlice.actions.setLang(getI18n().language))

			await storage.global.set('language', language)
		}
	),
}
export type LanguageType = Languages | 'system'
export const language: LanguageType = defaultLanguage as any
export const configSlice = createSlice({
	name: 'config',
	initialState: {
		language: language,
		lang: '',
		languages: ['system', ...languages],
	},
	reducers: {
		setLanguage: (
			state,
			params: {
				payload: LanguageType
				type: string
			}
		) => {
			state.language = params.payload
		},
		setLang: (
			state,
			params: {
				payload: string
				type: string
			}
		) => {
			state.lang = params.payload
		},
	},
})
