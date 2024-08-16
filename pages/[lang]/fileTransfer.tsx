import Head from 'next/head'
import ToolboxLayout, { getLayout } from '../../layouts/Toolbox'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import store, {
	RootState,
	AppDispatch,
	layoutSlice,
	useAppDispatch,
	methods,
	apiSlice,
	userSlice,
	configSlice,
} from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
	bindEvent,
	snackbar,
	progressBar,
	prompt,
	alert,
	multiplePrompts,
} from '@saki-ui/core'
import { byteConvert, Debounce, deepCopy, QueueLoop } from '@nyanyajs/utils'
import {
	getRegExp,
	copyText,
	getRandomPassword,
	download,
	emojiToText,
	emojiToImg,
	developing,
	showSnackbar,
} from '../../plugins/methods'
import {
	SakiAvatar,
	SakiButton,
	SakiChatMessageContainer,
	SakiChatMessageHeader,
	SakiChatSelect,
	SakiCol,
	SakiDropdown,
	SakiIcon,
	SakiImages,
	SakiMenu,
	SakiRow,
	SakiTabs,
} from '../../components/saki-ui-react/components'
import nsocketioAPI from '../../plugins/socketio/api'
import httpAPI from '../../plugins/http/api'
import { nsocketioMethods, nsocketioSlice } from '../../store/nsocketio'
import {
	clientId,
	nwebrtc,
	webRTCMethods,
	webRTCSlice,
} from '../../store/webRTC'
import {
	fileTransferMethods,
	fileTransferSlice,
} from '../../store/fileTransfer'
import { storage } from '../../store/storage'
import moment from 'moment'
import { emojiMethods, emojiSlice } from '../../store/emoji'
import {
	changeLanguage,
	languages,
	defaultLanguage,
} from '../../plugins/i18n/i18n'

