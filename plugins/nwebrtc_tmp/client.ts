import { file as nfile } from '@nyanyajs/utils'
import md5 from 'blueimp-md5'
import {
	ConcatArrayBuffer,
	StringToArrayBuffer,
	ArrayBufferToString,
} from './common'
import { NWebRTCtransport } from './transport'
import { NEventListener } from './neventListener'

import { v4 } from 'uuid'

import { DataChannelData, FileInfo, SignalingData } from './types'
import { NWebRTC } from './nwebrtc'

export class NWebRTCClient extends NEventListener<{
	connecting: NWebRTCClient
	connected: NWebRTCClient
	disconnected: NWebRTCClient
	'new-transport': NWebRTCtransport
	'data-channel-connected': NWebRTCtransport
}> {
	roomId: string
	nwebrtc?: NWebRTC
	timer: {
		[deviceId: string]: NodeJS.Timeout
	} = {}
	// 还是以RoomId为基准，但是没连接一个deviceId则创建个新的PC

	transports: {
		[deviceId: string]: NWebRTCtransport
	} = {}

	private transferredBytes = {
		sent: 0,
		received: 0,
	}

	static files: {
		[hash: string]: {
			receiveBuffer: ArrayBuffer[]
			// 0 / 1
			status: number
			fileInfo: FileInfo
		}
	} = {}

	status: 'connected' | 'connecting' | 'disconnected' | 'notConnect' =
		'notConnect'
	// private routerFuncs: {
	// 	[eventName: string]: ((data: any) => void)[]
	// } = {}
	constructor(roomId: string, nwebrtc: NWebRTC) {
		super()
		this.roomId = roomId
		this.nwebrtc = nwebrtc

		const dataChannelAPI = this.DataChannelAPI()
		dataChannelAPI.router('new-device', (data) => {
			console.log('new-devicenew-device', data, this.nwebrtc?.deviceId)

			if (data.data !== this.nwebrtc?.deviceId) {
				if (!this.getTransport(data.data)) {
					this.connect(data.data)
				}
			}
		})
		dataChannelAPI.router('force-disconnect', (data) => {
			console.log('force-disconnect', data, this, this.nwebrtc?.deviceId)

			// if (data.data !== this.nwebrtc?.deviceId) {
			// 	if (!this.getTransport(data.data)) {
			// 		this.connect(data.data)
			// 	}
			// }
			console.log(this.transports)
			this.transports[data.data].disconnect()
			delete this.transports[data.data]
			console.log(this.transports)
		})
	}

	// 别人的DeviceId
	async connect(deviceId: string) {
		if (!this.transports[deviceId]) {
			this.createTransport(deviceId)
		} else {
			if (this.transports[deviceId]?.status === 'connected') {
				return
			}
		}
		this.status = 'connecting'
		this.dispatch('connecting', this)
		const offer = await this.transports[deviceId].createOffer()

		this.nwebrtc?.sendDataFunc?.({
			type: 'offer',
			data: offer,
			toDeviceId: deviceId,
			deviceId: this.nwebrtc?.deviceId,
			roomId: this.roomId,
		})
	}
	createTransport(deviceId: string) {
		this.transports[deviceId] = new NWebRTCtransport(
			this.roomId,
			deviceId,
			this
		)
		this.dispatch('new-transport', this.transports[deviceId])
		this.transportEvent(deviceId)
		return this.transports[deviceId]
	}
	private transportEvent(deviceId: string) {
		this.transports[deviceId].on('connected', () => {
			this.status = 'connected'
			clearInterval(this.timer[deviceId])
			this.dispatch('connected', this)
			console.log('transportEvent connected', deviceId)
		})
		this.transports[deviceId].on('connecting', () => {
			console.log('transportEvent connecting', deviceId)
		})
		let connectCount = 4
		this.transports[deviceId].on('disconnected', () => {
			console.log('transportEvent disconnected', deviceId, this)
			// 断开连接后，就自动重连，除非对方发消息要求断开
			// delete this.transports[deviceId]
			console.log(Object.keys(this.transports).length)

			console.log('正在重连')
			this.connect(deviceId)
			// 超过多少次数，视为放弃
			this.timer[deviceId] = setInterval(() => {
				console.log('正在重连1')
				if (connectCount >= 5) {
					// this.dispatch('disconnected')
					this.transports[deviceId]?.disconnect()
					delete this.transports[deviceId]
					clearInterval(this.timer[deviceId])
					return
				}
				connectCount++
				this.connect(deviceId)
			}, 5000)

			// if (!Object.keys(this.transports).length) {
			// 	this.status = 'disconnected'
			// 	this.dispatch('disconnected')
			// }
		})
		this.transports[deviceId].on('closed', () => {
			delete this.transports[deviceId]
			clearInterval(this.timer[deviceId])
		})
	}
	getTransport(deviceId: string) {
		return this.transports[deviceId]
	}

	disconnect() {
		console.log('client disconnect')
		const dataChannelAPI = this.DataChannelAPI()

		dataChannelAPI.emit('force-disconnect', this.nwebrtc?.deviceId)

		console.log(this)
		Object.keys(this.transports).forEach((deviceId) => {
			this.transports[deviceId].disconnect()
			delete this.transports[deviceId]
		})
		this.status = 'disconnected'
		this.dispatch('disconnected', this)

		this.removeAllEvent()
	}
	bytes(type: 'sent' | 'received', bytes: number) {
		this.transferredBytes[type] += bytes
		this.nwebrtc?.bytes(type, bytes)
		// console.log('bytes', type, bytes, this.transferredBytes)
	}
	// 发送给其他所有人的，或接受其他所有人的
	DataChannelAPI() {
		const api = {
			to: (deviceId: string) => {
				const transport = this.transports[deviceId]

				const send = (data: string | ArrayBuffer) => {
					// console.log('sendd', data instanceof String)
					if (typeof data === 'string') {
						this.bytes('sent', data.length)
					}
					if (data instanceof ArrayBuffer) {
						this.bytes('sent', data.byteLength)
					}
					transport?.otherDC?.send(data as any)
				}

				return {
					sendFile: async (
						file: File,
						event?: {
							oncreated?: (fileInfo: FileInfo) => boolean
							onreceiving?: () => void
							onsending?: (fileInfo: FileInfo, uploadedSize: number) => void
							onsuccess?: (fileInfo: FileInfo) => void
							onabort?: () => void
							onerror?: (err: Error) => void
						}
					) => {
						let isAbort = false
						let offset = 0
						let chunkSize = 60 * 1024
						let width = 0
						let height = 0

						try {
							const fi = await nfile.getFileInfo(file)
							if (fi) {
								const fileInfo: FileInfo = {
									id: md5(fi.hash),
									chunkSize: chunkSize,
									...fi,
								}
								if (event?.oncreated?.(fileInfo)) {
									const toAPI = api.to(deviceId)
									toAPI.emit('file-oncreated', fileInfo)

									const reader = new FileReader()
									reader.onload = async (e) => {
										if (!e.target?.result || isAbort) {
											event?.onabort?.()
											return
										}

										// console.log(options, offset, offset + chunkSize)
										const result: any = e.target?.result

										const blob = new Blob(
											[e.target.result],
											{}
											// encodeURIComponent(
											// 	JSON.stringify({
											// 		offset: offset.toString(),
											// 		hash: hash,
											// 		// 有问题
											// 		final: e.total + offset === file.size ? 'ok' : 'no',
											// 	})
											// )
										)
										const buf = new ArrayBuffer(64)
										const str = new TextDecoder().decode(buf)
										// console.log(
										// 	'onsending1',
										// 	// (e.target.result as string).length,
										// 	// blob,
										// 	file.size,
										// 	offset,
										// 	chunkSize
										// )

										// ArrayBufferToString(
										//   arrayBuffer.slice(blob.size, blob.size + strbf.byteLength)
										// )
										offset += chunkSize

										// const offsetAB = StringToArrayBuffer(
										// 	String(offset > file.size ? file.size : offset).padStart(5, '0')
										// )

										const sizeAB = StringToArrayBuffer(
											String(blob.size).padStart(5, '0')
										)

										const hashAB = StringToArrayBuffer(
											JSON.stringify({
												hash: fi.hash,
												offset: offset > file.size ? file.size : offset,
											})
										)
										// console.log('onsending1', hash, strbf, e.target.result)
										// console.log(
										// 	String(offset > file.size ? file.size : offset).padStart(
										// 		12,
										// 		'0'
										// 	),
										// 	sizeAB,
										// 	offsetAB,
										// 	hashAB
										// )
										const arrayBuffer = ConcatArrayBuffer(
											e.target.result as any,
											hashAB,
											sizeAB
										)

										event?.onsending?.(
											fileInfo,
											offset > file.size ? file.size : offset
										)
										// api.send(clientId, e.target.result)
										// api.send(clientId, { file: e.target.result })
										// api.send(clientId, blob)

										send(arrayBuffer)

										// new RTCDataChannel.Buffer(ByteBuffer.wrap(msg), false);

										// api
										// 	.to({
										// 		clientId,
										// 	})
										// 	.emit('file-onreceiving', {
										// 		chunk: e.target.result,
										// 		hash: hash,
										// 		offset: offset > file.size ? file.size : offset,
										// 	})
										if (offset > file.size) {
											event?.onsuccess?.(fileInfo)

											return
										}

										reader.readAsArrayBuffer(
											file.slice(offset, offset + chunkSize)
										)
									}
									reader.readAsArrayBuffer(
										file.slice(offset, offset + chunkSize)
									)
								}
							}
						} catch (error) {
							event?.onerror?.(error as Error)
						}

						return {
							abort: () => {
								isAbort = true
							},
						}
					},
					emit: (eventName: string, data: any) => {
						// console.log(this, transport, eventName, data)
						send(
							JSON.stringify({
								eventName,
								deviceId: this.nwebrtc?.deviceId,
								roomId: this.roomId,
								data,
								requestId: v4(),
							})
						)
					},
				}
			},

			sendFile: (
				file: File,
				event?: {
					oncreated?: (fileInfo: FileInfo) => boolean
					onreceiving?: () => void
					onsending?: (fileInfo: FileInfo, uploadedSize: number) => void
					onsuccess?: (fileInfo: FileInfo) => void
					onabort?: () => void
					onerror?: (err: Error) => void
				}
			) => {
				Object.keys(this.transports).forEach((deviceId) => {
					const toAPI = api.to(deviceId)
					toAPI.sendFile(file, event)
				})
			},
			receiveFile: (event?: {
				oncreated?: (fileInfo: FileInfo, transport: NWebRTCtransport) => void
				onreceiving?: (fileInfo: FileInfo, uploadedSize: number) => void
				onsuccess?: (fileInfo: FileInfo, file: File) => void
				onabort?: () => void
				onerror?: (error: Error) => void
			}) => {
				let isAbort = false

				const files = NWebRTCClient.files
				try {
					const onSuccess = (hash: string) => {
						const file = files[hash]
						console.log('fileonsuccess', files[hash], files)
						files[hash].status = 1
						// delete files[data.data.hash]
						// 创建文件
						const received = new File(
							[
								new Blob(file.receiveBuffer, {
									type: file.fileInfo.type,
								}),
							],
							file.fileInfo.name,
							{
								type: file.fileInfo.type,
								lastModified: file.fileInfo.lastModified,
							}
						)
						event?.onsuccess?.(file.fileInfo, received)
					}
					api.router('file-oncreated', (data) => {
						if (files[data.data.hash]?.status === 1) {
							onSuccess(data.data.hash)
							return
						}
						files[data.data.hash] = {
							fileInfo: data.data,
							status: 0,
							receiveBuffer: [],
						}
						console.log('file-oncreated', data.data, files[data.data.hash])

						event?.oncreated?.(data.data, this.getTransport(data.deviceId))
					})

					api.router('file-onreceiving', (data) => {
						// console.log('file-onreceiving', data, files)
						files[data.data.hash].receiveBuffer.push(data.data.chunk)

						const file = files[data.data.hash]

						event?.onreceiving?.(file.fileInfo, data.data.offset)

						if (data.data.offset === file.fileInfo.size) {
							onSuccess(data.data.hash)
						}
						// event?.onreceiving?.(data.data, data.clientInfo)
					})
				} catch (error) {
					event?.onerror?.(error as Error)
				}
				return {
					// 预留
					abort: () => {
						isAbort = true
					},
				}
			},
			emit: (eventName: string, data: any) => {
				// console.log(this, eventName, data)
				Object.keys(this.transports).forEach((deviceId) => {
					const toAPI = api.to(deviceId)
					// console.log(toApi)
					toAPI.emit(eventName, data)
				})
			},
			router: (eventName: string, f: (data: DataChannelData) => void) => {
				// !this.routerFuncs[eventName] && (this.routerFuncs[eventName] = [])
				// this.routerFuncs[eventName].push(f)
				// console.log('routerrouter',this)
				this.on(('router' + eventName) as any, (val) => {
					f(val)
				})
			},
		}
		return api
	}
}
