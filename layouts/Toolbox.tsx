import Head from 'next/head'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
// import './App.module.scss'
import { useSelector, useStore, useDispatch } from 'react-redux'
import {
	RootState,
	userSlice,
	AppDispatch,
	layoutSlice,
	methods,
	configSlice,
} from '../store'
import { useTranslation } from 'react-i18next'
// import { userAgent } from './userAgent'
import { userAgent, CipherSignature } from '@nyanyajs/utils'
import debounce from '@nyanyajs/utils/dist/debounce'
import * as nyanyalog from 'nyanyajs-log'
import HeaderComponent from '../components/Header'
// import parserFunc from 'ua-parser-js'

const ToolboxLayout = ({ children }: propsType): JSX.Element => {
	const { t, i18n } = useTranslation()
	// console.log('Index Layout')

	// const cccc = useSelector((state: RootState) => state.)
	const dispatch = useDispatch<AppDispatch>()

	const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)

	return (
		<>
			<Head>
				<title>
					{t('appTitle', {
						ns: 'common',
					})}
				</title>
				<meta httpEquiv='X-UA-Compatible' content='IE=edge'></meta>
				<meta
					name='viewport'
					content='width=device-width, initial-scale=1.0'
				></meta>
			</Head>
			<div className='tool-box-layout'>
				<>
					<HeaderComponent></HeaderComponent>
					<div className={'tb-main '}>{children}</div>
				</>
			</div>
		</>
	)
}

export default ToolboxLayout
