import { NRequest, NSocketIoClient } from '@nyanyajs/utils'
import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import store, { ActionParams } from '.'

import nsocketioAPI from '../plugins/socketio/api'

import protoRoot from '../protos/proto'
import createSocketioRouter from '../plugins/socketio/router'

const state = {
	token: '',
	client: undefined as NSocketIoClient | undefined,
	opts: {
		reconnectionDelay: 2000,
		reconnectionDelayMax: 5000,
		secure: false,
		autoConnect: true,
		rejectUnauthorized: false,
		transports: ['websocket'],
	},
	status: 'notConnected' as 'connecting' | 'success' | 'fail' | 'notConnected',
}

const setStatus = (s: (typeof state)['status']) => {
	new Promise((resolve) => {
		store.dispatch(nsocketioSlice.actions.setStatus(s))
		resolve('')
	}).then()
}

export const nsocketioSlice = createSlice({
	name: 'nsocketio',
	initialState: state,
	reducers: {
		setStatus: (state, params: ActionParams<(typeof state)['status']>) => {
			state.status = params.payload
		},
		setToken: (
			state,
			params: {
				payload: string
				type: string
			}
		) => {
			state.token = params.payload
		},
		setClient: (
			state,
			params: {
				payload: NSocketIoClient | undefined
				type: string
			}
		) => {
			state.client = params.payload
		},
	},
})
export const nsocketioMethods = {
	init: createAsyncThunk('socketio/init', async (_, thunkAPI) => {
		const { api, nsocketio, user } = store.getState()
		if (nsocketio.client) return

		const query = NRequest.protobuf.ParamsEncode<protoRoot.base.IRequestType>(
			{
				token: user.token,
				userAgent: user.userAgent,
				deviceId: user.deviceId,
			},
			protoRoot.base.RequestType
		)

		console.log(query, user)

		const client = new NSocketIoClient({
			uri: api.apiUrl,
			opts: {
				...nsocketio.opts,
				query: query,
			},
			heartbeatInterval: 0,
		})
		thunkAPI.dispatch(nsocketioSlice.actions.setClient(client))

		console.log('MSCnsocketio connect', user.userAgent, client)
		client.on('connected', () => {
			console.log('connected')
			setStatus('success')
		})
		client.on('connecting', () => {
			console.log('connecting')
			setStatus('connecting')
		})
		client.on('disconnect', () => {
			console.log('disconnect')
			setStatus('fail')
		})
		client.on('close', () => {
			console.log('socketioclose')
			setStatus('notConnected')
		})
		client.socket(api.nsocketio.namespace.Base)
		client.socket(api.nsocketio.namespace.FileTransfer)

		createSocketioRouter.createRouter()

		// ResponseDecode
		// const res = await client.emit({
		// 	namespace: '/fileTransfer',
		// 	eventName: 'JoinRoomFT',
		// 	params: 'aaaaaaa',
		// })
	}),
}
