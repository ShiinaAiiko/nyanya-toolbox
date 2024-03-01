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

export const MoveCarQRC = () => {
	return {
		async CreateMoveCarQRC(params: protoRoot.moveCarQRC.IMoveCarQRCEditItem) {
			const { api } = store.getState()

			return await RequestProtobuf<protoRoot.moveCarQRC.CreateMoveCarQRC.IResponse>(
				{
					method: 'POST',
					url: getUrl(api.apiUrls.v1.baseUrl, api.apiUrls.v1.createMoveCarQRC),

					data: NRequest.protobuf.ParamsEncode<protoRoot.moveCarQRC.CreateMoveCarQRC.IRequest>(
						{
							moveCarQRC: params,
						},
						protoRoot.moveCarQRC.CreateMoveCarQRC.Request
					),
				},
				protoRoot.moveCarQRC.CreateMoveCarQRC.Response
			)
		},
		async UpdateMoveCarQRC(
			id: string,
			params: protoRoot.moveCarQRC.IMoveCarQRCEditItem
		) {
			const { api } = store.getState()

			return await RequestProtobuf<protoRoot.moveCarQRC.UpdateMoveCarQRC.IResponse>(
				{
					method: 'POST',
					url: getUrl(api.apiUrls.v1.baseUrl, api.apiUrls.v1.updateMoveCarQRC),

					data: NRequest.protobuf.ParamsEncode<protoRoot.moveCarQRC.UpdateMoveCarQRC.IRequest>(
						{
							id,
							moveCarQRC: params,
						},
						protoRoot.moveCarQRC.UpdateMoveCarQRC.Request
					),
				},
				protoRoot.moveCarQRC.UpdateMoveCarQRC.Response
			)
		},
		async DeleteMoveCarQRC(id: string) {
			const { api } = store.getState()

			return await RequestProtobuf<protoRoot.moveCarQRC.DeleteMoveCarQRC.IResponse>(
				{
					method: 'POST',
					url: getUrl(api.apiUrls.v1.baseUrl, api.apiUrls.v1.deleteMoveCarQRC),

					data: NRequest.protobuf.ParamsEncode<protoRoot.moveCarQRC.DeleteMoveCarQRC.IRequest>(
						{
							id,
						},
						protoRoot.moveCarQRC.DeleteMoveCarQRC.Request
					),
				},
				protoRoot.moveCarQRC.DeleteMoveCarQRC.Response
			)
		},
		async GetMoveCarQRCList(params: {
			sort: 'CreateTimeASC' | 'CreateTimeDESC'
			pageNum: number
			pageSize: number
		}) {
			const { api } = store.getState()

			return await RequestProtobuf<protoRoot.moveCarQRC.GetMoveCarQRCList.IResponse>(
				{
					method: 'GET',
					url: getUrl(api.apiUrls.v1.baseUrl, api.apiUrls.v1.getMoveCarQRCList),

					data: NRequest.protobuf.ParamsEncode<protoRoot.moveCarQRC.GetMoveCarQRCList.IRequest>(
						params,
						protoRoot.moveCarQRC.GetMoveCarQRCList.Request
					),
				},
				protoRoot.moveCarQRC.GetMoveCarQRCList.Response
			)
		},
		async GetMoveCarQRC(id: string) {
			const { api } = store.getState()

			return await RequestProtobuf<protoRoot.moveCarQRC.GetMoveCarQRC.IResponse>(
				{
					method: 'GET',
					url: getUrl(api.apiUrls.v1.baseUrl, api.apiUrls.v1.getMoveCarQRC),

					data: NRequest.protobuf.ParamsEncode<protoRoot.moveCarQRC.GetMoveCarQRC.IRequest>(
						{ id },
						protoRoot.moveCarQRC.GetMoveCarQRC.Request
					),
				},
				protoRoot.moveCarQRC.GetMoveCarQRC.Response
			)
		},
		async SendEmail(id: string) {
			const { api } = store.getState()

			return await RequestProtobuf<protoRoot.moveCarQRC.SendEmail.IResponse>(
				{
					method: 'POST',
					url: getUrl(api.apiUrls.v1.baseUrl, api.apiUrls.v1.sendEmail),

					data: NRequest.protobuf.ParamsEncode<protoRoot.moveCarQRC.SendEmail.IRequest>(
						{ id },
						protoRoot.moveCarQRC.SendEmail.Request
					),
				},
				protoRoot.moveCarQRC.SendEmail.Response
			)
		},
	}
}
