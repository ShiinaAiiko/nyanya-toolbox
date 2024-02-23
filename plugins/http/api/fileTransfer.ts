import * as proto from '../../../protos'
import * as coding from '../../../protos/socketioCoding'
import protoRoot from '../../../protos/proto'
import store from '../../../store'
import { RSA, AES } from '@nyanyajs/utils'
import { NSocketIoClient, NRequest } from '@nyanyajs/utils'
import { R } from '../../../store/config'
import { RequestProtobuf, getUrl } from '.'
// import { e2eeDecryption, e2eeEncryption } from '../common'

const { ResponseDecode, ParamsEncode } = NRequest.protobuf

export const FileTransfer = () => {
	return {
		async GetShareCode(deviceId: string) {
			const { api } = store.getState()

			return await RequestProtobuf<protoRoot.fileTransfer.GetShareCode.IResponse>(
				{
					method: 'GET',
					url: getUrl(api.apiUrls.v1.baseUrl, api.apiUrls.v1.getFTShareCode),

					data: NRequest.protobuf.ParamsEncode<protoRoot.fileTransfer.GetShareCode.IRequest>(
						{
							deviceId,
						},
						protoRoot.fileTransfer.GetShareCode.Request
					),
				},
				protoRoot.fileTransfer.GetShareCode.Response
			)
		},
		async ConnectFTRoom(shareCode: string, deviceId: string) {
			const { api } = store.getState()

			return await RequestProtobuf<protoRoot.fileTransfer.ConnectFTRoom.IResponse>(
				{
					method: 'POST',
					url: getUrl(api.apiUrls.v1.baseUrl, api.apiUrls.v1.connectFTRoom),

					data: NRequest.protobuf.ParamsEncode<protoRoot.fileTransfer.ConnectFTRoom.IRequest>(
						{
							shareCode,
							deviceId,
						},
						protoRoot.fileTransfer.ConnectFTRoom.Request
					),
				},
				protoRoot.fileTransfer.ConnectFTRoom.Response
			)
		},
		async ReconnectFTRoom(shareCode: string, deviceId: string) {
			const { api } = store.getState()

			return await RequestProtobuf<protoRoot.fileTransfer.ReconnectFTRoom.IResponse>(
				{
					method: 'POST',
					url: getUrl(api.apiUrls.v1.baseUrl, api.apiUrls.v1.reconnectFTRoom),

					data: NRequest.protobuf.ParamsEncode<protoRoot.fileTransfer.ReconnectFTRoom.IRequest>(
						{
							shareCode,
							deviceId,
						},
						protoRoot.fileTransfer.ReconnectFTRoom.Request
					),
				},
				protoRoot.fileTransfer.ReconnectFTRoom.Response
			)
		},
	}
}
