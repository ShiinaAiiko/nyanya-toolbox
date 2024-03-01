import Head from 'next/head'
import ToolboxLayout, { getLayout } from '../../../layouts/Toolbox'
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
} from '../../../store'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
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
} from '../../../plugins/methods'
import {
	changeLanguage,
	languages,
	defaultLanguage,
} from '../../../plugins/i18n/i18n'
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
} from '../../../components/saki-ui-react/components'

import httpApi from '../../../plugins/http/api'

import QRCode from 'qrcode'
import { protoRoot } from '../../../protos'
import moment from 'moment'

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
const MoveCarPhoneDetailPage = () => {
	const { t, i18n } = useTranslation('moveCarQRCPage')

	const config = useSelector((state: RootState) => state.config)
	const user = useSelector((state: RootState) => state.user)

	const avatarCvs = useRef<HTMLCanvasElement>(null)
	const [mounted, setMounted] = useState(false)

	// const [avatarCvs, setAvatarCvs] = useState<HTMLCanvasElement | null>(null)

	const [inputPhone, setInputPhone] = useState('')
	const [id, setId] = useState('')
	const [detail, setDetail] = useState<protoRoot.moveCarQRC.IMoveCarQRCItem>()
	const [sendingEmail, setSendingEmail] = useState(false)
	const [showManageMyQRCModal, setShowManageMyQRCModal] = useState(false)
	const [showUploadAvatarDropdown, setShowUploadAvatarDropdown] =
		useState(false)
	const [showQRCModal1, setShowQRCModal1] = useState(false)

	const [qrc, setQRC] = useState('')
	const [passwordInclude, setPasswordInclude] = useState<
		('Number' | 'Character')[]
	>(['Number'])

	const router = useRouter()

	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		setId(String(router.query.id || ''))
	}, [router])

	useEffect(() => {
		id && getMoveCarQRC()
	}, [id])

	useEffect(() => {
		dispatch(layoutSlice.actions.setLayoutHeaderLogoText(t('pageTitle')))
	}, [i18n.language])

	const [color, setColor] = useState('#04aa86')
	const [hoverColor, setHoverColor] = useState('#048b6e')
	const [activeColor, setActiveColor] = useState('#037159')

	// let color = '#04aa86'
	// let hoverColor = '#048b6e'
	// let activeColor = '#037159'
	// let color = '#1c6dfc'
	// let hoverColor = '#1b64e2'
	// let activeColor = '#1656c3'

	const getMoveCarQRC = async () => {
		const res = await httpApi.MoveCarQRC.GetMoveCarQRC(id)

		console.log('getMoveCarQRC', res)
		// console.log(moment(Number(res.data.moveCarQRC?.createTime || 0) * 1000))
		if (res.code === 200 && res.data.moveCarQRC) {
			setDetail(res.data.moveCarQRC)

			if (res.data.moveCarQRC.colorTheme) {
				switch (res.data.moveCarQRC.colorTheme) {
					case 'Default':
						setColor('#f29cb2')
						setHoverColor('#f185a0')
						setActiveColor('#ce5d79')
						break
					case 'Green':
						setColor('#04aa86')
						setHoverColor('#048b6e')
						setActiveColor('#037159')
						break
					case 'Blue':
						setColor('#1c6dfc')
						setHoverColor('#1b64e2')
						setActiveColor('#1656c3')
						break

					default:
						break
				}
			}
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
			</Head>
			<div className='move-car-phone-qrc-detail-page'>
				<div className='mcp-main'>
					{mounted && (
						<>
							<SakiColor
								ref={(e: any) => {
									e?.changeAppearance()
								}}
								// appearance={config.appearance}
								defaultColor={color}
								defaultHoverColor={color}
								defaultActiveColor={color}
								defaultBorderColor={color}
							></SakiColor>
							{detail?.id ? (
								<>
									<div className='mcp-m-title'>{detail?.carNumber}</div>
									<div className='mcp-m-subtitle'>{detail?.slogan}</div>
									<div className='mcp-m-buttons'>
										<SakiButton
											onTap={() => {
												alert({
													title: t('callCarOwner'),
													content: t('callCarOwnerContent'),
													cancelText: t('cancel', {
														ns: 'prompt',
													}),
													confirmText: t('call', {
														ns: 'prompt',
													}),
													async onConfirm() {
														const link = document.createElement('a')
														link.href = 'tel:' + detail.phone

														link.click()
													},
												}).open()
											}}
											margin='0 0 12px 0'
											padding='10px 0px'
											font-size='16px'
											// type='Primary'
											color='#fff'
											border={'1px solid ' + color}
											bgColor={color}
											bgHoverColor={hoverColor}
											bgActiveColor={activeColor}
										>
											<div className='button-content'>
												<SakiIcon
													color='#fff'
													margin='0 5px 0 0'
													type='Call'
												></SakiIcon>
												<div className='button-text'>
													<span>{t('callCarOwner')}</span>
												</div>
											</div>
										</SakiButton>
										{detail?.email ? (
											<SakiButton
												onTap={() => {
													alert({
														title: t('sendEmail'),
														content: t('sendEmailContent'),
														cancelText: t('cancel', {
															ns: 'prompt',
														}),
														confirmText: t('send', {
															ns: 'prompt',
														}),
														async onConfirm() {
															if (sendingEmail) return
															console.log('发送')
															setSendingEmail(true)

															const res = await httpApi.MoveCarQRC.SendEmail(
																detail?.id || ''
															)
															console.log(res)
															if (res?.code === 200) {
																showSnackbar(
																	t('sendSuccessfully', {
																		ns: 'prompt',
																	})
																)
																setSendingEmail(false)
															}
														},
													}).open()
												}}
												margin='0 0 12px 0'
												padding='10px 0px'
												font-size='16px'
												// type='Primary'
												color='#ea4335'
												border={'1px solid #ea4335'}
												bgColor={'#fff'}
												bgHoverColor={'#f3f2f2'}
												bgActiveColor={'#eee'}
												loading={sendingEmail}
											>
												<div className='button-content'>
													<SakiIcon
														color='#ea4335'
														margin='0 5px 0 0'
														type='Email'
													></SakiIcon>
													<div className='button-text'>
														<span>{t('sendEmail')}</span>
													</div>
												</div>
											</SakiButton>
										) : (
											''
										)}
										{detail?.wechat ? (
											<SakiButton
												onTap={() => {
													alert({
														title: t('addWechatId'),
														content: t('addWechatIdContent'),
														cancelText: t('cancel', {
															ns: 'prompt',
														}),
														confirmText: t('confirm', {
															ns: 'prompt',
														}),
														async onConfirm() {
															copyText(detail?.wechat || '')

															alert({
																title: t('copyWechat', {
																	ns: 'prompt',
																}),
																content: t('copyWechatSuccessfully', {
																	ns: 'prompt',
																}),
																cancelText: t('cancel', {
																	ns: 'prompt',
																}),
															}).open()
														},
													}).open()
												}}
												margin='0 0 12px 0'
												padding='10px 0px'
												font-size='16px'
												// type='Primary'
												color='#07c160'
												border={'1px solid #07c160'}
												bgColor={'#fff'}
												bgHoverColor={'#f3f2f2'}
												bgActiveColor={'#eee'}
											>
												<div className='button-content'>
													<SakiIcon
														color='#07c160'
														margin='0 5px 0 0'
														type='WeChatFill'
													></SakiIcon>
													<div className='button-text'>
														<span>{t('addWechatId')}</span>
													</div>
												</div>
											</SakiButton>
										) : (
											''
										)}
										<SakiButton
											onTap={() => {
												// console.log(router, config.language)
												router.push(
													`/${
														config.language === 'system' ? '' : config.lang
													}/moveCarQRC`
												)
											}}
											margin='0 0 12px 0'
											padding='10px 0px'
											font-size='16px'
											color={color}
											border={'1px solid ' + color}
											// border='1px solid none'
											// bgColor='transparent'
											// bgActiveColor='transparent'
											// bgHoverColor='transparent'
										>
											<div className='button-content'>
												<SakiIcon
													color={color}
													margin='0 5px 0 0'
													type='QRCode'
												></SakiIcon>
												<div className='button-text'>
													<span>{t('getFreeQRC', {})}</span>
												</div>
											</div>
										</SakiButton>
										<span
											style={{
												margin: '20px 0 10px 0',
												color: '#999',
											}}
										>
											{/* This QR code has served the car owner for 3 days */}
											{t('usageDays', {
												day: moment().diff(
													moment(Number(detail?.createTime || 0) * 1000),
													'day'
												),
											})}
										</span>
									</div>
								</>
							) : (
								<div className='mcp-m-none'>
									<span>
										{t('404', {
											ns: 'common',
										})}
									</span>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</>
	)
}
MoveCarPhoneDetailPage.getLayout = getLayout

export default MoveCarPhoneDetailPage
