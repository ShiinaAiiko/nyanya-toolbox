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

import moment from 'moment'

import { alert, bindEvent, snackbar } from '@saki-ui/core'
// console.log(sakiui.bindEvent)
import { storage } from '../store/storage'
import { useTranslation } from 'react-i18next'
import { protoRoot } from '../protos'

const StatisticsComponent = ({
	statisticsData,
}: {
	statisticsData?: protoRoot.moveCarQRC.IMoveCarQRCItemStatistics
}) => {
	const { t, i18n } = useTranslation('moveCarQRCPage')
	const config = useSelector((state: RootState) => state.config)
	const layout = useSelector((state: RootState) => state.layout)
	const dispatch = useDispatch<AppDispatch>()

	return (
		<saki-modal
			ref={bindEvent({
				close() {
					dispatch(layoutSlice.actions.setOpenStatisticsModal(false))
				},
			})}
			width='100%'
			height={config.deviceType === 'Mobile' ? '100%' : 'auto'}
			max-width={config.deviceType === 'Mobile' ? '100%' : '500px'}
			max-height={config.deviceType === 'Mobile' ? '100%' : '600px'}
			mask
			border-radius={config.deviceType === 'Mobile' ? '0px' : ''}
			border={config.deviceType === 'Mobile' ? 'none' : ''}
			mask-closable='false'
			background-color='#fff'
			visible={layout.openStatisticsModal}
		>
			<div className={'statistics-component ' + config.deviceType}>
				<div className='s-header'>
					<saki-modal-header
						border
						close-icon={true}
						ref={bindEvent({
							close() {
								dispatch(layoutSlice.actions.setOpenStatisticsModal(false))
							},
						})}
						title={t('statistics')}
					></saki-modal-header>
				</div>
				<div className='s-main'>
					<saki-title margin='0 0 10px 0' level='4' color='default'>
						{t('statistics')}
					</saki-title>
					<div className='s-m-p-i-content'>
						<div className='s-m-p-i-left'>{t('scanCount')}</div>
						<div className='s-m-p-i-right'>{statisticsData?.scanCount||0}</div>
					</div>
					<div className='s-m-p-i-content'>
						<div className='s-m-p-i-left'>{t('callCount')}</div>
						<div className='s-m-p-i-right'>{statisticsData?.callCount||0}</div>
					</div>
					<div className='s-m-p-i-content'>
						<div className='s-m-p-i-left'>{t('sendEmailCount')}</div>
						<div className='s-m-p-i-right'>
							{statisticsData?.sendEmailCount||0}
						</div>
					</div>
					<div className='s-m-p-i-content'>
						<div className='s-m-p-i-left'>{t('addWeChatCount')}</div>
						<div className='s-m-p-i-right'>
							{statisticsData?.addWeChatCount||0}
						</div>
					</div>
				</div>
			</div>
		</saki-modal>
	)
}

export default StatisticsComponent
