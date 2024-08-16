import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import store, { ActionParams, fileTransferSlice, methods, userSlice } from '.'
// import { SFUClient, SFUSignal } from '../plugins/ionSfuSdk'
import { webrtc } from '../config'
import { Debounce } from '@nyanyajs/utils'
import { download } from '../plugins/methods'
import nsocketioAPI from '../plugins/socketio/api'
// import { SFUClient, SFUSignal } from '@nyanyajs/utils/dist/ionSfuSdk'
import adapter from 'webrtc-adapter'
import { NWebRTC } from '@nyanyajs/utils'
import { fileTransferMethods } from './fileTransfer'

export let nwebrtc: NWebRTC | undefined

const state = {
	status: 'notConnected' as 'connecting' | 'success' | 'fail' | 'notConnected',
	// signal: undefined as SFUSignal | undefined,
	// client: undefined as SFUClient | undefined,
	transferData: {
		sent: 0,
		received: 0,
	},
	transferRate: {
		total: 0,
		sent: 0,
		received: 0,
	},
	webrtcOptions: {
		url: webrtc.url,
		// url: 'wss://tools.aiiko.club/sfuws',
		sfuUser: '',
		sfuPassword: '',
		options: {
			codec: 'vp8',
			iceServers: [
				{
					urls: ['turn:tools.aiiko.club:3479'],
					username: '',
					credential: '',
				},
			],
		},
	},
	// dataChannelAPI: {} as ReturnType<SFUClient['DataChannelAPI']>,
}

export let clientId = ''

