import { file as nfile } from '@nyanyajs/utils'
import md5 from 'blueimp-md5'
import {
	ConcatArrayBuffer,
	StringToArrayBuffer,
	ArrayBufferToString,
} from './common'
import { NWebRTCtransport } from './transport'
import { NEventListener } from './neventListener'

import { DataChannelData, FileInfo, SignalingData } from './types'
import { NWebRTCClient } from './client'

export class NWebRTC extends NEventListener<{
	'transfer-data': {
		sent: number
		received: number
	}
	'transfer-rate': number
	'transfer-rate-sent': number
	'transfer-rate-received': number
}> {
	deviceId: string = ''
	wsurl: string = ''
	configuration?: RTCConfiguration
	clients: {
		[roomId: string]: NWebRTCClient
	} = {}

	private transferredBytes = {
		sent: 0,
		received: 0,
	}

	private updateTransferRateInterval: number = 0
	private transferRateIntervalTimer?: NodeJS.Timeout

	sendDataFunc?: (data: SignalingData) => void

	constructor(
		wsurl: string,
		deviceId: string,
		configuration?: RTCConfiguration,
		options?: {
			// second
			updateTransferRateInterval?: number
		}
	) {
		super()
		this.wsurl = wsurl
		this.deviceId = deviceId
		this.configuration = configuration

		options?.updateTransferRateInterval &&
			this.setUpdateTransferRateInterval(options?.updateTransferRateInterval)

		// this.on('message', (val) => {
		// 	console.log('val')
		// })
	}

	createClient(roomId: string) {
		console.log('roomId', roomId)

		const client = new NWebRTCClient(roomId, this)
		console.log('client', client)

		client.on('disconnected', () => {
			delete this.clients[roomId]
		})

		this.clients[roomId] = client
		return client
	}

	getClient(roomId: string) {
		return this.clients?.[roomId]
	}
	sendData(f: (data: SignalingData) => void) {
		this.sendDataFunc = f
	}
	async receiveData(data: SignalingData) {
		console.log('receiveData', data, this.deviceId)
		if (data.toDeviceId !== this.deviceId) {
			return
		}
		switch (data.type) {
			case 'offer':
				console.log('offeroffer', this)
				let client = this.getClient(data.roomId)
				if (!this.getClient(data.roomId)) {
					client = this.createClient(data.roomId)
				}
				let transport = client.getTransport(data.deviceId)
				if (!transport) {
					transport = client.createTransport(data.deviceId)
				}
				const answer = await transport.createAnswer(data.data)

				this.sendDataFunc?.({
					type: 'answer',
					data: answer,
					roomId: transport.roomId,
					toDeviceId: data.deviceId,
					deviceId: client.nwebrtc?.deviceId || '',
				})
				break
			case 'answer':
				console.log(
					'aaaaaaaaa',
					this,
					this.getClient(data.roomId).getTransport(data.deviceId)
				)
				this.getClient(data.roomId)
					.getTransport(data.deviceId)
					.setRemoteAnswer(data.data)

				break
			case 'candidate':
				this.getClient(data.roomId).getTransport(data.deviceId).setCandidate({
					sdpMLineIndex: data.data.label,
					candidate: data.data.candidate,
				})
				break

			default:
				break
		}
	}
	bytes(type: 'sent' | 'received', bytes: number) {
		this.transferredBytes[type] += bytes
		// console.log('bytes', type, bytes, this.transferredBytes)
	}

	setUpdateTransferRateInterval(second: number) {
		this.updateTransferRateInterval = second * 1000
		if (!this.updateTransferRateInterval) return
		this.transferRateIntervalTimer &&
			clearInterval(this.transferRateIntervalTimer)

		const cTransferredBytes = {
			sent: 0,
			received: 0,
		}
		this.transferRateIntervalTimer = setInterval(() => {
			const sentSpeed = this.transferredBytes.sent - cTransferredBytes.sent
			const receivedSpeed =
				this.transferredBytes.received - cTransferredBytes.received

			this.dispatch('transfer-data', {
				sent: this.transferredBytes.sent,
				received: this.transferredBytes.received,
			})
			this.dispatch('transfer-rate', sentSpeed + receivedSpeed / second)
			this.dispatch('transfer-rate-sent', sentSpeed / second)
			this.dispatch('transfer-rate-received', receivedSpeed / second)
			cTransferredBytes.sent = this.transferredBytes.sent
			cTransferredBytes.received = this.transferredBytes.received
		}, this.updateTransferRateInterval)
	}
}
