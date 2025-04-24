import {
  createSlice,
  createAsyncThunk,
  combineReducers,
  configureStore,
} from '@reduxjs/toolkit'
import { getI18n } from 'react-i18next'
import store, { ActionParams, methods } from '.'

import { Languages, languages, defaultLanguage, changeLanguage } from '../plugins/i18n/i18n'
import { storage } from './storage'
import { NRequest, SAaSS } from '@nyanyajs/utils'
import moment from 'moment'
import 'moment/locale/zh-cn'
import 'moment/locale/zh-tw'
import axios from 'axios'
import { appListUrl } from '../config'

export type DeviceType = 'Mobile' | 'Pad' | 'PC'
export type LanguageType = Languages | 'system'
export let deviceType: DeviceType | undefined

export const R = new NRequest()
export const saass = new SAaSS({
  baseUrl: '',
})

export const language: LanguageType = defaultLanguage as any
export const configSlice = createSlice({
  name: 'config',
  initialState: {
    language: language,
    defaultLanguage: defaultLanguage,
    lang: '',
    languages: ['system', ...languages],
    deviceType,
    deviceWH: {
      w: 0,
      h: 0,
    },
    appList: [] as {
      title: {
        [lang: string]: string
      }
      url: string
      logoText: string
    }[],
    ssoAccount: false,
    pwaApp: false,
    appearance: 'system',
  },
  reducers: {
    setAppearance: (
      state,
      params: {
        payload: (typeof state)['appearance']
        type: string
      }
    ) => {
      state.appearance = params.payload
      storage.global.setSync('appearance', state.appearance)

      const el = document.body
      // const el = document.body.querySelector('#__next')

      if (!el) return

      // document.querySelector(":root")
      el.classList.remove(
        'system-mode',
        'dark-mode',
        'black-mode',
        'light-mode'
      )
      el.classList.add(state.appearance + '-mode')

      const themeColorEl = document.head.querySelector(
        "meta[name='theme-color']"
      )
      console.log('themeColorEl', themeColorEl)
      if (themeColorEl) {
        if (state.appearance === 'dark') {
          themeColorEl.setAttribute('content', '#1e1e1e')
          return
        }
        if (state.appearance === 'black') {
          themeColorEl.setAttribute('content', '#000')
          return
        }
        if (state.appearance === 'light') {
          themeColorEl.setAttribute('content', '#fff')
          return
        }
      }
    },
    setPwaApp: (
      state,
      params: {
        payload: (typeof state)['pwaApp']
        type: string
      }
    ) => {
      state.pwaApp = params.payload
    },
    setAppList: (
      state,
      params: {
        payload: (typeof state)['appList']
        type: string
      }
    ) => {
      state.appList = params.payload
    },
    setLanguage: (
      state,
      params: {
        payload: LanguageType
        type: string
      }
    ) => {
      state.language = params.payload
    },
    setSsoAccount: (
      state,
      params: {
        payload: boolean
        type: string
      }
    ) => {
      state.ssoAccount = params.payload
    },
    setLang: (
      state,
      params: {
        payload: string
        type: string
      }
    ) => {
      state.lang = params.payload
      moment.locale(state.lang)
    },
    setDeviceType: (state, params: ActionParams<DeviceType>) => {
      state.deviceType = params.payload
    },
    setDeviceWH: (state, params: ActionParams<void>) => {
      state.deviceWH = {
        w: window.innerWidth,
        h: window.innerHeight,
      }
    },
  },
})

export const configMethods = {
  init: createAsyncThunk('config/init', async (_, thunkAPI) => {
    // const language = (await storage.global.get('language')) || 'system'
    // thunkAPI.dispatch(configMethods.setLanguage(language))
    thunkAPI.dispatch(
      configSlice.actions.setAppearance(
        'light'
        // (await storage.global.get('appearance')) || 'system'
      )
    )

    window.addEventListener('resize', () => {
      thunkAPI.dispatch(configMethods.getDeviceType())
    })

    thunkAPI.dispatch(configMethods.getDeviceType())
    const res = await axios({
      method: 'GET',
      url: appListUrl,
    })
    res?.data?.appList &&
      thunkAPI.dispatch(configSlice.actions.setAppList(res.data.appList))
  }),
  setLanguage: createAsyncThunk(
    'config/setLanguage',
    async (language: LanguageType, thunkAPI) => {
      thunkAPI.dispatch(configSlice.actions.setLanguage(language))

      // console.log('navigator.language', language, navigator.language)
      if (language === 'system') {
        const languages = ['zh-CN', 'zh-TW', 'en-US']
        if (languages.indexOf(navigator.language) >= 0) {
          changeLanguage(navigator.language as any)
        } else {
          switch (navigator.language.substring(0, 2)) {
            case 'zh':
              changeLanguage('zh-CN')
              break
            case 'en':
              changeLanguage('en-US')
              break

            default:
              changeLanguage('en-US')
              break
          }
        }
      } else {
        changeLanguage(language)
      }

      store.dispatch(configSlice.actions.setLang(getI18n().language))
      await storage.global.set('language', language)
    }
  ),
  getDeviceType: createAsyncThunk('config/getDeviceType', (_, thunkAPI) => {
    console.log('getDeviceType', document.body.offsetWidth)

    thunkAPI.dispatch(configSlice.actions.setDeviceWH())
    if (document.body.offsetWidth <= 768) {
      thunkAPI.dispatch(configSlice.actions.setDeviceType('Mobile'))
      return
    }
    if (document.body.offsetWidth <= 1024 && document.body.offsetWidth > 768) {
      thunkAPI.dispatch(configSlice.actions.setDeviceType('Pad'))
      return
    }
    thunkAPI.dispatch(configSlice.actions.setDeviceType('PC'))
  }),
}
