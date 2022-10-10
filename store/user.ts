import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, { ActionParams, methods, RootState } from '.'
import Router from 'next/router'
// import getUserAgent from '@nyanyajs/utils/dist/userAgent'
// import { storage } from './storage'
import { UserAgent } from '@nyanyajs/utils/dist/userAgent'
import { deepCopy, QueueLoop } from '@nyanyajs/utils'
import { multiplePrompts, snackbar } from '@saki-ui/core'
import { getI18n } from 'react-i18next'

const effectiveDays = 21

const codeQueueloop = new QueueLoop({
	delayms: 1000,
})
export const userMethods = {}
// window.navigator.userAgent
// console.log({
// 	device: userAgent.device,
// 	deviceName: userAgent.deviceName,
// 	deviceId: '',
// 	browser: userAgent.browser,
// 	os: userAgent.os,
// })
export const userSlice = createSlice({
	name: 'user',
	initialState: {
		token: '',
	},
	reducers: {},
})
