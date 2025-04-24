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
import { userAgent, CipherSignature, NyaNyaWasm } from '@nyanyajs/utils'
import debounce from '@nyanyajs/utils/dist/debounce'
import * as nyanyalog from 'nyanyajs-log'
import HeaderComponent from '../components/Header'
import SakiSSOLoginComponent from '../components/SakiSSOLogin'
import {
	defaultLanguage,
	detectionLanguage,
	changeLanguage,
	resources,
	languages,
	initI18n,
} from '../plugins/i18n/i18n'
import {
	SakiBaseStyle,
	SakiColor,
	SakiI18n,
	SakiInit,
	SakiTemplateFooter,
} from '../components/saki-ui-react/components'
import { Query, isInPwa } from '../plugins/methods'
import { storage } from '../store/storage'
// import parserFunc from 'ua-parser-js'

const keywords: string = Object.keys(resources)
	.map((k) => {
		const res: any = resources
		return Object.keys(res[k] as any)
			.map((sk) => {
				return res[k][sk]['pageTitle']
			})
			.filter((v) => v)
			.join(',')
	})
	.join(',')

const ToolboxLayout = ({ children, pageProps }: any): JSX.Element => {
	const { t, i18n } = useTranslation()

	const { lang } = pageProps

	if (pageProps && process.env.OUTPUT === 'export') {
		const lang =
			pageProps?.router?.asPath?.split('/')?.[1] ||
			pageProps?.lang ||
			(typeof window === 'undefined' ? defaultLanguage : detectionLanguage())
		// isInPwa()

		// console.log(
		// 	'isInPwa',
		// 	isInPwa(),
		// 	detectionLanguage() as any,
		// )
		pageProps && i18n.language !== lang && changeLanguage(lang)
	}

	useEffect(() => {
		const l = lang || 'system'

		l && dispatch(methods.config.setLanguage(l))
	}, [lang])

	const [mounted, setMounted] = useState(false)
	// console.log('Index Layout')

	// const cccc = useSelector((state: RootState) => state.)
	const dispatch = useDispatch<AppDispatch>()
	const router = useRouter()
	const config = useSelector((state: RootState) => state.config)

	const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)

	useEffect(() => {
		setMounted(true)
		// initNyaNyaWasm()
	}, [])

	useEffect(() => {
		if (config.ssoAccount) {
			dispatch(methods.user.initSSOClient())
			dispatch(methods.user.initUser()).unwrap()
		}
	}, [config.ssoAccount])

	useEffect(() => {
		// console.log('router', location.href)
		localStorage.setItem('lastVisitedUrl', location.href)

		// console.log('pwa', router?.query?.isInPwa, router?.query?.pwa, isInPwa())

		if (isInPwa()) {
			dispatch(configSlice.actions.setPwaApp(true))
		}
	}, [router])

	const initNyaNyaWasm = async () => {
		NyaNyaWasm.setWasmPath('./nyanyajs-utils-wasm.wasm')
		NyaNyaWasm.setCoreJsPath('./wasm_exec.js')

		// const res = await (
		// 	await fetch(
		// 		'https://saass.aiiko.club/api/v1/share?path=/NyaNyaJS/1.0.0&sid=EWmdAO1GBw'
		// 	)
		// ).json()
		// console.log('initNyaNyaWasm', res?.data?.data?.list)
		// if (res?.data?.data?.list?.length) {
		// 	res?.data?.data?.list.forEach((v: any) => {
		// 		console.log(v)
		// 		if (v.fileName === 'wasm_exec.js') {
		// 			NyaNyaWasm.setCoreJsPath(v.urls.domainUrl + v.urls.shortUrl)
		// 		}
		// 		if (
		// 			v.fileName === 'nyanyajs-utils-wasm.wasm' ||
		// 			v.fileName === 'wasm_exec.js'
		// 		) {
		// 			NyaNyaWasm.setWasmPath(v.urls.domainUrl + v.urls.shortUrl)
		// 		}
		// 	})
		// }
	}
	let basePathname = router.pathname.replace('/[lang]', '')

	return (
		<>
			<Head>
				<meta name='keywords' content={keywords} />
			</Head>
			<div className='tool-box-layout'>
				<>
					{mounted ? (
						<>
							<HeaderComponent visible={true} fixed={false}></HeaderComponent>
						</>
					) : (
						''
					)}

					<div className={'tb-main '}>
						<div className='tb-main-wrap'>
							{children}

							{mounted ? (
								<SakiTemplateFooter
									onChangeLanguage={async (e) => {
										localStorage.setItem('language', e.detail)

										// router.locale = e.detail
										Object.keys(router.query).forEach((k) => {
											// console.log(k, basePathname.indexOf(`[${k}]`))
											const i = basePathname.indexOf(`[${k}]`)
											if (i >= 0) {
												basePathname = basePathname.replace(
													`[${k}]`,
													String(router.query[k])
												)

												delete router.query[k]
											}
										})
										// console.log('basePathname', basePathname)
										const pathname = Query(
											(e.detail === 'system' ? '' : '/' + e.detail) +
												basePathname,
											{
												...router.query,
												lang: '',
											}
										)
										console.log('pathname', router, pathname)

										router.replace(pathname || '/')
									}}
									onChangeAppearance={(e) => {
										// console.log(e)
										dispatch(configSlice.actions.setAppearance(e.detail.value))
									}}
									// appearance={config.appearance}
									// appearanceName={t(config.appearance, {
									// 	ns: 'appearance',
									// })}
									app-title={t('appTitle', {
										ns: 'common',
									})}
									github
									github-link='https://github.com/ShiinaAiiko/nyanya-toolbox'
									github-text='Github'
									blog
								></SakiTemplateFooter>
							) : (
								''
							)}
						</div>

						<div style={{ display: 'none' }}>
							{languages.map((v) => {
								return (
									<a key={v} href={'/' + v + basePathname}>
										{t(v, {
											ns: 'languages',
										})}
									</a>
								)
							})}
						</div>
					</div>
					{mounted ? (
						<>
							<SakiInit
								onMounted={() => {
									;(window as any)?.sakiui?.initAppearances?.([
										{
											value: 'system',
											name: t('system', {
												ns: 'appearance',
											}),
											color: '',
										},
										{
											value: 'light',
											name: t('light', {
												ns: 'appearance',
											}),
											color: '',
										},
										{
											value: 'dark',
											name: t('dark', {
												ns: 'appearance',
											}),
											color: '',
										},
										{
											value: 'black',
											name: t('black', {
												ns: 'appearance',
											}),
											color: '',
										},
									])
								}}
							></SakiInit>
							<SakiI18n
								onMounted={async (e) => {
									console.log('SakiI18n', e.target)
									const r = await e.target.getResources()
									console.log('SakiI18n', r)
									initI18n(r)
								}}
								language={config.language}
								lang={i18n.language}
								languages={config.languages}
								resources={resources as any}
							></SakiI18n>
							<SakiColor
								// appearance={config.appearance}
								defaultColor={'#f29cb2'}
								defaultHoverColor={'#f185a0'}
								defaultActiveColor={'#ce5d79'}
								defaultBorderColor={'#f1f1f1'}
							></SakiColor>
							<SakiBaseStyle></SakiBaseStyle>
							{config.ssoAccount ? <SakiSSOLoginComponent /> : ''}
						</>
					) : (
						''
					)}
				</>
			</div>
		</>
	)
}

export function getLayout(page: any, pageProps: any) {
	return (
		<ToolboxLayout
			pageProps={{
				...pageProps,
			}}
		>
			{page}
		</ToolboxLayout>
	)
}

export default ToolboxLayout
