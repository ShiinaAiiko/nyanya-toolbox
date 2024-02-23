import { info } from 'nyanyajs-log'
import {
	ResponseData,
	Response,
	requestConfig,
} from '@nyanyajs/utils/dist/nrequest'
import { Buffer } from 'buffer'
// import { ResponseData, Response, requestConfig,request } from '../modules/request'
import { FoeEachLongToNumber } from '.'
import store from '../store'
import protoRoot from './proto'
import { R } from '../store/config'

export const ResponseDecode = <T = any>(
	response: Response,
	proto: T | any
): ResponseData<T> => {
	try {
		if (
			response.data?.code !== (10008 || 10007) &&
			response.headers['content-type'] === 'application/x-protobuf' &&
			typeof response.data?.data === 'string'
		) {
			// console.log("response.data.data", response.data.data)
			// console.log("proto",proto)
			response.data.data = proto.decode(
				new Uint8Array(Buffer.from(response.data.data, 'base64'))
			)
		}
		response.data = FoeEachLongToNumber(response.data)
		// console.log(response.data)
		switch (response.data.code) {
			case 10004:
				console.log('Login faild.')
				// store.dispatch('user/login')
				break

			default:
				break
		}
		return response.data
	} catch (error) {
		throw error
	}
}

export const Request = async <T = any>(config: requestConfig, proto: any) => {
	config.config = {
		// ...store.state.config.requestConfig,
		dataType: 'protobuf',
		// 后面也是需要加密的
		resquestEncryption: false,
		responseEncryption: false,
	}
	return ResponseDecode<T>(await R.request(config), proto)
}

// export default {}
