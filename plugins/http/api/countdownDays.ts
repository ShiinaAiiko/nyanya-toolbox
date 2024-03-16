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

export const CountdownDays = () => {
	return {
		async GetUploadToken(
			params: protoRoot.countdownDays.GetUploadToken.IRequest
		) {
			const { api } = store.getState()

			return await RequestProtobuf<protoRoot.countdownDays.GetUploadToken.IResponse>(
				{
					method: 'GET',
					url: getUrl(
						api.apiUrls.v1.baseUrl,
						api.apiUrls.v1.getUploadTokenOfCountdownDays
					),

					data: NRequest.protobuf.ParamsEncode<protoRoot.countdownDays.GetUploadToken.IRequest>(
						params,
						protoRoot.countdownDays.GetUploadToken.Request
					),
				},
				protoRoot.countdownDays.GetUploadToken.Response
			)
		},
		async GetCountdownDaysFileUrls() {
			const { api } = store.getState()

			return await RequestProtobuf<protoRoot.countdownDays.GetCountdownDaysFileUrls.IResponse>(
				{
					method: 'GET',
					url: getUrl(
						api.apiUrls.v1.baseUrl,
						api.apiUrls.v1.getCountdownDaysFileUrls
					),

					data: NRequest.protobuf.ParamsEncode<protoRoot.countdownDays.GetCountdownDaysFileUrls.IRequest>(
						{},
						protoRoot.countdownDays.GetCountdownDaysFileUrls.Request
					),
				},
				protoRoot.countdownDays.GetCountdownDaysFileUrls.Response
			)
		},
	}
}
