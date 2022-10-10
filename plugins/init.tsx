import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { RootState, AppDispatch, methods, apiSlice } from '../store'
import { useSelector, useStore, useDispatch } from 'react-redux'

import * as nyanyalog from 'nyanyajs-log'
import { initPublic } from './public'
import { sakiui } from '../config'
import './i18n/i18n'
nyanyalog.timer()

const Init = () => {
	const router = useRouter()
	const dispatch = useDispatch<AppDispatch>()
	const api = useSelector((state: RootState) => state.api)
	const store = useStore()

	useEffect(() => {
		initPublic()
		const init = async () => {
			await dispatch(methods.config.init()).unwrap()
		}
		init()
	}, [])

	return (
		<>
			<Head>
				<link rel='icon' href='./favicon.ico' />
				<script noModule src={sakiui.jsurl} data-rh='true'></script>
				<script type='module' src={sakiui.esmjsurl} data-rh='true'></script>
			</Head>
		</>
	)
}

export default Init
