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
import { unwrapResult } from '@reduxjs/toolkit'
import * as nyanyalog from 'nyanyajs-log'
import config from '../../config'
import { bindEvent, snackbar, progressBar } from '@saki-ui/core'
import { deepCopy, QueueLoop } from '@nyanyajs/utils'
import { getRegExp, copyText } from '../../plugins/methods'
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
const WindowsPathPage = () => {
	const { t, i18n } = useTranslation('windowsPathToPosixPathPage')
	const [mounted, setMounted] = useState(false)
	const [convertType, setConvertType] = useState<'WindowsPath' | 'PosixPath'>(
		'WindowsPath'
	)
	const [windowsPath, setWindowsPath] = useState('')
	const [copyAfterConvert, setCopyAfterConvert] = useState(false)
	const [newWindowsPath, setNewWindowsPath] = useState('')
	const [newWindowsPathInputEl, setNewWindowsPathInputEl] = useState<any>()

	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => {
		setMounted(true)
		setCopyAfterConvert(
			localStorage.getItem('windowsPath_copyAfterConvert') === 'true'
		)
	}, [])
	useEffect(() => {
		dispatch(
			layoutSlice.actions.setLayoutHeaderLogoText(
				t('pageTitle', {
					ns: 'windowsPathToPosixPathPage',
				})
			)
		)
	}, [i18n.language])

	const convert = (fullPathPrefix: string = '') => {
		let p = windowsPath
		if (p === '') {
			snackbar({
				message:
					convertType === 'WindowsPath'
						? t('windowsPathDoesNotExist', {
								ns: 'prompt',
						  })
						: t('posixPathDoesNotExist', {
								ns: 'prompt',
						  }),
				autoHideDuration: 2000,
				vertical: 'top',
				horizontal: 'center',
				backgroundColor: 'var(--primary-color)',
				color: '#fff',
			}).open()
			setNewWindowsPath('')
			return
		}
		let copyText = ''
		if (convertType === 'WindowsPath') {
			if (p.indexOf(':\\') === 1) {
				const pathArr = p.split(':\\')
				copyText = `${fullPathPrefix}/${pathArr?.[0]?.toLocaleLowerCase()}/${pathArr?.[1]
					.split('\\')
					.map((v) => {
						if (v.indexOf(' ') >= 0) {
							if (v.indexOf('"') === 0 && v.lastIndexOf('"') === v.length - 1) {
								return v
							}
							return `"${v}"`
						}
						return v
					})
					.join('/')}`
			} else {
				if (p.indexOf('\\') === 0) {
					p = p.replace('\\', '')
				}
				copyText = `./${p
					.split('\\')
					.map((v) => {
						if (v.indexOf(' ') >= 0) {
							if (v.indexOf('"') === 0 && v.lastIndexOf('"') === v.length - 1) {
								return v
							}
							return `"${v}"`
						}
						return v
					})
					.join('/')}`
			}

			if (p.indexOf('.\\') === 0) {
				const pathArr = p.split('\\')
				// console.log('pathArr', pathArr)
				copyText = `./${pathArr
					.filter((v, i) => {
						return i >= 1
					})
					.map((v, i) => {
						if (v.indexOf(' ') >= 0) {
							if (v.indexOf('"') === 0 && v.lastIndexOf('"') === v.length - 1) {
								return v
							}
							return `"${v}"`
						}
						return v
					})
					.join('/')}`
			}
		}
		if (convertType === 'PosixPath') {
			if (fullPathPrefix === '/mnt') {
				// console.log('wsl')
				p = p.replace('/mnt', '')
			}
			// console.log(p)
			const pathArr = p.split('/')
			// console.log(pathArr)
			if (pathArr?.[0] === '') {
				copyText = `${pathArr?.[1].toLocaleUpperCase()}:\\${pathArr
					.filter((_, i) => {
						return i >= 2
					})
					.map((v, i) => {
						if (v.indexOf(' ') >= 0) {
							if (v.indexOf('"') === 0 && v.lastIndexOf('"') === v.length - 1) {
								return v
							}
							return `"${v}"`
						}
						return v
					})
					.join('\\')}`
			}

			if (p.indexOf('./') === 0) {
				const pathArr = p.split('/')
				copyText = `.\\${pathArr
					.filter((v, i) => {
						return i >= 1
					})
					.map((v, i) => {
						if (v.indexOf(' ') >= 0) {
							if (v.indexOf('"') === 0 && v.lastIndexOf('"') === v.length - 1) {
								return v
							}
							return `"${v}"`
						}
						return v
					})
					.join('\\')}`
			}
		}

		setNewWindowsPath(copyText)
		if (copyAfterConvert) {
			copy(copyText)
		}
	}

	const copy = (text?: string) => {
		if (!(text || newWindowsPath)) {
			snackbar({
				message:
					convertType === 'WindowsPath'
						? t('posixPathDoesNotExist', {
								ns: 'prompt',
						  })
						: t('windowsPathDoesNotExist', {
								ns: 'prompt',
						  }),
				autoHideDuration: 2000,
				vertical: 'top',
				horizontal: 'center',
				backgroundColor: 'var(--primary-color)',
				color: '#fff',
			}).open()
			return
		}
		copyText(text || newWindowsPath)
		newWindowsPathInputEl?.select(0, text || newWindowsPath.length)
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
	}
	return (
		<>
			<Head>
				<title>
					{t('pageTitle', {
						ns: 'windowsPathToPosixPathPage',
					}) +
						' - ' +
						t('appTitle', {
							ns: 'common',
						})}
				</title>
			</Head>
			<div className='windows-file-path-page'>
				<div className='wfp-main'>
					<div className='wfp-m-title'>
						{t('pageTitle', {
							ns: 'windowsPathToPosixPathPage',
						})}
					</div>
					<div className='wfp-m-subtitle'>
						{t('subtitle', {
							ns: 'windowsPathToPosixPathPage',
						})}
					</div>

					{mounted && (
						<>
							<saki-input
								ref={bindEvent({
									changevalue: (e: CustomEvent) => {
										const value = e.detail.trim()
										setWindowsPath(value)
									},
								})}
								value={windowsPath}
								placeholder={
									convertType === 'WindowsPath'
										? t('windowsPath', {
												ns: 'windowsPathToPosixPathPage',
										  })
										: t('posixPath', {
												ns: 'windowsPathToPosixPathPage',
										  })
								}
								type='Textarea'
								width='100%'
								min-height='150px'
								margin='40px 0 0'
								padding='10px'
								font-size='16px'
								border='1px solid var(--primary-color)'
								border-radius='10px'
							></saki-input>
							<div className='wfp-m-buttons'>
								<div className='wfp-m-b-left'>
									<saki-switch
										ref={bindEvent({
											change: (e) => {
												setCopyAfterConvert(e.detail)
												localStorage.setItem(
													'windowsPath_copyAfterConvert',
													String(e.detail)
												)
											},
										})}
										value={copyAfterConvert}
									></saki-switch>
									<span>
										{t('convertAndCopy', {
											ns: 'windowsPathToPosixPathPage',
										})}
									</span>
								</div>
								<div className='wfp-m-b-center'>
									<saki-button
										ref={bindEvent({
											tap: () => {
												setConvertType(
													convertType === 'PosixPath'
														? 'WindowsPath'
														: 'PosixPath'
												)
												setWindowsPath('')
												setNewWindowsPath('')
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
											width='16'
											height='16'
										>
											<path
												d='M872.1 197.6L684.4 72.5c-5.3-3.5-12.4 0.3-12.4 6.7V160H384C207.3 160 64 303.3 64 480v64c0 45.9 9.7 89.6 27.1 129 2 4.6 7.6 6.2 11.8 3.5l95.4-63.6c3-2 4.3-5.7 3.2-9.2-6.2-19-9.4-39.1-9.4-59.7v-64c0-51.3 20-99.5 56.2-135.8C284.5 308 332.7 288 384 288h288v81.3c0 6.4 7.1 10.2 12.4 6.7L872 250.9c19.1-12.7 19.1-40.6 0.1-53.3zM151.2 833.3l187.6 125.1c5.3 3.5 12.4-0.3 12.4-6.7v-80.8h288c176.7 0 320-143.3 320-320v-64c0-45.9-9.7-89.6-27.1-129-2-4.6-7.6-6.2-11.8-3.5L825 418c-3 2-4.3 5.7-3.2 9.2 6.2 19 9.4 39.1 9.4 59.7v64c0 51.3-20 99.5-56.2 135.8-36.3 36.3-84.5 56.2-135.8 56.2h-288v-81.3c0-6.4-7.1-10.2-12.4-6.7L151.2 780c-18.9 12.7-18.9 40.6 0 53.3z'
												p-id='6594'
											></path>
										</svg>
									</saki-button>
								</div>
								<div className='wfp-m-b-right'>
									<saki-button
										ref={bindEvent({
											tap: () => {
												convert('/mnt')
											},
										})}
										padding='8px 18px'
										font-size='14px'
										type='Primary'
									>
										{t('convert', {
											ns: 'windowsPathToPosixPathPage',
										})}{' '}
										(wsl)
									</saki-button>
									<saki-button
										ref={bindEvent({
											tap: () => {
												convert()
											},
										})}
										margin='0 0 0 10px'
										padding='8px 18px'
										font-size='14px'
										type='Primary'
									>
										{t('convert', {
											ns: 'windowsPathToPosixPathPage',
										})}
									</saki-button>
									{!copyAfterConvert ? (
										<saki-button
											ref={bindEvent({
												tap: () => {
													copy()
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
									) : (
										''
									)}
								</div>
							</div>

							<saki-input
								ref={bindEvent(
									{
										changevalue: (e: CustomEvent) => {
											const value = e.detail.trim()
											setNewWindowsPath(value)
										},
									},
									(e) => {
										setNewWindowsPathInputEl(e)
									}
								)}
								value={newWindowsPath}
								placeholder={
									convertType === 'WindowsPath'
										? t('posixPath', {
												ns: 'windowsPathToPosixPathPage',
										  })
										: t('windowsPath', {
												ns: 'windowsPathToPosixPathPage',
										  })
								}
								type='Textarea'
								width='100%'
								min-height='150px'
								margin='0px 0 20px'
								padding='10px'
								font-size='16px'
								border='1px solid var(--primary-color)'
								border-radius='10px'
							></saki-input>
						</>
					)}
				</div>
			</div>
		</>
	)
}
WindowsPathPage.getLayout = getLayout

export default WindowsPathPage
