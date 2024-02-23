import Head from 'next/head'
import ToolboxLayout, { getLayout } from '../../layouts/Toolbox'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import path from 'path'
import {
	RootState,
	AppDispatch,
	layoutSlice,
	useAppDispatch,
	methods,
	apiSlice,
} from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { bindEvent, snackbar, progressBar } from '@saki-ui/core'
import { deepCopy, QueueLoop } from '@nyanyajs/utils'
import { getRegExp, copyText, getRandomPassword } from '../../plugins/methods'
import {
	changeLanguage,
	languages,
	defaultLanguage,
} from '../../plugins/i18n/i18n'

export async function getStaticPaths() {
	return {
		paths:
			process.env.OUTPUT === 'export'
				? languages.map((v) => {
						return {
							params: {
								lang: v,
							},
						}
				  })
				: [],
		fallback: true,
		// fallback: process.env.OUTPUT === 'export',
	}
}

export async function getStaticProps({
	params,
	locale,
}: {
	params: {
		lang: string
	}
	locale: string
}) {
	process.env.OUTPUT === 'export' && changeLanguage(params.lang as any)
	// changeLanguage(params.lang as any)

	// const res = await fetch(`https://.../posts/${params.id}`)
	// const post = await res.json()

	// return { props: { post } }
	return {
		props: {
			// difficulty: params.difficulty,
			lang: params.lang || defaultLanguage,
		},
	}
}
const RandomPasswordPage = () => {
	const { t, i18n } = useTranslation('registerPage')
	const [mounted, setMounted] = useState(false)

	const [password, setPassword] = useState('')
	const [length, setLength] = useState(16)
	const [passwordInclude, setPasswordInclude] = useState<
		('Number' | 'Character')[]
	>(['Number'])

	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => {
		setMounted(true)
		setPassword(getRandomPassword(length, passwordInclude))
	}, [])
	useEffect(() => {
		dispatch(
			layoutSlice.actions.setLayoutHeaderLogoText(
				t('pageTitle', {
					ns: 'randomPasswordPage',
				})
			)
		)
	}, [i18n.language])

	return (
		<>
			<Head>
				<title>
					{t('pageTitle', {
						ns: 'randomPasswordPage',
					}) +
						' - ' +
						t('appTitle', {
							ns: 'common',
						})}
				</title>
			</Head>
			<div className='random-password-page'>
				<div className='rp-main'>
					<div className='rp-m-title'>
						{t('pageTitle', {
							ns: 'randomPasswordPage',
						})}
					</div>
					<div className='rp-m-subtitle'>
						{t('subtitle', {
							ns: 'randomPasswordPage',
						})}
					</div>

					<div className='rp-m-password'>
						<div className='rm-m-p-str'>
							{password.split('').map((v, i) => {
								return (
									<span key={i} className='rp-m-p-item'>
										{v}
									</span>
								)
							})}
						</div>
					</div>

					{mounted && (
						<>
							<div className='rp-m-buttons'>
								<div className='rp-m-b-left'>
									<div className='range'>
										<span>
											{t('length', {
												ns: 'randomPasswordPage',
											})}
										</span>
										<saki-input
											ref={bindEvent({
												changevalue: (e) => {
													setLength(Number(e.detail))
													setPassword(
														getRandomPassword(Number(e.detail), passwordInclude)
													)
												},
											})}
											type='Range'
											width='120px'
											min='6'
											max='100'
											value={length}
										></saki-input>
										<span>{length}</span>
									</div>
								</div>
								<div className='rp-m-b-center'>
									<saki-checkbox
										ref={bindEvent({
											selectvalue: (e) => {
												setPasswordInclude(e.detail.values)
												setPassword(getRandomPassword(length, e.detail.values))
											},
										})}
										value={passwordInclude}
										type='Checkbox'
									>
										<saki-checkbox-item padding='0 4px' value='Number'>
											{t('numbers', {
												ns: 'randomPasswordPage',
											})}
										</saki-checkbox-item>
										<saki-checkbox-item padding='0 4px' value='Character'>
											{t('symbols', {
												ns: 'randomPasswordPage',
											})}
										</saki-checkbox-item>
									</saki-checkbox>
								</div>
								<div className='rp-m-b-right'>
									<saki-button
										class='refresh'
										ref={bindEvent({
											tap: () => {
												setPassword(getRandomPassword(length, passwordInclude))
											},
										})}
										type='CircleIconGrayHover'
									>
										<svg
											className='icon'
											viewBox='0 0 1024 1024'
											version='1.1'
											xmlns='http://www.w3.org/2000/svg'
											p-id='6593'
											fill='#999'
											width='20'
											height='20'
										>
											<path
												d='M872.1 197.6L684.4 72.5c-5.3-3.5-12.4 0.3-12.4 6.7V160H384C207.3 160 64 303.3 64 480v64c0 45.9 9.7 89.6 27.1 129 2 4.6 7.6 6.2 11.8 3.5l95.4-63.6c3-2 4.3-5.7 3.2-9.2-6.2-19-9.4-39.1-9.4-59.7v-64c0-51.3 20-99.5 56.2-135.8C284.5 308 332.7 288 384 288h288v81.3c0 6.4 7.1 10.2 12.4 6.7L872 250.9c19.1-12.7 19.1-40.6 0.1-53.3zM151.2 833.3l187.6 125.1c5.3 3.5 12.4-0.3 12.4-6.7v-80.8h288c176.7 0 320-143.3 320-320v-64c0-45.9-9.7-89.6-27.1-129-2-4.6-7.6-6.2-11.8-3.5L825 418c-3 2-4.3 5.7-3.2 9.2 6.2 19 9.4 39.1 9.4 59.7v64c0 51.3-20 99.5-56.2 135.8-36.3 36.3-84.5 56.2-135.8 56.2h-288v-81.3c0-6.4-7.1-10.2-12.4-6.7L151.2 780c-18.9 12.7-18.9 40.6 0 53.3z'
												p-id='6594'
											></path>
										</svg>
									</saki-button>
									<saki-button
										ref={bindEvent({
											tap: () => {
												copyText(password)

												snackbar({
													message: t('copySuccessfully', {
														ns: 'prompt',
													}),
													autoHideDuration: 2000,
													vertical: 'top',
													horizontal: 'center',
													backgroundColor: 'var(--primary-color)',
													color: '#fff',
												}).open()
											},
										})}
										margin='0 0 0 10px'
										padding='8px 18px'
										font-size='14px'
										type='Primary'
									>
										{t('copy', {
											ns: 'common',
										})}
									</saki-button>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</>
	)
}
RandomPasswordPage.getLayout = getLayout

export default RandomPasswordPage