const FileTransferPage = (props: any) => {
	const { t, i18n } = useTranslation('fileTransferPage')
	const [mounted, setMounted] = useState(false)
	const [d] = useState(new Debounce())
	const api = useSelector((state: RootState) => state.api)
	const config = useSelector((state: RootState) => state.config)
	const nsocketio = useSelector((state: RootState) => state.nsocketio)
	const fileTransfer = useSelector((state: RootState) => state.fileTransfer)
	const webRTC = useSelector((state: RootState) => state.webRTC)
	const emoji = useSelector((state: RootState) => state.emoji)
	const user = useSelector((state: RootState) => state.user)

	const richtextEl = useRef<any>()

	const bubbleContextMenuEl = useRef<any>()
	const [bubbleContextMenuIndex, setBubbleContextMenuIndex] = useState(-1)
	const emojiContextMenuEl = useRef<any>()
	const [emojiContextMenuElIndex, setEmojiContextMenuElIndex] = useState({
		type: '',
		index: -1,
	})
	const [inputbarToolDorpdown, setInputbarToolDorpdown] = useState(false)

	const [fileTypes] = useState(['Image', 'Video', 'File'])

	const [sendFileDorpdown, setSendFileDorpdown] = useState(false)

	const [messageRichText, setMessageRichText] = useState('')
	const [message, setMessage] = useState('')
	const [inputTextMessage, setInputTextMessage] = useState(true)

	const [openDeviceListDropdown, setOpenDeviceListDropdown] = useState(false)
	const [messageHeaderMoreDorpdown, setMessageHeaderMoreDorpdown] =
		useState(false)
	const [openEmojiDropdown, setOpenEmojiDropdown] = useState(false)
	const [selectMessageCMIndex, setSelectMessageCMIndex] = useState(-1)

	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => {
		setMounted(true)

		const init = async () => {
			const roomHistory = await storage.global.get('roomHistory')
			console.log('roomHistory', roomHistory)
			dispatch(fileTransferSlice.actions.setRoomHistory(roomHistory || []))

			dispatch(configSlice.actions.setSsoAccount(true))

			dispatch(emojiMethods.init())
		}
		init()
		// setShareCode('E599233')
		// createRoom()
	}, [])
	useEffect(() => {
		dispatch(
			layoutSlice.actions.setLayoutHeaderLogoText(
				t('pageTitle', {
					ns: 'fileTransferPage',
				})
			)
		)
	}, [i18n.language])

	useEffect(() => {
		if (fileTransfer.shareCode) {
			dispatch(nsocketioMethods.init())
		}
	}, [fileTransfer.shareCode])

	useEffect(() => {
		if (nsocketio.status === 'success' && fileTransfer.shareCode) {
			joinRoom(fileTransfer.shareCode)
		}
	}, [nsocketio.status, fileTransfer.shareCode])

	useEffect(() => {
		fileTransfer.devices.length >= 2 &&
			d.increase(() => {
				const { fileTransfer } = store.getState()
				if (fileTransfer.status !== 'noMore') {
					if (fileTransfer.tcpConnection) {
						showSnackbar('TCP connection failed, please check the network')
						return
					}
					// joinRoom(fileTransfer.shareCode)
					showSnackbar('NWebRTC connection failed, using TCP reconnection.')
					fileTransfer.shareCode && usingTcpConnection(fileTransfer.shareCode)
					return
				}
				console.log('NWebRTC连接成功')
			}, 2000)
	}, [fileTransfer.status, fileTransfer.devices, fileTransfer.tcpConnection])

	const sendFile = async (type: string) => {
		console.log('sendFile ', type)
		dispatch(
			fileTransferMethods.sendFile({ type, roomId: fileTransfer.shareCode })
		)

		// // 发送给目标用户
		// webRTC.dataChannelAPI
		// 	.to({
		// 		clientId,
		// 		// clientId: webRTC.client?.clientInfo.clientId,
		// 	})
		// 	.emit('message', type + 'temp')
		// console.log(webRTC.client?.roomClients, clientId)
		// webRTC.dataChannelAPI.emit('message', type)
	}

	const joinRoom = async (shareCode: string) => {
		const res = await nsocketioAPI.FileTransfer.JoinRoom(shareCode)
		console.log('joinRoom res', res)
		if (res?.code === 200) {
			dispatch(
				fileTransferSlice.actions.setRoomHistory(
					fileTransfer.roomHistory.map((v) => {
						if (v.roomId === shareCode) {
							return {
								...v,
								lastConnectTime: Math.floor(new Date().getTime() / 1000),
							}
						}
						return v
					})
				)
			)

			// 连接WebRTC
			await dispatch(
				fileTransferMethods.connect({
					roomId: shareCode,
				})
			)
			// dispatch(
			// 	webRTCMethods.connect({
			// 		roomId: shareCode,
			// 	})
			// )
		}
	}

	const usingTcpConnection = async (roomId: string) => {
		await dispatch(
			fileTransferMethods.disconnect({
				roomId,
			})
		)

		dispatch(fileTransferSlice.actions.setTcpConnection(true))

		await reconnectDevice(roomId, true)
	}

	const inputRoomInfo = (
		type: 'New' | 'Update',
		f: (name: string) => Promise<void>
	) => {
		let name = ''
		let avatar = ''

		const mp1 = multiplePrompts({
			title: t(type === 'New' ? 'newRoom' : 'updateRoomInfo'),
			multipleInputs: [
				{
					label: 'name',
					value: name,
					placeholder: t('inputName'),
					type: 'Text',
					onChange(value) {
						name = value.trim()
						mp1.setButton({
							label: 'Next',
							type: 'disabled',
							v: !name,
						})
						if (!value) {
							mp1.setInput({
								label: 'name',
								type: 'error',
								v: t('cannotBeEmpty', {
									ns: 'prompt',
								}),
							})
							return
						}

						mp1.setInput({
							label: 'name',
							type: 'error',
							v: '',
						})
						return
					},
				},
			],
			closeIcon: true,
			flexButton: true,
			buttons: [
				{
					label: 'cancel',
					text: t('cancel', {
						ns: 'prompt',
					}),
					type: 'Normal',
					async onTap() {
						mp1.close()
					},
				},
				{
					label: 'Next',
					text: t('next', {
						ns: 'prompt',
					}),
					type: 'Primary',
					disabled: true,
					async onTap() {
						mp1.setButton({
							label: 'Next',
							type: 'disabled',
							v: !name,
						})
						if (!name) {
							mp1.setInput({
								label: 'name',
								type: 'error',
								v: t('cannotBeEmpty', {
									ns: 'prompt',
								}),
							})
							return
						}
						mp1.setButton({
							label: 'Next',
							type: 'loading',
							v: true,
						})
						mp1.setButton({
							label: 'Next',
							type: 'disable',
							v: true,
						})

						f(name)
						mp1.setButton({
							label: 'Next',
							type: 'disable',
							v: false,
						})
						mp1.setButton({
							label: 'Next',
							type: 'loading',
							v: false,
						})

						mp1.close()
					},
				},
			],
		})
		mp1.open()
	}

	const createRoom = async () => {
		if (!user.isLogin) {
			showSnackbar(
				t('nextStepAfterLogin', {
					ns: 'prompt',
				})
			)
			dispatch(layoutSlice.actions.setOpenLoginModal(true))
			return
		}
		console.log('createRoom')

		inputRoomInfo('New', async (name) => {
			console.log('创建房间', name)

			const res = await httpAPI.FileTransfer.GetShareCode(user.deviceId)
			console.log('createRoom res', res)

			if (res?.data?.shareCode) {
				prompt({
					title: t('copyShareCode'),
					value: res?.data?.shareCode,
					placeholder: t('copyShareCodePlaceholder'),
					confirmText: t('copy', {
						ns: 'prompt',
					}),
					onConfirm() {
						copyText(res?.data?.shareCode || '')

						snackbar({
							message: t('copySuccessfully', {
								ns: 'prompt',
							}),
							autoHideDuration: 2000,
							vertical: 'top',
							horizontal: 'center',
							backgroundColor: 'var(--saki-default-color)',
							color: '#fff',
						}).open()
					},
				}).open()
				// dispatch(nsocketioSlice.actions.setToken(res?.data?.token))
				// dispatch(userSlice.actions.setDeviceId(res?.data?.deviceId || ''))
				dispatch(
					webRTCSlice.actions.setWebrtcOptions({
						...webRTC.webrtcOptions,
						sfuUser: res.data.sfuUser || '',
						sfuPassword: res.data.sfuPassword || '',
						options: {
							...webRTC.webrtcOptions.options,
							iceServers: [deepCopy(res.data.turnServer)],
						},
					})
				)
				dispatch(
					fileTransferSlice.actions.setRoomInfo({
						name,
						id: res?.data?.shareCode,
						avatar: '',
						authorId: user.userInfo?.uid || '',
						lastUpdateTime: Math.floor(new Date().getTime() / 1000),
					})
				)

				dispatch(fileTransferSlice.actions.setShareCode(res?.data?.shareCode))

				// 然后开始进入并创建房间
				return
			}
			snackbar({
				message: res.error || res.msg,
				autoHideDuration: 2000,
				vertical: 'top',
				horizontal: 'center',
			}).open()
		})
	}

	const connectDevice = async () => {
		if (!user.isLogin) {
			showSnackbar(
				t('nextStepAfterLogin', {
					ns: 'prompt',
				})
			)
			dispatch(layoutSlice.actions.setOpenLoginModal(true))
			return
		}
		let val = ''
		const p = prompt({
			title: t('connectOtherDevice'),
			value: val,
			placeholder: t('connectOtherDeviceContentPlaceholder'),
			confirmText: t('connect'),
			cancelText: t('cancel', {
				ns: 'prompt',
			}),
			onChange(value) {
				val = value
				if (!val) {
					return '分享码不能为空'
				}
				return ''
			},
			async onConfirm() {
				if (!val) {
					snackbar({
						message: '分享码不能为空',
						autoHideDuration: 2000,
						vertical: 'top',
						horizontal: 'center',
						backgroundColor: 'var(--saki-default-color)',
						color: '#fff',
					}).open()
					return
				}
				console.log(val)
				// 通过shareCode获取token

				const res = await httpAPI.FileTransfer.ConnectFTRoom(val)
				console.log('createRoom res', res)

				if (res?.data?.sfuUser) {
					// dispatch(nsocketioSlice.actions.setToken(res?.data?.token))
					// dispatch(userSlice.actions.setDeviceId(res?.data?.deviceId || ''))

					dispatch(fileTransferSlice.actions.setShareCode(val))
					dispatch(
						webRTCSlice.actions.setWebrtcOptions({
							...webRTC.webrtcOptions,
							sfuUser: res.data.sfuUser || '',
							sfuPassword: res.data.sfuPassword || '',
							options: {
								...webRTC.webrtcOptions.options,
								iceServers: [deepCopy(res.data.turnServer)],
							},
						})
					)

					// 然后开始进入并创建房间
					return
				}
				snackbar({
					message: res.error || res.msg,
					autoHideDuration: 2000,
					vertical: 'top',
					horizontal: 'center',
				}).open()
			},
		})
		p.open()
	}

	const reconnectDevice = async (roomId: string, tcp: boolean) => {
		const res = await httpAPI.FileTransfer.ConnectFTRoom(roomId)
		console.log('createRoom res', res, tcp)

		if (res?.data?.sfuUser) {
			// dispatch(nsocketioSlice.actions.setToken(res?.data?.token))
			// dispatch(userSlice.actions.setDeviceId(res?.data?.deviceId || ''))

			dispatch(fileTransferSlice.actions.setShareCode(roomId))
			if (tcp && res.data.turnServer?.urls?.length) {
				res.data.turnServer.urls = res.data.turnServer?.urls.map((v) => {
					if (v.indexOf('transport=tcp') >= 0) {
						return v
					}
					return v + '?transport=tcp'
				})
			}
			dispatch(
				webRTCSlice.actions.setWebrtcOptions({
					...webRTC.webrtcOptions,
					sfuUser: res.data.sfuUser || '',
					sfuPassword: res.data.sfuPassword || '',
					options: {
						...webRTC.webrtcOptions.options,
						iceServers: [deepCopy(res.data.turnServer)],
					},
				})
			)

			// 然后开始进入并创建房间
			return
		}
		snackbar({
			message: res.error || res.msg,
			autoHideDuration: 2000,
			vertical: 'top',
			horizontal: 'center',
		}).open()
	}

	const sendMessage = () => {
		console.log(messageRichText)

		dispatch(
			fileTransferMethods.sendMessage({
				message: messageRichText,
				roomId: fileTransfer.shareCode,
			})
		)
		setMessage('')
		setMessageRichText('')
		richtextEl.current?.setValue('')
	}

	return (
		<>
			<Head>
				<title>
					{t('pageTitle', {
						ns: 'fileTransferPage',
					}) +
						' - ' +
						t('appTitle', {
							ns: 'common',
						})}
				</title>
				<meta name='description' content={t('subtitle')} />
			</Head>
			<div className='file-transfer-page'>
				{!fileTransfer.shareCode ? (
					<>
						<div className='ft-m-title'>
							{t('pageTitle', {
								ns: 'fileTransferPage',
							})}
						</div>
						<div className='ft-m-subtitle'>
							{t('subtitle', {
								ns: 'fileTransferPage',
							})}
						</div>
					</>
				) : (
					''
				)}
				<div className='ft-main'>
					{mounted && (
						<>
							{!fileTransfer.shareCode ? (
								<div className='ft-m-new-token'>
									<SakiButton
										onTap={() => {
											createRoom()
										}}
										width='220px'
										type='Primary'
										padding='12px 10px'
										margin='0 0 10px 0'
										fontSize='18px'
									>
										{t('start')}
									</SakiButton>
									<SakiButton
										onTap={() => {
											connectDevice()
										}}
										width='220px'
										type='Normal'
										padding='12px 10px'
										margin='0 0 10px 0'
										color='var(--saki-default-color)'
										border='1px solid var(--saki-default-color)'
										fontSize='18px'
									>
										{t('connectOtherDevice')}
									</SakiButton>

									{fileTransfer.roomHistory.length ? (
										<saki-card
											title={t('history', {
												ns: 'fileTransferPage',
											})}
											subtitle='1121'
											hide-subtitle='true'
										>
											{fileTransfer.roomHistory.map((v, i) => {
												const roomInfo = storage.fileTransferRoom.getSync(
													v.roomId
												)
												return (
													<saki-card-item
														key={i}
														type='Flex'
														center-content='false'
														right-width='50px'
													>
														<div slot='left'>
															<div className='su-m-history-item-l-title text-elipsis'>
																{roomInfo?.name || v.roomId}
															</div>
															<div className='su-m-history-item-l-subtitle text-elipsis'>
																{v.roomId +
																	', 上次连接 ' +
																	moment(v.lastConnectTime * 1000).format(
																		'YYYY-MM-DD HH:mm:ss'
																	)}
															</div>
														</div>
														<div slot='right'>
															<div className='su-m-history-item-right'>
																<saki-button
																	ref={bindEvent({
																		tap() {
																			reconnectDevice(v.roomId, false)
																			copyText(v.roomId)
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
																	bg-color='transparent'
																	type='CircleIconGrayHover'
																>
																	<SakiIcon type='Link'></SakiIcon>
																</saki-button>
																<saki-button
																	ref={bindEvent({
																		async tap() {
																			console.log(v)
																			dispatch(
																				fileTransferSlice.actions.setRoomHistory(
																					fileTransfer.roomHistory.filter(
																						(sv) => {
																							return sv.roomId !== v.roomId
																						}
																					)
																				)
																			)
																			// await storage.shortUrlHistory.delete(
																			// 	v.shortId
																			// )
																			// getHistory()
																		},
																	})}
																	bg-color='transparent'
																	type='CircleIconGrayHover'
																>
																	<SakiIcon type='Trash'></SakiIcon>
																</saki-button>
															</div>
														</div>
													</saki-card-item>
												)
											})}
										</saki-card>
									) : (
										''
									)}
								</div>
							) : (
								<div className='ft-m-container'>
									<SakiChatMessageContainer visible={true} full>
										<div className='ft-m-c-header' slot='message-header'>
											{/* visible: {visible},{type},{index},{id},{roomId} */}
											<SakiChatMessageHeader
												onClickinfo={() => {
													console.log('clickinfo')
												}}
												onBack={() => {
													alert({
														title: t('disconnect', {
															ns: 'prompt',
														}),
														content: t('disconnectContent', {
															ns: 'prompt',
														}),
														cancelText: t('cancel', {
															ns: 'prompt',
														}),
														confirmText: t('disconnect', {
															ns: 'prompt',
														}),
														onConfirm() {
															dispatch(
																fileTransferMethods.disconnect({
																	roomId: fileTransfer.shareCode,
																})
															)
														},
													}).open()
													// dispatch(methods.messages.setActiveRoomIndex(-1))
												}}
												backIcon={true}
												avatar-text={'FT'}
												avatar={''}
												nickname={
													fileTransfer.roomInfo?.name ||
													t('pageTitle', {
														ns: 'fileTransferPage',
													})
												}
												desc={t('connectedDevicesDesc', {
													ns: 'fileTransferPage',
													count: fileTransfer.devices.length,
												})}
											>
												<div slot='header-right'>
													<saki-row>
														<saki-col>
															<saki-button
																ref={bindEvent({
																	tap: async () => {
																		const res =
																			await nsocketioAPI.FileTransfer.IncreaseFTRoomTimeLimit(
																				fileTransfer.shareCode
																			)

																		console.log('copy', res)
																		if (res?.code === 200) {
																			copyText(fileTransfer.shareCode)
																		}

																		snackbar({
																			message: t('copySuccessfully', {
																				ns: 'prompt',
																			}),
																			autoHideDuration: 2000,
																			vertical: 'top',
																			horizontal: 'center',
																			backgroundColor:
																				'var(--saki-default-color)',
																			color: '#fff',
																		}).open()
																	},
																})}
																width='40px'
																height='40px'
																type='CircleIconGrayHover'
															>
																<SakiIcon
																	type={'ShareFill'}
																	width='20px'
																	height='20px'
																	color='#777'
																/>
															</saki-button>
														</saki-col>
														{/* <saki-col>
														<saki-button
															ref={bindEvent({
																tap: () => {},
															})}
															width='40px'
															height='40px'
															type='CircleIconGrayHover'
														>
															<saki-icon
																type='ScreeShareFill'
																width='20px'
																height='20px'
																color='#777'
															/>
														</saki-button>
													</saki-col> */}
														<saki-col>
															<saki-dropdown
																ref={bindEvent({
																	close: () => {
																		setOpenDeviceListDropdown(false)
																	},
																})}
																visible={openDeviceListDropdown}
															>
																<saki-button
																	ref={bindEvent({
																		tap: () => {
																			// sendMessage()
																			setOpenDeviceListDropdown(true)
																		},
																	})}
																	width='40px'
																	height='40px'
																	type='CircleIconGrayHover'
																>
																	<saki-icon
																		type='DeviceList'
																		width='20px'
																		height='20px'
																		color='#777'
																	/>
																</saki-button>
																<div
																	className='message-header-device-list'
																	slot='main'
																>
																	<SakiMenu
																		width={
																			(config.deviceWH.w - 20 > 350
																				? 350
																				: config.deviceWH.w - 20) + 'px'
																		}
																		onSelectvalue={(e) => {
																			switch (e.detail.value) {
																				case 'ClosePage':
																					break
																				case 'Delete':
																					break
																				case 'Info':
																					break

																				default:
																					break
																			}
																			setOpenDeviceListDropdown(false)
																		}}
																	>
																		{fileTransfer.devices.map((v, i) => {
																			const lUser = user.tempUsers[v.deviceId]

																			// console.log('lUser1', lUser)
																			return (
																				<saki-menu-item
																					key={i}
																					padding='8px 4px 8px 14px'
																					value='ID'
																				>
																					<div className='m-h-dl-item'>
																						<div className='item-left'>
																							<SakiRow alignItems='center'>
																								<SakiCol>
																									<SakiAvatar
																										width='30px'
																										height='30px'
																										margin='0 10px 0 0'
																										border-radius='50%'
																										nickname={
																											lUser?.nickname || ''
																										}
																										src={lUser?.avatar || ''}
																									/>
																								</SakiCol>
																								<SakiCol>
																									<SakiRow flexDirection='column'>
																										<SakiCol alignItems='center'>
																											<div className='i-l-title text-elipsis'>
																												{lUser?.nickname}
																											</div>
																										</SakiCol>
																										<SakiCol alignItems='center'>
																											<SakiRow alignItems='center'>
																												<SakiCol alignItems='center'>
																													{v.connectType !==
																													'Local' ? (
																														<div className='i-l-tag'>
																															{t(
																																v.connectType,
																																{
																																	ns: 'fileTransferPage',
																																}
																															)}
																														</div>
																													) : (
																														''
																													)}
																												</SakiCol>
																												<SakiCol alignItems='center'>
																													<div className='i-l-subtitle text-elipsis'>
																														{lUser?.userAgent
																															.deviceName +
																															', ' +
																															// lUser?.userAgent
																															// 	.browser.name +
																															// ' ' +
																															// lUser?.userAgent
																															// 	.browser.major +
																															// ', ' +
																															lUser?.userAgent
																																.os.name +
																															' ' +
																															lUser?.userAgent
																																.os.version}
																													</div>
																												</SakiCol>
																											</SakiRow>
																										</SakiCol>
																									</SakiRow>
																								</SakiCol>
																							</SakiRow>
																						</div>
																						<div className='item-right'>
																							{v.status === 'Closed' ||
																							v.status === 'Disconnected' ? (
																								<SakiButton
																									onTap={() => {
																										console.log('Reconnect')
																									}}
																								>
																									<span
																										style={{
																											color: '#dc4747',
																										}}
																									>
																										{t('reconnect')}
																									</span>
																								</SakiButton>
																							) : (
																								<span
																									style={{
																										padding: '0 7px 0 0',
																									}}
																								>
																									{t(v.status.toLowerCase())}
																								</span>
																							)}
																						</div>
																					</div>
																				</saki-menu-item>
																			)
																		})}
																	</SakiMenu>
																</div>
															</saki-dropdown>
														</saki-col>
														<saki-col>
															<saki-dropdown
																ref={bindEvent({
																	close: () => {
																		setMessageHeaderMoreDorpdown(false)
																	},
																})}
																visible={messageHeaderMoreDorpdown}
															>
																<saki-button
																	ref={bindEvent({
																		tap: () => {
																			setMessageHeaderMoreDorpdown(true)
																			// sendMessage()
																		},
																	})}
																	width='40px'
																	height='40px'
																	type='CircleIconGrayHover'
																>
																	<saki-icon
																		type='More'
																		width='20px'
																		height='20px'
																		color='#777'
																	/>
																</saki-button>
																<div
																	className='message-inputbar-button-file'
																	slot='main'
																>
																	<saki-menu
																		ref={bindEvent({
																			selectvalue: async (e) => {
																				switch (e.detail.value) {
																					case 'UpdateInfo':
																						inputRoomInfo(
																							'Update',
																							async (name) => {
																								const obj = {
																									...fileTransfer.roomInfo,
																									name,
																									lastUpdateTime: Math.floor(
																										new Date().getTime() / 1000
																									),
																								}

																								dispatch(
																									fileTransferSlice.actions.setRoomInfo(
																										obj as any
																									)
																								)

																								if (nwebrtc) {
																									const dataChannelAPI = nwebrtc
																										.getClient(
																											fileTransfer.roomInfo
																												?.id || ''
																										)
																										.DataChannelAPI()
																									dataChannelAPI.emit(
																										'sync-room',
																										obj
																									)
																								}
																							}
																						)
																						break
																					case 'TCP':
																						setMessageHeaderMoreDorpdown(false)
																						usingTcpConnection(
																							fileTransfer.shareCode
																						)
																						break
																					case 'Info':
																						break

																					default:
																						break
																				}
																			},
																		})}
																	>
																		<saki-menu-item
																			padding='8px 12px'
																			value='ID'
																		>
																			<span
																				style={{
																					fontSize: '12px',
																					color: '#999',
																				}}
																			>
																				ID: {fileTransfer.roomInfo?.id}
																			</span>
																		</saki-menu-item>
																		<saki-menu-item
																			padding='8px 12px'
																			value='UpdateInfo'
																		>
																			<span
																				style={{
																					fontSize: '13px',
																				}}
																			>
																				{t('updateInfo', {
																					ns: 'fileTransferPage',
																				})}
																			</span>
																		</saki-menu-item>
																		<saki-menu-item
																			padding='8px 12px'
																			value='TCP'
																		>
																			<span
																				style={{
																					fontSize: '13px',
																				}}
																			>
																				{t('usingTcpConnection')}
																			</span>
																		</saki-menu-item>
																	</saki-menu>
																</div>
															</saki-dropdown>
														</saki-col>
													</saki-row>
												</div>
											</SakiChatMessageHeader>
											{/* <MessagesHeader /> */}
										</div>

										<SakiChatSelect
											visible={selectMessageCMIndex !== -1}
											slot='message-select'
										>
											<saki-col slot='left'>
												<saki-button
													ref={bindEvent({
														tap: () => {
															// setEnbalSelect(false)
															// setSelectDialog(true)
															setSelectMessageCMIndex(-1)
														},
													})}
													padding='6px 18px'
													margin='0 10px 0 0'
													type='Primary'
												>
													Forward
												</saki-button>
												<saki-button
													ref={bindEvent({
														tap: () => {
															// setEnbalSelect(false)
															// dispatch(
															// 	messagesSlice.actions.setDeleteMessage({
															// 		roomId,
															// 		list: selectMessageIds,
															// 	})
															// )
															setSelectMessageCMIndex(-1)
														},
													})}
													padding='6px 18px'
													type='Primary'
												>
													Delete
												</saki-button>
											</saki-col>
											<div slot='right'>
												<saki-button
													ref={bindEvent({
														tap: () => {
															setSelectMessageCMIndex(-1)
														},
													})}
													padding='6px 18px'
													border='1px solid var(--saki-default-color)'
													color='var(--saki-default-color)'
												>
													Cancel
												</saki-button>
											</div>
										</SakiChatSelect>
										<div
											style={{
												width: '100%',
												height:
													(config.deviceWH.h - 260 < 300
														? 300
														: config.deviceWH.h - 260) + 'px',
											}}
											className='ft-m-c-main'
											slot='message-main'
										>
											{nsocketio.status !== 'success' ? (
												<div className='ft-m-c-m-wait'>
													<span>{t('connectingToServer')}</span>
												</div>
											) : !fileTransfer.devices.length ? (
												<div className='ft-m-c-m-wait'>
													<span>{t('waitForDeviceToConnect')}</span>
												</div>
											) : (
												<saki-scroll-view
													ref={bindEvent(
														{
															distancetoborder: (e) => {
																// setShowGoBottomButton(e.detail.bottom >= 100)
															},
														},
														(e) => {
															// messageMainScrollEl.current = e
														}
													)}
													mode='Inherit'
													position='Bottom'
													keep-scroll-position
													scroll-bar='Auto'
													// @distancetoborder="currentChat.distanceToborder"
													// @watchscrollto="currentChat.watchScrollTo"
													// @scrolltotop="currentChat.scrollToTop"
													// @mounted="currentChat.getScrollHeight"
												>
													<div className='message-m-main'>
														{/* uploadedSize:
													{Math.floor(fileTransfer.uploadedSize / 1024 / 1024)}
													MB */}
														<saki-scroll-loading
															ref={bindEvent({
																tap: () => {
																	console.log('load')
																},
															})}
															content={
																fileTransfer.status === 'loading'
																	? t('waitingForOtherDevicesToConnect')
																	: t('connected')
															}
															type={fileTransfer.status}
														></saki-scroll-loading>
														{fileTransfer.messages.map((v, i) => {
															let type = ''
															let maxWidth = 240
															let name = ''
															let size = 0
															let suffix = ''
															let time = ''
															let expirationTime = 0
															let progress = 0
															let src = ''
															let width = 0
															let height = 0
															if (v.image) {
																width = Number(v.image.width) || 0
																height = Number(v.image.height) || 0
																size = Number(v.image.fileInfo?.size)
																suffix = String(v.image.fileInfo?.fileSuffix)
																name = String(v.image.fileInfo?.name)
																src = String(v.image.url)
															}
															if (v?.video?.url) {
																width = Number(v.video.width) || 0
																height = Number(v.video.height) || 0
																size = Number(v.video.fileInfo?.size)
																suffix = String(v.video.fileInfo?.fileSuffix)
																name = String(v.video.fileInfo?.name)
																maxWidth = 300
																src = v.video.url
															}
															if (v?.file?.url) {
																maxWidth = 300
																size = Number(v.file.fileInfo?.size)
																name = String(v.file.fileInfo?.name)
																suffix = String(v.file.fileInfo?.fileSuffix)
																src = v.file.url
															}
															progress = v.progress
															type = v.type || ''
															let message = emojiToImg(v?.message || '')

															const lUser = user.tempUsers[v.deviceId]

															return (
																<saki-chat-bubble
																	data-id={v.id}
																	key={i}
																	ref={bindEvent({
																		sendfailed: () => {
																			console.log(
																				'消息发送失败',
																				v.id,
																				v.message
																			)
																		},
																		resend: () => {
																			console.log('resend', v.id, v.message)
																		},
																		tap: (e) => {
																			switch (e.detail) {
																				case 'message':
																					break
																				case 'avatar':
																					break

																				default:
																					break
																			}
																		},
																		opencontextmenu: (e: any) => {
																			console.log('opencontextmenu', e)
																			const el = e.target?.querySelector(
																				'.saki-richtext-content'
																			)
																			if (el) {
																				let range = document.createRange()
																				range.selectNodeContents(el)
																				let selection = window.getSelection()
																				selection?.removeAllRanges()
																				selection?.addRange(range)
																				// console.log(range)
																			}
																			console.log(el?.setSelectionRange)
																			el?.setSelectionRange?.(0, 10)
																			// setSelectMessageCMIndex(i)
																			// if (enbalSelect) {
																			// 	selectMessage(v)
																			// 	return
																			// }
																			bubbleContextMenuEl.current?.show({
																				x: e.detail.x,
																				y: e.detail.y,
																			})
																			setBubbleContextMenuIndex(i)
																		},
																	})}
																	uid={v.authorId}
																	type={
																		v.deviceId === user.deviceId
																			? 'sender'
																			: 'receiver'
																	}
																	nickname={lUser.nickname}
																	avatar={lUser.avatar}
																	// padding={
																	// 	type === 'Image' || type === 'Video'
																	// 		? '0px'
																	// 		: '8px 10px'
																	// }
																	status={1}
																	read-stats-icon
																	read-progress={progress}
																	horizontal-margin='46px'
																	vertical-margin='10px'
																	watch-status
																	watch-status-timeout='5'
																	watch-status-count='1'
																>
																	{type ? (
																		<saki-chat-bubble-file
																			ref={bindEvent({
																				download: () => {
																					console.log('download')
																					download(
																						String(
																							(v.image || v.video || v.file)
																								?.url
																						),
																						String(
																							(v.image || v.video || v.file)
																								?.fileInfo?.name
																						)
																					)
																				},
																				load: () => {
																					// messageMainScrollEl.current?.keepScrollPosition()
																				},
																			})}
																			file-width={width}
																			file-height={height}
																			width='100%'
																			max-width={maxWidth}
																			type={type}
																			name={name}
																			size={size}
																			suffix={suffix}
																			time={time}
																			expiration-time={expirationTime}
																			progress-icon
																			progress={progress}
																			src={src}
																		></saki-chat-bubble-file>
																	) : (
																		<>
																			<div
																				style={{
																					padding: '2px 4px',
																				}}
																				className='saki-richtext-content'
																				dangerouslySetInnerHTML={{
																					__html: message || '',
																				}}
																			></div>
																		</>
																	)}
																</saki-chat-bubble>
															)
														})}
														<div
															style={{
																width: '100%',
																padding: '10px',
															}}
														></div>
													</div>
												</saki-scroll-view>
											)}

											<div style={{}} className='message-m-bottom'>
												{/* <saki-button
												ref={bindEvent({
													tap: () => {},
												})}
												margin='0 4px 0 0 '
												width='40px'
												height='40px'
												bg-color='#eee'
												bg-hover-color='#e3e3e3'
												bg-active-color='#ddd'
												type='CircleIconGrayHover'
											>
												<saki-icon
													color='#999'
													width='20px'
													height='20px'
													type='Bottom'
												></saki-icon>
											</saki-button> */}
											</div>
										</div>
										<div className='ft-m-c-inputbar' slot='message-inputbar'>
											<saki-row flex-direction='column'>
												{/* <saki-col>
											<saki-chat-reply
												ref={bindEvent({
													close: (e) => {},
												})}
												nickname={''}
												message={''}
												image-src={''}
											></saki-chat-reply>
										</saki-col>
										<saki-col>
											<saki-chat-edit
												ref={bindEvent({
													close: (e) => {},
												})}
												title={'Edit message'}
												message={''}
											></saki-chat-edit>
										</saki-col> */}
												<saki-col>
													<div className='message-input-bar'>
														<div className='message-left-buttons'>
															<SakiDropdown
																ref={
																	bindEvent({
																		close: () => {
																			setOpenEmojiDropdown(false)
																		},
																	}) as any
																}
																floatingDirection='Left'
																width='100%'
																maxWidth='300px'
																mask
																maskClosable
																bodyClosable={false}
																visible={openEmojiDropdown}
															>
																<saki-button
																	ref={bindEvent({
																		tap: () => {
																			setOpenEmojiDropdown(true)
																		},
																	})}
																	margin='2px 4px 0 0 '
																	width='40px'
																	height='40px'
																	type='CircleIconGrayHover'
																>
																	<saki-icon
																		type='Emoji'
																		width='20px'
																		height='20px'
																		color='#777'
																	/>
																</saki-button>
																<div
																	className='message-inputbar-emoji'
																	slot='main'
																>
																	<SakiTabs
																		type='Flex'
																		full
																		disableMoreButton
																		activeTabLabel='Emoji'
																	>
																		<saki-tabs-item
																			font-size='14px'
																			label='Emoji'
																			name={t('emoji', {
																				ns: 'common',
																			})}
																		>
																			<saki-scroll-view mode='Inherit'>
																				<div className='mie-emoji-page'>
																					{/* <div
                                style={{
                                  textAlign: 'center',
                                  margin: '30px 0',
                                }}
                              >
                                预留, 暂未开放
                              </div>
                               */}
																					<div className='mie-e-list'>
																						{emoji.emojiList.map((v, i) => {
																							return v.list.length ? (
																								<div
																									key={i}
																									className='mie-e-category'
																								>
																									<saki-title
																										level='5'
																										color='default'
																										margin='10px 0 4px 8px'
																									>
																										<span>
																											{t(v.categoryName, {
																												ns: 'common',
																											})}
																										</span>
																									</saki-title>
																									<div className='mie-e-c-list'>
																										{v.list.map((sv, si) => {
																											return (
																												<SakiButton
																													border='none'
																													margin='1px'
																													padding='4px'
																													onLongtap={() => {
																														if (
																															v.categoryName ===
																															'recentlyUsed'
																														) {
																															alert({
																																title: t(
																																	'deleteEmoji',
																																	{
																																		ns: 'prompt',
																																	}
																																),
																																content: t(
																																	'deleteEmojiContent',
																																	{
																																		ns: 'prompt',
																																	}
																																),
																																cancelText: t(
																																	'cancel',
																																	{
																																		ns: 'prompt',
																																	}
																																),
																																confirmText: t(
																																	'confirm',
																																	{
																																		ns: 'prompt',
																																	}
																																),
																																onConfirm() {
																																	dispatch(
																																		emojiSlice.actions.removeEmojiRecentlyUsed(
																																			sv
																																		)
																																	)
																																},
																															}).open()
																														}
																													}}
																													onTap={() => {
																														console.log('emoji')
																														richtextEl.current.insetNode(
																															{
																																type: 'Image',
																																src: sv.src,
																																className:
																																	'editor-emoji',
																																name: sv.name,
																															}
																														)
																														console.log(
																															richtextEl.current
																														)
																														// .replace('😂', xiao)
																														setOpenEmojiDropdown(
																															false
																														)

																														dispatch(
																															emojiSlice.actions.setEmojiRecentlyUsed(
																																sv
																															)
																														)
																													}}
																													key={sv.src}
																												>
																													<SakiImages
																														width='30px'
																														height='30px'
																														object-fit='contain'
																														// background-color='#fff'
																														// background-hover-color='#eee'
																														// background-active-color='#ddd'
																														border-radius='6px'
																														src={sv.src}
																													></SakiImages>
																												</SakiButton>
																											)
																										})}
																									</div>
																								</div>
																							) : (
																								''
																							)
																						})}
																					</div>
																				</div>
																			</saki-scroll-view>
																		</saki-tabs-item>
																		<saki-tabs-item
																			font-size='14px'
																			label='CustomStickers'
																			name={t('customStickers', {
																				ns: 'common',
																			})}
																		>
																			<saki-scroll-view mode='Inherit'>
																				<div className='mie-cs-page'>
																					<div
																						style={{
																							textAlign: 'center',
																							margin: '30px 0',
																						}}
																					>
																						{t('developing', {
																							ns: 'common',
																						})}
																					</div>

																					<saki-row
																						flex-wrap='wrap'
																						justify-content='flex-start'
																						padding='10px'
																					>
																						{emoji.customStickers.map(
																							(v, i) => {
																								return (
																									<div key={i}>
																										<saki-col>
																											<SakiImages
																												onClick={() => {
																													setOpenEmojiDropdown(
																														false
																													)

																													// dispatch(
																													// 	methods.messages.sendMessage(
																													// 		{
																													// 			roomId: roomId,
																													// 			image: {
																													// 				url: v.url,
																													// 				width: v.width,
																													// 				height: v.height,
																													// 				type: v.type,
																													// 			},
																													// 		}
																													// 	)
																													// ).unwrap()
																												}}
																												onContextMenu={(e) => {
																													setEmojiContextMenuElIndex(
																														{
																															type: 'customStickers',
																															index: i,
																														}
																													)
																													emojiContextMenuEl.current?.show(
																														{
																															x: e.pageX,
																															y: e.pageY,
																														}
																													)
																													e.preventDefault()
																													return false
																												}}
																												load={openEmojiDropdown}
																												width='70px'
																												height='70px'
																												padding='5px'
																												margin='5px'
																												object-fit='contain'
																												background-color='#fff'
																												background-hover-color='#eee'
																												background-active-color='#ddd'
																												border-radius='6px'
																												src={v.url}
																											></SakiImages>
																										</saki-col>
																									</div>
																								)
																							}
																						)}
																					</saki-row>
																				</div>
																			</saki-scroll-view>
																		</saki-tabs-item>
																	</SakiTabs>
																</div>
															</SakiDropdown>
														</div>
														<div className='message-inputbar-input saki-richtext-content'>
															{inputTextMessage ? (
																<div className='inputbar-text'>
																	<saki-richtext
																		ref={bindEvent(
																			{
																				changevalue: (e) => {
																					// console.log('textarea', e.detail)

																					// e.detail.richText = e.detail.richText.replace(
																					// 	xiao,
																					// 	'😂'
																					// )
																					// console.log('textarea', e.detail)
																					setMessageRichText(e.detail.richText)
																					setMessage(
																						emojiToText(
																							e.detail.richText
																						).replace(/<[^>]+>/g, '')
																					)
																				},
																				submit: () => {
																					sendMessage()
																				},
																			},
																			(e) => {
																				richtextEl.current = e
																				richtextEl.current?.setToolbar?.({
																					container: [],
																				})
																			}
																		)}
																		theme='snow'
																		toolbar='false'
																		editor-padding='0px'
																		toolbar-padding='0px'
																		max-height='300px'
																		width='100%'
																		padding='0'
																		font-size='14px'
																		border-radius='0'
																		min-length='0'
																		max-length='10000'
																		clear-all-styles-when-pasting
																		enter={
																			config.deviceType === 'PC' ||
																			user.userAgent?.os?.name === 'Windows' ||
																			user.userAgent?.os?.name ===
																				'Linux x86_64' ||
																			user.userAgent?.os?.name === 'Mac OS X'
																				? 'Submit'
																				: 'NewLine'
																		}
																		short-enter='NewLine'
																		background-color='rgb(243,243,243)'
																		value={messageRichText}
																		// :value="currentChat.value"
																		// @clearvalue="currentChat.value = ''"
																		// @pressenter="currentChat.send"
																		// @changevalue="(e:CustomEvent)=>currentChat.changevalue(e)"
																		placeholder={t('writeMessage')}
																	/>
																</div>
															) : (
																<SakiDropdown
																	onClose={() => {
																		setSendFileDorpdown(false)
																	}}
																	floatingDirection='Center'
																	visible={sendFileDorpdown}
																>
																	<SakiButton
																		onTap={() => {
																			setSendFileDorpdown(true)
																		}}
																		bg-color='rgb(243, 243, 243)'
																		margin='0 0 0 4px'
																		borderRadius='20px'
																		height='40px'
																	>
																		{t('sendFile')}
																	</SakiButton>
																	<div
																		className='message-inputbar-button-file'
																		slot='main'
																	>
																		<saki-menu
																			ref={bindEvent({
																				selectvalue: (e) => {
																					switch (e.detail.value) {
																						case 'Image':
																							sendFile('Image')
																							break
																						case 'Video':
																							sendFile('Video')
																							break
																						case 'File':
																							sendFile('File')
																							break

																						default:
																							// dispatch(methods.tools.developing())
																							break
																					}
																					setSendFileDorpdown(false)
																				},
																			})}
																		>
																			{fileTypes.map((v) => {
																				return (
																					<saki-menu-item
																						key={v}
																						padding='10px 18px'
																						value={v}
																					>
																						<div className='message-b-f-item'>
																							<saki-icon
																								type={v}
																								width='20px'
																								height='20px'
																								margin='0 8px 0 0'
																								color='#777'
																							/>
																							<span>
																								{t(v.toLowerCase(), {
																									ns: 'common',
																								})}
																							</span>
																						</div>
																					</saki-menu-item>
																				)
																			})}
																		</saki-menu>
																	</div>
																</SakiDropdown>
															)}
														</div>
														<div className='message-right-buttons'>
															{message && inputTextMessage ? (
																<saki-button
																	ref={bindEvent({
																		tap: () => {
																			sendMessage()
																		},
																	})}
																	margin='2px 0 0 4px'
																	width='40px'
																	height='40px'
																	type='CircleIconGrayHover'
																>
																	<saki-icon
																		type='Send'
																		width='18px'
																		height='18px'
																		color='var(--default-color)'
																	/>
																</saki-button>
															) : (
																''
																// <saki-button
																// 	ref={bindEvent({
																// 		tap: () => {
																// 			// dispatch(methods.tools.developing())
																// 		},
																// 	})}
																// 	margin='2px 0 0 4px'
																// 	width='40px'
																// 	height='40px'
																// 	type='CircleIconGrayHover'
																// 	disabled
																// >
																// 	<saki-icon
																// 		type='MicroPhone'
																// 		width='20px'
																// 		height='20px'
																// 		color='#ccc'
																// 		// color='#777'
																// 	/>
																// </saki-button>
															)}

															{!inputTextMessage ? (
																<SakiButton
																	onTap={() => {
																		setInputTextMessage(!inputTextMessage)
																	}}
																	margin='2px 0 0 4px'
																	width='40px'
																	height='40px'
																	type='CircleIconGrayHover'
																>
																	<SakiIcon
																		type='Chat'
																		width='18px'
																		height='18px'
																		color='#777'
																	/>
																</SakiButton>
															) : (
																<>
																	<saki-dropdown
																		ref={bindEvent({
																			close: () => {
																				setInputbarToolDorpdown(false)
																			},
																		})}
																		visible={inputbarToolDorpdown}
																	>
																		<saki-button
																			ref={bindEvent({
																				tap: () => {
																					setInputbarToolDorpdown(true)
																				},
																			})}
																			margin='2px 0 0 4px'
																			width='40px'
																			height='40px'
																			type='CircleIconGrayHover'
																		>
																			<saki-icon
																				type='Paperclip'
																				width='20px'
																				height='20px'
																				color='#777'
																			/>
																		</saki-button>
																		<div
																			className='message-inputbar-button-file'
																			slot='main'
																		>
																			<saki-menu
																				ref={bindEvent({
																					selectvalue: (e) => {
																						switch (e.detail.value) {
																							case 'Image':
																								sendFile('Image')
																								break
																							case 'Video':
																								sendFile('Video')
																								break
																							case 'File':
																								sendFile('File')
																								break

																							default:
																								// dispatch(methods.tools.developing())
																								break
																						}
																						setInputbarToolDorpdown(false)
																					},
																				})}
																			>
																				{fileTypes.map((v) => {
																					return (
																						<saki-menu-item
																							key={v}
																							padding='10px 18px'
																							value={v}
																						>
																							<div className='message-b-f-item'>
																								<saki-icon
																									type={v}
																									width='20px'
																									height='20px'
																									margin='0 8px 0 0'
																									color='#777'
																								/>
																								<span>
																									{t(v.toLowerCase(), {
																										ns: 'common',
																									})}
																								</span>
																							</div>
																						</saki-menu-item>
																					)
																				})}
																			</saki-menu>
																		</div>
																	</saki-dropdown>
																	<SakiButton
																		onTap={() => {
																			setInputTextMessage(!inputTextMessage)
																		}}
																		margin='2px 0 0 4px'
																		width='40px'
																		height='40px'
																		type='CircleIconGrayHover'
																	>
																		<SakiIcon
																			type='Undo'
																			width='18px'
																			height='18px'
																			color='#777'
																		/>
																	</SakiButton>
																</>
															)}
														</div>
													</div>
												</saki-col>
											</saki-row>
										</div>
									</SakiChatMessageContainer>

									{/* load saki ui component */}
									<div
										style={{
											display: 'none',
										}}
									>
										<saki-chat-bubble />
									</div>
								</div>
							)}

							{mounted ? (
								<saki-context-menu
									ref={bindEvent(
										{
											selectvalue: (e) => {
												let m = fileTransfer.messages[bubbleContextMenuIndex]
												console.log('saki-context-menu', e, m)
												switch (e.detail.value) {
													case 'Download':
														if ((m.image || m.video || m.file)?.url) {
															download(
																String((m.image || m.video || m.file)?.url),
																String(
																	(m.image || m.video || m.file)?.fileInfo?.name
																)
															)
														}
														break
													case 'Copy':
														copyText(m?.message?.replace(/<[^>]+>/gi, '') || '')

														snackbar({
															message: t('copySuccessfully', {
																ns: 'prompt',
															}),
															autoHideDuration: 2000,
															vertical: 'top',
															horizontal: 'center',
															backgroundColor: 'var(--saki-default-color)',
															color: '#fff',
														}).open()
														break
													// case 'Forward':
													// 	setEnbalSelect(true)
													// 	setSelectMessageIds([m.id || ''])
													// 	setTimeout(() => {
													// 		setSelectDialog(true)
													// 	}, 200)
													// 	break
													// case 'Reply':
													// 	if (editMessage) {
													// 		setEditMessage(undefined)
													// 		setMessageRichText('')
													// 	}
													// 	setSelectReplyMessage(m)
													// 	break
													// case 'Select':
													// 	setEnbalSelect(true)
													// 	setSelectMessageIds([m.id || ''])
													// 	break
													// case 'AddSticker':
													// 	dispatch(
													// 		methods.emoji.addCustomSticker({
													// 			csi: {
													// 				url: m?.image?.url || '',
													// 				width: Number(m?.image?.width) || 0,
													// 				height: Number(m?.image?.height) || 0,
													// 				type: (m?.image?.type as any) || 'image/jpeg',
													// 				createTime: getUnix(),
													// 			},
													// 		})
													// 	)

													// 	break
													// case 'Pin':
													// 	break
													// case 'Edit':
													// 	// dispatch(
													// 	// 	methods.messages.editMessage({
													// 	// 		roomId: roomId,
													// 	// 		messageId: m.id || '',
													// 	// 	})
													// 	// )
													// 	console.log(m.message)
													// 	selectReplyMessage &&
													// 		setSelectReplyMessage(undefined)
													// 	setEditMessage(m)
													// 	setMessageRichText(m.message || '')
													// 	richtextEl.current?.setValue(m.message)
													// 	break
													// case 'Delete':
													// 	dispatch(
													// 		messagesSlice.actions.setDeleteMessage({
													// 			roomId,
													// 			list: [m?.id || ''],
													// 		})
													// 	)
													// 	break

													default:
														developing()
														break
												}
											},
											close: () => {
												let selection = window.getSelection()
												selection?.removeAllRanges()

												setTimeout(() => {
													setBubbleContextMenuIndex(-1)
												}, 300)

												// chatDialogList.dialogContextMenuIndex = -1
											},
										},
										(e) => {
											bubbleContextMenuEl.current = e
										}
									)}
								>
									{(() => {
										let fontSize = '13px'
										let padding = '10px 20px'
										let m = fileTransfer.messages[bubbleContextMenuIndex]
										return (
											<div>
												<saki-context-menu-item
													font-size={fontSize}
													padding={padding}
													value='Download'
													hide={
														!(
															m?.image?.url ||
															m?.audio?.url ||
															m?.video?.url ||
															m?.file?.url
														)
													}
												>
													{t('download', {
														ns: 'prompt',
													})}
												</saki-context-menu-item>
												<saki-context-menu-item
													font-size={fontSize}
													padding={padding}
													value='Edit'
													hide={!(m?.deviceId === user.deviceId && m?.message)}
													disabled
												>
													{t('edit', {
														ns: 'prompt',
													})}
												</saki-context-menu-item>
												<saki-context-menu-item
													font-size={fontSize}
													padding={padding}
													value='Copy'
													hide={!m?.message}
												>
													{t('copy', {
														ns: 'prompt',
													})}
												</saki-context-menu-item>
												<saki-context-menu-item
													font-size={fontSize}
													padding={padding}
													value='Forward'
													disabled
												>
													{t('forward', {
														ns: 'prompt',
													})}
												</saki-context-menu-item>
												<saki-context-menu-item
													font-size={fontSize}
													padding={padding}
													value='Reply'
													disabled
												>
													{t('reply', {
														ns: 'prompt',
													})}
												</saki-context-menu-item>
												<saki-context-menu-item
													font-size={fontSize}
													padding={padding}
													value='Select'
													disabled
												>
													{t('select', {
														ns: 'prompt',
													})}
												</saki-context-menu-item>
												<saki-context-menu-item
													font-size={fontSize}
													padding={padding}
													value='AddSticker'
													hide={!m?.image?.url}
													disabled
												>
													{t('addSticker', {
														ns: 'prompt',
													})}
												</saki-context-menu-item>
												{/* 收藏夹 */}
												<saki-context-menu-item
													font-size={fontSize}
													padding={padding}
													value='Pin'
													disabled
												>
													{t('pin', {
														ns: 'prompt',
													})}
												</saki-context-menu-item>
												<saki-context-menu-item
													font-size={fontSize}
													padding={padding}
													value='Delete'
													disabled
												>
													{t('delete', {
														ns: 'prompt',
													})}
												</saki-context-menu-item>
											</div>
										)
									})()}
								</saki-context-menu>
							) : (
								''
							)}

							{/* <div className='ft-m-data'>
								<div className='ft-m-d-item'>
									<span className='data'></span>
									<span className='title'></span>
								</div>
								<div className='ft-m-d-item'>
									<span className='data'></span>
									<span className='title'></span>
								</div>
								<div className='ft-m-d-item'>
									<span className='data'></span>
									<span className='title'></span>
								</div>
							</div> */}
						</>
					)}
				</div>
			</div>
		</>
	)
}
FileTransferPage.getLayout = getLayout

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

export default FileTransferPage
