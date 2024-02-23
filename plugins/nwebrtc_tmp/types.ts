export interface SignalingData {
	roomId: string
	toDeviceId: string
	deviceId: string
	type: 'offer' | 'answer' | 'candidate'
	data: any
}
export interface DataChannelData {
	requestId: string
	roomId: string
	deviceId: string
	data: any
}
export interface FileInfo {
	id: string

	name: string
	size: number
	type: string
	fileSuffix: string
	lastModified: number
	hash: string
	chunkSize: number

	width: number
	height: number
}
