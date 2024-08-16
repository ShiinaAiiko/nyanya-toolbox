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
import userAgent, { UserAgent } from '@nyanyajs/utils/dist/userAgent'
import { deepCopy, QueueLoop } from '@nyanyajs/utils'
import SakiSSOClient, {
	createLocalUser,
	getLocalUsers,
	UserInfo,
} from '@nyanyajs/utils/dist/sakisso'
import { alert, multiplePrompts, snackbar } from '@saki-ui/core'
import { getI18n } from 'react-i18next'
import { createInstance, t } from 'i18next'
import {
	deleteLocalUser,
	getLoginLocalUser,
	LocalUser,
	loginLocalUser,
	logoutLocalUser,
} from '@nyanyajs/utils/dist/sakisso/localUser'
import { storage } from './storage'
import { sakisso } from '../config'

const effectiveDays = 21

const codeQueueloop = new QueueLoop({
	delayms: 1000,
})
// window.navigator.userAgent
// console.log({
// 	device: userAgent.device,
// 	deviceName: userAgent.deviceName,
// 	deviceId: '',
// 	browser: userAgent.browser,
// 	os: userAgent.os,
// })

export let client: SakiSSOClient | undefined

export let userInfo: UserInfo = {
	uid: '',
	username: '',
	email: '',
	phone: '',
	nickname: '',
	avatar: '',
	bio: '',
	city: [],
	gender: -1,
	birthday: '',
	status: -1,
	additionalInformation: {},
	appData: {},
	creationTime: -1,
	lastUpdateTime: -1,
	lastSeenTime: -1,
}

export interface TempUserInfo {
	uid: string
	username: string
	nickname: string
	avatar: string
	createTime: number
	lastUpdateTime: number
	lastLoginTime: number
	deviceId: string
	userAgent: UserAgent
}

export const getTempUser = (): TempUserInfo => {
	const { user } = store.getState()
	return {
		uid: user.userInfo.uid,
		username: user.userInfo.username,
		nickname: user.userInfo.nickname,
		avatar: user.userInfo.avatar,
		createTime: user.userInfo.creationTime,
		lastUpdateTime: user.userInfo.lastUpdateTime,
		lastLoginTime: user.userInfo.lastSeenTime,
		deviceId: user.deviceId,
		userAgent: user.userAgent,
	}
}

const state = {
	token: '',
	deviceId: '',
	userAgent: userAgent(
		typeof window === 'undefined' ? '' : window?.navigator?.userAgent || ''
	),
	userInfo: {} as UserInfo,
	isLogin: false,
	isInit: false,
	tempUsers: {} as {
		[deviceId: string]: TempUserInfo
	},
}

let modeName = 'user'

export const userSlice = createSlice({
	name: modeName,
	initialState: state,
	reducers: {
		setTempUsers: (
			state,
			params: {
				payload: (typeof state)['tempUsers']
				type: string
			}
		) => {
			state.tempUsers = params.payload
		},
		setInit: (state, params: ActionParams<boolean>) => {
			state.isInit = params.payload
		},
		setDeviceId: (
			state,
			params: {
				payload: string
				type: string
			}
		) => {
			state.deviceId = params.payload
		},
		setIsLogin: (
			state,
			params: {
				payload: boolean
				type: string
			}
		) => {
			state.isLogin = params.payload
		},
		login: (
			state,
			params: ActionParams<{
				token: string
				deviceId: string
				userInfo: UserInfo
			}>
		) => {
			const { token, deviceId, userInfo } = params.payload
			state.token = token || ''
			state.deviceId = deviceId || ''
			state.userInfo = userInfo || Object.assign({}, userInfo)
			state.isLogin = !!token
			if (token) {
				storage.global.setSync('token', token)
				storage.global.setSync('deviceId', deviceId)
				storage.global.setSync('userInfo', userInfo)
			}
			setTimeout(() => {
				const { user } = store.getState()
				const obj = {
					...user.tempUsers,
				}

				obj[user.deviceId] = getTempUser()

				store.dispatch(userSlice.actions.setTempUsers(obj))
				// store.dispatch(storageSlice.actions.init(userInfo.uid))
			})
			// store.dispatch(userSlice.actions.init({}))
		},
		logout: (state, _) => {
			storage.global.delete('token')
			storage.global.delete('deviceId')
			storage.global.delete('userInfo')
			state.token = ''
			state.deviceId = ''
			state.userInfo = Object.assign({}, userInfo)
			state.isLogin = false
		},
	},
})

export const userMethods = {
	initSSOClient: createAsyncThunk(
		modeName + '/initSSOClient',
		async (_, thunkAPI) => {
			const { user } = store.getState()
			client = new SakiSSOClient({
				appId: sakisso.appId,
				clientUrl: sakisso.clientUrl,
				serverUrl: sakisso.serverUrl,
				userAgent: user.userAgent,
			})
		}
	),
	initUser: createAsyncThunk(modeName + '/initUser', async (_, thunkAPI) => {
		// 获取配置
		// console.log(await storage.config.get('language'))
		// thunkAPI.dispatch(userSlice.actions.setInit(false))
		const { user, config } = store.getState()
		console.log('校验token是否有效')
		const token = await storage.global.get('token')
		const deviceId = await storage.global.get('deviceId')
		const userInfo = await storage.global.get('userInfo')
		if (token) {
			thunkAPI.dispatch(
				userSlice.actions.login({
					token: token,
					deviceId: deviceId,
					userInfo: userInfo,
				})
			)
			// 检测网络状态情况
			await thunkAPI
				.dispatch(
					methods.user.checkToken({
						token,
						deviceId,
					})
				)
				.unwrap()
		} else {
			thunkAPI.dispatch(userSlice.actions.logout({}))
		}
		thunkAPI.dispatch(userSlice.actions.setInit(true))
	}),
	checkToken: createAsyncThunk(
		modeName + '/checkToken',
		async (
			{
				token,
				deviceId,
			}: {
				token: string
				deviceId: string
			},
			thunkAPI
		) => {
			try {
				const res = await client?.checkToken({
					token,
					deviceId,
				})
				console.log('res checkToken', res)
				if (res) {
					// console.log('登陆成功')
					thunkAPI.dispatch(
						userSlice.actions.login({
							token: res.token,
							deviceId: res.deviceId,
							userInfo: res.userInfo,
						})
					)
				} else {
					thunkAPI.dispatch(userSlice.actions.logout({}))
				}
			} catch (error) {}
		}
	),
	logout: createAsyncThunk(modeName + '/logout', async (_, thunkAPI) => {
		alert({
			title: t('logout', {
				ns: 'prompt',
			}),
			content: t('logoutContent', {
				ns: 'prompt',
			}),
			cancelText: t('cancel', {
				ns: 'prompt',
			}),
			confirmText: t('logout', {
				ns: 'prompt',
			}),
			onCancel() {},
			async onConfirm() {
				thunkAPI.dispatch(userSlice.actions.logout({}))
				snackbar({
					message: t('logoutSuccessfully', {
						ns: 'prompt',
					}),
					autoHideDuration: 2000,
					vertical: 'top',
					horizontal: 'center',
					backgroundColor: 'var(--saki-default-color)',
					color: '#fff',
				}).open()
			},
		}).open()
	}),
}
