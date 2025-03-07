import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, { ActionParams } from '.'
import { Debounce, WebStorage, getShortId } from '@nyanyajs/utils'
import SAaSS from '@nyanyajs/utils/dist/saass'
import { RoomInfo } from './fileTransfer'
import { alert, multiplePrompts } from '@saki-ui/core'
import { t } from '../plugins/i18n/i18n'
import { storage } from './storage'
import { showSnackbar } from '../plugins/methods'
import moment from 'moment'
import { protoRoot } from '../protos'
import httpApi from '../plugins/http/api'
import { getHash } from '@nyanyajs/utils/dist/file'
import { saass } from './config'
// import { User } from './user'
// import { WebStorage } from '@nyanyajs/utils'

export const getCountdownDay = (
	v: protoRoot.countdownDays.ICountdownDaysEvent
) => {
	if (!v?.repeatType?.type) {
		return {
			nextDate: '',
			day: 0,
		}
	}

	const repeatNum = Number(v.repeatType?.num) || 0

	// console.log(v.name, v)
	const now = new Date(moment().format('YYYY-MM-DD 00:00:00'))
	let nextDate = new Date(moment(v.date).format('YYYY-MM-DD 0:0:0'))

	if (v.repeatType?.type === 'Year') {
		while (nextDate.getTime() < now.getTime()) {
			nextDate = new Date(
				`${nextDate.getFullYear() + repeatNum}-${
					nextDate.getMonth() + 1
				}-${nextDate.getDate()} 00:00:00`
			)
		}
	}

	if (v.repeatType?.type === 'Month') {
		while (nextDate.getTime() < now.getTime()) {
			let y = nextDate.getFullYear()
			let m = nextDate.getMonth() + 1 + repeatNum
			if (m + repeatNum > 12) {
				m = m % 12
				y = y + Math.floor(25 / 12)
			}
			nextDate = new Date(`${y}-${m}-${nextDate.getDate()} 00:00:00`)
		}
	}

	if (v.repeatType?.type === 'Week') {
		while (nextDate.getTime() < now.getTime()) {
			nextDate = new Date(nextDate.getTime() + repeatNum * 7 * 3600 * 24 * 1000)
		}
	}
	if (v.repeatType?.type === 'Day') {
		while (nextDate.getTime() < now.getTime()) {
			nextDate = new Date(nextDate.getTime() + repeatNum * 3600 * 24 * 1000)
		}
	}
	if (v.repeatType?.type === 'Never') {
		const day = Math.ceil(
			(now.getTime() - nextDate.getTime()) / (1000 * 24 * 3600)
		)
		return {
			nextDate: '',
			day: day,
		}
	}

	const day = Math.ceil(
		(nextDate.getTime() - now.getTime()) / (1000 * 24 * 3600)
	)

	// console.log(
	// 	'nextDate',
	// 	v.name,
	// 	nextDate,
	// 	now,
	// 	nextDate.getTime() - now.getTime()
	// )

	return {
		nextDate: moment(nextDate).format('LL dddd'),
		day,
	}
}

const d = new Debounce()

const state = {
	categories: [] as protoRoot.countdownDays.ICountdownDaysCategory[],
	list: [] as protoRoot.countdownDays.ICountdownDaysEvent[],
	showType: 'Grid' as 'List' | 'Grid',
	showEventItemId: '',
	createTime: 0,
	syncing: false,
	lastUpdateTime: 0,
	downloadDataStatus: {
		local: false,
		saass: false,
		readySync: false,
	},
	allowSync: false,
}

