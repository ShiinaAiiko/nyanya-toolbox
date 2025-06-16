import {
  createSlice,
  createAsyncThunk,
  combineReducers,
  configureStore,
} from '@reduxjs/toolkit'
import { getI18n } from 'react-i18next'
import store, { ActionParams, methods } from '.'

import {
  Languages,
  languages,
  defaultLanguage,
  changeLanguage,
} from '../plugins/i18n/i18n'
import { storage } from './storage'
import { deepCopy, NRequest, SAaSS } from '@nyanyajs/utils'
import moment from 'moment'
import 'moment/locale/zh-cn'
import 'moment/locale/zh-tw'
import axios from 'axios'
import { appListUrl } from '../config'
import { snackbar } from '@saki-ui/core'
import { R } from './config'

let watchId = -1

const getIpPosition = async (t: number) => {
  setTimeout(async () => {
    const { position } = store.getState()

    console.log('watchPosition getIpPosition', position)
    if (position.position?.coords?.latitude) {
      return
    }

    const res = await R.request({
      method: 'GET',
      url: 'https://tools.aiiko.club/api/v1/ip/details?ip=&language=zh-CN',
    })

    console.log('watchPosition getIpPosition', res?.data?.data)
    if (res?.data?.data?.ipv4) {
      store.dispatch(
        positionSlice.actions.setPosition({
          ...position,
          coords: {
            latitude: res?.data?.data?.lat || 0,
            longitude: res?.data?.data?.lon || 0,
          },
          timestamp: new Date().getTime(),
        } as any)
      )
    }
  }, t)
}

export const positionSlice = createSlice({
  name: 'position',
  initialState: {
    position: undefined as GeolocationPosition | undefined,
    allowWatchPosition: true,
  },
  reducers: {
    setAllowWatchPosition: (
      state,
      params: {
        payload: (typeof state)['allowWatchPosition']
        type: string
      }
    ) => {
      console.log('curCityIndex set state.allowWatchPosition =', params.payload)
      state.allowWatchPosition = params.payload
    },
    setPosition: (
      state,
      params: {
        payload: (typeof state)['position']
        type: string
      }
    ) => {
      // console.log('getWeather res setPosition')
      state.position = params.payload
      storage.global.setSync('curPosition', params.payload)
    },
  },
})

export const positionMethods = {
  watchPosition: createAsyncThunk(
    'position/watchPosition',
    async (
      {
        watch,
      }: {
        watch: boolean
      },
      thunkAPI
    ) => {
      const { position } = store.getState()

      console.log(
        'watchPosition curCityIndex router?.query allowWatchPosition',
        location.search.includes('lat='),
        position,
        !position.allowWatchPosition,
        location.search.includes('lat=') && location.search.includes('lng=')
      )
      if (
        !position.allowWatchPosition ||
        (location.search.includes('lat=') && location.search.includes('lng='))
      ) {
        return
      }
      console.log('watchPosition position.position', position.position)

      if (!position.position) {
        const curPosition = await storage.global.get('curPosition')
        console.log('watchPosition position.position', curPosition)

        if (curPosition?.timestamp && curPosition?.accuracy) {
          thunkAPI.dispatch(positionSlice.actions.setPosition(curPosition))
        } else {
          getIpPosition(5000)
        }
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            thunkAPI.dispatch(positionSlice.actions.setPosition(pos))
          },
          (error) => {
            if (error.code === 1) {
              snackbar({
                message: '必须开启定位权限，请检查下是否开启定位权限',
                autoHideDuration: 2000,
                vertical: 'top',
                horizontal: 'center',
                closeIcon: true,
              }).open()

              getIpPosition(0)
            }
            console.log('GetCurrentPosition Error', error)
          },
          { enableHighAccuracy: true }
        )

        if (watch) {
          navigator.geolocation.clearWatch(watchId)

          watchId = navigator.geolocation.watchPosition(
            (pos) => {
              console.log('watchPosition', pos, {
                ...deepCopy(pos.coords),
                timestamp: pos.timestamp,
              })
              thunkAPI.dispatch(positionSlice.actions.setPosition(pos))
            },
            (error) => {
              console.log('GetCurrentPosition Error', error)
            },
            {
              enableHighAccuracy: true,
              maximumAge: 30000,
              timeout: 10000,
            }
          )
        }
      } else {
        console.log('该浏览器不支持获取地理位置')
        getIpPosition(0)
      }
    }
  ),
}
