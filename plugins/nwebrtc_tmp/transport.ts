// import { NEventListener } from '@nyanyajs/utils'
import { NWebRTCClient } from './client'
import { NEventListener } from './neventListener'
import {
	ConcatArrayBuffer,
	StringToArrayBuffer,
	ArrayBufferToString,
} from './common'
import { DataChannelData } from './types'

export type CandidateType = 'host' | 'prflx' | 'srflx' | 'relay'

export interface RTCStatsLocalCandidate {
	id: string
	timestamp: number
	type: string
	address: string
	candidateType: CandidateType
	foundation: string
	ip: string
	isRemote: boolean
	networkType: string
	port: number
	priority: number
	protocol: string
	transportId: string
	url: string
	usernameFragment: string
}
export interface RTCStatsRemoteCandidate {
	id: string
	timestamp: number
	type: string
	address: string
	candidateType: CandidateType
	foundation: string
	ip: string
	isRemote: boolean
	port: number
	priority: number
	protocol: string
	transportId: string
	usernameFragment: string
}

export class NWebRTCtransport extends NEventListener<{
	connected: NWebRTCtransport
	connecting: NWebRTCtransport
	disconnected: NWebRTCtransport
	closed: NWebRTCtransport
	failed: NWebRTCtransport
	new: NWebRTCtransport
	'local-candidate': RTCStatsLocalCandidate
	'remote-candidate': RTCStatsRemoteCandidate
}> {
	roomId: string
	deviceId: string
	client: NWebRTCClient
	pc?: RTCPeerConnection
	dc?: RTCDataChannel
	otherDC?: RTCDataChannel
	status:
		| 'connected'
		| 'connecting'
		| 'disconnected'
		| 'closed'
		| 'notConnect' = 'notConnect'
	constructor(roomId: string, deviceId: string, client: NWebRTCClient) {
		super()
		this.roomId = roomId
		this.deviceId = deviceId
		this.client = client

		this.pc = new RTCPeerConnection({
			...this.client?.nwebrtc?.configuration,
		})

		this.pc.onconnectionstatechange = async (e) => {
			console.log('1onconnectionstatechange', e, this.pc?.connectionState)
			if (this.pc?.connectionState === 'connected') {
				// Peers connected!
				let stats = await this.pc.getStats()

				for (const value of stats.values()) {
					if (
						value.type == 'local-candidate' ||
						value.type == 'remote-candidate'
					)
						// console.log(
						// 	'111111111',
						// 	this.deviceId,
						// 	value.type,
						// 	value.candidateType,
						// 	value,
						// 	e,
						// 	stats.values()
						// )
					this.dispatch(value.type, value)
				}
			}
			switch (this.pc?.connectionState) {
				case 'connected':
					this.status = 'connected'

					break
				case 'connecting':
					this.status = 'connecting'

					break
				case 'disconnected':
					this.status = 'disconnected'

					break
				case 'closed':
					this.status = 'closed'

					break

				default:
					break
			}
			this.pc?.connectionState &&
				this.dispatch(this.pc?.connectionState as any, this)
		}
		this.pc.oniceconnectionstatechange = (e) => {
			console.log('1oniceconnectionstatechange', e)
		}
		this.pc.onicecandidateerror = (e) => {
			console.log('1onicecandidateerror', e)
		}

		this.pc.onicecandidate = (e) => {
			console.log('onicecandidate', e, e?.candidate?.type)
			// const { webRTC, user, fileTransfer } = store.getState()
			if (e.candidate) {
				// await nsocketioAPI.FileTransfer.Data(fileTransfer.shareCode, {
				// 	type: 'candidate',

				// 	label: e.candidate.sdpMLineIndex,
				// 	id: e.candidate.sdpMid,
				// 	candidate: e.candidate.candidate,
				// 	deviceId: user.deviceId,
				// })
				this.client?.nwebrtc?.sendDataFunc?.({
					type: 'candidate',
					data: {
						label: e.candidate.sdpMLineIndex,
						id: e.candidate.sdpMid,
						candidate: e.candidate.candidate,
					},
					toDeviceId: this.deviceId,
					deviceId: client.nwebrtc?.deviceId || '',
					roomId: this.roomId,
				})
				// console.log('连接类型: =>', e.candidate.type)
			} else {
				console.log('this is the end candidate')
				// this.client.dispatch('connected')
			}
		}

		// otherdc

		this.pc.ondatachannel = (e) => {
			// const { webRTC, user } = store.getState()
			console.log('ondatachannel', e, this)
			// // dc = e.channel
			this.otherDC = e.channel
			this.otherDC.send('success')
		}

		var options = { ordered: true, maxRetransmits: 30 }
		this.dc = this.pc?.createDataChannel('fileTransfer', options)

		this.dc.onerror = (error) => {
			console.log('dc,onerror', error)
		}

		this.dc.onopen = (event) => {
			console.log('dc,onopen', this.dc, this.pc, event)

			// setTimeout(() => {
			// 	this.dc?.send('11111111111111')
			// }, 1000)
		}
		this.dc.onclose = () => {
			console.log('dc,onclose')
		}
		let receiveBuffer: ArrayBuffer[] = []
		let time = 0
		this.dc.onmessage = (event) => {
			// console.log('dc,onmessage', event)
			try {
				if (event.data instanceof ArrayBuffer) {
					// console.log('ArrayBuffer', event.data)
					this.client.bytes('received', event.data.byteLength)
					const size = Number(
						ArrayBufferToString(
							event.data.slice(
								event.data.byteLength - 10,
								event.data.byteLength
							)
						)
					)
					// console.log(
					// 	ArrayBufferToString(
					// 		message.data.slice(size, message.data.byteLength - 10)
					// 	)
					// )
					const infoObj: any = JSON.parse(
						ArrayBufferToString(
							event.data.slice(size, event.data.byteLength - 10)
						)
					)

					// console.log(this.routers, infoObj, this.requests)
					// this.requests[message.clientInfo.clientId][data.eventName][
					// 	data?.requestId
					// ]?.response?.func?.(data)
					// this.routers['file-onreceiving']?.({
					// 	data: {
					// 		chunk: event.data.slice(0, size),
					// 		hash: infoObj['hash'],
					// 		offset: infoObj['offset'],
					// 	},
					// } as any)

					this.client.dispatch(
						('router' + 'file-onreceiving') as any,
						{
							data: {
								chunk: event.data.slice(0, size),
								hash: infoObj['hash'],
								offset: infoObj['offset'],
							},
						} as DataChannelData
					)
					return
				}
				if (typeof event.data === 'string') {
					this.client.bytes('received', event.data.length)
					if (event.data === 'success') {
						console.log(this)
						// this.status = 'connected'
						// this.client.status = 'connected'

						this.client.dispatch('data-channel-connected', this)

						const dataChannelAPI = this.client.DataChannelAPI()
						dataChannelAPI.emit('new-device', this.deviceId)
						return
					}
					const data = JSON.parse(event.data)
					if (data?.eventName) {
						this.client.dispatch(
							('router' + data.eventName) as any,
							{
								data: data.data,
								deviceId: data.deviceId,
								roomId: data.roomId,
								requestId: data.requestId,
							} as DataChannelData
						)
						// this.routerFuncs[data.eventName]?.forEach((f) => {
						// 	f(data.data)
						// })
					}
					return
				}
			} catch (error) {
				console.error(error)
			}
			// if (typeof event.data !== 'string') {
			// 	receiveBuffer.push(event.data as any)
			// 	!time && (time = new Date().getTime())

			// 	console.log(event.data.byteLength)
			// 	if (event.data.byteLength !== 61440) {
			// 		const received = new File(
			// 			[
			// 				new Blob(receiveBuffer, {
			// 					type: 'image/jpeg',
			// 				}),
			// 			],
			// 			'z.jpg',
			// 			{
			// 				type: 'image/jpeg',
			// 			}
			// 		)

			// 		console.log('received', received)
			// 		console.log(new Date().getTime() - time)
			// 		console.log(
			// 			received.size / (new Date().getTime() - time) / 1024 + 'MB'
			// 		)

			// 		receiveBuffer = []
			// 		time = 0
			// 		download(URL.createObjectURL(received), 'test')
			// 		// const img = document.createElement('img')
			// 		// img.src = URL.createObjectURL(received)
			// 		// img.style.width = '300px'
			// 		// document.body.appendChild(img)
			// 	}

			// 	debounce.increase(() => {}, 3000)
			// }

			// if (event.data === 'success') {
			// 	console.log(dc)
			// 	console.log(pc)
			// 	console.log(pc.iceConnectionState)
			// 	console.log(pc.iceGatheringState)
			// 	console.log(pc.canTrickleIceCandidates)
			// }
		}
	}

	async createOffer() {
		if (this.pc?.signalingState === 'closed') {
			this.status = 'closed'
			this.dispatch('closed', this)
			return
		}
		this.status = 'connecting'
		this.dispatch('connecting', this)

		console.log('createOffer', this)
		const offer = await this.pc?.createOffer()
		console.log('offer', offer)
		await this.pc?.setLocalDescription(offer)

		console.log('pc', this.pc)

		return offer
	}
	async createAnswer(offer: RTCSessionDescriptionInit) {
		if (this.pc?.signalingState === 'closed') {
			this.status = 'closed'
			this.dispatch('closed', this)
			return
		}
		this.status = 'connecting'
		this.dispatch('connecting', this)

		console.log('createAnswer', offer, this)
		await this.pc?.setRemoteDescription(offer)
		const answer = await this.pc?.createAnswer()

		await this.pc?.setLocalDescription(answer)

		return answer
	}
	async setRemoteAnswer(remoteAnswer: RTCSessionDescriptionInit) {
		if (this.pc?.signalingState === 'closed') {
			this.status = 'closed'
			this.dispatch('closed', this)
			return
		}
		if (!this.pc?.currentRemoteDescription) {
			await this.pc?.setRemoteDescription(remoteAnswer)
		}
		console.log('setRemoteAnswer', remoteAnswer)
	}
	async setCandidate(candidateInitDict?: RTCIceCandidateInit) {
		var candidate = new RTCIceCandidate(candidateInitDict)
		await this.pc?.addIceCandidate(candidate)
		console.log('setCandidate', this)
		console.log('Successed to add ice candidate')
		console.log('连接类型: =>', candidate.type)
	}
	disconnect() {
		console.log(this)
		this.dc?.close()
		this.pc?.close()
		this.otherDC?.close()
		this.dispatch('disconnected', this)
		this.dispatch('closed', this)
		this.removeAllEvent()
	}
}