export const countdownDaysSlice = createSlice({
	name: 'countdownDays',
	initialState: state,
	reducers: {
		init: (state) => {
			let uid = 0
		},
		setSyncing: (state, params: ActionParams<(typeof state)['syncing']>) => {
			state.syncing = params.payload
		},
		setDownloadDataStatus: (
			state,
			params: ActionParams<(typeof state)['downloadDataStatus']>
		) => {
			state.downloadDataStatus = params.payload
		},
		setLastUpdateTime: (
			state,
			params: ActionParams<(typeof state)['lastUpdateTime']>
		) => {
			state.lastUpdateTime = params.payload
		},
		setCreateTime: (
			state,
			params: ActionParams<(typeof state)['createTime']>
		) => {
			state.createTime = params.payload
		},
		setCategories: (
			state,
			params: ActionParams<(typeof state)['categories']>
		) => {
			state.categories = params.payload

			storage.global.setSync('countdownDays-categories', params.payload)

			setTimeout(() => {
				store.dispatch(
					countdownDaysMethods.syncData({
						rename: false,
					})
				)
			})
		},
		setList: (
			state,
			params: ActionParams<protoRoot.countdownDays.ICountdownDaysEvent[]>
		) => {
			params.payload = params.payload.map((v) => {
				return {
					...v,
					countdownData: getCountdownDay(v),
				}
			})

			params.payload.sort((a, b) => {
				return Number(a.countdownData?.day) - Number(b.countdownData?.day)
			})

			state.list = params.payload
				.filter((v) => {
					return v.repeatType?.type !== 'Never'
				})
				.concat(
					params.payload.filter((v) => {
						return v.repeatType?.type === 'Never'
					})
				)

			console.log('params.payload', params.payload)
			storage.global.setSync(
				'countdownDays-list',
				params.payload.map((v) => {
					return {
						...v,
					}
				})
			)
			setTimeout(() => {
				store.dispatch(
					countdownDaysMethods.syncData({
						rename: false,
					})
				)
			})
		},
		setShowType: (state, params: ActionParams<(typeof state)['showType']>) => {
			state.showType = params.payload

			storage.global.setSync('countdownDays-showType', params.payload)
		},
		setShowEventItemId: (
			state,
			params: ActionParams<(typeof state)['showEventItemId']>
		) => {
			state.showEventItemId = params.payload
		},
	},
})

const name = countdownDaysSlice.name

