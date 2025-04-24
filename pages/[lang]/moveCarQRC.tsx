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
	configSlice,
} from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import StatisticsComponent from '../../components/Statistics'
import {
	bindEvent,
	snackbar,
	progressBar,
	multiplePrompts,
	alert,
} from '@saki-ui/core'
import { deepCopy, QueueLoop } from '@nyanyajs/utils'
import {
	getRegExp,
	copyText,
	getRandomPassword,
	download,
	showSnackbar,
	hidePhone,
} from '../../plugins/methods'
import {
	changeLanguage,
	languages,
	defaultLanguage,
} from '../../plugins/i18n/i18n'
import {
	SakiButton,
	SakiCol,
	SakiColor,
	SakiIcon,
	SakiImages,
	SakiInput,
	SakiModal,
	SakiModalHeader,
	SakiRow,
	SakiScrollLoading,
	SakiTitle,
} from '../../components/saki-ui-react/components'

import httpApi from '../../plugins/http/api'

import QRCode from 'qrcode'
import { protoRoot } from '../../protos'
import moment from 'moment'
import html2canvas from 'html2canvas'

const colours = {
	Default: 'var(--saki-default-color)',
	Green: '#04aa86',
	Blue: '#1c6dfc',
}

const getColor = (type: 'Default' | 'Green' | 'Blue') => {
	return colours[type]
}

const getColorType = (color: string): any => {
	return Object.keys(colours).filter(
		(k) => ((colours as any)[k] as any) === color
	)?.[0]
}

