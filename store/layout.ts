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
		bottomNavigator: true,
		openStatisticsModal: false,
		openLoginModal: false,
		headerLogoText: '',
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
		setOpenLoginModal: (
			state,
			params: {
				payload: boolean
				type: string
			}
		) => {
			state.openLoginModal = params.payload
		},
		setOpenStatisticsModal: (
			state,
			params: {
				payload: boolean
				type: string
			}
		) => {
			state.openStatisticsModal = params.payload
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
		setBottomNavigator: (
			state,
			params: {
				payload: boolean
				type: string
			}
		) => {
			state.bottomNavigator = params.payload
		},
	},
})
