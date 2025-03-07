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
import { deepCopy, QueueLoop, Debounce, images } from '@nyanyajs/utils'
import { getRegExp, copyText, showSnackbar } from '../../plugins/methods'
import {
	changeLanguage,
	languages,
	defaultLanguage,
} from '../../plugins/i18n/i18n'
import { imageColorInversionUsingCanvas } from '@nyanyajs/utils/dist/images/imageColorInversion'
import { SakiInput } from '../../components/saki-ui-react/components'

const ImageColorInversionPage = () => {
	const { t, i18n } = useTranslation('imageColorInversionPage')

	const config = useSelector((state: RootState) => state.config)

	const [mounted, setMounted] = useState(false)
	const [convertType, setConvertType] = useState<'WindowsPath' | 'PosixPath'>(
		'WindowsPath'
	)
	const uploadAvatarInput = useRef<HTMLInputElement>(null)
	const uploadBadgeInput = useRef<HTMLInputElement>(null)
	const originalImgCvs = useRef<HTMLCanvasElement>(null)
	const outputImgCvs = useRef<HTMLCanvasElement>(null)
	const [initCvsDebounce] = useState(new Debounce())
	const [uploadAvatar, setUploadAvatar] = useState('')
	const [avatarBorderRadiusDropDown, setAvatarBorderRadiusDropDown] =
		useState(false)
	const [avatarBorderRadius, setAvatarBorderRadius] = useState('0px')

	const [badgeBorderRadiusDropDown, setBadgeBorderRadiusDropDown] =
		useState(false)
	const [badgeBorderRadius, setBadgeBorderRadius] = useState('50%')
	const [badgeSize, setBadgeSize] = useState(75)
	const [badgeBorderSize, setBadgeBorderSize] = useState(5)
	const [badgeBorderColor, setBadgeBorderColor] = useState('#fff')
	const [badgePositionDropDown, setBadgePositionDropDown] = useState(false)
	const [badgePosition, setBadgePosition] = useState('BottomRight')
	const [badgeDistanceBorder, setBadgeDistanceBorder] = useState(27)

	const [badgeIconList, setBadgeIconList] = useState<
		{
			url: string
		}[]
	>([
		// {
		// 	url: '/transgender1.jpg',
		// },
		// {
		// 	url: '/lgbt1.jpg',
		// },
		{
			url: '/messi_world_cup1.jpg',
		},
		{
			url: '/messi_world_cup2.jpg',
		},
	])
	const [badgeIcon, setBadgeIcon] = useState(badgeIconList?.[0]?.url || '')

	const [outputSizeDropdown, setOutputSizeDropdown] = useState(false)
	const [outputSize, setOutputSize] = useState(160)

	const [outputQuality, setOutputQuality] = useState(9)

	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => {
		setMounted(true)
	}, [])
	useEffect(() => {
		dispatch(
			layoutSlice.actions.setLayoutHeaderLogoText(
				t('pageTitle', {
					ns: 'imageColorInversionPage',
				})
			)
		)
	}, [i18n.language])

	const [originalImg, setOriginalImg] = useState('')
	const [oImgEl, setOImgEl] = useState<HTMLImageElement>()
	const [outputImg, setOutputImg] = useState<Blob>()
	const [showConvertButton, setShowConvertButton] = useState(false)
	const [rgbaList, setRgbaList] = useState<number[][]>([])
	const [rgbaRange, setRgbaRange] = useState<string[][]>([])
	const [isCanvasMove, setIsCanvasMove] = useState(false)

	const [toRgba, setToRgba] = useState<string[]>(
		new Array(3).fill('').map((v, i) => '233')
	)

	useEffect(() => {
		initCvs()
	}, [config.deviceType])

	const initCvs = () => {
		// console.log('initCvs', uploadAvatar)
		if (!uploadAvatar) return
		let cvs = originalImgCvs.current
		if (!cvs) return
		let ctx = cvs.getContext('2d')
		const layerEl = document.body.querySelector('.cip-m-layer') as HTMLElement
		// let w = 100
		let w = layerEl.offsetWidth
		let h = cvs.offsetHeight

		const originalImgEl = document.body.querySelector(
			'.cip-m-original-img'
		) as HTMLElement

		// let oImgEl = originalImgEl.querySelector('img')
		// if (!oImgEl) return
		const oImgEl = document.createElement('img')
		oImgEl.setAttribute('crossOrigin', 'anonymous')
		oImgEl.src = uploadAvatar

		setOriginalImg(uploadAvatar)

		// console.log(oImgEl)

		oImgEl.onload = () => {
			if (!ctx || !cvs) return
			// console.log('onload', ctx, cvs.offsetWidth, oImgEl.width, oImgEl.height)

			cvs.width = w
			h = w / (oImgEl.width / oImgEl.height)
			cvs.height = h

			originalImgEl.style.width = w + 'px'
			originalImgEl.style.height = h + 'px'

			setOImgEl(oImgEl)
			ctx?.drawImage(oImgEl, 0, 0, w, h)
			setOutputImg(undefined)
			setShowConvertButton(false)
		}
	}

	const addRgbaList = (e: MouseEvent) => {
		let cvs = originalImgCvs.current
		if (!cvs || !oImgEl) return
		let ctx = cvs.getContext('2d')
		if (!ctx) return

		const cvsRect = cvs.getBoundingClientRect()

		let x = e.pageX - cvsRect.x
		let y = e.pageY - cvsRect.y

		// // console.log('addRgbaList', x, y, e, e.pageX, cvsRect.x)

		let pixel = ctx?.getImageData(x, y, 1, 1)
		let data = pixel.data

		const v = data

		// const rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`

		// // console.log('rgba', rgba, rgbaList)

		// setRgbaList(rgbaList.concat([[data[0], data[1], data[2], data[3]]]))

		let newRgbaRange: typeof rgbaRange = deepCopy(rgbaRange)

		if (!newRgbaRange.length) {
			newRgbaRange = [
				[String(v[0]), String(v[0])],
				[String(v[1]), String(v[1])],
				[String(v[2]), String(v[2])],
			]
		}
		for (let i = 0; i < v.length - 1; i++) {
			if (newRgbaRange[i][0] === '') {
				newRgbaRange[i][0] = String(v[i])
			}
			if (newRgbaRange[i][1] === '') {
				newRgbaRange[i][1] = String(v[i])
			}
			if (Number(v[i]) < Number(newRgbaRange[i][0])) {
				newRgbaRange[i][0] = String(v[i])
			}
			if (Number(v[i]) > Number(newRgbaRange[i][1])) {
				newRgbaRange[i][1] = String(v[i])
			}
		}

		setRgbaRange(newRgbaRange)

		// return rgba
		// setOutputImg(undefined)
		setShowConvertButton(false)
	}

	const recover = () => {
		let cvs = originalImgCvs.current
		if (!cvs || !oImgEl) return
		let ctx = cvs.getContext('2d')
		if (!ctx) return
		const w = cvs.width
		const h = cvs.height
		ctx?.drawImage(oImgEl, 0, 0, w, h)
		setOutputImg(undefined)
		setShowConvertButton(false)
	}

	const convert = async () => {
		if (toRgba.filter((v) => v).length !== 3) {
			showSnackbar(t('toRGBAErr'))
			return
		}
		if (rgbaRange.length != 3) {
			showSnackbar(t('rgbaRangeErr'))
			return
		}

		// outputImgEl.style.width = cvs?.width + 'px'
		// outputImgEl.style.height = cvs?.height + 'px'

		let cvs = outputImgCvs.current
		if (!cvs || !oImgEl) return
		let ctx = cvs.getContext('2d')
		if (!ctx) return

		const layerEl = document.body.querySelector('.cip-m-layer') as HTMLElement
		// let w = 100
		let w = layerEl.offsetWidth
		let h = cvs.offsetHeight

		cvs.width = w
		h = w / (oImgEl.width / oImgEl.height)
		cvs.height = h

		ctx?.drawImage(oImgEl, 0, 0, w, h)

		// console.log(rgbaList, rgbaRange)
		const imageData = await imageColorInversionUsingCanvas(
			cvs,
			[...rgbaRange.map((v) => v.map((sv) => Number(sv))), [1, 1]],
			toRgba.map((v) => Number(v)).concat(1)
		)

		// console.log('imageData', imageData)
		ctx.putImageData(imageData, 0, 0)
		cvs?.toBlob(
			(b) => {
				b && setShowConvertButton(true)
				b && setOutputImg(b)
			},
			'image/jpg',
			1
		)
	}

	const output = async () => {
		if (!uploadAvatar) {
			snackbar({
				message: t('pleaseUploadYourAvatar', {
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
		let cvs = originalImgCvs.current
		if (!cvs) return
		const { resizeByUrl } = images
		let src = (
			await resizeByUrl(cvs?.toDataURL('image/jpg', 1), {
				width: outputSize,
				height: outputSize,
				quality: outputQuality / 10,
			})
		).dataURL
		let aLink = document.createElement('a')
		aLink.style.display = 'none'
		aLink.setAttribute('target', '_blank')
		aLink.href = src
		aLink.download = 'nyanya_avatar_' + outputSize + 'x' + outputSize + '.jpg'

		document.body.appendChild(aLink)
		aLink.click()
		document.body.removeChild(aLink)
	}

	useEffect(() => {
		// // console.log(
		// 	'2121',
		// 	badgeSize,
		// 	badgePosition,
		// 	badgeBorderRadius,
		// 	badgeDistanceBorder
		// )
		initCvsDebounce.increase(() => {
			initCvs()
		}, 300)
	}, [
		uploadAvatar,
		badgeIcon,
		badgeSize,
		badgePosition,
		badgeBorderRadius,
		badgeDistanceBorder,
		badgeBorderSize,
		badgeBorderColor,
	])

	const rgbaWidth = 40

	return (
		<>
			<Head>
				<title>
					{t('pageTitle', {
						ns: 'imageColorInversionPage',
					}) +
						' - ' +
						t('appTitle', {
							ns: 'common',
						})}
				</title>
				<meta name='description' content={t('subtitle')} />
			</Head>
			<div className='color-inversion-page'>
				<div className='cip-main'>
					<div className='cip-m-title'>
						{t('pageTitle', {
							ns: 'imageColorInversionPage',
						})}
					</div>
					<div className='cip-m-subtitle'>
						{t('subtitle', {
							ns: 'imageColorInversionPage',
						})}
					</div>

					<div className='cip-m-layer'>
						<div
							className={
								'cip-m-original-img ' + (originalImg ? 'uploaded' : '')
							}
						>
							{/* <img src={uploadAvatar}></img> */}
							<canvas
								style={{
									borderRadius: avatarBorderRadius,
								}}
								// onClick={(e) => {
								// 	// // console.log(e)
								// 	addRgbaList(e as any)
								// }}
								onMouseDown={() => {
									setIsCanvasMove(true)
								}}
								onMouseMove={(e) => {
									isCanvasMove && addRgbaList(e as any)
								}}
								onMouseUp={(e) => {
									isCanvasMove && addRgbaList(e as any)
									setIsCanvasMove(false)
								}}
								onTouchStart={() => {
									setIsCanvasMove(true)
								}}
								onTouchMove={(e) => {
									isCanvasMove &&
										e.targetTouches?.[0] &&
										addRgbaList(e.targetTouches?.[0] as any)
								}}
								onTouchEnd={(e) => {
									isCanvasMove &&
										e.targetTouches?.[0] &&
										addRgbaList(e.targetTouches?.[0] as any)
									setIsCanvasMove(false)
								}}
								ref={originalImgCvs}
								className='cvs'
							></canvas>

							<canvas
								style={{
									borderRadius: avatarBorderRadius,
								}}
								// onClick={(e) => {
								// 	// // console.log(e)
								// 	addRgbaList(e as any)
								// }}
								onMouseDown={() => {
									setIsCanvasMove(true)
								}}
								onMouseMove={(e) => {
									isCanvasMove && addRgbaList(e as any)
								}}
								onMouseUp={(e) => {
									isCanvasMove && addRgbaList(e as any)
									setIsCanvasMove(false)
								}}
								onTouchStart={() => {
									setIsCanvasMove(true)
								}}
								onTouchMove={(e) => {
									isCanvasMove &&
										e.targetTouches?.[0] &&
										addRgbaList(e.targetTouches?.[0] as any)
								}}
								onTouchEnd={(e) => {
									isCanvasMove &&
										e.targetTouches?.[0] &&
										addRgbaList(e.targetTouches?.[0] as any)
									setIsCanvasMove(false)
								}}
								ref={outputImgCvs}
								className={'output-cvs ' + (!!outputImg ? 'show' : 'hide')}
							></canvas>
							{/* <img className='cvs' src={uploadAvatar} alt='' /> */}
							{/* <img className='cvs' src={uploadAvatar} alt='' /> */}
							<div
								onClick={() => {
									uploadAvatarInput.current?.click()
								}}
								className='cip-m-a-upload'
							>
								<svg
									className='icon'
									viewBox='0 0 1024 1024'
									version='1.1'
									xmlns='http://www.w3.org/2000/svg'
									p-id='4292'
								>
									<path
										d='M874.666667 469.333333H554.666667V149.333333c0-23.466667-19.2-42.666667-42.666667-42.666666s-42.666667 19.2-42.666667 42.666666v320H149.333333c-23.466667 0-42.666667 19.2-42.666666 42.666667s19.2 42.666667 42.666666 42.666667h320v320c0 23.466667 19.2 42.666667 42.666667 42.666666s42.666667-19.2 42.666667-42.666666V554.666667h320c23.466667 0 42.666667-19.2 42.666666-42.666667s-19.2-42.666667-42.666666-42.666667z'
										p-id='4293'
									></path>
								</svg>
							</div>

							<div
								onClick={() => {
									uploadAvatarInput.current?.click()
								}}
								className='cip-m-a-re-upload'
							>
								Upload
							</div>
							<input
								ref={uploadAvatarInput}
								onChange={(e) => {
									// // console.log(e.target.files)
									if (e?.target?.files?.[0]) {
										setUploadAvatar(URL.createObjectURL(e.target.files?.[0]))
									}
								}}
								type='file'
							/>
						</div>

						{/* <div
							className={'cip-m-output-img ' + (outputImg ? 'uploaded' : '')}
						>
							<img src={outputImg}></img>
						</div> */}
					</div>

					{mounted ? (
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
										ns: 'imageColorInversionPage',
									})}
								>
									<>
										<div className={'cip-m-spacing ' + config.deviceType}>
											<div className='cip-m-s-left'>
												{/* <p>{JSON.stringify(rgbaRange)}</p>
										<p>{JSON.stringify(rgbaList.length)}</p>
										<p>{JSON.stringify(toRgba)}</p> */}
												<div className='cip-rgbarange'>
													{[0, 1].map((v, i) => {
														return (
															<div key={i} className='cip-item'>
																<span>
																	{t('rgbRange' + (i === 0 ? 'Min' : 'Max'))}
																</span>

																<div className='cip-i-right'>
																	<div className='cip-input'>
																		{['R', 'G', 'B'].map((sv, si) => {
																			return (
																				<SakiInput
																					key={si}
																					onChangevalue={(e) => {
																						if (isCanvasMove) {
																							return
																						}
																						let newRgbaRange: typeof rgbaRange =
																							deepCopy(rgbaRange)

																						// console.log(e.detail, newRgbaRange)
																						if (!newRgbaRange.length) {
																							newRgbaRange = [
																								['', ''],
																								['', ''],
																								['', ''],
																							]
																						}

																						// console.log(e.detail, newRgbaRange)
																						newRgbaRange[si][i] =
																							String(e.detail) || ''

																						setRgbaRange(newRgbaRange)
																					}}
																					width={rgbaWidth + 'px'}
																					value={rgbaRange[si]?.[i] || '' || ''}
																					height='50px'
																					margin='0 0 0 0'
																					min={0}
																					max={si === 3 ? 1 : 255}
																					placeholder={t(sv)}
																					type='Number'
																					placeholderAnimation='MoveUp'
																				></SakiInput>
																			)
																		})}
																	</div>
																	<div
																		style={
																			i === 1
																				? {
																						background: `linear-gradient(45deg, ${rgbaRange
																							.reduce(
																								(rgba, v, i) => {
																									v.forEach((sv, si) => {
																										rgba[si].push(sv)
																									})
																									return rgba
																								},
																								[[], []] as string[][]
																							)
																							.map((v) => `rgb(${v.join(',')})`)
																							.join(',')})`,
																				  }
																				: {}
																		}
																		className={
																			'cip-color ' + (i === 1 ? 'show' : 'hide')
																		}
																	></div>
																</div>
															</div>
														)
													})}
												</div>
												<div className='cip-torgba'>
													<div className='cip-item'>
														<span>{t('toRGBA')}</span>

														<div className='cip-i-right'>
															<div className='cip-input'>
																{['R', 'G', 'B'].map((v, i) => {
																	return (
																		<SakiInput
																			key={i}
																			onChangevalue={(e) => {
																				// console.log(e.detail)
																				const newToRgba = [...toRgba]
																				newToRgba[i] = String(
																					Number(e.detail) || 0
																				)
																				setToRgba(newToRgba)
																			}}
																			width={rgbaWidth + 'px'}
																			value={toRgba?.[i] || ''}
																			height='50px'
																			margin='0 0 0 0'
																			min={0}
																			max={i === 3 ? 1 : 255}
																			placeholder={t(v)}
																			type='Number'
																			placeholderAnimation='MoveUp'
																		></SakiInput>
																	)
																})}
															</div>
															<div
																style={{
																	backgroundColor: `rgba(${toRgba.join(',')})`,
																}}
																className={'cip-color show'}
															></div>
														</div>
													</div>
												</div>
												<div className='cip-buttons'></div>
											</div>
											<div className='cip-m-s-right'>
												<saki-button
													padding='8px 8px'
													margin='0 0 0 10px'
													type='Normal'
													ref={bindEvent({
														tap: () => {
															setIsCanvasMove(true)
															setTimeout(() => {
																setRgbaRange([])
																setToRgba(
																	new Array(3).fill('').map((v, i) => '233')
																)
																setTimeout(() => {
																	setIsCanvasMove(false)
																}, 10)
															}, 10)
														},
													})}
												>
													<saki-row flex-direction='column'>
														<span>
															{t('resetRGB', {
																ns: 'imageColorInversionPage',
															})}
														</span>
													</saki-row>
												</saki-button>
												<saki-button
													padding='8px 8px'
													margin='0 0 0 10px'
													type='Normal'
													disabled={!showConvertButton}
													ref={bindEvent({
														tap: () => {
															recover()
														},
													})}
												>
													<saki-row flex-direction='column'>
														<span>
															{t('recover', {
																ns: 'imageColorInversionPage',
															})}
														</span>
													</saki-row>
												</saki-button>
												<saki-button
													padding='8px 8px'
													margin='0 0 0 10px'
													type='Primary'
													disabled={!!showConvertButton}
													ref={bindEvent({
														tap: () => {
															convert()
														},
													})}
												>
													<saki-row flex-direction='row'>
														<span>
															{t('convert', {
																ns: 'imageColorInversionPage',
															})}
														</span>
														{/* <saki-icon color='#fff' type='ArrowRight'></saki-icon> */}
													</saki-row>
												</saki-button>
											</div>
										</div>
									</>
								</saki-tabs-item>

								<saki-tabs-item
									font-size='14px'
									label='personal-info'
									name={t('output', {
										ns: 'imageColorInversionPage',
									})}
								>
									<div className='cip-m-style'>
										<div className='cip-s-title'>
											{t('outputParameters', {
												ns: 'imageColorInversionPage',
											})}
										</div>
										<div className='cip-s-main'>
											<div className='cip-s-m-item'>
												<span className='item-title'>
													{t('resolution', {
														ns: 'imageColorInversionPage',
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
															>
																<div className='item-c-b-content'>
																	<span>
																		{outputSize + 'px x ' + outputSize + 'px'}
																	</span>

																	<saki-icon type='BottomTriangle'></saki-icon>
																</div>
															</saki-button>
														</div>
														<div slot='main'>
															<saki-menu
																ref={bindEvent({
																	selectvalue: (e) => {
																		setOutputSize(Number(e.detail.value))
																		setOutputSizeDropdown(false)
																	},
																})}
															>
																<saki-menu-item
																	padding='10px 26px'
																	value={'80'}
																>
																	<div>80px x 80px</div>
																</saki-menu-item>
																<saki-menu-item
																	padding='10px 26px'
																	value={'160'}
																>
																	<div>160px x 160px</div>
																</saki-menu-item>
																<saki-menu-item
																	padding='10px 26px'
																	value={'200'}
																>
																	<div>200px x 200px</div>
																</saki-menu-item>
																<saki-menu-item
																	padding='10px 26px'
																	value={'500'}
																>
																	<div>500px x 500px</div>
																</saki-menu-item>
															</saki-menu>
														</div>
													</saki-dropdown>
												</div>
											</div>
											<div className='cip-s-m-item'>
												<span className='item-title'>
													{t('quality', {
														ns: 'imageColorInversionPage',
													})}
													:
												</span>
												<div className='item-content'>
													<saki-input
														ref={bindEvent({
															changevalue: (e) => {
																setOutputQuality(Number(e.detail))
															},
														})}
														type='Range'
														width='120px'
														min='0'
														max='10'
														value={outputQuality}
													></saki-input>
													<span
														style={{
															margin: '0 0 0 10px',
														}}
													>
														{outputQuality / 10}
													</span>
												</div>
											</div>
											<div
												style={{
													margin: '20px 0 0',
												}}
												className='cip-s-m-button'
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
ImageColorInversionPage.getLayout = getLayout
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

export default ImageColorInversionPage
