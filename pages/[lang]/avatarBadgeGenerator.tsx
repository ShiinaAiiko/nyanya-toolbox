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
const AvatarBadgeGeneratorPage = () => {
	const { t, i18n } = useTranslation('avatarBadgeGeneratorPage')
	const [mounted, setMounted] = useState(false)
	const [convertType, setConvertType] = useState<'WindowsPath' | 'PosixPath'>(
		'WindowsPath'
	)
	const uploadAvatarInput = useRef<HTMLInputElement>(null)
	const uploadBadgeInput = useRef<HTMLInputElement>(null)
	const avatarCvs = useRef<HTMLCanvasElement>(null)
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
					ns: 'avatarBadgeGeneratorPage',
				})
			)
		)
	}, [i18n.language])
	// 绘制圆角矩形
	const drawRoundedRectImage = (
		ctx: CanvasRenderingContext2D,
		imgSrc: string,
		x: number,
		y: number,
		width: number,
		height: number,
		radius: number,
		borderWidth?: number,
		borderColor?: string
	) => {
		let img = document.createElement('img')
		img.setAttribute('crossOrigin', 'anonymous')
		img.src = imgSrc

		img.onload = () => {
			// console.log('onload', ctx, img)
			if (!ctx) return
			ctx.save()
			let r = radius

			let w = width
			let h = height

			ctx.beginPath()
			ctx.moveTo(x + r, y)
			ctx.arcTo(x + w, y, x + w, y + h, r)
			ctx.arcTo(x + w, y + h, x, y + h, r)
			ctx.arcTo(x, y + h, x, y, r)
			ctx.arcTo(x, y, x + w, y, r)
			ctx.closePath()
			if (borderWidth) {
				ctx.lineWidth = borderWidth
				ctx.strokeStyle = borderColor || '#000'
				ctx.stroke()
			}
			ctx.clip()
			ctx?.drawImage(img, x, y, w, h)
			ctx.beginPath()

			ctx.restore()
		}
	}

	const initCvs = () => {
		if (!uploadAvatar) return
		let cvs = avatarCvs.current
		if (!cvs) return
		let ctx = cvs.getContext('2d')
		let w = cvs.offsetWidth
		let h = cvs.offsetHeight
		cvs.width = 500
		cvs.height = 500

		let img = document.createElement('img')
		img.setAttribute('crossOrigin', 'anonymous')
		img.src = uploadAvatar
		// console.log(img)

		img.onload = () => {
			if (!ctx) return
			// console.log('onload', ctx, img)

			// drawRoundedRect(ctx, 0, 0, w, h, 14)

			ctx?.drawImage(img, 0, 0, w, h)

			if (!badgeIcon) return

			let bbr = (badgeSize * 2) / 2
			if (badgeBorderRadius !== '50%') {
				bbr = Number(badgeBorderRadius.replace('px', '')) * 2
			}
			let x = 0
			let y = 0

			switch (badgePosition) {
				case 'TopLeft':
					x = badgeDistanceBorder * 2
					y = badgeDistanceBorder * 2
					break
				case 'TopRight':
					x = w - badgeSize * 2 - badgeDistanceBorder * 2
					y = badgeDistanceBorder * 2
					break
				case 'BottomLeft':
					x = badgeDistanceBorder
					y = h - badgeSize * 2 - badgeDistanceBorder * 2
					break
				case 'BottomRight':
					x = w - badgeSize * 2 - badgeDistanceBorder * 2
					y = h - badgeSize * 2 - badgeDistanceBorder * 2
					break

				default:
					break
			}
			drawRoundedRectImage(
				ctx,
				badgeIcon,
				x,
				y,
				badgeSize * 2,
				badgeSize * 2,
				bbr,
				badgeBorderSize * 2,
				badgeBorderColor
			)
		}
	}

	const outputCvs = async () => {
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
		let cvs = avatarCvs.current
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
		// console.log(
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

	return (
		<>
			<Head>
				<title>
					{t('pageTitle', {
						ns: 'avatarBadgeGeneratorPage',
					}) +
						' - ' +
						t('appTitle', {
							ns: 'common',
						})}
				</title>
				<meta name='description' content={t('subtitle')} />
			</Head>
			<div className='avatar-generator-page'>
				<div className='agp-main'>
					<div className='agp-m-title'>
						{t('pageTitle', {
							ns: 'avatarBadgeGeneratorPage',
						})}
					</div>
					<div className='agp-m-subtitle'>
						{t('subtitle', {
							ns: 'avatarBadgeGeneratorPage',
						})}
					</div>

					<div className={'agp-m-avatar ' + (uploadAvatar ? 'uploaded' : '')}>
						<canvas
							style={{
								borderRadius: avatarBorderRadius,
							}}
							ref={avatarCvs}
							className='cvs'
						></canvas>
						{/* <img className='cvs' src={uploadAvatar} alt='' /> */}
						{/* <img className='cvs' src={uploadAvatar} alt='' /> */}
						<div
							onClick={() => {
								uploadAvatarInput.current?.click()
							}}
							className='agp-m-a-upload'
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
							className='agp-m-a-re-upload'
						>
							Upload
						</div>
						<input
							ref={uploadAvatarInput}
							onChange={(e) => {
								// console.log(e.target.files)
								if (e?.target?.files?.[0]) {
									setUploadAvatar(URL.createObjectURL(e.target.files?.[0]))
								}
							}}
							type='file'
						/>
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
										// console.log('tap', e)
										// setActiveTabLabel(e.detail.label)
										// setOpenDropDownMenu(false)
									},
								})}
							>
								<saki-tabs-item
									font-size='14px'
									label='account-security'
									name={t('badge', {
										ns: 'avatarBadgeGeneratorPage',
									})}
								>
									<div className='agp-m-badge'>
										<div className='agp-m-b-image'>
											<div className='agp-title'>
												{t('badge', {
													ns: 'avatarBadgeGeneratorPage',
												})}
											</div>
											<div className='agp-images-wrap'>
												<div className='agp-iw-images'>
													{badgeIconList.map((v, i) => {
														return (
															<img
																key={i}
																onClick={() => {
																	setBadgeIcon(v.url)
																}}
																className={v.url === badgeIcon ? 'active' : ''}
																src={v.url}
																alt=''
															/>
														)
													})}
													<div
														onClick={() => {
															uploadBadgeInput.current?.click()
														}}
														className='agp-iw-upload'
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
														<input
															style={{
																display: 'none',
															}}
															ref={uploadBadgeInput}
															onChange={(e) => {
																// console.log(e.target.files)
																if (e?.target?.files?.[0]) {
																	setBadgeIconList(
																		badgeIconList.concat([
																			{
																				url: URL.createObjectURL(
																					e.target.files?.[0]
																				),
																			},
																		])
																	)
																}
															}}
															type='file'
														/>
													</div>
												</div>
											</div>
										</div>
									</div>

									<div className='agp-m-style'>
										<div className='agp-s-title'>
											{t('style', {
												ns: 'avatarBadgeGeneratorPage',
											})}
										</div>
										<div className='agp-s-main'>
											<div className='agp-s-m-item'>
												<span className='item-title'>
													{t('size', {
														ns: 'avatarBadgeGeneratorPage',
													})}
													:
												</span>
												<div className='item-content'>
													<saki-input
														ref={bindEvent({
															changevalue: (e) => {
																setBadgeSize(Number(e.detail))
															},
														})}
														type='Range'
														width='120px'
														min='40'
														max='100'
														value={badgeSize}
													></saki-input>
													<span
														style={{
															margin: '0 0 0 10px',
														}}
													>
														{badgeSize}px
													</span>
												</div>
											</div>
											<div className='agp-s-m-item'>
												<span className='item-title'>
													{t('position', {
														ns: 'avatarBadgeGeneratorPage',
													})}
													:
												</span>
												<div className='item-content'>
													<saki-dropdown
														visible={badgePositionDropDown}
														floating-direction='Left'
														ref={bindEvent({
															close: (e) => {
																setBadgePositionDropDown(false)
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
																		setBadgePositionDropDown(
																			!badgePositionDropDown
																		)
																	},
																})}
															>
																<div className='item-c-b-content'>
																	<span>
																		{t(
																			badgePosition
																				.substring(0, 1)
																				.toLowerCase() +
																				badgePosition.substring(
																					1,
																					badgePosition.length
																				),
																			{
																				ns: 'avatarBadgeGeneratorPage',
																			}
																		)}
																	</span>
																	<svg
																		className='icon'
																		viewBox='0 0 1024 1024'
																		version='1.1'
																		xmlns='http://www.w3.org/2000/svg'
																		p-id='1644'
																	>
																		<path
																			d='M725.333333 426.666667L512 640 298.666667 426.666667z'
																			p-id='1645'
																		></path>
																	</svg>
																</div>
															</saki-button>
														</div>
														<div slot='main'>
															<saki-menu
																ref={bindEvent({
																	selectvalue: (e) => {
																		setBadgePosition(e.detail.value)
																		setBadgePositionDropDown(false)
																	},
																})}
															>
																<saki-menu-item
																	padding='10px 26px'
																	value={'TopLeft'}
																>
																	<div>
																		{t('topLeft', {
																			ns: 'avatarBadgeGeneratorPage',
																		})}
																	</div>
																</saki-menu-item>
																<saki-menu-item
																	padding='10px 26px'
																	value={'TopRight'}
																>
																	<div>
																		{t('topRight', {
																			ns: 'avatarBadgeGeneratorPage',
																		})}
																	</div>
																</saki-menu-item>
																<saki-menu-item
																	padding='10px 26px'
																	value={'BottomLeft'}
																>
																	<div>
																		{t('bottomLeft', {
																			ns: 'avatarBadgeGeneratorPage',
																		})}
																	</div>
																</saki-menu-item>
																<saki-menu-item
																	padding='10px 26px'
																	value={'BottomRight'}
																>
																	<div>
																		{t('bottomRight', {
																			ns: 'avatarBadgeGeneratorPage',
																		})}
																	</div>
																</saki-menu-item>
															</saki-menu>
														</div>
													</saki-dropdown>
												</div>
											</div>
											<div className='agp-s-m-item'>
												<span className='item-title'>
													{t('borderRadius', {
														ns: 'avatarBadgeGeneratorPage',
													})}
													:
												</span>
												<div className='item-content'>
													<saki-dropdown
														visible={badgeBorderRadiusDropDown}
														floating-direction='Left'
														ref={bindEvent({
															close: (e) => {
																setBadgeBorderRadiusDropDown(false)
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
																		setBadgeBorderRadiusDropDown(
																			!badgeBorderRadiusDropDown
																		)
																	},
																})}
															>
																<div className='item-c-b-content'>
																	<span>{badgeBorderRadius}</span>
																	<svg
																		className='icon'
																		viewBox='0 0 1024 1024'
																		version='1.1'
																		xmlns='http://www.w3.org/2000/svg'
																		p-id='1644'
																	>
																		<path
																			d='M725.333333 426.666667L512 640 298.666667 426.666667z'
																			p-id='1645'
																		></path>
																	</svg>
																</div>
															</saki-button>
														</div>
														<div slot='main'>
															<saki-menu
																ref={bindEvent({
																	selectvalue: async (e) => {
																		setBadgeBorderRadius(e.detail.value)
																		setBadgeBorderRadiusDropDown(false)
																	},
																})}
															>
																<saki-menu-item
																	padding='10px 26px'
																	value={'6px'}
																>
																	<div>6px</div>
																</saki-menu-item>
																<saki-menu-item
																	padding='10px 26px'
																	value={'10px'}
																>
																	<div>10px</div>
																</saki-menu-item>
																<saki-menu-item
																	padding='10px 26px'
																	value={'15px'}
																>
																	<div>15px</div>
																</saki-menu-item>
																<saki-menu-item
																	padding='10px 26px'
																	value={'50%'}
																>
																	<div>50%</div>
																</saki-menu-item>
															</saki-menu>
														</div>
													</saki-dropdown>
												</div>
											</div>
											<div className='agp-s-m-item'>
												<span className='item-title'>
													{t('distanceBorder', {
														ns: 'avatarBadgeGeneratorPage',
													})}
													:
												</span>
												<div className='item-content'>
													<saki-input
														ref={bindEvent({
															changevalue: (e) => {
																setBadgeDistanceBorder(Number(e.detail))
															},
														})}
														type='Range'
														width='120px'
														min='5'
														max='40'
														value={badgeDistanceBorder}
													></saki-input>
													<span
														style={{
															margin: '0 0 0 10px',
														}}
													>
														{badgeDistanceBorder}px
													</span>
												</div>
											</div>
											<div className='agp-s-m-item'>
												<span className='item-title'>
													{t('borderSize', {
														ns: 'avatarBadgeGeneratorPage',
													})}
													:
												</span>
												<div className='item-content'>
													<saki-input
														ref={bindEvent({
															changevalue: (e) => {
																setBadgeBorderSize(Number(e.detail))
															},
														})}
														type='Range'
														width='120px'
														min='0'
														max='20'
														value={badgeBorderSize}
													></saki-input>
													<span
														style={{
															margin: '0 0 0 10px',
														}}
													>
														{badgeBorderSize}px
													</span>
												</div>
											</div>
											<div className='agp-s-m-item'>
												<span className='item-title'>
													{t('borderColor', {
														ns: 'avatarBadgeGeneratorPage',
													})}
													:
												</span>
												<div className='item-content'>
													<saki-input
														ref={bindEvent({
															changevalue: (e) => {
																setBadgeBorderColor(e.detail)
															},
														})}
														type='Text'
														border='1px solid #eee'
														border-radius='4px'
														padding='10px'
														width='120px'
														value={badgeBorderColor}
													></saki-input>
													<div
														style={{
															margin: '0 0 0 10px',
															backgroundColor: badgeBorderColor,
															width: '36px',
															height: '36px',
															border: '1px solid #eee',
														}}
													></div>
												</div>
											</div>
										</div>
									</div>
								</saki-tabs-item>
								<saki-tabs-item
									font-size='14px'
									label='personal-info'
									name={t('avatar', {
										ns: 'avatarBadgeGeneratorPage',
									})}
								>
									<div className='agp-m-style'>
										<div className='agp-s-title'>
											{t('avatarStyle', {
												ns: 'avatarBadgeGeneratorPage',
											})}
										</div>
										<div className='agp-s-main'>
											<div className='agp-s-m-item'>
												<span className='item-title'>
													{t('borderRadius', {
														ns: 'avatarBadgeGeneratorPage',
													})}
													:
												</span>
												<div className='item-content'>
													<saki-dropdown
														visible={avatarBorderRadiusDropDown}
														floating-direction='Left'
														ref={bindEvent({
															close: (e) => {
																setAvatarBorderRadiusDropDown(false)
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
																		setAvatarBorderRadiusDropDown(
																			!avatarBorderRadiusDropDown
																		)
																	},
																})}
															>
																<div className='item-c-b-content'>
																	<span>
																		{avatarBorderRadius === '50%'
																			? avatarBorderRadius
																			: Number(
																					avatarBorderRadius.replace('px', '')
																			  ) /
																					2.5 +
																			  'px'}
																	</span>
																	<svg
																		className='icon'
																		viewBox='0 0 1024 1024'
																		version='1.1'
																		xmlns='http://www.w3.org/2000/svg'
																		p-id='1644'
																	>
																		<path
																			d='M725.333333 426.666667L512 640 298.666667 426.666667z'
																			p-id='1645'
																		></path>
																	</svg>
																</div>
															</saki-button>
														</div>
														<div slot='main'>
															<saki-menu
																ref={bindEvent({
																	selectvalue: async (e) => {
																		setAvatarBorderRadius(e.detail.value)
																		setAvatarBorderRadiusDropDown(false)
																	},
																})}
															>
																<saki-menu-item
																	padding='10px 26px'
																	value={'0px'}
																>
																	<div>0px</div>
																</saki-menu-item>
																<saki-menu-item
																	padding='10px 26px'
																	value={'20px'}
																>
																	<div>8px</div>
																</saki-menu-item>
																<saki-menu-item
																	padding='10px 26px'
																	value={'100px'}
																>
																	<div>40px</div>
																</saki-menu-item>
																<saki-menu-item
																	padding='10px 26px'
																	value={'200px'}
																>
																	<div>80px</div>
																</saki-menu-item>
																<saki-menu-item
																	padding='10px 26px'
																	value={'50%'}
																>
																	<div>50%</div>
																</saki-menu-item>
															</saki-menu>
														</div>
													</saki-dropdown>
												</div>
											</div>
										</div>
									</div>
								</saki-tabs-item>

								<saki-tabs-item
									font-size='14px'
									label='personal-info'
									name={t('output', {
										ns: 'avatarBadgeGeneratorPage',
									})}
								>
									<div className='agp-m-style'>
										<div className='agp-s-title'>
											{t('outputParameters', {
												ns: 'avatarBadgeGeneratorPage',
											})}
										</div>
										<div className='agp-s-main'>
											<div className='agp-s-m-item'>
												<span className='item-title'>
													{t('resolution', {
														ns: 'avatarBadgeGeneratorPage',
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
																	<svg
																		className='icon'
																		viewBox='0 0 1024 1024'
																		version='1.1'
																		xmlns='http://www.w3.org/2000/svg'
																		p-id='1644'
																	>
																		<path
																			d='M725.333333 426.666667L512 640 298.666667 426.666667z'
																			p-id='1645'
																		></path>
																	</svg>
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
											<div className='agp-s-m-item'>
												<span className='item-title'>
													{t('quality', {
														ns: 'avatarBadgeGeneratorPage',
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
												className='agp-s-m-button'
											>
												<saki-button
													ref={bindEvent({
														tap: () => {
															outputCvs()
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
AvatarBadgeGeneratorPage.getLayout = getLayout

export default AvatarBadgeGeneratorPage
