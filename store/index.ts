import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import exp from 'constants'
// import thunk from 'redux-thunk'
import { useDispatch } from 'react-redux'

import { apiSlice, apiMethods } from './api'
import { userSlice, userMethods } from './user'
import { localUserSlice, localUserMethods } from './localUser'
import { layoutSlice, layoutMethods } from './layout'
import { configSlice, configMethods } from './config'
import { nsocketioSlice, nsocketioMethods } from './nsocketio'
import { fileTransferSlice, fileTransferMethods } from './fileTransfer'
import { webRTCSlice, webRTCMethods } from './webRTC'
import { emojiSlice, emojiMethods } from './emoji'

export interface ActionParams<T = any> {
	type: string
	payload: T
}

const rootReducer = combineReducers({
	api: apiSlice.reducer,
	user: userSlice.reducer,
	layout: layoutSlice.reducer,
	config: configSlice.reducer,
	nsocketio: nsocketioSlice.reducer,
	fileTransfer: fileTransferSlice.reducer,
	webRTC: webRTCSlice.reducer,
	emoji: emojiSlice.reducer,
	localUser: localUserSlice.reducer,
})

const store = configureStore({
	reducer: rootReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
})

export {
	apiSlice,
	userSlice,
	configSlice,
	fileTransferSlice,
	nsocketioSlice,
	layoutSlice,
	webRTCSlice,
	emojiSlice,
	localUserSlice,
}
export const methods = {
	api: apiMethods,
	user: userMethods,
	layout: layoutMethods,
	config: configMethods,
	nsocketio: nsocketioMethods,
	fileTransfer: fileTransferMethods,
	webRTC: webRTCMethods,
	emoji: emojiMethods,
	localUser: localUserMethods,
}

// console.log(store.getState())
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()

export default store
