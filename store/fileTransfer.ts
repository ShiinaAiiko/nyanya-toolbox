import { UserAgent } from '@nyanyajs/utils/dist/userAgent'
import {
	file,
	AsyncQueue,
	file as nfile,
	deepCopy,
	byteConvert,
	getShortId,
} from '@nyanyajs/utils'
import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import store, { userSlice, webRTCSlice } from '.'
import { protoRoot } from '../protos'
import nsocketioAPI from '../plugins/socketio/api'
import md5 from 'blueimp-md5'
import { nwebrtc, webRTCMethods } from './webRTC'
import { storage } from './storage'
import { v4 } from 'uuid'
import { alert, multiplePrompts, snackbar } from '@saki-ui/core'
import { t } from 'i18next'
import { getTempUser } from './user'
// import { NWebRTCtransport } from '../plugins/nwebrtc/transport'

export interface MessageItem
	extends protoRoot.fileTransfer.FileTransferMessageItem {
	progress: number
	hash: string
}

export interface RoomInfo {
	// =ShareCode,RoomId
	id: string
	name: string
	avatar: string
	authorId: string
	lastUpdateTime: number
}

export interface DeviceInfo {
	uid: string
	deviceId: string
	roomId: string
	status:
		| 'Connected'
		| 'Connecting'
		| 'Disconnected'
		| 'NotConnected'
		| 'Closed'
	connectType: string
}

export const asyncQueue = new AsyncQueue()

const on = (
	deviceId: string,
	params: {
		status?: DeviceInfo['status']
		connectType?: string
	}
) => {
	const { fileTransfer } = store.getState()
	store.dispatch(
		fileTransferSlice.actions.setDevices(
			fileTransfer.devices.map((v) => {
				if (v.deviceId === deviceId) {
					return {
						...v,

						status: params.status || v.status,
						connectType: params.connectType || v.connectType || 'Local',
					}
				}

				return v
			}) || []
		)
	)
}

const state = {
	// 未来可以考虑改为以RoomId为key的数组
	devices: [] as DeviceInfo[],
	uploadedSize: 0,
	files: {} as {
		[hash: string]: File
	},
	shareCode: '',
	tcpConnection: false,
	roomInfo: undefined as RoomInfo | undefined,
	messages: [] as MessageItem[],
	status: 'loading' as 'loading' | 'loaded' | 'noMore',
	roomHistory: [] as {
		roomId: string
		roomInfo?: RoomInfo
		lastConnectTime: number
		lastUpdateTime: number
		createTime: number
	}[],
	maxFileSize: 1.7 * 1024 * 1024 * 1024,
}
export const fileTransferSlice = createSlice({
	name: 'fileTransfer',
	initialState: state,
	reducers: {
		setTcpConnection: (
			state,
			params: {
				payload: (typeof state)['tcpConnection']
				type: string
			}
		) => {
			state.tcpConnection = params.payload
		},
		setStatus: (
			state,
			params: {
				payload: (typeof state)['status']
				type: string
			}
		) => {
			state.status = params.payload
		},
		setDevices: (
			state,
			params: {
				payload: (typeof state)['devices']
				type: string
			}
		) => {
			state.devices = params.payload
			console.log('fileTransferconnect', state.devices)
		},
		setShareCode: (
			state,
			params: {
				payload: (typeof state)['shareCode']
				type: string
			}
		) => {
			state.shareCode = params.payload
			if (state.shareCode) {
				setTimeout(async () => {
					const { fileTransfer } = store.getState()

					let roomHistory = deepCopy(
						fileTransfer.roomHistory
					) as typeof fileTransfer.roomHistory

					let isexits = false
					roomHistory.some((v, i) => {
						if (v.roomId === fileTransfer.shareCode) {
							roomHistory[i].lastUpdateTime = Math.floor(
								new Date().getTime() / 1000
							)
							isexits = true
							return isexits
						}
					})
					if (!isexits) {
						roomHistory = roomHistory.concat([
							{
								roomId: fileTransfer.shareCode,
								lastConnectTime: 0,
								lastUpdateTime: Math.floor(new Date().getTime() / 1000),
								createTime: Math.floor(new Date().getTime() / 1000),
							},
						])
					}
					roomHistory.sort((a, b) => {
						return b.lastUpdateTime - a.lastUpdateTime
					})

					store.dispatch(fileTransferSlice.actions.setRoomHistory(roomHistory))

					const roomInfo = await storage.fileTransferRoom.get(
						fileTransfer.shareCode
					)
					console.log('roomInfo', roomInfo)
					roomInfo &&
						store.dispatch(
							fileTransferSlice.actions.setRoomInfo({
								...roomInfo,
							})
						)
				})
			}
		},
		setRoomHistory: (
			state,
			params: {
				payload: (typeof state)['roomHistory']
				type: string
			}
		) => {
			state.roomHistory = params.payload

			storage.global.set('roomHistory', state.roomHistory || [])
		},
		setRoomInfo: (
			state,
			params: {
				payload: (typeof state)['roomInfo']
				type: string
			}
		) => {
			state.roomInfo = params.payload

			params.payload?.id &&
				storage.fileTransferRoom.set(params.payload?.id, params.payload)
		},
		setUploadedSize: (
			state,
			params: {
				payload: (typeof state)['uploadedSize']
				type: string
			}
		) => {
			state.uploadedSize = params.payload
		},
		setMessages: (
			state,
			params: {
				payload: (typeof state)['messages']
				type: string
			}
		) => {
			state.messages = params.payload
		},
		setFiles: (
			state,
			params: {
				payload: (typeof state)['files']
				type: string
			}
		) => {
			state.files = params.payload
		},
	},
})

