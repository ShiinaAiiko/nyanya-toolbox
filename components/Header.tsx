import Head from 'next/head'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
	RootState,
	userSlice,
	AppDispatch,
	layoutSlice,
	methods,
	configSlice,
} from '../store'
import { useTranslation } from 'react-i18next'
import { bindEvent } from '@saki-ui/core'
import { useSelector, useStore, useDispatch } from 'react-redux'
import axios from 'axios'
import { appListUrl, sakisso } from '../config'
import {
	SakiAsideModal,
	SakiAvatar,
	SakiButton,
	SakiCol,
	SakiMenu,
	SakiMenuItem,
	SakiModalHeader,
	SakiRow,
	SakiTitle,
	SakiTemplateHeader,
	SakiTemplateMenuDropdown,
	SakiAnimationLoading,
	SakiSso,
} from './saki-ui-react/components'
import {
	LocalUser,
	getLocalUsers,
	loginLocalUser,
} from '@nyanyajs/utils/dist/sakisso/localUser'
import { userMethods } from '../store/user'
import { localUserMethods } from '../store/localUser'
import moment from 'moment'
import { byteConvert } from '@nyanyajs/utils'

const SpeedComponent = React.memo(() => {
	const { t, i18n } = useTranslation('common')
	const webRTC = useSelector((state: RootState) => state.webRTC)

	const [openNetworkSpeedDropDownMenu, setOpenNetworkSpeedDropDownMenu] =
		useState(false)
	return (
		<saki-dropdown
			visible={openNetworkSpeedDropDownMenu}
			floating-direction='Left'
			z-index='1001'
			ref={bindEvent({
				close: (e) => {
					setOpenNetworkSpeedDropDownMenu(false)
				},
			})}
		>
			<SakiButton
				onTap={() => {
					setOpenNetworkSpeedDropDownMenu(!openNetworkSpeedDropDownMenu)
				}}
				type='Normal'
				border='none'
			>
				<SakiRow margin='0 4px 0 0'>
					<SakiCol>
						<span
							style={{
								color: '#666',
								fontSize: '12px',
							}}
						>
							{t('networkSpeed', {
								ns: 'prompt',
								speed:
									Math.floor((webRTC.transferRate.total / 1024) * 10) / 10 +
									' KB/s',
							})}
						</span>
					</SakiCol>
				</SakiRow>
			</SakiButton>
			<div
				style={{
					padding: '10px 12px',
				}}
				className='network-speed-dp-main'
				slot='main'
			>
				<SakiTitle
					margin='0 0 4px 0'
					level={5}
					color='var(--saki-default-color)'
				>
					Transfer data
				</SakiTitle>
				<div
					style={{
						padding: '2px 0',
						color: '#666',
						fontSize: '12px',
					}}
					className='nsd-item'
				>
					{'已上传 ' + byteConvert(webRTC.transferData.sent)}
				</div>
				<div
					style={{
						padding: '2px 0',
						color: '#666',
						fontSize: '12px',
					}}
					className='nsd-item'
				>
					{'已下载 ' + byteConvert(webRTC.transferData.received)}
				</div>
				<SakiTitle
					margin='6px 0 4px 0'
					level={5}
					color='var(--saki-default-color)'
				>
					Transfer rate
				</SakiTitle>
				<div
					style={{
						padding: '2px 0',
						color: '#666',
						fontSize: '12px',
					}}
					className='nsd-item'
				>
					{'上传 ' +
						Math.floor((webRTC.transferRate.sent / 1024) * 10) / 10 +
						' KB/s'}
				</div>
				<div
					style={{
						padding: '2px 0',
						color: '#666',
						fontSize: '12px',
					}}
					className='nsd-item'
				>
					{'下载 ' +
						Math.floor((webRTC.transferRate.total / 1024) * 10) / 10 +
						' KB/s'}
				</div>
			</div>
		</saki-dropdown>
	)
})

