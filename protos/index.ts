import * as nyanyalog from 'nyanyajs-log'
import { Buffer } from 'buffer'
import Long from 'long'
import protoRoot from './proto'
import { ResponseDecode, Request } from './request'
import { socketio } from './socketioCoding'
export const PARAMS = <T = any>(data: T, proto: T | any) => {
	try {
		return {
			data: Buffer.from(
				proto.encode(proto.create(data)).finish(),
				'base64'
			).toString('base64'),
		}
	} catch (error) {
		nyanyalog.error(error)
	}
}

export const LongToNumber = (data: any): number => {
	if (data?.hasOwnProperty('low') && typeof data?.low === 'number') {
		const long = new Long(data.low, data.high, data.unsigned)

		return long.toNumber()
	}
	return data
}

export const FoeEachLongToNumber = (data: any) => {
	Object.keys(data).forEach((k) => {
    if (typeof data[k] === 'object') {
			if (data[k]?.hasOwnProperty('low')) {
				data[k] = LongToNumber(data[k])
			} else {
				FoeEachLongToNumber(data[k])
			}
		}
	})
	return data
}

export { protoRoot, ResponseDecode, Request, socketio }
