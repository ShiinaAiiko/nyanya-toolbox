import * as proto from '../../../protos'
import * as coding from '../../../protos/socketioCoding'
import protoRoot from '../../../protos/proto'
import store from '../../../store'
import { RSA, AES } from '@nyanyajs/utils'
import { NSocketIoClient, NRequest } from '@nyanyajs/utils'
// import { e2eeDecryption, e2eeEncryption } from '../common'

const { ResponseDecode, ParamsEncode } = NRequest.protobuf

export const FileTransfer = () => {
	return {
		async JoinRoom(roomId: string) {
			const { api, nsocketio } = store.getState()
			if (!nsocketio.client) return
			return ResponseDecode<protoRoot.fileTransfer.JoinFTRoom.IResponse>(
				ResponseDecode<protoRoot.base.IResponseType>(
					{
						data: await nsocketio.client?.emit({
							namespace: api.nsocketio.namespace.FileTransfer,
							eventName: api.nsocketio.requestEventName.JoinFTRoom,
							params: ParamsEncode<protoRoot.fileTransfer.JoinFTRoom.IRequest>(
								{
									roomId,
								},
								protoRoot.fileTransfer.JoinFTRoom.Request
							),
						}),
					} as any,
					protoRoot.base.ResponseType
				) as any,
				protoRoot.fileTransfer.JoinFTRoom.Response
			)
		},
		async LeaveFTRoom(roomId: string) {
			const { api, nsocketio } = store.getState()
			if (!nsocketio.client) return

			return ResponseDecode<protoRoot.fileTransfer.LeaveFTRoom.IResponse>(
				ResponseDecode<protoRoot.base.IResponseType>(
					{
						data: await nsocketio.client?.emit({
							namespace: api.nsocketio.namespace.FileTransfer,
							eventName: api.nsocketio.requestEventName.LeaveFTRoom,
							params: ParamsEncode<protoRoot.fileTransfer.LeaveFTRoom.IRequest>(
								{
									roomId,
								},
								protoRoot.fileTransfer.LeaveFTRoom.Request
							),
						}),
					} as any,
					protoRoot.base.ResponseType
				) as any,
				protoRoot.fileTransfer.LeaveFTRoom.Response
			)
		},
		async IncreaseFTRoomTimeLimit(roomId: string) {
			const { api, nsocketio } = store.getState()
			if (!nsocketio.client) return

			return ResponseDecode<protoRoot.fileTransfer.IncreaseFTRoomTimeLimit.IResponse>(
				ResponseDecode<protoRoot.base.IResponseType>(
					{
						data: await nsocketio.client?.emit({
							namespace: api.nsocketio.namespace.FileTransfer,
							eventName: api.nsocketio.requestEventName.IncreaseFTRoomTimeLimit,
							params:
								ParamsEncode<protoRoot.fileTransfer.IncreaseFTRoomTimeLimit.IRequest>(
									{
										roomId,
									},
									protoRoot.fileTransfer.IncreaseFTRoomTimeLimit.Request
								),
						}),
					} as any,
					protoRoot.base.ResponseType
				) as any,
				protoRoot.fileTransfer.IncreaseFTRoomTimeLimit.Response
			)
		},
		async Data(roomId: string, data: any) {
			const { api, nsocketio } = store.getState()
			if (!nsocketio.client) return

			return await nsocketio.client?.emit({
				namespace: api.nsocketio.namespace.FileTransfer,
				eventName: api.nsocketio.requestEventName.Data,
				params: {
					roomId,
					data: {
						data,
					},
				},
			})
		},
	}
}
