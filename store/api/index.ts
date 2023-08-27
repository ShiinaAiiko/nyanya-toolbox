import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { server } from '../../config'

export const apiMethods = {}

export const apiSlice = createSlice({
	name: 'api',
	initialState: {
		apiUrl: server.url,
		apiUrls: {
			v1: {
				baseUrl: '/api/v1',
				urlToIp: '/url/toIp',
				ipDetails: '/ip/details',
			},
		},
	},
	reducers: {},
	extraReducers: (builder) => {},
})
