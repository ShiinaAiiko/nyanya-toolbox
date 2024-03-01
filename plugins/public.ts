// import { interceptors } from './request'
import store from '../store'
import { protoRoot, FoeEachLongToNumber, PARAMS, Request } from '../protos'
import { Buffer } from 'buffer'
import { R } from '../store/config'
import { deepCopy } from '@nyanyajs/utils'
// import { NWebRTC } from './nwebrtc/nwebrtc'
let RequestType = protoRoot.base.RequestType
let ResponseType = protoRoot.base.ResponseType
let ResponseEncryptDataType = protoRoot.base.ResponseEncryptDataType

R.interceptors.request.use(async (config) => {
  const state = store.getState()
	const { api, user } = state
	const { token, deviceId, userAgent } = user
	// console.log(String(config.url).indexOf(api.baseUrl) >= 0 && token)
	// console.log(String(config.url).indexOf(api.apiUrl) >= 0, token)
	if (String(config.url).indexOf(api.apiUrl) >= 0 && token) {
		config.data.token = token
		config.data.deviceId = deviceId
	}
	config.data.userAgent = userAgent
	config.data.language = state.config.lang
	// console.log('configf', deepCopy(config), Boolean(String(config.url).indexOf(api.apiUrl) >= 0 && token))
	// nyanyalog.info("axiosrequest",JSON.parse(JSON.stringify(config.data)))

	// 发送请求也需要序列号
	// 当没有远程publicKey的时候也要加密
	if (config?.config?.resquestEncryption) {
		// console.log(!store.state.encryption.client?.aes.key)
		// // 没有完成加密
		// const aesKey = store.state.storage.ws.getSync('ec-aesKey')
		// const userKey = store.state.storage.ws.getSync('ec-userKey')
		// // console.log(
		// // 	'ec-aesKey',
		// // 	aesKey,
		// // 	userKey,
		// // 	Math.random().toString(),
		// // 	Math.random()
		// // )
		// if (!aesKey || !userKey) {
		// 	console.log(api.RSA.publicKey)
		// 	// 1、获取并加密临时TempAESKey
		// 	const aesKey = md5(
		// 		Math.random().toString() +
		// 			Math.random().toString() +
		// 			Math.random().toString() +
		// 			new Date().toString()
		// 	)
		// 	// console.log('aesKey', aesKey)
		// 	const aesKeyEnStr = RSA.encrypt(api.RSA.publicKey, aesKey)
		// 	// console.log('aesKeyEnStr', aesKeyEnStr)
		// 	// console.log(config.data)
		// 	const dataEnStr = AES.encrypt(config.data, aesKey)
		// 	// console.log(config.data.data.length)
		// 	// console.log(config.data.token.length)
		// 	// console.log(dataEnStr.value.length)
		// 	// console.log(aesKeyEnStr.length)
		// 	config.data = {
		// 		data: dataEnStr.value,
		// 		tempAesKey: aesKeyEnStr,
		// 	}
		// 	// console.log(config.data)
		// } else {
		// 	const enData = AES.encrypt(config.data, aesKey)
		// 	config.data = {
		// 		data: enData.value,
		// 		key: userKey,
		// 		// key: store.state.encryption.client?.aes.userKey + '323232sa',
		// 	}
		// }
	} else {
		// console.log('不需要加密', {
		// 	token: config.data.token,
		// 	deviceId: config.data.deviceId,
		// 	userAgent: config.data.userAgent,
		// 	data: config.data.data,
		// })
		const data: any = RequestType.encode(
			RequestType.create({
				token: config.data.token,
				deviceId: config.data.deviceId,
				userAgent: config.data.userAgent,
				language: config.data.language,
				data: config.data.data,
			})
		).finish()

		config.data = {
			data: Buffer.from(data, 'base64').toString('base64'),
		}
	}
	// console.log(config.data)

	// if (config?.config?.dataType === 'protobuf') {
	// 	config.responseType = 'arraybuffer'
	// }
	// config.data = {
	// 	a: 121,
	// }
	return config
})

R.interceptors.response.use(async (response) => {
	const config: any = response.config
	// console.log(config)
	if (
		config?.config?.dataType === 'protobuf' &&
		response?.headers?.['content-type'] === 'application/x-protobuf'
	) {
		// 	// 将二进制数据生成js对象
		// console.log(response.data.protobuf)
		// console.log(Buffer.from(response.data.protobuf, 'utf-8'))
		// console.log(new Uint8Array(Buffer.from(response.data.protobuf, 'base64')))

		// console.log(ResponseType.encode)

		let data: any = ResponseType.decode(
			// Buffer.from(response.data.protobuf, 'utf-8')
			new Uint8Array(Buffer.from(response.data.protobuf, 'base64'))
		)
		data.code = data.code?.toNumber?.() || data.code
		data.requestTime = data.requestTime?.toNumber?.() || data.requestTime
		// console.log('data', data)
		// 	// console.log('key', key)
		// 	// console.log(config.config.responseEncryption)
		// 	if (config.config.responseEncryption) {
		// 		// console.log('解密开始', response.data, data, !!data.key)

		// 		const aesKey = store.state.storage.ws.getSync('ec-aesKey')
		// 		const userKey = store.state.storage.ws.getSync('ec-userKey')

		// 		// console.log('获取到的aesKey', aesKey)
		// 		// console.log(data.key)
		// 		if (!data.key) {
		// 			data.key = aesKey
		// 		}
		response.data = FoeEachLongToNumber({
			...response.data,
			...data,
			// ...JSON.parse(AES.decrypt(data.data, data.key, data.key)),
		})
		// console.log('解密', response.data, data.key)
		delete response.data.protobuf
		// 	}
		// }
		// // console.log(response.data)
		// if (response.data.code === 10008 || response.data.code === 10007) {
		// 	// setTimeout(() => {
		// 	store.dispatch('encryption/reEncrypt')
		// 	// }, 3000)
		// 	console.log('加密失败', response)
		// }
		// console.log('new response ', response)
		// config.data = {
		// 	a: 121,
	}
	return response
})

export const initPublic = () => {
	const { webRTC, nsocketio, api, user } = store.getState()
	// console.log('initpublic')
}
