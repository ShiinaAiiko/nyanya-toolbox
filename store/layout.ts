import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'

export const layoutMethods = {}
export const layoutSlice = createSlice({
	name: 'layout',
	initialState: {
		header: false,
    footer: true,
    headerLogoText:"",
	},
	reducers: {
		setLayoutHeader: (
			state,
			params: {
				payload: boolean
				type: string
			}
		) => {
			state.header = params.payload
		},
		setLayoutHeaderLogoText: (
			state,
			params: {
				payload: string
				type: string
			}
		) => {
			state.headerLogoText = params.payload
		},
		setLayoutFooter: (
			state,
			params: {
				payload: boolean
				type: string
			}
		) => {
			state.footer = params.payload
		},
	},
})