export const fileTransferMethods = {
	connectUsingTcp: createAsyncThunk(
		'fileTransfer/connectUsingTcp',
		async ({ roomId }: { roomId: string }, thunkAPI) => {
			const { user, fileTransfer } = store.getState()

			// console.log('fileTransferconnect', fileTransfer.devices)

			thunkAPI.dispatch(webRTCMethods.disconnect({ roomId }))

			await thunkAPI.dispatch(
				fileTransferMethods.connect({
					roomId: roomId,
				})
			)
		}
	),
	disconnect: createAsyncThunk(
		'fileTransfer/disconnect',
		async ({ roomId }: { roomId: string }, thunkAPI) => {
			console.log('disconnect')
			const { webRTC, user, fileTransfer } = store.getState()

			// nsocket leaveRoom
			const res = await nsocketioAPI.FileTransfer.LeaveFTRoom(roomId)
			console.log('res', res)
			if (res?.code === 200) {
				// webrtc disconnect
				// thunkAPI.dispatch(webRTCSlice.actions.disconnectClient())

				// 删除本地数据
				thunkAPI.dispatch(fileTransferSlice.actions.setShareCode(''))
				thunkAPI.dispatch(fileTransferSlice.actions.setMessages([]))
				thunkAPI.dispatch(fileTransferSlice.actions.setFiles({}))
				thunkAPI.dispatch(fileTransferSlice.actions.setDevices([]))

				thunkAPI.dispatch(webRTCMethods.disconnect({ roomId }))
			}
		}
	),
	connect: createAsyncThunk(
		'fileTransfer/connect',
		async ({ roomId }: { roomId: string }, thunkAPI) => {
			const { user, fileTransfer } = store.getState()

			// console.log('fileTransferconnect', fileTransfer.devices)

			await store.dispatch(
				webRTCMethods.testwebrtc({
					roomId,
				})
			)
			// console.log('fileTransferconnect', nwebrtc, nwebrtc.getClient(roomId))
			if (!nwebrtc || nwebrtc?.getClient(roomId)) {
				return
			}

			let client = nwebrtc.createClient(roomId)

			client.on('connected', () => {
				console.log('webrtc connected', 'connected')
				on(user.deviceId, {
					status: 'Connected',
				})

				store.dispatch(fileTransferSlice.actions.setStatus('noMore'))
			})
			client.on('disconnected', () => {
				console.log('webrtc connected', 'disconnected')
				on(user.deviceId, {
					status: 'Disconnected',
				})
				store.dispatch(fileTransferSlice.actions.setStatus('loading'))
			})
			client.on('connecting', () => {
				console.log('webrtc connected', 'connconnectingected')
				on(user.deviceId, {
					status: 'Connecting',
				})
				store.dispatch(fileTransferSlice.actions.setStatus('loading'))
			})

			const dataChannelAPI = client.DataChannelAPI()

			client.on('new-transport', (transport) => {
				const { user, fileTransfer } = store.getState()
				console.log('data-channel new-transport', transport)

				console.log(transport)
				transport.on('connected', () => {
					console.log('transport1 connected')
					on(transport.deviceId, {
						status: 'Connected',
					})
				})
				transport.on('connecting', () => {
					console.log('transport1 connecting')
					on(transport.deviceId, {
						status: 'Connecting',
					})
				})
				transport.on('disconnected', () => {
					console.log('transport1 disconnected')
					on(transport.deviceId, {
						status: 'Disconnected',
					})
				})
				transport.on('closed', () => {
					on(transport.deviceId, {
						status: 'Closed',
					})
					console.log('transport1 closed')
				})
				transport.on('remote-candidate', (candidate) => {
					on(transport.deviceId, {
						connectType: candidate.candidateType,
					})
					console.log(
						'transport1 candidate',
						candidate,
						candidate.candidateType
					)
				})
			})
			client.on('data-channel-connected', (data) => {
				const { fileTransfer } = store.getState()
				console.log('data-channel connected', data)
				dataChannelAPI.to(data.deviceId).emit('sync-user', getTempUser())
				dataChannelAPI
					.to(data.deviceId)
					.emit('sync-room', fileTransfer.roomInfo)
			})

			dataChannelAPI.router('sync-user', (data) => {
				console.log('dataChannelAPI sync-user', data, nwebrtc)

				const { user, fileTransfer } = store.getState()
				const users = {
					...user.tempUsers,
				}

				users[data.deviceId] = data.data
				store.dispatch(userSlice.actions.setTempUsers(users))

				console.log('JoinedFTRoom', fileTransfer.devices)
				store.dispatch(
					fileTransferSlice.actions.setDevices(
						fileTransfer.devices.map((v) => {
							if (v.deviceId === data.deviceId) {
								return {
									...v,
									uid: users[data.deviceId].uid || '',
									status: 'Connected',
								}
							}

							return v
						}) || []
					)
				)
			})

			dataChannelAPI.router('sync-room', (data) => {
				console.log('dataChannelAPI sync-room', data, nwebrtc)

				if (!data.data) return

				const { fileTransfer } = store.getState()
				let obj = {
					...fileTransfer.roomInfo,
				}

				if (
					!fileTransfer.roomInfo ||
					data.data.lastUpdateTime > fileTransfer.roomInfo.lastUpdateTime
				) {
					obj = {
						...fileTransfer.roomInfo,
						...data.data,
					}
				}

				console.log('roomInfo', obj)
				store.dispatch(fileTransferSlice.actions.setRoomInfo(obj as any))
			})

			dataChannelAPI.router('chat-message', (data) => {
				console.log('dataChannelAPI message', data, nwebrtc)
			})
			thunkAPI.dispatch(fileTransferMethods.receiveFile())
		}
	),
	sendFile: createAsyncThunk(
		'fileTransfer/sendFile',
		({ type, roomId }: { type: string; roomId: string }, thunkAPI) => {
			// alert({
			// 	title: '上传限制',
			// 	content:
			// 		'准备上传的文件大小不可高于' + byteConvert(fileTransfer.maxFileSize),
			// 	cancelText: t('cancel', {
			// 		ns: 'prompt',
			// 	}),
			// 	confirmText: t('next', {
			// 		ns: 'prompt',
			// 	}),
			// 	onConfirm() {
			let input = document.createElement('input')
			input.type = 'file'
			input.multiple = true
			switch (type) {
				case 'Image':
					// 目前暂时仅支持PNG和JPG
					input.accept = 'image/bmp,image/jpeg,image/png'
					break
				case 'Video':
					input.accept = 'video/*'
					break
				case 'File':
					input.accept = '*'
					break

				default:
					break
			}
			input.oninput = (e) => {
				console.log(input?.files)
				if (input?.files?.length) {
					for (let i = 0; i < input.files.length; i++) {
						// 发送消息
						const file = input.files.item(i)
						file &&
							thunkAPI.dispatch(
								fileTransferMethods.sendFileMessage({ type, file, roomId })
							)
					}
				}
			}
			input.click()
			// },
			// }).open()
		}
	),
	sendMessage: createAsyncThunk(
		'fileTransfer/sendMessage',
		({ message, roomId }: { message: string; roomId: string }, thunkAPI) => {
			const { webRTC, user, fileTransfer } = store.getState()

			const msg = {
				id: getShortId(12),
				roomId: roomId,
				authorId: '',
				deviceId: user.deviceId,

				replyId: '',
				replyMessage: undefined,

				message: message,

				video: undefined,
				audio: undefined,
				progress: 1,
				createTime: Math.floor(new Date().getTime() / 1000),
			} as MessageItem
			thunkAPI.dispatch(
				fileTransferSlice.actions.setMessages(
					fileTransfer.messages.concat([msg])
				)
			)

			if (!nwebrtc) return
			const dataChannelAPI = nwebrtc.getClient(roomId).DataChannelAPI()

			dataChannelAPI.emit('ft-message', msg)
		}
	),
	sendFileMessage: createAsyncThunk(
		'fileTransfer/sendFileMessage',
		async (
			{ type, file, roomId }: { type: string; file: File; roomId: string },
			thunkAPI
		) => {
			const { webRTC, user, fileTransfer } = store.getState()

			// console.log(file, webRTC.client?.roomClients)

			if (file) {
				// const reader = new FileReader()
				// reader.onload = (e) => {
				// 	console.log('e.target?.result', e.target?.result)
				// }
				// reader.readAsArrayBuffer(file)

				if (file.size > fileTransfer.maxFileSize) {
					snackbar({
						message: '「' + file.name + '」的文件大小已超出最大限制',
						autoHideDuration: 2000,
						vertical: 'top',
						horizontal: 'center',
						backgroundColor: 'var(--saki-default-color)',
						color: '#fff',
					}).open()
					return
				}
				const fi = await nfile.getFileInfo(file)

				console.log('fi', fi)
				if (fi) {
					const msg = {
						id: getShortId(12),
						type,

						roomId,
						authorId: '',
						deviceId: user.deviceId,
						replyId: '',
						replyMessage: undefined,
						video: undefined,
						audio: undefined,
						progress: 0,
						createTime: Math.floor(new Date().getTime() / 1000),
						hash: fi.hash,
					} as MessageItem

					const fileInfo = {
						name: fi.name,
						size: fi.size,
						type: fi.type,
						fileSuffix: fi.fileSuffix,
						lastModified: fi.lastModified,
						hash: fi.hash,
						chunkSize: 1024,
					}
					if (type === 'Image') {
						msg.image = {
							width: fi.width,
							height: fi.height,
							type: fi.type,
							url: URL.createObjectURL(file),
							fileInfo: fileInfo,
						}
					}
					if (type === 'Video') {
						msg.video = {
							width: fi.width,
							height: fi.height,
							type: fi.type,
							url: URL.createObjectURL(file),
							fileInfo: fileInfo,
						}
					}
					if (type === 'File') {
						msg.file = {
							url: URL.createObjectURL(file),
							fileInfo: fileInfo,
						}
					}
					const { fileTransfer } = store.getState()

					store.dispatch(
						fileTransferSlice.actions.setMessages(
							fileTransfer.messages.concat([msg])
						)
					)
					const files = {
						...fileTransfer.files,
					}
					files[fi.hash] = file
					store.dispatch(fileTransferSlice.actions.setFiles(files))

					// let offset = 0
					// let chunkSize = 60 * 1024
					// const reader = new FileReader()

					// reader.onload = async (e) => {
					// 	if (!e.target?.result) {
					// 		return
					// 	}

					// 	otherDC.send(e.target.result as any)

					// 	offset += chunkSize

					// 	if (offset > file.size) {
					// 		return
					// 	}

					// 	reader.readAsArrayBuffer(
					// 		file.slice(offset, offset + chunkSize)
					// 	)
					// }
					// reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize))

					if (!nwebrtc) return
					const dataChannelAPI = nwebrtc
						.getClient(fileTransfer.shareCode)
						.DataChannelAPI()

					dataChannelAPI.emit('ft-message', msg)

					// webRTC.dataChannelAPI.emit('ft-message', msg)
				}
			}
		}
	),
	receiveFile: createAsyncThunk('fileTransfer/receiveFile', (_, thunkAPI) => {
		const { webRTC, user, fileTransfer } = store.getState()

		if (!nwebrtc) return
		const dataChannelAPI = nwebrtc
			.getClient(fileTransfer.shareCode)
			.DataChannelAPI()

		dataChannelAPI.router('ft-message', (data) => {
			console.log('ft-message', data, data.data)
			const { webRTC, user, fileTransfer } = store.getState()

			thunkAPI.dispatch(
				fileTransferSlice.actions.setMessages(
					fileTransfer.messages.concat([data.data])
				)
			)

			if (data.data.image || data.data.video || data.data.file) {
				// 要求对方发此文件，图片直接发
				dataChannelAPI
					.to(data.deviceId)
					.emit(
						'ft-receive-file',
						(data.data.image || data.data.video || data.data.file).fileInfo.hash
					)

				return
			}
		})

		dataChannelAPI.router('ft-receive-file', (data) => {
			const { webRTC, user, fileTransfer } = store.getState()

			// 一个一个发，慢慢来

			const hash = data.data
			console.log('ft-receive-file', data, hash)

			if (!hash) return

			asyncQueue.increase(() => {
				return new Promise(async (res, rej) => {
					const { webRTC, fileTransfer } = store.getState()

					const file = fileTransfer.files[hash]

					if (file) {
						const toAPI = dataChannelAPI.to(data.deviceId)
						const fileAPI = toAPI.sendFile(file, {
							oncreated(fileInfo) {
								console.log('oncreated', fileInfo)
								return true
							},
							onsending(fileInfo, uploadedSize) {
								// fileAPI.abort()
								// console.log('onsending', fileInfo, uploadedSize)
								// store.dispatch(
								// 	fileTransferSlice.actions.setUploadedSize(uploadedSize)
								// )

								const { fileTransfer } = store.getState()

								store.dispatch(
									fileTransferSlice.actions.setMessages(
										fileTransfer.messages.map((v) => {
											if (v.hash === fileInfo.hash) {
												return {
													...v,
													progress: uploadedSize / fileInfo.size,
												} as any
											}
											return v
										})
									)
								)
							},
							onsuccess(fileInfo) {
								console.log('onsuccess', fileInfo)
								res()
							},
							onabort() {
								console.log('onabort')
								res()
							},
							onerror(err) {
								console.log('onerror', err)
								res()
							},
						})
						console.log('fileAPI', fileAPI)
					}
				})
			}, data.requestId)
		})

		dataChannelAPI.receiveFile({
			oncreated(fileInfo, clientInfo) {
				console.log('oncreated', fileInfo, clientInfo)
			},
			onreceiving(fileInfo, uploadedSize) {
				const { fileTransfer } = store.getState()

				console.log('onreceiving', fileInfo, uploadedSize)

				thunkAPI.dispatch(
					fileTransferSlice.actions.setMessages(
						fileTransfer.messages.map((v) => {
							if (
								(v.image || v.video || v.file)?.fileInfo?.hash === fileInfo.hash
							) {
								return {
									...v,
									progress: uploadedSize / fileInfo.size,
								} as MessageItem
							}
							return v
						})
					)
				)
			},
			onsuccess(fileInfo, file) {
				console.log('onsuccess', webRTC, fileInfo, file)
				const { fileTransfer } = store.getState()

				thunkAPI.dispatch(
					fileTransferSlice.actions.setMessages(
						fileTransfer.messages.map((v) => {
							if (
								v.type === 'Image' &&
								v.image?.fileInfo?.hash === fileInfo.hash
							) {
								return {
									...v,
									progress: 1,
									image: {
										...v.image,
										url: URL.createObjectURL(file),
									},
								} as MessageItem
							}
							if (
								v.type === 'Video' &&
								v.video?.fileInfo?.hash === fileInfo.hash
							) {
								return {
									...v,
									progress: 1,
									video: {
										...v.video,
										url: URL.createObjectURL(file),
									},
								} as MessageItem
							}
							if (
								v.type === 'File' &&
								v.file?.fileInfo?.hash === fileInfo.hash
							) {
								return {
									...v,
									progress: 1,
									file: {
										...v.file,
										url: URL.createObjectURL(file),
									},
								} as MessageItem
							}
							return v
						})
					)
				)
				// // 将 buffer 和 size 清空，为下一次传文件做准备
				// const a = document.createElement('a')
				// a.download = file.fileInfo.name
				// a.style.display = 'none'
				// // 字符内容转变成blob地址
				// a.href = URL.createObjectURL(received)
				// // 触发点击
				// document.body.appendChild(a)
				// a.click()
				// // 然后移除
				// document.body.removeChild(a)
			},
			onerror(error) {
				console.log('onerror', error)
			},
		})
	}),
}
