import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, { ActionParams } from '.'
import { WebStorage } from '@nyanyajs/utils'
// import { User } from './user'
// import { WebStorage } from '@nyanyajs/utils'

export let storage = {
	global: new WebStorage({
		storage: 'IndexedDB',
		baseLabel: 'global',
	}),
	// token: new WebStorage<string, string>({
	// 	storage: 'IndexedDB',
	// 	baseLabel: 'token',
	// }),
	// users: new WebStorage<number, User>({
	// 	storage: 'IndexedDB',
	// 	baseLabel: 'users',
	// }),
}

export const storageMethods = {
	init: createAsyncThunk('storage/init', async ({}, thunkAPI) => {
		return
	}),
}

export const storageSlice = createSlice({
	name: 'storage',
	initialState: {
		// 未来改nodefs
	},
	reducers: {
		init: (state) => {
			let uid = 0
		},
	},
})