export const countdownDaysMethods = {
	init: createAsyncThunk(name + '/init', async (_, thunkAPI) => {
		store.dispatch(
			countdownDaysSlice.actions.setLastUpdateTime(
				(await storage.global.get('countdownDays-lastUpdateTime')) || -1
			)
		)
		store.dispatch(
			countdownDaysSlice.actions.setCreateTime(
				(await storage.global.get('countdownDays-createTime')) ||
					Math.floor(new Date().getTime() / 1000)
			)
		)

		let categories = await storage.global.get('countdownDays-categories')
		if (!categories) {
			categories = [
				{
					id: getShortId(9),
					name: '生日',
					sort: 1,
					createTime: Math.floor(new Date().getTime() / 1000),
					lastUpdateTime: -1,
				},
				{
					id: getShortId(9),
					name: '日常',
					sort: 2,
					createTime: Math.floor(new Date().getTime() / 1000),
					lastUpdateTime: -1,
				},
			]
		}
		store.dispatch(countdownDaysSlice.actions.setCategories(categories || []))

		const list = await storage.global.get('countdownDays-list')
		store.dispatch(countdownDaysSlice.actions.setList(list || []))
		const showType = await storage.global.get('countdownDays-showType')
		store.dispatch(countdownDaysSlice.actions.setShowType(showType || 'Grid'))

		store.dispatch(
			countdownDaysSlice.actions.setDownloadDataStatus({
				...store.getState().countdownDays.downloadDataStatus,
				local: true,
			})
		)
	}),
	downloadData: createAsyncThunk(
		name + '/downloadData',
		async (_, thunkAPI) => {
			try {
				// 远程数据同步下来
				const res = await httpApi.CountdownDays.GetCountdownDaysFileUrls()
				console.log('downloadData', res)
				if (res.code === 200 && res?.data?.urls?.domainUrl) {
					const { countdownDays } = store.getState()

					// 线上对比
					if (
						Math.floor(Number(res?.data?.fileInfo?.lastModified) / 1000) - 2 <=
						countdownDays.lastUpdateTime
					) {
						console.log('老版本')

						store.dispatch(
							countdownDaysSlice.actions.setDownloadDataStatus({
								...store.getState().countdownDays.downloadDataStatus,
								saass: true,
							})
						)
						return
					}

					const data: protoRoot.countdownDays.ICountdownDaysData = await (
						await fetch(
							(res.data.urls?.domainUrl || '') +
								res.data.urls?.shortUrl +
								'?timestamp=' +
								new Date().getTime()
						)
					).json()
					if (!data) {
						return
					}

					console.log(data, countdownDays)
					console.log(Number(data.lastUpdateTime), countdownDays.lastUpdateTime)
					// 检测线下对比是否更新
					if (Number(data.lastUpdateTime) <= countdownDays.lastUpdateTime) {
						console.log('老版本')

						store.dispatch(
							countdownDaysSlice.actions.setDownloadDataStatus({
								...store.getState().countdownDays.downloadDataStatus,
								saass: true,
							})
						)
						return
					}
					console.log('开始下载并同步')

					store.dispatch(countdownDaysMethods.replaceData(data))

					console.log(data)
					store.dispatch(
						countdownDaysSlice.actions.setDownloadDataStatus({
							...store.getState().countdownDays.downloadDataStatus,
							saass: true,
						})
					)
				} else {
					store.dispatch(
						countdownDaysSlice.actions.setDownloadDataStatus({
							...store.getState().countdownDays.downloadDataStatus,
							saass: true,
						})
					)
				}
			} catch (error) {
				console.error(error)
				showSnackbar(
					t('failedToConnectToApp', {
						appName: 'SAaSS',
						ns: 'prompt',
					})
				)
			}
		}
	),
	replaceData: createAsyncThunk(
		name + '/replaceData',
		async (data: protoRoot.countdownDays.ICountdownDaysData, thunkAPI) => {
			store.dispatch(
				countdownDaysSlice.actions.setLastUpdateTime(
					Number(data.lastUpdateTime) || -1
				)
			)
			storage.global.setSync(
				'countdownDays-lastUpdateTime',
				Number(data.lastUpdateTime) || -1
			)

			store.dispatch(
				countdownDaysSlice.actions.setCreateTime(
					Number(data.createTime) || Math.floor(new Date().getTime() / 1000)
				)
			)
			store.dispatch(
				countdownDaysSlice.actions.setCategories(data.categories || [])
			)
			store.dispatch(countdownDaysSlice.actions.setList(data.list || []))
		}
	),
	addAndUpdateCategory: createAsyncThunk(
		name + '/addAndUpdateCategory',
		async (
			{
				id,
			}: {
				id?: string
			},
			thunkAPI
		) => {
			const { countdownDays } = store.getState()

			let name = ''

			const cate = countdownDays.categories.filter((v) => v.id === id)?.[0]

			if (cate?.id) {
				name = cate?.name || ''
			}
			const mp1 = multiplePrompts({
				title: t(!id ? 'addCategory' : 'updateCategory', {
					ns: 'countdownDaysPage',
				}),
				multipleInputs: [
					{
						label: 'name',
						value: name,
						placeholder: t('categoryName', { ns: 'countdownDaysPage' }),
						type: 'Text',
						onChange(value) {
							name = value.trim()
							mp1.setButton({
								label: 'Next',
								type: 'disabled',
								v: !name,
							})
							if (!value) {
								mp1.setInput({
									label: 'name',
									type: 'error',
									v: t('cannotBeEmpty', {
										ns: 'prompt',
									}),
								})
								return
							}

							mp1.setInput({
								label: 'name',
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
						},
					},
					{
						label: 'Next',
						text: t('next', {
							ns: 'prompt',
						}),
						type: 'Primary',
						disabled: true,
						async onTap() {
							mp1.setButton({
								label: 'Next',
								type: 'disabled',
								v: !name,
							})
							if (!name) {
								mp1.setInput({
									label: 'name',
									type: 'error',
									v: t('cannotBeEmpty', {
										ns: 'prompt',
									}),
								})
								return
							}

							const { countdownDays } = store.getState()

							mp1.close()
							if (cate?.id) {
								store.dispatch(
									countdownDaysSlice.actions.setCategories(
										countdownDays.categories.map((v) => {
											if (v.id === cate.id) {
												return {
													...v,
													name,
													lastUpdateTime: Math.floor(
														new Date().getTime() / 1000
													),
												}
											}
											return v
										})
									)
								)
								showSnackbar(
									t('updateSuccessfully', {
										ns: 'prompt',
									})
								)
								return
							}

							store.dispatch(
								countdownDaysSlice.actions.setCategories([
									...countdownDays.categories,
									{
										id: getShortId(9),
										name,
										sort: countdownDays.categories.length + 1,
										createTime: Math.floor(new Date().getTime() / 1000),
										lastUpdateTime: -1,
									},
								])
							)
							showSnackbar(
								t('createSuccessfully', {
									ns: 'prompt',
								})
							)
						},
					},
				],
			})
			mp1.open()
			return
		}
	),
	deleteCategory: createAsyncThunk(
		name + '/deleteCategory',
		async (
			{
				id,
			}: {
				id: string
			},
			thunkAPI
		) => {
			const { countdownDays } = store.getState()

			alert({
				title: t('delete', {
					ns: 'prompt',
				}),
				content: t('deleteThisCategory', {
					ns: 'prompt',
				}),
				cancelText: t('cancel', {
					ns: 'prompt',
				}),
				confirmText: t('delete', {
					ns: 'prompt',
				}),
				onCancel() {},
				async onConfirm() {
					// 检测是否有事件，有的话，清空其分类，作为无分类处理

					store.dispatch(
						countdownDaysSlice.actions.setCategories(
							countdownDays.categories.filter((v) => {
								return v.id !== id
							})
						)
					)

					showSnackbar(t('deleteSuccessfully'))
				},
			}).open()
		}
	),
	addCountdownDaysEvent: createAsyncThunk(
		name + '/addCountdownDaysEvent',
		async (
			{
				name,
				date,
				categoryId,
				repeatType,
				top,
			}: {
				name: string
				date: string
				categoryId: string
				repeatType: {
					type: 'Never' | 'Day' | 'Week' | 'Month' | 'Year'
					num: number
				}
				top: boolean
			},
			thunkAPI
		) => {
			console.log('addCountdownDaysEvent')
			const { countdownDays } = store.getState()

			store.dispatch(
				countdownDaysSlice.actions.setList([
					...countdownDays.list,
					{
						id: getShortId(9),
						name,
						date,
						categoryId,
						repeatType,
						top,
						sort: countdownDays.list.length,
						createTime: Math.floor(new Date().getTime() / 1000),
						lastUpdateTime: -1,
						countdownData: {
							nextDate: '',
							day: 0,
						},
					},
				])
			)
			showSnackbar(
				t('createSuccessfully', {
					ns: 'prompt',
				})
			)
		}
	),
	updateCountdownDaysEvent: createAsyncThunk(
		name + '/updateCountdownDaysEvent',
		async (
			{
				id,
				name,
				date,
				categoryId,
				repeatType,
				top,
			}: {
				id: string
				name: string
				date: string
				categoryId: string
				repeatType: {
					type: 'Never' | 'Day' | 'Week' | 'Month' | 'Year'
					num: number
				}
				top: boolean
			},
			thunkAPI
		) => {
			const { countdownDays } = store.getState()

			store.dispatch(
				countdownDaysSlice.actions.setList(
					countdownDays.list.map((v) => {
						if (v.id === id) {
							console.log('top', top)
							return {
								...v,
								name,
								date,
								categoryId,
								repeatType,
								top,
								lastUpdateTime: Math.floor(new Date().getTime() / 1000),
							}
						}
						return v
					})
				)
			)
			showSnackbar(
				t('updateSuccessfully', {
					ns: 'prompt',
				})
			)
		}
	),
	deleteCountdownDaysEvent: createAsyncThunk(
		name + '/deleteCountdownDaysEvent',
		async (
			{
				id,
			}: {
				id: string
			},
			thunkAPI
		) => {
			const { countdownDays } = store.getState()

			alert({
				title: t('delete', {
					ns: 'prompt',
				}),
				content: t('deleteThisEvent', {
					ns: 'prompt',
				}),
				cancelText: t('cancel', {
					ns: 'prompt',
				}),
				confirmText: t('delete', {
					ns: 'prompt',
				}),
				onCancel() {},
				async onConfirm() {
					// 检测是否有事件，有的话，清空其分类，作为无分类处理

					store.dispatch(
						countdownDaysSlice.actions.setList(
							countdownDays.list.filter((v) => {
								return v.id !== id
							})
						)
					)

					showSnackbar(t('deleteSuccessfully'))
				},
			}).open()
		}
	),
	syncData: createAsyncThunk(
		name + '/syncData',
		async (
			{
				rename,
			}: {
				rename: boolean
			},
			thunkAPI
		) => {
			d.increase(
				async () => {
					const { countdownDays, user } = store.getState()

					if (!user.isLogin) {
						console.log('未登录')
						return
					}
					console.log(countdownDays)

					if (
						!countdownDays.downloadDataStatus.local ||
						!countdownDays.downloadDataStatus.saass
					) {
						return
					}

					if (!countdownDays.downloadDataStatus.readySync) {
						store.dispatch(
							countdownDaysSlice.actions.setDownloadDataStatus({
								...countdownDays.downloadDataStatus,
								readySync: true,
							})
						)
						return
					}

					const lastUpdateTime = Math.floor(new Date().getTime() / 1000)

					storage.global.setSync('countdownDays-lastUpdateTime', lastUpdateTime)

					store.dispatch(
						countdownDaysSlice.actions.setLastUpdateTime(lastUpdateTime)
					)

					// 检测线上是否更新
					// 如果线上版本高于当前，则询问是否覆盖
					// if (countdownDays.lastUpdateTime <= lastUpdateTime) {
					// 	// 说明老版本
					// 	console.log('老版本')
					// 	return
					// }

					const cdData: protoRoot.countdownDays.ICountdownDaysData = {
						categories: countdownDays.categories,
						list: countdownDays.list,
						authorId: user.userInfo.uid,
						createTime: countdownDays.createTime,
						lastUpdateTime: lastUpdateTime,
					}

					console.log('cdData', cdData)

					const blob = new Blob([JSON.stringify(cdData)], {
						type: 'application/json',
					})

					console.log(blob)

					const reader = new FileReader()

					reader.onload = async (e) => {
						if (!e.target?.result) {
							return
						}
						store.dispatch(countdownDaysSlice.actions.setSyncing(true))

						const hash = await getHash(e.target.result, 'SHA-256')

						console.log(hash, blob.size)

						// http://192.168.204.132:16100/s/IkO0aOU2fs

						const res = await httpApi.CountdownDays.GetUploadToken({
							size: blob.size,
							hash: hash,
							rename,
						})

						console.log('res', res)

						if (res.code === 200) {
							const { uploadFile } = saass
							// const { uploadFile } = SAaSS.api
							const file = new File(
								[blob],
								(res.data.fileInfo?.name || '') + res.data.fileInfo?.suffix,
								{
									type: res.data.fileInfo?.type || '',
								}
							)

							uploadFile({
								file,
								url: res.data.apiUrl || '',
								token: res.data.token || '',
								chunkSize: Number(res.data.chunkSize || 0),
								uploadedOffset:
									res.data.uploadedOffset?.map((v) => Number(v)) || [],

								uploadedTotalSize: Number(res.data.uploadedTotalSize || 0),
								onprogress(options) {
									console.log('onprogress', options)
								},
								onsuccess(options) {
									console.log(
										'onsuccess',
										options,
										(res.data.urls?.domainUrl || '') + options.shortUrl
									)
									showSnackbar(
										t('uploadedSuccessfully', {
											ns: 'prompt',
										})
									)

									store.dispatch(countdownDaysSlice.actions.setSyncing(false))
								},
								onerror(err) {
									console.log('onerror', err)
								},
							})

							// uploadFile(
							// 	res.data.apiUrl || '',
							// 	res.data.token || '',
							// 	file,
							// 	(progress) => {
							// 		console.log(progress)
							// 	}
							// )
						}

						// console.log('reader.onload', e)
						// const hash = await getHash(e.target?.result, 'SHA-256')
						// const fileInfo: FileInfo = {
						// 	name: file.name,
						// 	size: file.size,
						// 	type: file.type,
						// 	fileSuffix: file.name.split('.')?.[1] || '',
						// 	lastModified: file.lastModified,
						// 	hash: hash,

						// 	width,
						// 	height,
						// }

						// res(fileInfo)
					}

					reader.readAsArrayBuffer(blob)

					// storage.global.setSync('countdownDays-lastUpdateTime', params.payload)
				},
				rename ? 0 : 2000
			)
		}
	),
}
