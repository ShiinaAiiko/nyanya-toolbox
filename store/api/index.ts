import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, { RootState, userSlice } from '../index'
// import { request } from '../../plugins/methods'
// import { api, sso, passwordKey } from '../../config'
// import { storage } from '../storage'
import { useRouter } from 'next/router'
import { bindEvent, snackbar, progressBar } from '@saki-ui/core'

export const apiMethods = {}

export const apiSlice = createSlice({
	name: 'api',
	initialState: {},
	reducers: {},
	extraReducers: (builder) => {},
})