export const webRTCSlice = createSlice({
	name: 'webRTC',
	initialState: state,
	reducers: {
		setStatus: (state, params: ActionParams<(typeof state)['status']>) => {
			state.status = params.payload
		},
		setTransferData: (
			state,
			params: ActionParams<(typeof state)['transferData']>
		) => {
			state.transferData = params.payload
		},
		setTransferRate: (
			state,
			params: ActionParams<(typeof state)['transferRate']['total']>
		) => {
			state.transferRate.total = params.payload
		},
		setTransferRateSent: (
			state,
			params: ActionParams<(typeof state)['transferRate']['sent']>
		) => {
			state.transferRate.sent = params.payload
		},
		setTransferRateReceived: (
			state,
			params: ActionParams<(typeof state)['transferRate']['received']>
		) => {
			state.transferRate.received = params.payload
		},
		// setSignal: (state, params: ActionParams<(typeof state)['signal']>) => {
		// 	state.signal = params.payload
		// },
		// setClient: (state, params: ActionParams<(typeof state)['client']>) => {
		// 	state.client = params.payload
		// },
		// setDataChannelAPI: (
		// 	state,
		// 	params: ActionParams<(typeof state)['dataChannelAPI']>
		// ) => {
		// 	state.dataChannelAPI = params.payload
		// },
		setWebrtcOptions: (
			state,
			params: ActionParams<(typeof state)['webrtcOptions']>
		) => {
			state.webrtcOptions = params.payload
		},
		// connect: (state, params: ActionParams<(typeof state)['signal']>) => {
		// 	state.signal = params.payload
		// },
		// disconnectClient: (state, params: ActionParams<void>) => {
		// 	state.client?.close()

		// 	state.client = undefined
		// },
	},
})
export const webRTCMethods = {
	disconnect: createAsyncThunk(
		'webRTC/disconnect',
		async ({ roomId }: { roomId: string }, thunkAPI) => {
			const { webRTC, nsocketio, api, user, fileTransfer } = store.getState()

			nwebrtc?.getClient(roomId).disconnect()
			nwebrtc = undefined
		}
	),
	testwebrtc: createAsyncThunk(
		'webRTC/testwebrtc',
		async ({ roomId }: { roomId: string }, thunkAPI) => {
			const { webRTC, nsocketio, api, user, fileTransfer } = store.getState()
			console.log('getDeviceType', document.body.offsetWidth)
			console.log(roomId, nwebrtc, user.deviceId)

			if (!nwebrtc) {
				nwebrtc = new NWebRTC(
					// '',
					user.deviceId,
					{
						iceServers: [
							{
								// urls: ['turn:stun.voipbuster.com:3478'],
								// urls: ['turn:tools.aiiko.club:3480'],
								// urls: 'turn:tools.aiiko.club:3480',
								// urls: 'turn:139.196.6.190:3480',
								urls: webRTC.webrtcOptions.options.iceServers[0].urls[0],
								username: webRTC.webrtcOptions.options.iceServers[0].username,
								credential:
									webRTC.webrtcOptions.options.iceServers[0].credential,
								// urls: 'turn:192.168.204.129:3479',
								// urls: 'turn:192.168.204.129:3480',
								// credential: '4080218913',
								// username: 'demo',
							},
						],

						// iceServers,
						// iceTransportPolicy: 'relay',
						// iceServers: webRTC.webrtcOptions.options.iceServers,
						// .concat([
						// 	{
						// 		urls: ['turn:stun.voipbuster.com'],
						// 	} as any,
						// ]),
					},
					{
						updateTransferRateInterval: 1,
					}
				)
				console.log(roomId, nwebrtc)

				nwebrtc.on('transfer-data', (val) => {
					// console.log('transfer-rate', val)
					store.dispatch(webRTCSlice.actions.setTransferData(val))
				})
				nwebrtc.on('transfer-rate', (val) => {
					// console.log('transfer-rate', val)
					store.dispatch(webRTCSlice.actions.setTransferRate(val || 0))
				})
				nwebrtc.on('transfer-rate-sent', (val) => {
					// console.log('transfer-rate', val)
					store.dispatch(webRTCSlice.actions.setTransferRateSent(val || 0))
				})
				nwebrtc.on('transfer-rate-received', (val) => {
					// console.log('transfer-rate', val)
					store.dispatch(webRTCSlice.actions.setTransferRateReceived(val || 0))
				})
				// nwebrtc.on<number>('transfer-rate-sent', (val) => {
				// 	console.log('transfer-rate-sent', val)
				// })
				// nwebrtc.on<number>('transfer-rate-received', (val) => {
				// 	console.log('transfer-rate-received', val)
				// })

				nwebrtc.sendData(async (data) => {
					const { webRTC, nsocketio, api, user, fileTransfer } =
						store.getState()
					await nsocketioAPI.FileTransfer.Data(fileTransfer.shareCode, {
						data,
						deviceId: user.deviceId,
					})
				})

				nsocketio.client?.router(
					api.nsocketio.namespace.FileTransfer,
					'Data',
					{},
					async (data) => {
						const { webRTC, nsocketio, api, user, fileTransfer } =
							store.getState()
						console.log('nsocketiodata', data, user.deviceId)

						if (data.deviceId !== user.deviceId) {
							await nwebrtc?.receiveData(data.data)
						}
					}
				)
			}
		}
	),
	// connect: createAsyncThunk(
	// 	'webRTC/connect',
	// 	({ roomId }: { roomId: string }, thunkAPI) => {
	// 		const { webRTC, user } = store.getState()
	// 		console.log('getDeviceType', document.body.offsetWidth)
	// 		let signal = webRTC.signal
	// 		console.log('signal', signal, webRTC.webrtcOptions)
	// 		if (!signal && typeof window !== 'undefined') {
	// 			let ion = require('../plugins/ionSfuSdk')
	// 			// let ion = require('@nyanyajs/utils/dist/ionSfuSdk')
	// 			signal = new ion.SFUSignal(webRTC.webrtcOptions.url, {
	// 				token: '',
	// 				deviceId: user.deviceId,
	// 				uid: '',
	// 				userAgent: user.userAgent,
	// 				userInfo: {
	// 					uid: '',
	// 					avatar: '',
	// 					username: '',
	// 					nickname: '',
	// 				},
	// 				customData: {
	// 					sfuUser: webRTC.webrtcOptions.sfuUser,
	// 					sfuPassword: webRTC.webrtcOptions.sfuPassword,
	// 					roomId: roomId,
	// 				},
	// 			})
	// 			thunkAPI.dispatch(webRTCSlice.actions.setSignal(signal))
	// 		}
	// 		console.log('signal', signal, webRTC.webrtcOptions)

	// 		let client: SFUClient | undefined = webRTC.client

	// 		if (!client && signal) {
	// 			client = signal.createClient(
	// 				roomId,
	// 				webRTC.webrtcOptions.options as any
	// 			)
	// 			// const c = s.createClient('ion', webrtc.options as any)
	// 			console.log(
	// 				'使用的roomId client：',
	// 				roomId,
	// 				client,
	// 				webRTC.webrtcOptions.options as any
	// 			)
	// 			thunkAPI.dispatch(webRTCSlice.actions.setClient(client))
	// 			// c.onStream = (stream) => {
	// 			// 	onStream(stream)
	// 			// }
	// 			const api = client.DataChannelAPI()
	// 			thunkAPI.dispatch(webRTCSlice.actions.setDataChannelAPI(api))
	// 			api.router('connected', (data) => {
	// 				console.log('connectedDC', data, user.deviceId, signal, client, api)

	// 				clientId = data.clientInfo.clientId
	// 				if (data.data.deviceId !== user.deviceId) {
	// 					// callConnected()
	// 				}

	// 				// if (location.href.indexOf('q') >= 0) {
	// 				// 	console.log('创建answer')
	// 				// 	createOffer()
	// 				// }
	// 			})
	// 			api.emit('connected', {
	// 				deviceId: user.deviceId,
	// 				userAgent: user.userAgent,
	// 			})

	// 			// api.router('offer', (data) => {
	// 			// 	console.log('offer', data)
	// 			// 	createAnswer(data.data.offer)
	// 			// })

	// 			// api.router('answer', (data) => {
	// 			// 	console.log('answer', data)
	// 			// 	createRemoteAnswer(data.data.answer)
	// 			// })

	// 			// api.router('candidate', (data) => {
	// 			// 	// createRemoteAnswer(data.data.answer)
	// 			// 	var candidate = new RTCIceCandidate({
	// 			// 		sdpMLineIndex: data.data.label,
	// 			// 		candidate: data.data.candidate,
	// 			// 	})
	// 			// 	pc.addIceCandidate(candidate)
	// 			// 		.then(() => {
	// 			// 			console.log('Successed to add ice candidate')
	// 			// 		})
	// 			// 		.catch((err) => {
	// 			// 			console.error(err)
	// 			// 		})

	// 			// 	console.log('candidate', data, pc, dc)
	// 			// })

	// 			// thunkAPI.dispatch(methods.fileTransfer.receiveFile())
	// 		}

	// 		thunkAPI.dispatch(fileTransferSlice.actions.setSatus('noMore'))
	// 	}
	// ),
}
