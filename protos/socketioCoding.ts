import { ResponseData, Response } from '@nyanyajs/utils/dist/nsocketio'
import { Buffer } from 'buffer'
// import { AES, RSA } from '@nyanyajs/utils'
import { protoRoot, LongToNumber, FoeEachLongToNumber } from './'
// import * as nyanyalog from 'nyanyajs-log'
let ResponseType = protoRoot.base.ResponseType

// import store from '../store'

export const socketio = {
	ResponseDecode<T>(func: (res: Response<T>) => void, proto: T | any) {
		return (response: Response<any>) => {
			console.log('response', response)
			const dataAny: any = response.data
			let data: any = ResponseType.decode(
				new Uint8Array(Buffer.from(dataAny, 'base64'))
			)

			response.data = data

			response.data.code = LongToNumber(response.data?.code)
			// console.log(Long.fromValue(response.data?.code))

			if (
				response.data &&
				response.data?.code !== (10008 || 10007) &&
				typeof response.data.data === 'string'
			) {
				response.data.data = proto.decode(
					new Uint8Array(Buffer.from(response.data.data, 'base64'))
				)
			}
			switch (response?.data?.code) {
				case 10004:
					console.log('Login faild.')

					break

				default:
					break
			}
			response = FoeEachLongToNumber(response)

			func(response)
		}
	},
}
// 	ResponseDecode: <T = any>(
// 		response: Response<any> | any,
// 		proto: T | any
// 	): Response<T> => {
// 		if (
// 			response?.data?.code !== (10008 || 10007) &&
// 			typeof response?.data?.data === 'string'
// 		) {
// 			response.data.data = proto.decode(
// 				new Uint8Array(Buffer.from(response.data.data, 'base64'))
// 			)
// 		}
// 		// console.log(response)
// 		// console.log(response?.data)

// 		switch (response?.data?.code) {
// 			case 10004:
// 				console.log('Login faild.')

// 				break

// 			default:
// 				break
// 		}
// 		return response
// 	},
// }
// export const ResponseDecode = <T = any>(
// 	response: Response<any>
// ): Response<T> => {
// 	// console.log(response)
// 	const dataAny: any = response.data
// 	let { data, key } = ResponseEncryptDataType.decode(
// 		new Uint8Array(Buffer.from(dataAny, 'base64'))
// 	)

// 	// console.log(data)
// 	// console.log(key)
// 	const aesKey = store.state.storage.ws.getSync('ec-aesKey')
// 	// console.log('aesKey', aesKey)
// 	if (aesKey) {
// 		console.log(aesKey)
// 		const deData = AES.decrypt(data, aesKey)
// 		response.data = deData && JSON.parse(deData)
// 	} else {
// 		console.log('未加密')
// 	}
// 	return response
// }