const EditQRCModal = ({
	visible,
	type,
	mcqrc,
	onClose,
	onComfirm,
}: {
	visible: boolean
	type: 'Create' | 'Update'
	mcqrc?: {
		id?: string
		phone: string
		carNumber: string
		slogan: string
		email: string
		wechat: string
		colorTheme?: string
	}
	onClose: () => void
	onComfirm: (mcqrc: {
		id?: string
		phone: string
		carNumber: string
		slogan: string
		email: string
		wechat: string
		colorTheme?: string
	}) => void
}) => {
	const { t, i18n } = useTranslation('moveCarQRCPage')
	const config = useSelector((state: RootState) => state.config)

	const [phone, setPhone] = useState('')
	const [phoneErr, setPhoneErr] = useState('')
	const [carNumber, setCarNumber] = useState('')
	const [carNumberErr, setCarNumberErr] = useState('')
	const [slogan, setSlogan] = useState('')
	const [sloganErr, setSloganErr] = useState('')
	const [email, setEmail] = useState('')
	const [emailErr, setEmailErr] = useState('')
	const [wechat, setWechat] = useState('')
	const [wechatErr, setWechatErr] = useState('')
	const [colorTheme, setColorTheme] = useState('var(--saki-default-color)')
	const [colorThemeType, setColorThemeType] = useState<
		'Default' | 'Green' | 'Blue'
	>('Default')
	const [disableComfirmButton, setDisableComfirmButton] = useState(false)

	const [openColorThemeDropdown, setOpenColorThemeDropdown] = useState(false)

	useEffect(() => {
		verfiyNextButton()
	}, [carNumber, slogan, phone])

	useEffect(() => {
		setPhone(mcqrc?.phone || '')
		setCarNumber(mcqrc?.carNumber || '')
		setSlogan(mcqrc?.slogan || '')
		setEmail(mcqrc?.email || '')
		setWechat(mcqrc?.wechat || '')
		// console.log('mcqrc?.colorTheme', mcqrc?.colorTheme)
		setColorTheme(
			getColor(mcqrc?.colorTheme as any) || 'var(--saki-default-color'
		)
		mcqrc?.colorTheme &&
			setColorThemeType(
				getColorType(mcqrc?.colorTheme || 'var(--saki-default-color)')
			)
	}, [mcqrc])
	// console.log('colorThemeType', colorTheme, colorThemeType)

	const verfiyNextButton = () => {
		// console.log('verfiyNextButton', carNumber, slogan, phone)

		setDisableComfirmButton(!carNumber || !slogan || !phone)

		setCarNumberErr(
			!carNumber
				? t('cannotBeEmpty', {
						ns: 'prompt',
				  })
				: ''
		)
		setSloganErr(
			!slogan
				? t('cannotBeEmpty', {
						ns: 'prompt',
				  })
				: ''
		)
		setPhoneErr(
			!phone
				? t('cannotBeEmpty', {
						ns: 'prompt',
				  })
				: phone.length === 0
				? t('phoneRuleErr', {
						ns: 'prompt',
				  })
				: ''
		)
	}

	return (
		<SakiModal
			onClose={() => {
				// setShowManageMyQRCModal(false)
				onClose()
			}}
			visible={visible}
			width='100%'
			height={config.deviceType === 'Mobile' ? '100%' : 'auto'}
			max-width={config.deviceType === 'Mobile' ? '100%' : '520px'}
			max-height={config.deviceType === 'Mobile' ? '100%' : '600px'}
			mask
			border-radius={config.deviceType === 'Mobile' ? '0px' : ''}
			border={config.deviceType === 'Mobile' ? 'none' : ''}
			mask-closable='false'
			background-color='#fff'
		>
			<SakiModalHeader
				closeIcon
				title={
					type === 'Create'
						? t('createMoveCarQRC', {})
						: t('updateMoveCarQRC', {})
				}
				ref={
					bindEvent({
						close() {
							onClose()
						},
					}) as any
				}
			></SakiModalHeader>
			<div className='edit-qrc-modal'>
				{mcqrc?.id ? (
					<>
						<SakiTitle margin='10px 0 6px 0' level={5} color='default'>
							{t('id')}
						</SakiTitle>
						<div
							style={{
								margin: '0 0 10px 0',
								color: '#666',
							}}
							className='eq-id'
						>
							{mcqrc?.id}
						</div>
					</>
				) : (
					''
				)}
				<SakiInput
					onChangevalue={(e) => {
						setPhone(e.detail)
					}}
					value={phone}
					height='50px'
					margin='0 0 10px 0'
					placeholder={t('typePhone')}
					error={phoneErr}
					type='Number'
					placeholderAnimation='MoveUp'
				></SakiInput>

				<SakiInput
					onChangevalue={(e) => {
						setCarNumber(e.detail)
					}}
					value={carNumber}
					height='50px'
					margin='0 0 10px 0'
					placeholder={t('typeCarNumber')}
					error={carNumberErr}
					type='Text'
					placeholderAnimation='MoveUp'
				></SakiInput>

				<SakiInput
					onChangevalue={(e) => {
						setSlogan(e.detail)
					}}
					value={slogan}
					height='50px'
					margin='0 0 10px 0'
					placeholder={t('typeSlogan')}
					error={sloganErr}
					type='Text'
					placeholderAnimation='MoveUp'
				></SakiInput>

				<SakiInput
					onChangevalue={(e) => {
						setEmail(e.detail)
					}}
					value={email}
					height='50px'
					margin='0 0 10px 0'
					placeholder={t('typeEmail')}
					error={emailErr}
					type='Text'
					placeholderAnimation='MoveUp'
				></SakiInput>

				<SakiInput
					onChangevalue={(e) => {
						setWechat(e.detail)
					}}
					value={wechat}
					height='50px'
					margin='0 0 10px 0'
					placeholder={t('typeWechat')}
					error={wechatErr}
					type='Text'
					placeholderAnimation='MoveUp'
				></SakiInput>
				<div className='eq-colorTheme'>
					<SakiTitle margin='10px 0 6px 0' level={5} color='default'>
						{t('colorTheme')}
					</SakiTitle>
					<div className='eq-c-main'>
						<saki-dropdown
							visible={openColorThemeDropdown}
							floating-direction='Left'
							z-index='1001'
							ref={bindEvent({
								close: (e) => {
									setOpenColorThemeDropdown(false)
								},
							})}
						>
							<saki-button
								ref={bindEvent({
									tap: async () => {
										setOpenColorThemeDropdown(true)
									},
								})}
								margin='0 0 0 0px'
								padding={'6px 10px'}
								font-size='14px'
								border='none'
							>
								{/* <span
									style={{
										color: colorTheme,
									}}
								>
									蓝色
								</span> */}
								<div
									style={{
										backgroundColor: colorTheme,
									}}
									className='eq-c-m-color'
								></div>
								<SakiIcon
									margin='0 0 0 6px'
									width='12px'
									color='#999'
									type='Bottom'
								></SakiIcon>
								{/* <div
									style={{
										backgroundColor: colorTheme,
									}}
									className='eq-c-m-color'
								></div> */}
							</saki-button>
							<div slot='main'>
								<saki-menu
									ref={bindEvent({
										selectvalue: async (e) => {
											setColorThemeType(e.detail.value)
											setColorTheme(getColor(e.detail.value as any))
											setOpenColorThemeDropdown(false)
										},
									})}
								>
									{['Default', 'Green', 'Blue'].map((v) => {
										return (
											<saki-menu-item
												key={v}
												active={colorThemeType === v}
												padding='10px 18px'
												value={v}
											>
												<span
													style={{
														color: getColor(v as any),
													}}
												>
													{t(v.toLowerCase())}
												</span>
											</saki-menu-item>
										)
									})}
								</saki-menu>
							</div>
						</saki-dropdown>
					</div>
				</div>
				<div className='eq-buttons'>
					<saki-button
						ref={bindEvent({
							tap: async () => {
								onClose()
							},
						})}
						margin='0 0 0 10px'
						padding='8px 18px'
						font-size='14px'
					>
						{t('cancel', {
							ns: 'prompt',
						})}
					</saki-button>

					<saki-button
						ref={bindEvent({
							tap: async () => {
								verfiyNextButton()

								onComfirm({
									id: mcqrc?.id,
									phone,
									carNumber,
									slogan,
									email,
									wechat,
									colorTheme: colorThemeType,
								})
							},
						})}
						margin='0 0 0 10px'
						padding='8px 18px'
						font-size='14px'
						type='Primary'
						disabled={disableComfirmButton}
					>
						{type === 'Create'
							? t('create', {
									ns: 'prompt',
							  })
							: t('update', {
									ns: 'prompt',
							  })}
					</saki-button>
				</div>
			</div>
		</SakiModal>
	)
}
const MoveCarPhonePage = () => {
	const { t, i18n } = useTranslation('moveCarQRCPage')

	const config = useSelector((state: RootState) => state.config)
	const user = useSelector((state: RootState) => state.user)

	const avatarCvs = useRef<HTMLCanvasElement>(null)
	const [mounted, setMounted] = useState(false)

	// const [avatarCvs, setAvatarCvs] = useState<HTMLCanvasElement | null>(null)

	const [inputPhone, setInputPhone] = useState('')
	const [phone, setPhone] = useState('none')
	const [inputPhoneErr, setInputPhoneErr] = useState('')
	const [url, setUrl] = useState('')

	const [showQRCModal, setShowQRCModal] = useState(false)
	const [showEditQRCModal, setShowEditQRCModal] = useState(false)

	const [showUploadAvatarDropdown, setShowUploadAvatarDropdown] =
		useState(false)
	const [showTextDropdown, setShowTextDropdown] = useState(false)

	const [loadStatus, setLoadStatus] = useState<'loading' | 'noMore' | 'loaded'>(
		'loaded'
	)
	const [pageNum, setPageNum] = useState(1)
	const [pageSize, setPageSize] = useState(15)
	const [moveCarQRCList, setMoveCarQRCList] = useState<
		protoRoot.moveCarQRC.IMoveCarQRCItem[]
	>([])

	const [qrc, setQRC] = useState('')

	const [selectMCQ, setSelectMCQ] =
		useState<protoRoot.moveCarQRC.IMoveCarQRCItem>()

	const [avatarCvsOptions, setAvatarCvsOptions] = useState({
		w: 400,
		h: 400,
		textTemplate: '',
		// font: {
		// 	text: '',
		// 	fontSize: 0,
		// 	fontFamily: '',
		// 	x: 0,
		// 	y: 0,
		// },
	})

	const router = useRouter()

	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => {
		setMounted(true)
		setInputPhone('')
		dispatch(configSlice.actions.setSsoAccount(true))
	}, [])

	useEffect(() => {
		console.log('router.', router)
		setPhone(String(router.query.p || ''))
	}, [router])

	useEffect(() => {
		if (qrc && showQRCModal) {
			setAvatarCvsOptions({
				...avatarCvsOptions,
				textTemplate: '',
			})
			initDefaultCvs()
		}
		if (!showQRCModal) {
			setQRC('')
		}
	}, [qrc, showQRCModal])

	useEffect(() => {
		if (user.isLogin && user.token) {
			getMoveCarQRCList()
		} else {
			setMoveCarQRCList([])
			setPageNum(1)
			setLoadStatus('loaded')
		}
	}, [user.isLogin, user.token])

	useEffect(() => {
		pageNum === 1 &&
			moveCarQRCList.length === 0 &&
			loadStatus === 'loaded' &&
			user.isLogin &&
			user.token &&
			getMoveCarQRCList()
	}, [pageNum, moveCarQRCList, loadStatus])

	useEffect(() => {
		dispatch(layoutSlice.actions.setLayoutHeaderLogoText(t('pageTitle')))
	}, [i18n.language])

	const generateQR = async (text: string) => {
		try {
			// avatarCvs &&
			// 	document.body.querySelector('.mcp-qrc')?.removeChild(avatarCvs)

			// const cvs = await QRCode.toCanvas(text, {
			// 	width: 200,
			// })
			// document.body.querySelector('.mcp-qrc')?.appendChild(cvs)

			// setAvatarCvs(cvs)
			// // avatarCvs.current =
			// setAvatarCvs(
			// 	await QRCode.toCanvas(text, {
			// 		width: 200,
			// 	})
			// )
			// document.body.appendChild(
			// 	await QRCode.toCanvas(text, {
			// 		width: 400,
			// 	})
			// )
			return await QRCode.toDataURL(text, {
				width: 400,
			})
		} catch (err) {
			console.error(err)
		}
	}

	const showQRCModalFunc = async (id: string) => {
		const url = location.origin + location.pathname + '/detail?id=' + id
		setUrl(url)
		console.log(url)
		setQRC(((await generateQR(url + '&scan=1')) as any) || '')
		console.log(qrc)
		setShowQRCModal(true)
	}

	const initDefaultCvs = () => {
		let cvs = avatarCvs.current
		if (!cvs) return

		let ctx = cvs.getContext('2d')
		let w = cvs.offsetWidth
		let h = cvs.offsetHeight
		// cvs.width = 400
		// cvs.height = 500

		let img = document.createElement('img')
		img.setAttribute('crossOrigin', 'anonymous')
		img.src = qrc
		// console.log(img)

		img.onload = () => {
			if (!ctx) return
			// console.log('onload', ctx, img)

			// drawRoundedRect(ctx, 0, 0, w, h, 14)
			console.log(w, h)
			console.log(cvs)
			ctx?.drawImage(img, -18, -18, 2 * w + 36, 2 * (h - 0) + 36)

			// ctx.font = '90px Georgia'
			// ctx.fillText('扫码挪车', 20, 470)
			// addAvatar()
		}
	}

	const addAvatar = (url: string) => {
		console.log('添加头像')
		let cvs = avatarCvs.current
		if (!cvs) return
		let ctx = cvs.getContext('2d')
		let w = cvs.offsetWidth
		let h = cvs.offsetHeight

		let badgeSize = 46
		let badgeBorderRadius: string = '2px'

		let bbr = (badgeSize * 2) / 2
		if (badgeBorderRadius !== '50%') {
			bbr = Number(badgeBorderRadius.replace('px', '')) * 2
		}

		let x = w - badgeSize
		let y = h - badgeSize
		console.log('bbr', bbr)

		let badgeBorderSize = 6

		let badgeBorderColor = '#fff'

		if (!ctx) return
		drawRoundedRectImage(
			ctx,
			url,
			x,
			y,
			badgeSize * 2,
			badgeSize * 2,
			bbr,
			badgeBorderSize * 2,
			badgeBorderColor
		)

		showSnackbar(
			t('avatarAddedSuccessfully', {
				ns: 'prompt',
			})
		)
	}

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

		console.log(
			'drawRoundedRectImage',
			x,
			y,
			width,
			height,
			radius,
			borderWidth,
			borderColor
		)
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

			console.log(ctx)
			ctx.restore()
		}
	}

	const getMoveCarQRCList = async () => {
		if (loadStatus === 'loading' || loadStatus === 'noMore') {
			return
		}
		setLoadStatus('loading')
		const res = await httpApi.MoveCarQRC.GetMoveCarQRCList({
			pageNum: pageNum,
			pageSize: pageSize,
			sort: 'CreateTimeDESC',
		})

		console.log('getMoveCarQRCList', res)
		if (res.code === 200) {
			setPageNum(pageNum + 1)

			res.data.list && setMoveCarQRCList(moveCarQRCList.concat(res.data.list))
			if (Number(res.data.total) < pageSize) {
				setLoadStatus('noMore')
				return
			}
			setLoadStatus('loaded')
		}
	}

	const [editQRC, setEditQRC] = useState<{
		type: 'Create' | 'Update'
		mcqrc?: {
			id?: string
			phone: string
			carNumber: string
			slogan: string
			email: string
			wechat: string
			colorTheme?: string
		}
	}>({
		type: 'Create',
		mcqrc: {
			phone: '',
			carNumber: '',
			slogan: '',
			email: '',
			wechat: '',
			colorTheme: '',
		},
	})

	const createAndUpdateMoveCarQRC = (
		type: 'Create' | 'Update',
		mcqrc?: {
			id?: string
			phone: string
			carNumber: string
			slogan: string
			email: string
			wechat: string
			colorTheme?: string
		}
	) => {
		if (!user.isLogin) {
			showSnackbar(t('createQRCAfterLogin'))
			return
		}

		setShowEditQRCModal(true)
		setEditQRC({
			type,
			mcqrc,
		})
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
			<div className='move-car-phone-qrc-page'>
				<div className='mcp-main'>
					<div className='mcp-m-title'>{t('pageTitle')}</div>
					<div className='mcp-m-subtitle'>{t('subtitle')}</div>

					{mounted && phone !== 'none' && (
						<>
							<SakiInput
								onChangevalue={(e) => {
									console.log(e)
									// setInputPhoneErr(
									// 	e.detail.length === 0
									// 		? t('phoneRuleErr', {
									// 				ns: 'prompt',
									// 		  })
									// 		: ''
									// )
									setInputPhone(e.detail)
								}}
								value={inputPhone}
								placeholder={t('indexInputPh')}
								error={inputPhoneErr}
								type='Number'
								width='100%'
								margin='40px 0 0'
								padding='28px 0px 14px'
								font-size='16px'
								// border='1px solid var(--primary-color)'
								// border-radius='10px'
								placeholderAnimation='MoveUp'
							></SakiInput>

							<div className='mcp-m-buttons'>
								<saki-button
									ref={bindEvent({
										tap: async () => {
											// console.log(user)
											window.open('https://link.aiiko.club/AXaJyi')
										},
									})}
									margin='0 0 0 10px'
									padding='8px 18px'
									font-size='14px'
									color='var(--saki-default-color)'
									border='1px solid var(--saki-default-color)'
								>
									{t('tutorial')}
								</saki-button>
								<saki-button
									ref={bindEvent({
										tap: async () => {
											createAndUpdateMoveCarQRC('Create', {
												phone: inputPhone,
												carNumber: '',
												slogan: '',
												email: '',
												wechat: '',
											})
										},
									})}
									margin='0 0 0 10px'
									padding='8px 18px'
									font-size='14px'
									type='Primary'
								>
									{t('generateQRC')}
								</saki-button>
							</div>

							{moveCarQRCList.length ? (
								<div className='mcp-m-history'>
									<saki-card
										title={t('history')}
										subtitle='1121'
										hide-subtitle='true'
									>
										{moveCarQRCList.map((v, i) => {
											return (
												<saki-card-item
													key={i}
													title={v.id}
													type='Flex'
													center-content='false'
													right-width='108px'
												>
													<div slot='left'>
														<div className='mcp-item-title text-two-elipsis'>
															<span>
																{hidePhone(v.phone || '') + ' · ' + v.carNumber}
															</span>
														</div>
														<div className='mcp-item-subtitle text-two-elipsis'>
															{/* <span>{v.id + ', '}</span> */}

															<div className='mcp-item-s-slogan'>
																<div
																	style={{
																		backgroundColor:
																			getColor(String(v.colorTheme) as any) ||
																			'',
																	}}
																	className='mcp-item-s-dot'
																></div>
																<span>{v.slogan + '，'}</span>
															</div>
															<span>
																{t('createdOn', {
																	time: moment(
																		Number(v.createTime) * 1000
																	).format('LL'),
																})}
															</span>
														</div>
													</div>
													<div slot='right'>
														<div className='mcp-item-right'>
															<saki-button
																ref={bindEvent({
																	async tap() {
																		showQRCModalFunc(v.id || '')
																	},
																})}
																bg-color='transparent'
																type='CircleIconGrayHover'
															>
																<SakiIcon type='QRCode'></SakiIcon>
															</saki-button>
															<saki-button
																ref={bindEvent({
																	tap() {
																		console.log('edit')
																		createAndUpdateMoveCarQRC('Update', {
																			id: v.id || '',
																			phone: v.phone || '',
																			carNumber: v.carNumber || '',
																			slogan: v.slogan || '',
																			email: v.email || '',
																			wechat: v.wechat || '',
																			colorTheme: v.colorTheme || '',
																		})
																		// reconnectDevice(v.roomId)
																		// copyText(v.roomId)
																		// snackbar({
																		// 	message: t('copySuccessfully', {
																		// 		ns: 'prompt',
																		// 	}),
																		// 	autoHideDuration: 2000,
																		// 	vertical: 'top',
																		// 	horizontal: 'center',
																		// 	backgroundColor: 'var(--primary-color)',
																		// 	color: '#fff',
																		// }).open()
																	},
																})}
																bg-color='transparent'
																type='CircleIconGrayHover'
															>
																<SakiIcon color='#999' type='Pen'></SakiIcon>
															</saki-button>
															<SakiButton
																onTap={() => {
																	setSelectMCQ(v)
																	dispatch(
																		layoutSlice.actions.setOpenStatisticsModal(
																			true
																		)
																	)
																}}
																bg-color='transparent'
																type='CircleIconGrayHover'
															>
																<SakiIcon
																	color='#999'
																	type='Statistics'
																></SakiIcon>
															</SakiButton>
															<saki-button
																ref={bindEvent({
																	async tap() {
																		console.log(v)

																		alert({
																			title: t('deleteThisMCQRC'),
																			content: t('deleteThisMCQRCContent'),
																			cancelText: t('cancel', {
																				ns: 'prompt',
																			}),
																			confirmText: t('delete', {
																				ns: 'prompt',
																			}),
																			async onConfirm() {
																				const res =
																					await httpApi.MoveCarQRC.DeleteMoveCarQRC(
																						v.id || ''
																					)

																				console.log('res', res)

																				if (res.code === 200) {
																					setMoveCarQRCList(
																						moveCarQRCList.filter((sv) => {
																							return v.id !== sv?.id
																						})
																					)
																					showSnackbar(
																						t('deleteSuccessfully', {
																							ns: 'prompt',
																						})
																					)
																				}
																			},
																		}).open()
																	},
																})}
																bg-color='transparent'
																type='CircleIconGrayHover'
															>
																<SakiIcon color='#333' type='Trash'></SakiIcon>
															</saki-button>
														</div>
													</div>
												</saki-card-item>
											)
										})}
									</saki-card>
									<SakiScrollLoading
										onTap={() => {
											getMoveCarQRCList()
										}}
										type={loadStatus}
										language={config.lang}
									></SakiScrollLoading>
								</div>
							) : (
								''
							)}
							<EditQRCModal
								visible={showEditQRCModal}
								type={editQRC.type}
								mcqrc={editQRC.mcqrc}
								onClose={() => {
									setShowEditQRCModal(false)
								}}
								onComfirm={async (mcqrc) => {
									console.log(mcqrc)

									if (editQRC.type === 'Create') {
										const res = await httpApi.MoveCarQRC.CreateMoveCarQRC({
											phone: mcqrc.phone,
											carNumber: mcqrc.carNumber,
											slogan: mcqrc.slogan,
											email: mcqrc.email,
											wechat: mcqrc.wechat,
											colorTheme: mcqrc.colorTheme,
										})

										console.log('CreateMoveCarQRC', res)
										if (res.code === 200) {
											setMoveCarQRCList([])
											setPageNum(1)
											setLoadStatus('loaded')
											showSnackbar(
												t('createSuccessfully', {
													ns: 'prompt',
												})
											)
											setShowEditQRCModal(false)

											showQRCModalFunc(res.data.moveCarQRC?.id || '')

											setInputPhone('')

											return
										}
									}
									if (editQRC.type === 'Update' && mcqrc?.id) {
										console.log('update')
										const res = await httpApi.MoveCarQRC.UpdateMoveCarQRC(
											mcqrc?.id,
											{
												phone: mcqrc.phone,
												carNumber: mcqrc.carNumber,
												slogan: mcqrc.slogan,
												email: mcqrc.email,
												wechat: mcqrc.wechat,
												colorTheme: mcqrc.colorTheme,
											}
										)
										console.log('UpdateMoveCarQRC', res)
										if (res.code === 200) {
											setMoveCarQRCList(
												moveCarQRCList.map((v) => {
													if (v.id === mcqrc?.id) {
														return {
															...v,
															...res.data.moveCarQRC,
														}
													}
													return v
												})
											)
											setPageNum(1)
											setLoadStatus('loaded')
											showSnackbar(
												t('updateSuccessfully', {
													ns: 'prompt',
												})
											)
											setShowEditQRCModal(false)
											return
										}
									}
								}}
							/>
							<SakiModal
								onClose={() => {
									setShowQRCModal(false)
								}}
								visible={showQRCModal}
								width='100%'
								height={config.deviceType === 'Mobile' ? '100%' : 'auto'}
								max-width={config.deviceType === 'Mobile' ? '100%' : '520px'}
								max-height={config.deviceType === 'Mobile' ? '100%' : '600px'}
								mask
								border-radius={config.deviceType === 'Mobile' ? '0px' : ''}
								border={config.deviceType === 'Mobile' ? 'none' : ''}
								mask-closable='false'
								background-color='#fff'
							>
								<SakiModalHeader
									closeIcon
									title={t('pageTitle')}
									ref={
										bindEvent({
											close() {
												setShowQRCModal(false)
											},
										}) as any
									}
								></SakiModalHeader>
								<div className='move-car-phone-qrc-modal'>
									<div className='mcp-qrc'>
										<div id='qrc'>
											<canvas
												style={
													// 	showQRCModal1
													{
														width: avatarCvsOptions.w / 2 + 'px',
														height: avatarCvsOptions.h / 2 + 'px',
													}
													// 		: {}
												}
												width={avatarCvsOptions.w}
												height={avatarCvsOptions.h}
												ref={avatarCvs}
												className='cvs'
											></canvas>
											{avatarCvsOptions?.textTemplate === 'Template1' ? (
												<div className={'qrc-text Template1 ' + config.lang}>
													{t('template1')}
												</div>
											) : (
												''
											)}
										</div>
										{/* <SakiImages
											width='200px'
											height='200px'
											margin='0 auto'
											src={qrc}
										></SakiImages> */}
									</div>
									<div className='mcp-buttons'>
										<saki-button
											ref={bindEvent({
												tap: async () => {
													copyText(url)
													console.log(url)
													showSnackbar(
														t('copySuccessfully', {
															ns: 'prompt',
														})
													)

													window.open(url)
												},
											})}
											margin='0 0 10px 10px'
											padding='8px 18px'
											font-size='14px'
										>
											{t('openUrl')}
										</saki-button>

										<saki-dropdown
											visible={showTextDropdown}
											floating-direction='Left'
											z-index='1001'
											ref={bindEvent({
												close: (e) => {
													setShowTextDropdown(false)
												},
											})}
										>
											<saki-button
												ref={bindEvent({
													tap: async () => {
														setShowTextDropdown(true)
													},
												})}
												margin='0 0 10px 10px'
												padding='8px 18px'
												font-size='14px'
												color='var(--saki-default-color)'
												border='1px solid var(--saki-default-color)'
											>
												{t('showText', {})}
											</saki-button>
											<div slot='main'>
												<saki-menu
													ref={bindEvent({
														selectvalue: async (e) => {
															console.log(e.detail.value)
															switch (e.detail.value) {
																case 'Template1':
																	setAvatarCvsOptions({
																		...avatarCvsOptions,
																		textTemplate: 'Template1',
																	})
																	break
																case 'UploadImages':
																	break

																default:
																	break
															}
															setShowTextDropdown(false)
														},
													})}
												>
													<saki-menu-item
														padding='10px 18px'
														value={'Template1'}
													>
														<SakiRow
															justifyContent='flex-start'
															alignItems='center'
														>
															<SakiCol>
																<span>{t('template1', {})}</span>
															</SakiCol>
														</SakiRow>
													</saki-menu-item>

													{/* <saki-menu-item
														padding='10px 18px'
														value={'Template1'}
													>
														<SakiRow
															justifyContent='flex-start'
															alignItems='center'
														>
															<SakiCol>
																<span>{t('自定义文字', {})}</span>
															</SakiCol>
														</SakiRow>
													</saki-menu-item> */}
												</saki-menu>
											</div>
										</saki-dropdown>
										<saki-dropdown
											visible={showUploadAvatarDropdown}
											floating-direction='Left'
											z-index='1001'
											ref={bindEvent({
												close: (e) => {
													setShowUploadAvatarDropdown(false)
												},
											})}
										>
											<saki-button
												ref={bindEvent({
													tap: async () => {
														setShowUploadAvatarDropdown(true)
													},
												})}
												margin='0 0 10px 10px'
												padding='8px 18px'
												font-size='14px'
												color='var(--saki-default-color)'
												border='1px solid var(--saki-default-color)'
											>
												{t('showAvatar', {})}
											</saki-button>
											<div slot='main'>
												<saki-menu
													ref={bindEvent({
														selectvalue: async (e) => {
															console.log(e.detail.value)
															switch (e.detail.value) {
																case 'UseAvatar':
																	addAvatar(user.userInfo.avatar)
																	break
																case 'UploadImages':
																	const ipt = document.createElement('input')
																	ipt.type = 'file'
																	ipt.accept = 'image/bmp,image/jpeg,image/png'
																	ipt.oninput = (e) => {
																		console.log(e)

																		const file = ipt?.files?.[0]

																		file &&
																			addAvatar(
																				window.URL.createObjectURL(file)
																			)
																	}
																	ipt.click()
																	break

																default:
																	break
															}
															setShowUploadAvatarDropdown(false)
														},
													})}
												>
													{user.userInfo.avatar ? (
														<saki-menu-item
															padding='10px 18px'
															value={'UseAvatar'}
														>
															<SakiRow
																justifyContent='flex-start'
																alignItems='center'
															>
																<SakiCol>
																	<span>{t('useAvatar', {})}</span>
																</SakiCol>
															</SakiRow>
														</saki-menu-item>
													) : (
														''
													)}
													<saki-menu-item
														padding='10px 18px'
														value={'UploadImages'}
													>
														<SakiRow
															justifyContent='flex-start'
															alignItems='center'
														>
															<SakiCol>
																<span>{t('uploadImages', {})}</span>
															</SakiCol>
														</SakiRow>
													</saki-menu-item>
												</saki-menu>
											</div>
										</saki-dropdown>
										<saki-button
											ref={bindEvent({
												tap: async () => {
													// const imgSrc = avatarCvs.current?.toDataURL(
													// 	'image/jpeg',
													// 	1
													// )
													// if (!imgSrc) return
													const qrcEl = document.body.querySelector('#qrc')
													const contentCvs = await html2canvas(qrcEl as any, {
														backgroundColor: 'white',
														useCORS: true,
														scale: 2,
														width: qrcEl?.clientWidth as any,
														height: qrcEl?.clientHeight as any,
														windowWidth: qrcEl?.clientHeight as any,
														windowHeight: qrcEl?.clientHeight as any,
													})
													const imgSrc = contentCvs.toDataURL('image/jpeg', 1)
													if (!imgSrc) return
													download(imgSrc, 'qrc.jpg')

													// console.log(
													// 	'contentCvs',
													// 	document.body.querySelector('#qrc'),
													// 	contentCvs
													// )
													// document.body
													// 	.querySelector('.move-car-phone-qrc-modal')
													// 	?.appendChild(contentCvs)

													showSnackbar(
														t('downloadSuccessfully', {
															ns: 'prompt',
														})
													)
												},
											})}
											margin='0 0 10px 10px'
											padding='8px 18px'
											font-size='14px'
											type='Primary'
										>
											{t('downloadQRC', {})}
										</saki-button>
									</div>
								</div>
							</SakiModal>

							<StatisticsComponent
								statisticsData={selectMCQ?.statistics || undefined}
							></StatisticsComponent>
						</>
					)}

					{mounted && (
						<SakiColor
							ref={(e: any) => {
								e?.changeAppearance?.()
							}}
							appearance={'Pink'}
						></SakiColor>
					)}
				</div>
			</div>
		</>
	)
}

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
MoveCarPhonePage.getLayout = getLayout

export default MoveCarPhonePage
