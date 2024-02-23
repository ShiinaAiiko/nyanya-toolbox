import store, { fileTransferSlice } from '../../store'
import { protoRoot, socketio } from '../../protos'
import socketApi from './api'
import md5 from 'blueimp-md5'
import nyanyalog from 'nyanyajs-log'
import { RSA, DiffieHellman, deepCopy } from '@nyanyajs/utils'
import { nwebrtc, webRTCMethods } from '../../store/webRTC'
import { fileTransferMethods } from '../../store/fileTransfer'
import { stringify } from 'querystring'
// import { e2eeDecryption } from './common'
// import { getDialogRoomUsers } from '../../store/modules/chat/methods'

export const createSocketioRouter = {
	createRouter() {
		const { nsocketio, api, config } = store.getState()
		if (!nsocketio.client) return
		// const state = store.state
		const namespace = api.nsocketio.namespace
		const routerEventName = api.nsocketio.routerEventName
		// // console.log(deepCopy(client), namespace, namespace.base)

		nsocketio.client?.routerGroup(namespace.Base).router({
			eventName: routerEventName.Error,
			func: (response) => {
				console.log('Socket.io Error', response)
				switch (response.data.code) {
					case 10009:
						// store.state.event.eventTarget.dispatchEvent(
						// 	new Event('initEncryption')
						// )
						break
					case 10004:
						// store.state.event.eventTarget.dispatchEvent(new Event('initLogin'))
						break

					default:
						break
				}
			},
		})

		nsocketio.client
			?.routerGroup(namespace.FileTransfer)
			.router({
				eventName: routerEventName.JoinedFTRoom,
				func: socketio.ResponseDecode<protoRoot.fileTransfer.JoinFTRoom.IResponse>(
					async (res) => {
						console.log('JoinedFTRoom', res)
						if (res.data.code === 200 && res.data?.data?.connectedDevices) {
							const { fileTransfer, user } = store.getState()
							console.log(
								'JoinedFTRoom',
								fileTransfer.devices,
								res.data.data.connectedDevices
							)

							store.dispatch(
								fileTransferSlice.actions.setDevices(
									res.data.data.connectedDevices?.map((v) => {
										const device = fileTransfer.devices.filter(
											(sv) => sv.deviceId === v.deviceId
										)
										return {
											uid: '',
											deviceId: v.deviceId || '',
											roomId: v.roomId || '',
											status: device.length
												? device[0]?.status
												: user.deviceId === v.deviceId
												? 'Connected'
												: 'NotConnected',
											connectType: device?.[0]?.connectType || 'Local',
										}
									}) || []
								)
							)

							if (
								!fileTransfer.devices.length &&
								res.data?.data?.connectedDevices?.length >= 2
							) {
								// 连接WebRTC
								await store.dispatch(
									fileTransferMethods.connect({
										roomId: fileTransfer.shareCode,
									})
								)

								const client = nwebrtc.getClient(fileTransfer.shareCode)

								const deviceId = res.data.data.connectedDevices?.filter((v) => {
									return v.deviceId !== user.deviceId
								})?.[0]?.deviceId
								console.log(
									'JoinedFTRoom',
									deviceId,
									user.deviceId,
									res.data.data.currentDevice,
									client
								)
								deviceId && client.connect(deviceId)
							}
						}
						// const res = socketio.ResponseDecode<protoRoot.sync.SyncData.IResponse>(
						// 	response,
						// 	protoRoot.sync.SyncData.Response
						// )
					},
					protoRoot.fileTransfer.JoinFTRoom.Response
				),
			})
			.router({
				eventName: routerEventName.ExitedFTRoom,
				func: socketio.ResponseDecode<protoRoot.fileTransfer.LeaveFTRoom.IResponse>(
					(res) => {
						console.log('LeaveFTRoom', res)
						if (res.data.code === 200) {
							const { fileTransfer, user } = store.getState()
							store.dispatch(
								fileTransferSlice.actions.setDevices(
									res.data.data.connectedDevices?.map((v) => {
										const device = fileTransfer.devices.filter(
											(sv) => sv.deviceId === v.deviceId
										)
										return {
											uid: '',
											deviceId: v.deviceId || '',
											roomId: v.roomId || '',
											status: device.length
												? device[0]?.status
												: user.deviceId === v.deviceId
												? 'Connected'
												: 'NotConnected',
											connectType: device?.[0]?.connectType || 'Local',
										}
									}) || []
								)
							)

							const client = nwebrtc.getClient(fileTransfer.shareCode)

							const deviceId = res.data.data.currentDevice?.deviceId
							deviceId && client.getTransport(deviceId).disconnect()
						}
						// const res = socketio.ResponseDecode<protoRoot.sync.SyncData.IResponse>(
						// 	response,
						// 	protoRoot.sync.SyncData.Response
						// )
					},
					protoRoot.fileTransfer.LeaveFTRoom.Response
				),
			})
	},
}
export default createSocketioRouter
