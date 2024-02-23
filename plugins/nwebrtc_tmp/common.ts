export function ArrayBufferToString(buf: ArrayBuffer) {
	return String.fromCharCode.apply(null, new Uint16Array(buf) as any)
}
export function StringToArrayBuffer(str: string) {
	var buf = new ArrayBuffer(str.length * 2)
	var bufView = new Uint16Array(buf)
	for (var i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i)
	}
	return buf
}
export function ConcatArrayBuffer(...arrays: ArrayBuffer[]) {
	let totalLen = 0

	for (let arr of arrays) totalLen += arr.byteLength

	let res = new Uint8Array(totalLen)

	let offset = 0

	for (let arr of arrays) {
		let uint8Arr = new Uint8Array(arr)

		res.set(uint8Arr, offset)

		offset += arr.byteLength
	}

	return res.buffer
}
