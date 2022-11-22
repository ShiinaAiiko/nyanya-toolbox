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
import { appListUrl } from '../config'
const HeaderComponent = () => {
	const { t, i18n } = useTranslation('randomPasswordPage')
	const [mounted, setMounted] = useState(false)
	useEffect(() => {
		setMounted(true)
		getAppList()
	}, [])
	const router = useRouter()
	const { redirectUri, deviceId, appId, disableHeader } = router.query
	const layout = useSelector((state: RootState) => state.layout)
	const config = useSelector((state: RootState) => state.config)
	const [openMenuDropDownMenu, setOpenMenuDropDownMenu] = useState(false)
	const [appList, setAppList] = useState<
		{
			title: any
			url: string
		}[]
	>([])

	const getAppList = async () => {
		const res = await axios({
			method: 'GET',
			url: appListUrl,
		})
		console.log(res.data)
		setAppList(res.data.appList)
	}

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
										setOpenMenuDropDownMenu(false)
									},
								})}
							>
								{appList.map((v, i) => {
									return (
										<saki-menu-item key={i} padding='0' value={v.url}>
											<div className='tblml-item'>
												<Link href={v.url} passHref>
													<a target='_blank' rel='noopener noreferrer'>
														{v.title[i18n.language]}
													</a>
												</Link>
											</div>
										</saki-menu-item>
									)
								})}
							</saki-menu>
						</div>
					</saki-dropdown>
				)}
			</div>
		</div>
	)
}

export default HeaderComponent
