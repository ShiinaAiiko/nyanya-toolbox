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
let localUser: LocalUser | undefined

const state = {
	token: '',
	deviceId: '',
	userAgent: userAgent(
		typeof window === 'undefined' ? '' : window?.navigator?.userAgent || ''
	),
	localUser,
	isLogin: false,
	tempLocalUsers: {} as {
		[deviceId: string]: LocalUser
	},
}
let modeName = 'localUser'
export const localUserSlice = createSlice({
	name: modeName,
	initialState: state,
	reducers: {
		setDeviceId: (
			state,
			params: {
				payload: string
				type: string
			}
		) => {
			state.deviceId = params.payload
		},
		setLocalUser: (
			state,
			params: {
				payload: LocalUser | undefined
				type: string
			}
		) => {
			state.localUser = params.payload
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
		setTempLocalUsers: (
			state,
			params: {
				payload: (typeof state)['tempLocalUsers']
				type: string
			}
		) => {
			state.tempLocalUsers = params.payload
		},
	},
})

export const localUserMethods = {
	login: createAsyncThunk(modeName + '/login', async (_, thunkAPI) => {
		const { emoji, localUser, user } = store.getState()
		const loginLocalUser = await getLoginLocalUser()
		// ;(await getLocalUsers()).forEach(async (v) => {
		// 	console.log(await deleteLocalUser(v.uid))
		// })
		if (loginLocalUser) {
			const obj = {
				...localUser.tempLocalUsers,
			}

			obj[loginLocalUser.deviceId] = loginLocalUser

			store.dispatch(localUserSlice.actions.setTempLocalUsers(obj))

			store.dispatch(localUserSlice.actions.setLocalUser(loginLocalUser))
			store.dispatch(localUserSlice.actions.setDeviceId(localUser?.deviceId))
			store.dispatch(localUserSlice.actions.setIsLogin(true))
			return
		}
		store.dispatch(localUserSlice.actions.setIsLogin(false))
	}),
	logout: createAsyncThunk(modeName + '/logout', async (_, thunkAPI) => {
		const { emoji } = store.getState()
		logoutLocalUser()
		store.dispatch(localUserSlice.actions.setLocalUser(undefined))
		store.dispatch(localUserSlice.actions.setDeviceId(''))
		store.dispatch(localUserSlice.actions.setIsLogin(false))
	}),
	createLocalUser: createAsyncThunk(
		modeName + '/createLocalUser',
		async (_, thunkAPI) => {
			return new Promise<boolean>((res, rej) => {
				const { localUser } = store.getState()

				if (localUser.localUser) {
					res(true)
					return
				}

				let nickname = ''
				let avatar = ''
				let uid = ''
				let username = ''
				let deviceId = ''

				const mp1 = multiplePrompts({
					title: t('createLocalUser', {
						ns: 'prompt',
					}),
					multipleInputs: [
						{
							label: 'nickname',
							value: nickname,
							placeholder: t('typeNickname', {
								ns: 'prompt',
							}),
							type: 'Text',
							onChange(value) {
								if (!value) {
									mp1.setInput({
										label: 'nickname',
										type: 'error',
										v: t('nicknameCannotBeEmpty', {
											ns: 'prompt',
										}),
									})
									return
								}

								nickname = value.trim()
								mp1.setInput({
									label: 'nickname',
									type: 'error',
									v: '',
								})
								return
							},
						},
					],
					closeIcon: true,
					flexButton: true,
					buttons: [
						{
							label: 'cancel',
							text: t('cancel', {
								ns: 'prompt',
							}),
							type: 'Normal',
							async onTap() {
								mp1.close()
								res(false)
							},
						},
						{
							label: 'Next',
							text: t('next', {
								ns: 'prompt',
							}),
							type: 'Primary',
							async onTap() {
								if (!nickname) {
									mp1.setInput({
										label: 'nickname',
										type: 'error',
										v: t('nicknameCannotBeEmpty', {
											ns: 'prompt',
										}),
									})
									return
								}
								mp1.setButton({
									label: 'Next',
									type: 'loading',
									v: true,
								})
								mp1.setButton({
									label: 'Next',
									type: 'disable',
									v: true,
								})

								console.log('创建本地用户')

								const localUser = await createLocalUser({
									nickname,
									avatar: '',
								})
								await loginLocalUser(localUser.uid)
								await store.dispatch(localUserMethods.login())

								mp1.setButton({
									label: 'Next',
									type: 'disable',
									v: false,
								})
								mp1.setButton({
									label: 'Next',
									type: 'loading',
									v: false,
								})

								mp1.close()
								res(true)
							},
						},
					],
				})
				mp1.open()
			})
		}
	),
}
