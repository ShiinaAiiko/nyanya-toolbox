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
import { bindEvent } from '@saki-ui/core'
import { useSelector, useStore, useDispatch } from 'react-redux'
const HeaderComponent = () => {
	const [mounted, setMounted] = useState(false)
	useEffect(() => {
		setMounted(true)
	}, [])
	const router = useRouter()
	const { redirectUri, deviceId, appId, disableHeader } = router.query
	const layout = useSelector((state: RootState) => state.layout)
	const config = useSelector((state: RootState) => state.config)
	const [openMenuDropDownMenu, setOpenMenuDropDownMenu] = useState(false)

	return (
		<div className='tb-header'>
			<div className='tb-h-left'>
				<div className='logo-text'>{layout.headerLogoText}</div>
			</div>
			<div className='tb-h-center'></div>
			<div className='tb-h-right'>
				{mounted && (
					<saki-dropdown
						visible={openMenuDropDownMenu}
						floating-direction='Left'
						ref={bindEvent({
							close: (e) => {
								setOpenMenuDropDownMenu(false)
							},
						})}
					>
						<div className='tb-h-r-icon'>
							<saki-button
								ref={bindEvent({
									tap: () => {
										setOpenMenuDropDownMenu(!openMenuDropDownMenu)
									},
								})}
								type='CircleIconGrayHover'
							>
								<svg
									className='icon'
									viewBox='0 0 1024 1024'
									version='1.1'
									xmlns='http://www.w3.org/2000/svg'
									p-id='16135'
									fill='#555'
									width='20'
									height='20'
								>
									<path
										d='M384 480H192c-52.8 0-96-43.2-96-96V192c0-52.8 43.2-96 96-96h192c52.8 0 96 43.2 96 96v192c0 52.8-43.2 96-96 96zM192 160c-17.6 0-32 14.4-32 32v192c0 17.6 14.4 32 32 32h192c17.6 0 32-14.4 32-32V192c0-17.6-14.4-32-32-32H192zM832 480H640c-52.8 0-96-43.2-96-96V192c0-52.8 43.2-96 96-96h192c52.8 0 96 43.2 96 96v192c0 52.8-43.2 96-96 96zM640 160c-17.6 0-32 14.4-32 32v192c0 17.6 14.4 32 32 32h192c17.6 0 32-14.4 32-32V192c0-17.6-14.4-32-32-32H640zM384 928H192c-52.8 0-96-43.2-96-96V640c0-52.8 43.2-96 96-96h192c52.8 0 96 43.2 96 96v192c0 52.8-43.2 96-96 96zM192 608c-17.6 0-32 14.4-32 32v192c0 17.6 14.4 32 32 32h192c17.6 0 32-14.4 32-32V640c0-17.6-14.4-32-32-32H192zM832 928H640c-52.8 0-96-43.2-96-96V640c0-52.8 43.2-96 96-96h192c52.8 0 96 43.2 96 96v192c0 52.8-43.2 96-96 96zM640 608c-17.6 0-32 14.4-32 32v192c0 17.6 14.4 32 32 32h192c17.6 0 32-14.4 32-32V640c0-17.6-14.4-32-32-32H640z'
										p-id='16136'
									></path>
								</svg>
							</saki-button>
						</div>
						<div className='tool-box-layout-menu-list' slot='main'>
							<saki-menu
								ref={bindEvent({
									selectvalue: async (e) => {
										// console.log(e.detail.value)
										// switch (e.detail.value) {
										// 	case 'WindowsPath':
										// 		router.replace('/windowsPath')

										// 		break
										// 	case 'AiikoBlog':
										// 		router.replace('https://aiiko.club')

										// 		break

										// 	default:
										// 		break
										// }
										setOpenMenuDropDownMenu(false)
									},
								})}
							>
								<saki-menu-item padding='0' value={'WindowsPath'}>
									<div className='tblml-item'>
										<a target='_blank' href='/windowsPathToPosixPath'>
											Windows路径转换成Posix路径
										</a>
									</div>
								</saki-menu-item>
								<saki-menu-item padding='0' value={'AiikoBlog'}>
									<div className='tblml-item'>
										<a target='_blank' href='https://aiiko.club'>
											爱喵日记
										</a>
									</div>
								</saki-menu-item>
							</saki-menu>
						</div>
					</saki-dropdown>
				)}
			</div>
		</div>
	)
}

export default HeaderComponent