const HeaderComponent = ({
	// 暂时仅fixed可用
	visible = true,
	fixed = false,
}: {
	visible: boolean
	fixed: boolean
}) => {
	const { t, i18n } = useTranslation('common')
	const [mounted, setMounted] = useState(false)
	useEffect(() => {
		setMounted(true)
	}, [])
	const store = useStore()
	const dispatch = useDispatch<AppDispatch>()

	const router = useRouter()
	const { redirectUri, deviceId, appId, disableHeader } = router.query
	const layout = useSelector((state: RootState) => state.layout)
	const config = useSelector((state: RootState) => state.config)
	const user = useSelector((state: RootState) => state.user)
	const localUser = useSelector((state: RootState) => state.localUser)
	const fileTransfer = useSelector((state: RootState) => state.fileTransfer)

	const [openUserDropDownMenu, setOpenUserDropDownMenu] = useState(false)
	const [openLoginUserModal, setOpenLoginUserModal] = useState(false)
	const [openUserProfileModal, setOpenUserProfileModal] = useState(false)

	const [localUsers, setLocalUsers] = useState([] as LocalUser[])
	return (
		<SakiTemplateHeader visible={visible} fixed={fixed}>
			<div slot='left'>
				<SakiTemplateMenuDropdown
					ref={(e) => {
						// console.log('routerrr', router)

						e?.setAppList?.(
							config.appList.map((v) => {
								return {
									...v,
									url: v.url.replace(
										'http://tools.aiiko.club/',
										'http://tools.aiiko.club/' +
											// 'http://192.168.204.129:23200/' +
											(router.query.lang ? router.query.lang + '/' : '')
									),
								}
							})
						)
					}}
					app-text={layout.headerLogoText}
				></SakiTemplateMenuDropdown>
			</div>
			<div slot={'right'}>
				{router.asPath.indexOf('fileTransfer') >= 0 &&
				fileTransfer.shareCode ? (
					<SpeedComponent />
				) : (
					''
				)}
				<meow-apps-dropdown
					bg-color='rgba(0,0,0,0)'
					language={config.lang}
				></meow-apps-dropdown>

				{config.ssoAccount ? (
					<saki-dropdown
						visible={openUserDropDownMenu}
						floating-direction='Left'
						z-index='1001'
						ref={bindEvent({
							close: (e) => {
								setOpenUserDropDownMenu(false)
							},
						})}
					>
						<div
							onClick={() => {
								// onSettings?.('Account')
								setOpenUserDropDownMenu(!openUserDropDownMenu)
								// setOpenUserDropDownMenu(!openUserDropDownMenu)
							}}
							className='tb-h-r-user'
						>
							<saki-avatar
								ref={bindEvent({
									tap: () => {
										// setOpenUserDropDownMenu(!openUserDropDownMenu)
										// onSettings?.()
										// store.dispatch(userSlice.actions.logout({}))
									},
								})}
								className='qv-h-r-u-avatar'
								width='34px'
								height='34px'
								border-radius='50%'
								margin='0 0 0 6px'
								default-icon={'UserLine'}
								// anonymous-icon
								nickname={user.userInfo?.nickname || ''}
								src={user.userInfo?.avatar || ''}
								alt=''
							/>
							{/* {user.isLogin ? (
							) : (
								<saki-button
									ref={bindEvent({
										tap: async () => {
											setOpenUserDropDownMenu(!openUserDropDownMenu)
										},
									})}
									margin='0 0 0 6px'
									padding='8px 18px'
									font-size='14px'
									type='Primary'
								>
									{t('login', {
										ns: 'prompt',
									})}
								</saki-button>
							)} */}
						</div>
						<div slot='main'>
							<saki-menu
								ref={bindEvent({
									selectvalue: async (e) => {
										console.log(e.detail.value)
										switch (e.detail.value) {
											case 'Login':
												dispatch(layoutSlice.actions.setOpenLoginModal(true))
												break
											case 'Logout':
												dispatch(methods.user.logout())
												break
											case 'Account':
												setOpenUserProfileModal(true)
												break

											default:
												break
										}
										setOpenUserDropDownMenu(false)
									},
								})}
							>
								{!user.isLogin ? (
									<saki-menu-item padding='10px 18px' value={'Login'}>
										<SakiRow justifyContent='flex-start' alignItems='center'>
											<SakiCol>
												<saki-icon
													width='20px'
													color='#666'
													margin='0 10px 0 0'
													type='User'
												></saki-icon>
											</SakiCol>
											<SakiCol>
												<span>
													{t('login', {
														ns: 'prompt',
													})}
												</span>
											</SakiCol>
										</SakiRow>
									</saki-menu-item>
								) : (
									''
								)}
								{user.isLogin ? (
									<>
										<saki-menu-item padding='10px 18px' value={'Account'}>
											<SakiRow justifyContent='flex-start' alignItems='center'>
												<SakiCol>
													<SakiAvatar
														className='qv-h-r-u-avatar'
														width='20px'
														height='20px'
														margin='0 10px 0 0'
														border-radius='50%'
														nickname={user.userInfo?.nickname || ''}
														src={user.userInfo?.avatar || ''}
													/>
												</SakiCol>
												<SakiCol>
													<span className='text-elipsis'>
														{user.userInfo?.nickname}
													</span>
												</SakiCol>
											</SakiRow>
										</saki-menu-item>
									</>
								) : (
									''
								)}
								{user.isLogin ? (
									<saki-menu-item padding='10px 18px' value={'Logout'}>
										<SakiRow justifyContent='flex-start' alignItems='center'>
											<SakiCol>
												<saki-icon
													width='20px'
													color='#666'
													margin='0 10px 0 0'
													type='Logout'
												></saki-icon>
											</SakiCol>
											<SakiCol>
												<span>
													{t('logout', {
														ns: 'prompt',
													})}
												</span>
											</SakiCol>
										</SakiRow>
									</saki-menu-item>
								) : (
									''
								)}
							</saki-menu>
						</div>
					</saki-dropdown>
				) : router.asPath.indexOf('fileTransfer') >= 0 ? (
					<saki-dropdown
						visible={openUserDropDownMenu}
						floating-direction='Left'
						z-index='1001'
						ref={bindEvent({
							close: (e) => {
								setOpenUserDropDownMenu(false)
							},
						})}
					>
						<div
							onClick={() => {
								// onSettings?.('Account')
								setOpenUserDropDownMenu(!openUserDropDownMenu)
							}}
							className='tb-h-r-user'
						>
							<saki-avatar
								ref={bindEvent({
									tap: () => {
										// onSettings?.()
										// store.dispatch(userSlice.actions.logout({}))
									},
								})}
								className='qv-h-r-u-avatar'
								width='34px'
								height='34px'
								border-radius='50%'
								margin='0 0 0 6px'
								nickname={localUser.localUser?.nickname || ''}
								src={localUser.localUser?.avatar || ''}
								alt=''
							/>
						</div>
						<div slot='main'>
							<saki-menu
								ref={bindEvent({
									selectvalue: async (e) => {
										console.log(e.detail.value)
										switch (e.detail.value) {
											case 'Login':
												// 先选择，没有再创建

												const users = await getLocalUsers()
												if (!users.length) {
													dispatch(localUserMethods.createLocalUser())
												} else {
													setLocalUsers(users)
													setOpenLoginUserModal(true)
												}
												break
											case 'Logout':
												dispatch(userMethods.logout())
												break
											case 'Account':
												break

											default:
												break
										}
										setOpenUserDropDownMenu(false)
									},
								})}
							>
								{!user.isLogin ? (
									<saki-menu-item padding='10px 18px' value={'Login'}>
										<SakiRow justifyContent='flex-start' alignItems='center'>
											<SakiCol>
												<saki-icon
													width='20px'
													color='#666'
													margin='0 10px 0 0'
													type='User'
												></saki-icon>
											</SakiCol>
											<SakiCol>
												<span>
													{t('login', {
														ns: 'prompt',
													})}
												</span>
											</SakiCol>
										</SakiRow>
									</saki-menu-item>
								) : (
									''
								)}
								{user.isLogin ? (
									<>
										<saki-menu-item padding='10px 18px' value={'Account'}>
											<SakiRow justifyContent='flex-start' alignItems='center'>
												<SakiCol>
													<SakiAvatar
														className='qv-h-r-u-avatar'
														width='20px'
														height='20px'
														margin='0 10px 0 0'
														border-radius='50%'
														nickname={localUser.localUser?.nickname || ''}
														src={localUser.localUser?.avatar || ''}
													/>
												</SakiCol>
												<SakiCol>
													<span className='text-elipsis'>
														{localUser.localUser?.nickname}
													</span>
												</SakiCol>
											</SakiRow>
										</saki-menu-item>
									</>
								) : (
									''
								)}
								{user.isLogin ? (
									<saki-menu-item padding='10px 18px' value={'Logout'}>
										<SakiRow justifyContent='flex-start' alignItems='center'>
											<SakiCol>
												<saki-icon
													width='20px'
													color='#666'
													margin='0 10px 0 0'
													type='Logout'
												></saki-icon>
											</SakiCol>
											<SakiCol>
												<span>
													{t('logout', {
														ns: 'prompt',
													})}
												</span>
											</SakiCol>
										</SakiRow>
									</saki-menu-item>
								) : (
									''
								)}
							</saki-menu>
						</div>
					</saki-dropdown>
				) : (
					''
				)}

				<SakiAsideModal
					onClose={() => {
						setOpenLoginUserModal(false)
					}}
					vertical='Center'
					horizontal='Center'
					mask
					// mask-closable
					visible={openLoginUserModal}
					width='300px'
					background-color='#fff'
					border-radius='10px'
					padding='0px 0'
					margin='0px'
				>
					<div>
						{/* <SakiModalHeader
									close-icon={true}
									onClose={() => {
										setOpenLoginUserModal(false)
									}}
									title={'选择一个本地用户'}
								/> */}
						<SakiTitle level={5} color='#666' padding='10px 20px 0'>
							<span>已创建的用户</span>
						</SakiTitle>
						{localUsers.length ? (
							<SakiMenu
								onSelectvalue={async (e) => {
									console.log(e.detail.value)
									switch (e.detail.value) {
										case 'Cancel':
											break

										default:
											await loginLocalUser(e.detail.value)
											await dispatch(localUserMethods.login())
											break
									}
									setOpenLoginUserModal(false)
								}}
							>
								{localUsers.map((v, i) => {
									return (
										<SakiMenuItem key={i} padding='10px 18px' value={v.uid}>
											<SakiRow alignItems='center'>
												<SakiCol>
													<SakiRow alignItems='center'>
														<SakiCol>
															<SakiAvatar
																className='qv-h-r-u-avatar'
																width='30px'
																height='30px'
																margin='0 10px 0 0'
																border-radius='50%'
																nickname={v.nickname}
																src={v.avatar}
															/>
														</SakiCol>
														<SakiCol>
															<span
																style={{
																	fontSize: '16px',
																}}
																className='text-elipsis'
															>
																{v.nickname}
															</span>
														</SakiCol>
													</SakiRow>
												</SakiCol>
												<SakiCol>
													<span
														style={{
															fontSize: '12px',
														}}
														className='text-elipsis'
													>
														{moment(v.lastLoginTime * 1000).fromNow()}
													</span>
												</SakiCol>
											</SakiRow>
										</SakiMenuItem>
									)
								})}
								<SakiMenuItem padding='10px 18px' value={'Cancel'}>
									<span
										style={{
											textAlign: 'center',
										}}
										className='text-elipsis'
									>
										取消登录
									</span>
								</SakiMenuItem>
							</SakiMenu>
						) : (
							''
						)}
					</div>
				</SakiAsideModal>
        
				<saki-modal
					max-width={config.deviceType === 'Mobile' ? '100%' : '800px'}
					min-width={config.deviceType === 'Mobile' ? 'auto' : '700px'}
					max-height={config.deviceType === 'Mobile' ? '100%' : '600px'}
					min-height={config.deviceType === 'Mobile' ? 'auto' : '400px'}
					width='100%'
					height='100%'
					border-radius={config.deviceType === 'Mobile' ? '0px' : ''}
					border={config.deviceType === 'Mobile' ? 'none' : ''}
					mask
					background-color='#fff'
					onClose={() => {
						setOpenUserProfileModal(false)
					}}
					visible={openUserProfileModal}
				>
					<div
						style={{
							width: '100%',
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'space-between',
						}}
					>
						<saki-modal-header
							ref={bindEvent({
								close: (e) => {
									setOpenUserProfileModal(false)
								},
							})}
							closeIcon
							title={t('profile', {
								ns: 'prompt',
							})}
						/>
						{openUserProfileModal ? (
							<SakiSso
								onUpdateUser={async (e) => {
									await dispatch(
										methods.user.checkToken({
											token: user.token,
											deviceId: user.deviceId,
										})
									)
								}}
								disable-header
								style={{
									flex: '1',
								}}
								class='disabled-dark'
								app-id={sakisso.appId}
								language={config.language}
								appearance={''}
								// url={"https://aiiko.club"}
								url={sakisso.clientUrl + '/profile'}
							/>
						) : (
							''
						)}
					</div>
				</saki-modal>
			</div>
		</SakiTemplateHeader>
	)
}

export default HeaderComponent
