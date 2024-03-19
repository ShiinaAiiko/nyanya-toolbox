import React, { useEffect, useState } from 'react'

import { useSelector, useDispatch } from 'react-redux'
import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	configSlice,
	userSlice,
	layoutSlice,
} from '../store'
import { useTranslation } from 'react-i18next'
import { prompt, alert, bindEvent } from '@saki-ui/core'
import { Debounce } from '@nyanyajs/utils'
import { sakisso } from '../config'
import { SakiSso } from './saki-ui-react/components'

const loginDebounce = new Debounce()
const LoginComponent = () => {
	const { t, i18n } = useTranslation()
	const config = useSelector((state: RootState) => state.config)
	const layout = useSelector((state: RootState) => state.layout)
	// const appearance = useSelector((state: RootState) => state.appearance)

	const [noteContextMenuEl, setNoteContextMenuEl] = useState<any>()
	const [openDropDownMenu, setOpenDropDownMenu] = useState(false)
	const [openAddDropDownMenu, setOpenAddDropDownMenu] = useState(false)
	const [openSettingDropDownMenu, setOpenSettingDropDownMenu] = useState(false)
	const [openUserDropDownMenu, setOpenUserDropDownMenu] = useState(false)

	const dispatch = useDispatch<AppDispatch>()
	useEffect(() => {}, [])

	// setTimeout(() => {
	// 	store.dispatch(
	// 		configSlice.actions.setStatus({
	// 			type: 'loginModalStatus',
	// 			v: true,
	// 		})
	// 	)
  // }, 1000)
  
	return (
		<saki-modal
			max-width={config.deviceType === 'Mobile' ? 'auto' : '500px'}
			min-width={config.deviceType === 'Mobile' ? 'auto' : '400px'}
			max-height={config.deviceType === 'Mobile' ? 'auto' : '440px'}
			min-height={config.deviceType === 'Mobile' ? 'auto' : '400px'}
			width='100%'
			height='100%'
			border-radius={config.deviceType === 'Mobile' ? '0px' : ''}
			border={config.deviceType === 'Mobile' ? 'none' : ''}
			mask
			background-color='#fff'
			onClose={() => {
				dispatch(layoutSlice.actions.setOpenLoginModal(false))
			}}
			visible={layout.openLoginModal}
		>
			<div className='login-component'>
				<saki-modal-header
					ref={bindEvent({
						close: (e) => {
							dispatch(layoutSlice.actions.setOpenLoginModal(false))
						},
					})}
					closeIcon
					title={t('login', {
						ns: 'prompt',
					})}
				/>
				{layout.openLoginModal ? (
					<SakiSso
						onLogin={(e) => {
							loginDebounce.increase(() => {
								console.log('login', e)
								store.dispatch(
									userSlice.actions.login({
										token: e.detail.token,
										deviceId: e.detail.deviceId,
										userInfo: e.detail.userInfo,
									})
								)

								dispatch(layoutSlice.actions.setOpenLoginModal(false))
							}, 100)
						}}
						style={{
							flex: 1,
						}}
						class='disabled-dark'
						language={config.language}
						// appearance={appearance.mode}
						app-id={sakisso.appId}
						url={sakisso.clientUrl + '/login'}
					/>
				) : (
					''
				)}
			</div>
		</saki-modal>
	)
}

export default LoginComponent
