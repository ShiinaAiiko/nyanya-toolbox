import Head from 'next/head'
import ToolboxLayout, { getLayout } from '../../layouts/Toolbox'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
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
import { deepCopy, QueueLoop, WebWorker } from '@nyanyajs/utils'
import { getRegExp, copyText, getRandomPassword } from '../../plugins/methods'
import {
	changeLanguage,
	languages,
	defaultLanguage,
} from '../../plugins/i18n/i18n'
import moment from 'moment'

const StopWatchPage = () => {
	const { t, i18n } = useTranslation('stopwatchPage')
	const [mounted, setMounted] = useState(false)

	const worker =
		useRef<
			WebWorker<'stopwatch-start' | 'stopwatch-pause' | 'stopwatch-clear'>
		>()

	const [time, setTime] = useState(0)

	const [history, setHistory] = useState<
		{
			time: number
			crateTime: number
		}[]
	>([])

	const [start, setStart] = useState(false)

	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => {
		setMounted(true)
	}, [])
	useEffect(() => {
		dispatch(layoutSlice.actions.setLayoutHeaderLogoText(t('pageTitle')))
	}, [i18n.language])

	useEffect(() => {
		if (!start) {
			worker.current?.postMessage('stopwatch-pause', {})
			return
		}
		initWebWork()

		const init = async () => {
			// console.log('worker.current', worker.current)
			await worker.current?.postMessage('stopwatch-start', {})
		}
		init()
	}, [start])

	const initWebWork = () => {
		if (!worker.current) {
			worker.current = new WebWorker<
				'stopwatch-start' | 'stopwatch-pause' | 'stopwatch-clear'
			>('/webworker-bundle.js')

			worker.current.on('stopwatch-time', (v: any) => {
				// console.log('stopwatch-time', v)
				setTime(v.time)
			})
		}
	}

	const clear = () => {
		setHistory([])
		setTime(0)
		worker.current?.postMessage('stopwatch-clear', {})
	}

	const formatTime = (time: number) => {
		const ms = Math.floor(time / 10) % 100
		const s = Math.floor(time / 1000) % 60
		const m = Math.floor(time / 60000)
		const h = Math.floor(time / 3600000)
		return `${String(h).padStart(2, '0')}:${String(m).padStart(
			2,
			'0'
		)}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
	}

	return (
		<>
			<Head>
				<title>
					{t('pageTitle') +
						' - ' +
						t('appTitle', {
							ns: 'common',
						})}
				</title>
				<meta name='description' content={t('subtitle')} />
			</Head>
			<div className='stopwatch-page'>
				<div className='rp-main'>
					<div className='rp-m-title'>{t('pageTitle')}</div>
					<div className='rp-m-subtitle'>{t('subtitle')}</div>

					<div className='rp-m-t-time'>{formatTime(time)}</div>

					<div className={'rp-m-buttons ' + (start ? 'start' : '')}>
						{mounted && (
							<>
								{time ? (
									<saki-button
										class={'refresh'}
										ref={bindEvent({
											tap: () => {
												clear()
											},
										})}
										width='50px'
										height='50px'
										type='CircleIconGrayHover'
										disabled={start}
									>
										<saki-icon
											width='24px'
											height='24px'
											color={start ? '#ccc' : '#666'}
											type='Refresh2'
										></saki-icon>
									</saki-button>
								) : (
									''
								)}

								<saki-button
									ref={bindEvent({
										tap: () => {
											setStart(!start)
										},
									})}
									margin={'0 20px'}
									width='60px'
									height='60px'
									type='CircleIconGrayHover'
								>
									<saki-icon
										width='34px'
										height='34px'
										color={'#666'}
										type={start ? 'Pause' : 'Play'}
									></saki-icon>
								</saki-button>

								{time ? (
									<saki-button
										ref={bindEvent({
											tap: () => {
												setHistory(
													[
														{
															time,
															crateTime: new Date().getTime(),
														},
													].concat(history)
												)
											},
										})}
										width='50px'
										height='50px'
										type='CircleIconGrayHover'
										disabled={!start}
									>
										<saki-icon
											width='24px'
											height='24px'
											color={!start ? '#ccc' : '#666'}
											type='Flag'
										></saki-icon>
									</saki-button>
								) : (
									''
								)}
							</>
						)}
					</div>

					{history.length ? (
						<div className='rp-m-history'>
							<div className='rm-m-h-title'>{t('history')}</div>

							<div className='rm-m-h-list'>
								{history.map((v, i, arr) => {
									return (
										<div className='rm-m-h-l-item'>
											<div className='rp-m-h-index'>
												<span># {arr.length - i}</span>
											</div>
											<div className='rp-m-h-time text-elipsis'>
												{formatTime(v.time)}
											</div>
											<div className='rp-m-h-createtime text-elipsis'>
												{moment(v.crateTime).format('YYYY-MM-DD HH:mm:ss')}
											</div>
										</div>
									)
								})}
							</div>
						</div>
					) : (
						''
					)}
				</div>
			</div>
		</>
	)
}
StopWatchPage.getLayout = getLayout

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
	return {
		props: {
			lang: params.lang || defaultLanguage,
		},
	}
}
export default StopWatchPage
