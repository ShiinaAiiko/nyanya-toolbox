import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { Router } from 'next/router'
import '../layouts/Toolbox.scss'
import "./randomPassword.scss"
import "./windowsPathToPosixPath.scss"
import '../components/Footer.scss'
import '../components/Header.scss'

import { useRouter } from 'next/router'
import { Provider } from 'react-redux'
import store from '../store'
import Init from '../plugins/init'

import * as nyanyalog from 'nyanyajs-log'

nyanyalog.timer()
nyanyalog.config({
	format: {
		function: {
			fullFunctionChain: false,
		},
		prefixTemplate: '[{{Timer}}] [{{Type}}] [{{File}}]@{{Name}}',
	},
})
// import '../assets/style/base.scss'

export default function App({ Component, pageProps }: any) {
	const getLayout = Component.getLayout || ((page: any) => page)

	const router = useRouter()

	return (
		<Provider store={store}>
			<Init />
			{getLayout(<Component router={router} {...pageProps} />)}
		</Provider>
	)
	// return getLayout(<Component router={router} {...pageProps} />)

	// return (
	// 	<>
	// 		<Head>
	// 			<title>SSO</title>
	// 			<meta httpEquiv='X-UA-Compatible' content='IE=edge'></meta>
	// 			<meta
	// 				name='viewport'
	// 				content='width=device-width, initial-scale=1.0'
	// 			></meta>
	// 		</Head>

	// 		<LayoutTree Component={Component} pageProps={pageProps} />
	// 	</>
	// )
}
