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
import { unwrapResult } from '@reduxjs/toolkit'
import * as nyanyalog from 'nyanyajs-log'
import config from '../../config'
import { bindEvent, snackbar, progressBar } from '@saki-ui/core'
import {
	deepCopy,
	QueueLoop,
	Debounce,
	images,
	userAgent,
} from '@nyanyajs/utils'
import {
	getRegExp,
	copyText,
	showSnackbar,
	formatTime,
} from '../../plugins/methods'
import {
	changeLanguage,
	languages,
	defaultLanguage,
} from '../../plugins/i18n/i18n'
import { imageColorInversionUsingCanvas } from '@nyanyajs/utils/dist/images/imageColorInversion'
import { SakiInput } from '../../components/saki-ui-react/components'
import { nwebrtc, webRTCMethods } from '../../store/webRTC'
import moment from 'moment'

const WebScreenRecordingPage = () => {
	const { t, i18n } = useTranslation('webScreenRecordingPage')

	const config = useSelector((state: RootState) => state.config)

	const [mounted, setMounted] = useState(false)

	const [disabled, setDisabled] = useState(false)

	const videoEl = useRef<HTMLVideoElement>(null)
	const screenStream = useRef<MediaStream>()
	const recordTimer = useRef<NodeJS.Timeout>()

	const [startRecord, setStartRecord] = useState(false)
	const [startRecording, setStartRecording] = useState(false)
	const [microphoneEnabled, setMicrophoneEnabled] = useState(false)
	const [systemSoundEnabled, setSystemSoundEnabled] = useState(true)
	const [recordTime, setRecordTime] = useState(0)

	const [displayMediaStreamOptions, setDisplayMediaStreamOptions] =
		useState<DisplayMediaStreamOptions>({
			audio: systemSoundEnabled,
			video: true,
		})

	const recordChunks = useRef<Blob[]>([])
	const recordBlob = useRef<Blob>()
	const [recordUrl, setRecordUrl] = useState('')
	const [resolution, setResolution] = useState('Adaptive')

	const [outputSizeDropdown, setOutputSizeDropdown] = useState(false)

	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => {
		setMounted(true)
		const ua = userAgent(window.navigator.userAgent)
		console.log(ua)
		if (ua.os.name === 'iOS' || ua.os.name === 'Android') {
			setDisabled(true)
		}
	}, [])
	useEffect(() => {
		dispatch(layoutSlice.actions.setLayoutHeaderLogoText(t('pageTitle')))
	}, [i18n.language])

	useEffect(() => {
		setDisplayMediaStreamOptions({
			...displayMediaStreamOptions,
			video:
				resolution === 'Adaptive'
					? true
					: (resolution.split('x') as string[]).reduce((mtc, v, i) => {
							if (i === 0) {
								mtc.width = Number(v)
							}
							if (i === 1) {
								mtc.height = Number(v)
							}
							return mtc
					  }, {} as MediaTrackConstraints),
		})
	}, [resolution])

	// useEffect(() => {
	// 	if (startRecord) {
	// 		startRecordFunc()
	// 		return
	// 	}
	// }, [startRecord])
	useEffect(() => {
		clearInterval(recordTimer.current)
		if (startRecording) {
			let rt = recordTime

			recordTimer.current = setInterval(() => {
				setRecordTime(rt++)
			}, 1000)

			return
		}
	}, [startRecording])

	useEffect(() => {
		screenStream.current?.getAudioTracks().forEach((track) => {
			console.log(track)
			if (track.kind === 'audio') {
				track.enabled = systemSoundEnabled
			}
			console.log(track)
		})
		setDisplayMediaStreamOptions({
			...displayMediaStreamOptions,
			audio: systemSoundEnabled,
		})
	}, [systemSoundEnabled])

	const output = async () => {
		let aLink = document.createElement('a')
		aLink.style.display = 'none'
		aLink.setAttribute('target', '_blank')
		aLink.href = recordUrl
		aLink.download = `ScreenRecording_${moment().format(
			'YYYY-MM-DD_hh:mm"ss'
		)}.mp4`

		document.body.appendChild(aLink)
		aLink.click()
		document.body.removeChild(aLink)
	}

	const initWebRTC = async (roomId: string) => {
		await dispatch(
			webRTCMethods.testwebrtc({
				roomId,
			})
		)

		if (!nwebrtc || nwebrtc?.getClient(roomId)) {
			return
		}

		let client = nwebrtc.createClient(roomId)
	}

	const startRecordFunc = async () => {
		if (!videoEl.current) return
		const roomId = 'roomId'

		await initWebRTC(roomId)

		const client = nwebrtc?.getClient(roomId)

		if (!client) {
			return
		}

		console.log('client', client)
		const gmd = await client.getMediaDevices()

		console.log('gmd', gmd)

		console.log('client', client)
		const stream = await client.getDisplayMedia(displayMediaStreamOptions)

		console.log('stream', stream)
		console.log('getTracks', stream.getTracks())

		setStartRecording(stream.active)
		setStartRecord(stream.active)

		stream.addEventListener('active', (e) => {
			console.log('active', e)
		})
		stream.addEventListener('addtrack', (e) => {
			console.log('addtrack', e)
		})
		stream.addEventListener('inactive', (e) => {
			console.log('inactive', e)
			setStartRecording(stream.active)
			setStartRecord(stream.active)
			screenStream.current = undefined
		})
		stream.addEventListener('removetrack', (e) => {
			console.log('removetrack', e)
		})

		const mimeType = 'video/mp4'

		const mediaRecorder = new MediaRecorder(stream, {
			mimeType,
		})

		console.log('mediaRecorder', mediaRecorder)
		mediaRecorder.start(1000)
		mediaRecorder.ondataavailable = (e) => {
			console.log('ondataavailable', e.data)
			recordChunks.current.push(e.data)
		}
		mediaRecorder.onstop = (e) => {
			recordBlob.current = new Blob(recordChunks.current, { type: mimeType })
			const url = window.URL.createObjectURL(recordBlob.current)
			console.log(
				'mediaRecorder stop',
				e,
				recordChunks.current,
				recordBlob.current,
				url
			)
			setRecordUrl(url)
			recordChunks.current = []
			recordBlob.current = undefined
		}

		screenStream.current = stream

		videoEl.current.srcObject = stream
		// const getMediaMethod =
		// 	recordType === 'screen' ? 'getDisplayMedia' : 'getUserMedia'
		// const stream = await navigator.mediaDevices[getMediaMethod]({
		// 	video: {
		// 		width: 500,
		// 		height: 300,
		// 		frameRate: 20,
		// 	},
		// })
		// // player.srcObject = stream
		// mediaRecorder = new MediaRecorder(stream, {
		// 	mimeType: 'video/webm',
		// })
		// mediaRecorder.ondataavailable = (e) => {
		// 	blobs.push(e.data)
		// }
		// mediaRecorder.start(100)
	}
	const stopTrack = async (kind: string) => {
		screenStream.current?.getTracks().forEach((track) => {
			console.log(track)
			if (track.kind === kind) {
				track.stop()
			}
		})
	}

	const stopRecordFunc = async () => {
		stopTrack('video')
		stopTrack('audio')
	}
	const formartResolutionText = (resolution: string) => {
		switch (resolution) {
			case 'Adaptive':
				return t('adaptive')

			default:
				const resolutions = resolution.split('x')
				resolutions.reduce((mtc, v, i) => {
					if (i === 0) {
						mtc.width = Number(v)
					}
					if (i === 1) {
						mtc.height = Number(v)
					}
					return mtc
				}, {} as MediaTrackConstraints)

				return `${resolutions[0]}px x ${resolutions[1]}px`
		}
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
			<div className='web-screen-recording-page'>
				<div className='wsr-main'>
					{!startRecording ? (
						<>
							<div className='wsr-m-title'>
								{disabled ? t('noSupportMobile') : t('pageTitle')}
							</div>
							<div className='wsr-m-subtitle'>
								{disabled ? t('onlySupportPC') : t('subtitle')}
							</div>
						</>
					) : (
						''
					)}

					{recordUrl ? (
						<div className='wsr-m-recordData'>
							<video src={recordUrl} controls></video>
						</div>
					) : (
						<div
							className={'wsr-m-layer ' + (startRecording ? 'start' : 'stop')}
						>
							<div className='layer-video'>
								<video ref={videoEl} muted autoPlay></video>
							</div>

							{mounted ? (
								<div className='layer-button'>
									<div className='layer-b-left'>
										<div className='configure-button-item'>
											<saki-button
												width='30px'
												height='30px'
												margin='0 10px'
												border-radius='50%'
												type='Primary'
												ref={bindEvent({
													tap: () => {
														setSystemSoundEnabled(!systemSoundEnabled)
													},
												})}
												disabled={
													!screenStream.current?.getAudioTracks()?.length
												}
											>
												<div
													className={
														'system-sound-button ' +
														(systemSoundEnabled ? 'enabled' : 'disabled')
													}
												>
													<saki-icon
														width='16px'
														height='16px'
														color='#fff'
														type={
															systemSoundEnabled ? 'SoundFill' : 'SoundDisable'
														}
													></saki-icon>
												</div>
											</saki-button>
											<span>
												{systemSoundEnabled
													? t('systemSoundEnabled')
													: t('systemSoundDisabled')}
											</span>
										</div>
									</div>
									<div className='layer-b-right'>
										<div className='layer-time'>
											{formatTime(recordTime * 1000, ['h', 'm', 's'])}
										</div>
										<saki-button
											width='40px'
											height='40px'
											margin='0 10px'
											border-radius='50%'
											type='Primary'
											box-shadow='0 0 10px rgba(0,0,0,0.3)'
											ref={bindEvent({
												tap: () => {
													stopRecordFunc()
												},
											})}
										>
											<saki-icon
												width='20px'
												height='20px'
												color='#fff'
												type={'Shutdown'}
											></saki-icon>
										</saki-button>
									</div>
								</div>
							) : (
								''
							)}
							<div className='wsr-m-l-buttons'>
								{/* <saki-button
								padding='8px 8px'
								type='Normal'
								ref={bindEvent({
									tap: () => {
										recover()
									},
								})}
							>
								<saki-row flex-direction='column'>
									<span>{t('recover')}</span>
								</saki-row>
							</saki-button> */}
								{mounted && (
									<saki-button
										width='100px'
										height='100px'
										padding='14px 18px'
										margin='0 10px'
										border-radius='50%'
										type='Primary'
										ref={bindEvent({
											tap: () => {
												// setStartRecord(true)
												startRecordFunc()
											},
										})}
										disabled={disabled}
									>
										<div className={'button-startRecording ' + config.lang}>
											<span>
												{t('start', {
													ns: 'prompt',
												})}
											</span>
											<span>{t('recording')}</span>
										</div>
									</saki-button>
								)}
							</div>
						</div>
					)}

					{mounted && !disabled ? (
						<div className='aqp-m-dropdown'>
							<saki-tabs
								type='Flex'
								// header-background-color='rgb(245, 245, 245)'
								header-max-width='740px'
								// header-border-bottom='none'
								header-padding='0 10px'
								header-item-min-width='80px'
								ref={bindEvent({
									tap: (e) => {
										// // console.log('tap', e)
										// setActiveTabLabel(e.detail.label)
										// setOpenDropDownMenu(false)
									},
								})}
							>
								<saki-tabs-item
									font-size='14px'
									label='account-security'
									name={t('configure', {
										ns: 'prompt',
									})}
								>
									<>
										<div className={'wsr-m-configure ' + config.deviceType}>
											<div className='c-item'>
												<span>
													{systemSoundEnabled
														? t('systemSoundEnabled')
														: t('systemSoundDisabled')}
												</span>

												<saki-switch
													ref={bindEvent({
														change: (e) => {
															setSystemSoundEnabled(Boolean(e.detail))
														},
													})}
													height='24px'
													value={systemSoundEnabled}
													disabled={
														startRecording
															? !screenStream.current?.getAudioTracks()?.length
															: false
													}
												></saki-switch>
											</div>
											<div className='wsr-s-m-item'>
												<span className='item-title'>
													{t('resolution', {
														ns: 'prompt',
													})}
													:
												</span>
												<div className='item-content'>
													<saki-dropdown
														visible={outputSizeDropdown}
														floating-direction='Left'
														ref={bindEvent({
															close: (e) => {
																setOutputSizeDropdown(false)
															},
														})}
													>
														<div className='item-c-button'>
															<saki-button
																padding='10px 6px 10px 12px'
																border='none'
																type='Normal'
																ref={bindEvent({
																	tap: () => {
																		setOutputSizeDropdown(!outputSizeDropdown)
																	},
																})}
																disabled={startRecording}
															>
																<div className='item-c-b-content'>
																	<span>
																		{formartResolutionText(resolution)}
																	</span>

																	<saki-icon
																		color={startRecording ? '#999' : '#000'}
																		type='BottomTriangle'
																	></saki-icon>
																</div>
															</saki-button>
														</div>
														<div slot='main'>
															<saki-menu
																ref={bindEvent({
																	selectvalue: (e) => {
																		setResolution(e.detail.value)
																		setOutputSizeDropdown(false)
																	},
																})}
															>
																{[
																	'Adaptive',
																	'2560x1600',
																	'1920x1080',
																	'1280x720',
																	'854x480',
																	'640x360',
																].map((v, i) => {
																	return (
																		<saki-menu-item
																			key={i}
																			padding='10px 26px'
																			value={v}
																			active={resolution === v}
																		>
																			<div>{formartResolutionText(v)}</div>
																		</saki-menu-item>
																	)
																})}
															</saki-menu>
														</div>
													</saki-dropdown>
												</div>
											</div>

											<div
												style={{
													margin: '20px 0 0',
												}}
												className='c-buttons'
											>
												<saki-button
													ref={bindEvent({
														tap: () => {
															setRecordUrl('')
														},
													})}
													loading='false'
													margin='0 0 0 10px'
													padding='8px 18px'
													font-size='14px'
													type='Primary'
													disabled={!recordUrl}
												>
													<div>{t('clearRecordedVideo')}</div>
												</saki-button>
											</div>
										</div>
									</>
								</saki-tabs-item>

								<saki-tabs-item
									font-size='14px'
									label='personal-info'
									name={t('output', {
										ns: 'prompt',
									})}
								>
									<div className='wsr-m-style'>
										<div className='wsr-s-title'>
											{t('outputParameters', {
												ns: 'prompt',
											})}
										</div>
										<div className='wsr-s-main'>
											<div
												style={{
													margin: '20px 0 0',
												}}
												className='wsr-s-m-button'
											>
												<saki-button
													ref={bindEvent({
														tap: () => {
															output()
														},
													})}
													loading='false'
													margin='0 0 0 10px'
													padding='8px 18px'
													font-size='14px'
													type='Primary'
													disabled={!recordUrl}
												>
													<div>
														{t('download', {
															ns: 'prompt',
														})}
													</div>
												</saki-button>
											</div>
										</div>
									</div>
								</saki-tabs-item>
							</saki-tabs>
						</div>
					) : (
						''
					)}
				</div>
			</div>
		</>
	)
}
WebScreenRecordingPage.getLayout = getLayout
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

export default WebScreenRecordingPage
