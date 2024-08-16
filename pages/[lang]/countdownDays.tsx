import Head from 'next/head'
import ToolboxLayout, { getLayout } from '../../layouts/Toolbox'
import Link from 'next/link'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import path from 'path'
import store, {
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
import { bindEvent, snackbar, progressBar, alert, prompt } from '@saki-ui/core'
import { deepCopy, getShortId, QueueLoop } from '@nyanyajs/utils'
import {
	getRegExp,
	copyText,
	getRandomPassword,
	showSnackbar,
	downloadFile,
} from '../../plugins/methods'
import {
	changeLanguage,
	languages,
	defaultLanguage,
} from '../../plugins/i18n/i18n'
import {
	SakiButton,
	SakiCol,
	SakiContextMenu,
	SakiDropdown,
	SakiIcon,
	SakiInput,
	SakiMenuItem,
	SakiModal,
	SakiModalHeader,
	SakiRow,
	SakiSwitch,
	SakiTitle,
} from '../../components/saki-ui-react/components'
import {
	countdownDaysMethods,
	countdownDaysSlice,
} from '../../store/countdownDays'
import moment from 'moment'
import { t } from 'i18next'
import { storage } from '../../store/storage'
import { protoRoot } from '../../protos'
import { circle } from 'leaflet'

let count = 0

const FormatNextDate = ({
	val,
}: {
	val: protoRoot.countdownDays.ICountdownDaysEvent
}) => {
	const { t, i18n } = useTranslation('countdownDaysPage')
	// const nextDay = getCountdownDay(val)
	return (
		<span>
			{(val?.repeatType?.type === 'Never' ? t('startDate') : t('nextDate')) +
				': ' +
				(val.countdownData?.nextDate || moment(val.date).format('LL dddd'))}
		</span>
	)
}

let timer: NodeJS.Timeout

const CountdownDaysTime = memo(({}: {}) => {
	const { t, i18n } = useTranslation('countdownDaysPage')
	// const nextDay = getCountdownDay(val)

	const [updateTime, setUpdateTime] = useState(new Date().getTime())
	const [mounted, setMounted] = useState(false)

	const [showPageTitle, setShowPageTitle] = useState(false)

	useEffect(() => {
		setMounted(true)
		setTimeout(() => {
			setShowPageTitle(true)
		}, 2000)
	}, [])

	useEffect(() => {
		clearInterval(timer)

		if (typeof window !== 'undefined') {
			mounted &&
				setTimeout(() => {
					setUpdateTime(new Date().getTime())

					timer = setInterval(() => {
						setUpdateTime(new Date().getTime())
					}, 1000)
				}, 1000 - (new Date().getTime() % 1000))
		}
	}, [showPageTitle])

	const m = moment(updateTime)

	return (
		<div
			className='cd-m-header'
			onClick={() => {
				setShowPageTitle(!showPageTitle)
			}}
		>
			{mounted && showPageTitle ? (
				<div className='cd-m-time'>
					<div className='cd-m-t-time'>{m.format('HH:mm:ss')}</div>
					<div className='cd-m-t-date'>{m.format('YYYY-MM-DD dddd')}</div>
				</div>
			) : (
				<>
					<div className='cd-m-title'>{t('pageTitle')}</div>
					<div className='cd-m-subtitle'>{t('subtitle')}</div>
				</>
			)}
		</div>
	)
})

const CountdownDaysEventDetailComponent = ({
	val,
	width,
}: {
	val: protoRoot.countdownDays.ICountdownDaysEvent
	width: number
}) => {
	const { t, i18n } = useTranslation('countdownDaysPage')
	// const nextDay = getCountdownDay(val)

	return (
		<div
			style={
				{
					'--width': width + 'px',
				} as any
			}
			className={
				'countdown-days-event-detail ' +
				(val?.repeatType?.type === 'Never' ? 'neverRepeat' : '')
			}
		>
			<div className='cde-top'>
				{val?.repeatType?.type === 'Never'
					? t('nameAlready', {
							name: val.name,
					  })
					: t('nameArrivesIn', {
							name: val.name,
					  })}
			</div>
			<div
				className={
					'cde-center ' +
					(Number(val.countdownData?.day) > 100000
						? 'h1'
						: Number(val.countdownData?.day) > 10000
						? 'h2'
						: Number(val.countdownData?.day) > 1000
						? 'h3'
						: 'normal')
				}
			>
				{val.countdownData?.day}
			</div>
			<div className='cde-bottom'>
				<FormatNextDate val={val} />
			</div>
		</div>
	)
}

const CountdownDaysEventDetailModalComponent = ({
	visible,
	val,
	onClose,
	onEdit,
}: {
	visible: boolean
	val?: protoRoot.countdownDays.ICountdownDaysEvent
	onClose: () => void
	onEdit: (val: protoRoot.countdownDays.ICountdownDaysEvent) => void
}) => {
	const { t, i18n } = useTranslation('countdownDaysPage')
	const countdownDays = useSelector((state: RootState) => state.countdownDays)

	const config = useSelector((state: RootState) => state.config)

	const cateName = countdownDays.categories?.filter(
		(sv) => sv.id === val?.categoryId
	)?.[0]?.name

	return (
		<SakiModal
			onClose={() => {
				// setShowManageMyQRCModal(false)
				onClose()
			}}
			visible={visible}
			width='100%'
			height={config.deviceType === 'Mobile' ? '100%' : '600px'}
			max-width={config.deviceType === 'Mobile' ? '100%' : '600px'}
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
				backgroundColor='transparent'
				ref={
					bindEvent({
						close() {
							onClose()
						},
					}) as any
				}
			>
				<div slot='right'>
					<SakiRow alignItems='center'>
						<SakiButton
							onTap={() => {
								val && onEdit(val)
							}}
							margin='0 10px 0 0'
							type='CircleIconGrayHover'
						>
							<SakiIcon color='#999' type='Pen'></SakiIcon>
						</SakiButton>
					</SakiRow>
				</div>
			</SakiModalHeader>
			<div className='countdown-days-event-detail-modal'>
				{val?.id ? (
					<>
						<CountdownDaysEventDetailComponent
							val={val}
							width={config.deviceWH.w < 440 ? config.deviceWH.w - 40 : 400}
						/>
						<div className='cded-detail'>
							{cateName ? (
								<>
									<span className='desc-category'>
										{val?.categoryId ? cateName : ''}
									</span>
									<span className='desc-spacing'>-</span>
								</>
							) : (
								''
							)}
							<span>
								{val?.repeatType?.num === 0
									? t('neverRepeat')
									: t('repeat' + val?.repeatType?.type, {
											num: val?.repeatType?.num,
									  })}
							</span>
						</div>
					</>
				) : (
					''
				)}
			</div>
		</SakiModal>
	)
}
const CreateEventModalComponent = memo(
	({
		visible,
		val,
		onClose,
		onComfirm,
	}: {
		visible: boolean
		val?: protoRoot.countdownDays.ICountdownDaysEvent
		onClose: () => void
		onComfirm: () => void
	}) => {
		const { t, i18n } = useTranslation('countdownDaysPage')
		const config = useSelector((state: RootState) => state.config)
		const countdownDays = useSelector((state: RootState) => state.countdownDays)

		const [name, setName] = useState('')
		const [nameErr, setNameErr] = useState('')
		const [date, setDate] = useState('')
		const [categoryId, setCategoryId] = useState('')
		const [repeatType, setRepeatType] = useState<{
			type: 'Never' | 'Day' | 'Week' | 'Month' | 'Year'
			num: number
		}>({
			type: 'Never',
			num: 0,
		})
		const [top, setTop] = useState(false)

		const [disableComfirmButton, setDisableComfirmButton] = useState(true)

		const [openCategoryDropdown, setOpenCategoryDropdown] = useState(false)
		const [openRepeatDropdown, setOpenRepeatDropdown] = useState(false)
		const [openDateDatePicker, setOpenDateDatePicker] = useState(false)

		const dispatch = useDispatch<AppDispatch>()

		useEffect(() => {
			verfiyNextButton()
		}, [name])

		useEffect(() => {
			setName(val?.name || '')
			setDate(val?.date || '')
			setCategoryId(val?.categoryId || '')
			setRepeatType(
				(val?.repeatType as any) || {
					type: 'Never',
					num: 0,
				}
			)
			setTop(val?.top || false)
			// console.log('mcqrc?.colorTheme', mcqrc?.colorTheme)
		}, [val])
		// console.log('colorThemeType', colorTheme, colorThemeType)

		const verfiyNextButton = () => {
			// console.log('verfiyNextButton')

			setDisableComfirmButton(!name)

			// setNameErr(
			// 	!name
			// 		? t('cannotBeEmpty', {
			// 				ns: 'prompt',
			// 		  })
			// 		: ''
			// )
		}

		console.log('CreateEventModalComponent')

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
				zIndex={1100}
			>
				<SakiModalHeader
					closeIcon
					title={!val?.id ? t('createEvent', {}) : t('updateEvent', {})}
					ref={
						bindEvent({
							close() {
								onClose()
							},
						}) as any
					}
				></SakiModalHeader>
				<div className='edit-countdown-days-event-modal'>
					{val?.id ? (
						<>
							<SakiTitle margin='10px 0 6px 0' level={5} color='default'>
								{t('id')}
							</SakiTitle>
							<div
								style={{
									margin: '0 0 10px 0',
									color: '#666',
								}}
								className='ecd-id'
							>
								{val?.id}
							</div>
						</>
					) : (
						''
					)}
					<SakiInput
						onChangevalue={(e) => {
							setNameErr(
								!e.detail
									? t('cannotBeEmpty', {
											ns: 'prompt',
									  })
									: ''
							)
							setName(e.detail)
						}}
						value={name}
						height='50px'
						margin='0 0 10px 0'
						placeholder={t('eventName')}
						error={nameErr}
						type='Text'
						placeholderAnimation='MoveUp'
					></SakiInput>

					<SakiInput
						onChangevalue={(e) => {
							console.log(e)
							const dateArr = e.detail.split('-')
							const y = Number(dateArr[0])
							const m = Number(dateArr[1])
							const d = Number(dateArr[2])
							const date = new Date(y + '-' + m + '-' + d)
							const t = date.getTime()

							if (!!t && y > 1000 && m >= 0 && m <= 11 && d >= 0 && d <= 31) {
								setDate(moment(e.detail).format('YYYY-MM-DD'))
							}
						}}
						onPressenter={() => {}}
						onFocusfunc={() => {
							console.log('focus')
							setOpenDateDatePicker(true)
						}}
						width='100%'
						padding='28px 0px 14px'
						value={date ? moment(date).format('YYYY-MM-DD dddd') : ''}
						border-radius='10px'
						font-size='16px'
						margin='20px 0 0'
						placeholder={t('eventDate')}
						border='1px solid var(--defaul-color)'
						placeholderAnimation='MoveUp'
					></SakiInput>
					<saki-date-picker
						ref={bindEvent({
							close: () => {
								setOpenDateDatePicker(false)
							},
							selectdate: (e) => {
								console.log(e)
								setDate(moment(e.detail.date).format('YYYY-MM-DD'))
								setOpenDateDatePicker(false)
							},
						})}
						date={date}
						visible={openDateDatePicker}
						time-picker
						mask
						z-index={1300}
					></saki-date-picker>

					<div className='ecd-item'>
						<SakiTitle margin='0 0 6px 0' level={5} color='default'>
							{t('eventCategory')}
						</SakiTitle>
						<saki-dropdown
							visible={openCategoryDropdown}
							floating-direction='Left'
							z-index='1105'
							ref={bindEvent({
								close: (e) => {
									setOpenCategoryDropdown(false)
								},
							})}
						>
							<saki-button
								ref={bindEvent({
									tap: async () => {
										setOpenCategoryDropdown(true)
									},
								})}
								margin='0 0 0 0px'
								padding={'6px 10px'}
								font-size='14px'
								border='none'
							>
								<span>
									{countdownDays.categories?.filter(
										(v) => v.id === categoryId
									)?.[0]?.name || t('selectEventCategory')}
								</span>
								<SakiIcon
									margin='0 0 0 6px'
									width='12px'
									color='#999'
									type='Bottom'
								></SakiIcon>
							</saki-button>
							<div slot='main'>
								<saki-menu
									ref={bindEvent({
										selectvalue: async (e) => {
											setCategoryId(e.detail.value)
											setOpenCategoryDropdown(false)
										},
									})}
								>
									{countdownDays.categories.map((v) => {
										return (
											<saki-menu-item
												key={v.id}
												padding='10px 18px'
												value={v.id}
											>
												<span>{v.name}</span>
											</saki-menu-item>
										)
									})}
								</saki-menu>
							</div>
						</saki-dropdown>
					</div>

					{/* <div className='ecd-item'>
					<SakiTitle margin='0 0 6px 0' level={5} color='default'>
						{t('pinTop')}
					</SakiTitle>
					{String(top)}
					<SakiSwitch
						ref={
							bindEvent({
								change: (e) => {
									console.log(e)

									setTop(e.detail)
								},
							}) as any
						}
						value={top}
					></SakiSwitch>
				</div> */}
					<div className='ecd-item'>
						<SakiTitle margin='0 0 6px 0' level={5} color='default'>
							{t('repeat')}
						</SakiTitle>
						<div className='ecd-i-right'>
							<saki-dropdown
								visible={openRepeatDropdown}
								floating-direction='Left'
								z-index='1105'
								ref={bindEvent({
									close: (e) => {
										setOpenRepeatDropdown(false)
									},
								})}
							>
								<saki-button
									ref={bindEvent({
										tap: async () => {
											setOpenRepeatDropdown(true)
										},
									})}
									margin='0 0 0 0px'
									padding={'6px 10px'}
									font-size='14px'
									border='none'
								>
									<span>
										{repeatType?.num === 0
											? t('neverRepeat')
											: t('repeat' + repeatType?.type, {
													num: repeatType?.num,
											  })}
									</span>
									<SakiIcon
										margin='0 0 0 6px'
										width='12px'
										color='#999'
										type='Bottom'
									></SakiIcon>
								</saki-button>
								<div className='repeat-dropdown' slot='main'>
									<div className='rd-left scrollBarHover'>
										<saki-menu
											ref={bindEvent({
												selectvalue: async (e) => {
													if (!Number(e.detail.value)) {
														setRepeatType({
															type: 'Never',
															num: 0,
														})
														return
													}
													setRepeatType({
														num: Number(e.detail.value),
														type:
															repeatType?.type === 'Never'
																? 'Day'
																: repeatType?.type,
													})
												},
											})}
										>
											{new Array(100).fill(1).map((v, i) => {
												return (
													<saki-menu-item
														key={i}
														active={repeatType?.num === i}
														padding='10px 28px'
														value={i}
													>
														<span>
															{i === 0
																? t('neverRepeat')
																: t('every', {
																		num: i,
																  })}
														</span>
													</saki-menu-item>
												)
											})}
										</saki-menu>
									</div>
									<div className='rd-right scrollBarHover'>
										<saki-menu
											ref={bindEvent({
												selectvalue: async (e) => {
													if (e.detail.value === 'Never') {
														setRepeatType({
															type: 'Never',
															num: 0,
														})
														return
													}
													setRepeatType({
														type: e.detail.value,
														num: !repeatType?.num ? 1 : repeatType?.num,
													})
												},
											})}
										>
											{['Never', 'Day', 'Week', 'Month', 'Year'].map((v, i) => {
												return (
													<saki-menu-item
														key={i}
														active={repeatType?.type === v}
														padding='10px 28px'
														value={v}
													>
														<span>
															{v === 'Never'
																? t('neverRepeat')
																: t(v.toLowerCase())}
														</span>
													</saki-menu-item>
												)
											})}
										</saki-menu>
									</div>
								</div>
							</saki-dropdown>
						</div>
					</div>
					<div className='ecd-buttons'>
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

									if (!date) {
										showSnackbar(t('noDateSelectedYet'))
										return
									}

									if (!categoryId) {
										showSnackbar(t('noCategorySelectedYet'))
										return
									}

									if (val?.id) {
										dispatch(
											methods.countdownDays.updateCountdownDaysEvent({
												id: val.id,
												name,
												date,
												categoryId,
												repeatType,
												top,
											})
										)
										onClose()
										return
									}

									dispatch(
										methods.countdownDays.addCountdownDaysEvent({
											name,
											date,
											categoryId,
											repeatType,
											top,
										})
									)
									onClose()
								},
							})}
							margin='0 0 0 10px'
							padding='8px 18px'
							font-size='14px'
							type='Primary'
							disabled={disableComfirmButton}
						>
							{!val?.id
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
)

const CountdownDaysPage = () => {
	const { t, i18n } = useTranslation('countdownDaysPage')
	const [mounted, setMounted] = useState(false)

	const config = useSelector((state: RootState) => state.config)
	const countdownDays = useSelector((state: RootState) => state.countdownDays)
	const user = useSelector((state: RootState) => state.user)

	const cdItemContextMenuEl = useRef<any>()
	const eventItemContextMenuEl = useRef<any>()

	// console.log('CountdownDaysPage')
	const [contentMenuActiveIndex, setContentMenuActiveIndex] =
		useState<number>(-1)

	const [updateTime, setUpdateTime] = useState(0)
	const [eventItemActiveIndex, setEventItemActiveIndex] = useState<number>(-1)
	const [showCategoryId, setShowCategoryId] = useState('All')
	const [openCategoryDropdown, setOpenCategoryDropdown] = useState(false)
	const [openDownloadDropdown, setOpenDownloadDropdown] = useState(false)

	const [
		openCountdownDaysEventDetailModal,
		setOpenCountdownDaysEventDetailModal,
	] = useState(false)

	const [openCreateDayEventModal, setOpenCreateDayEventModal] = useState(false)
	const [editEventItem, setEditEventItem] =
		useState<protoRoot.countdownDays.ICountdownDaysEvent>()

	const createEventModalMemo = useMemo((): Parameters<
		typeof CreateEventModalComponent
	>[0] => {
		return {
			visible: openCreateDayEventModal,
			val: editEventItem,
			onClose() {
				setOpenCreateDayEventModal(false)
				setEditEventItem(undefined)
			},
			onComfirm() {},
		}
	}, [openCreateDayEventModal, editEventItem])

	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => {
		// window.addEventListener('focus', () => {
		// 	setUpdateTime(new Date().getTime())
		// })
		setMounted(true)
		dispatch(configSlice.actions.setSsoAccount(true))

		dispatch(methods.countdownDays.init()).unwrap()
		setTimer()
	}, [])

	const setTimer = () => {
		// console.log(
		// 	3600 * 24 * 1000 -
		// 		(new Date().getTime() -
		// 			new Date(moment().format('YYYY-MM-DD 00:00:00')).getTime())
		// )
		setTimeout(() => {
			// console.log('setTimer')
			// setUpdateTime(new Date().getTime())
			const { countdownDays } = store.getState()
			dispatch(countdownDaysSlice.actions.setList(countdownDays.list || []))
			setTimer()
		// }, 5000)
		}, 3600 * 24 * 1000 - (new Date().getTime() - new Date(moment().format('YYYY-MM-DD 00:00:00')).getTime()))
	}

	useEffect(() => {
		dispatch(layoutSlice.actions.setLayoutHeaderLogoText(t('pageTitle')))
	}, [i18n.language])

	useEffect(() => {
		console.log(
			user.isLogin,
			countdownDays.lastUpdateTime !== 0,
			!countdownDays.downloadDataStatus.saass
		)
		user.isLogin &&
			countdownDays.lastUpdateTime !== 0 &&
			!countdownDays.downloadDataStatus.saass &&
			dispatch(methods.countdownDays.downloadData())
	}, [user.isLogin])

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
			<div className='countdown-days-page'>
				<div className='cd-main'>
					<CountdownDaysTime />

					{mounted && (
						<>
							<div className='cd-m-list'>
								<div className='cd-m-l-header'>
									<div className='rp-m-b-left'>
										<div className='rp-m-b-l-category'>
											<SakiDropdown
												visible={openCategoryDropdown}
												floating-direction='Left'
												z-index='1001'
												ref={
													bindEvent({
														close: () => {
															console.log('SakiDropdown')
															setOpenCategoryDropdown(false)
														},
													}) as any
												}
											>
												<SakiButton
													className='rp-m-b-l-c-button'
													onTap={() => {
														console.log(openCategoryDropdown)
														setOpenCategoryDropdown(true)
													}}
													type={'Normal'}
													border='none'
													padding='8px 12px'
												>
													<span>
														{showCategoryId === 'All'
															? t('allCategory')
															: countdownDays.categories?.filter(
																	(v) => v.id === showCategoryId
															  )?.[0]?.name || ''}
													</span>
													<SakiIcon
														color='#666'
														width='12px'
														type='Bottom'
														margin={'0 0 0 6px'}
													></SakiIcon>
												</SakiButton>
												<div slot='main'>
													<SakiTitle
														margin='16px 16px 10px'
														fontSize='10px'
														color='#999'
													>
														<span>CATEGORIES</span>
													</SakiTitle>
													<saki-menu
														padding={''}
														ref={bindEvent({
															selectvalue: async (e) => {
																console.log(
																	e.detail.value,
																	countdownDays.categories?.filter(
																		(v) => v.id === e.detail.value
																	)?.[0]?.name
																)
																switch (e.detail.value) {
																	case 'AddCategory':
																		dispatch(
																			countdownDaysMethods.addAndUpdateCategory(
																				{}
																			)
																		)

																		break

																	default:
																		setShowCategoryId(e.detail.value)
																		setOpenCategoryDropdown(false)
																		break
																}
															},
														})}
													>
														<SakiMenuItem padding='12px 18px' value={'All'}>
															<span>{t('allCategory')}</span>
														</SakiMenuItem>
														<saki-drag-sort
															ref={bindEvent({
																dragdone: (e) => {
																	console.log(e.detail)

																	const list = [...countdownDays.categories]
																	const { originalIndex, targetIndex } =
																		e.detail
																	if (originalIndex === targetIndex) return
																	if (originalIndex < targetIndex) {
																		for (
																			let i = originalIndex;
																			i < targetIndex;
																			i++
																		) {
																			;[list[i], list[i + 1]] = [
																				list[i + 1],
																				list[i],
																			]
																		}
																	} else {
																		for (
																			let i = originalIndex;
																			i > targetIndex;
																			i--
																		) {
																			;[list[i], list[i - 1]] = [
																				list[i - 1],
																				list[i],
																			]
																		}
																	}

																	dispatch(
																		countdownDaysSlice.actions.setCategories(
																			list || []
																		)
																	)
																},
															})}
															sort
														>
															{countdownDays?.categories?.map((v, i) => {
																return (
																	<SakiMenuItem
																		key={v.id}
																		onOpencontextmenu={(e) => {
																			setContentMenuActiveIndex(i)
																			cdItemContextMenuEl.current?.show({
																				x: e.detail.pageX,
																				y: e.detail.pageY,
																				label: i.toString(),
																			})
																		}}
																		padding='12px 18px'
																		value={v.id || ''}
																	>
																		<span>{v.name}</span>
																	</SakiMenuItem>
																)
															})}
														</saki-drag-sort>
														<saki-menu-item
															padding='12px 18px'
															value={'AddCategory'}
														>
															<span
																style={{
																	color: 'var(--saki-default-color)',
																}}
															>
																{t('addCategory')}
															</span>
														</saki-menu-item>
													</saki-menu>
												</div>
											</SakiDropdown>
										</div>
									</div>
									<div className='rp-m-b-right'>
										<SakiDropdown
											visible={openDownloadDropdown}
											floating-direction='Left'
											z-index='1001'
											ref={
												bindEvent({
													close: () => {
														setOpenDownloadDropdown(false)
													},
												}) as any
											}
										>
											<SakiButton
												onTap={() => {
													setOpenDownloadDropdown(true)
												}}
												type={'CircleIconGrayHover'}
												border='none'
												margin='0 0 0 10px'
												padding='8px 12px'
											>
												<SakiIcon
													color='#999'
													width='20px'
													height='20px'
													type='Download'
												></SakiIcon>
											</SakiButton>
											<div slot='main'>
												<saki-menu
													ref={bindEvent({
														selectvalue: async (e) => {
															switch (e.detail.value) {
																case 'Backup':
																	alert({
																		title: t('backup', {
																			ns: 'prompt',
																		}),
																		content: t('backupContent', {
																			ns: 'prompt',
																			appName: t('pageTitle'),
																		}),
																		cancelText: t('cancel', {
																			ns: 'prompt',
																		}),
																		confirmText: t('download', {
																			ns: 'prompt',
																		}),
																		onConfirm() {
																			const cdData: protoRoot.countdownDays.ICountdownDaysData =
																				{
																					categories: countdownDays.categories,
																					list: countdownDays.list,
																					authorId: user.userInfo.uid,
																					createTime: countdownDays.createTime,
																					lastUpdateTime:
																						countdownDays.lastUpdateTime,
																				}

																			const file = new File(
																				[
																					new Blob(
																						[JSON.stringify(cdData, null, 4)],
																						{
																							type: 'application/json',
																						}
																					),
																				],
																				'CountdownDaysData.json',
																				{
																					type: 'application/json',
																				}
																			)
																			downloadFile(
																				file,
																				'CountdownDaysData.json'
																			)
																		},
																	}).open()

																	break
																case 'Restore':
																	const ipt = document.createElement('input')

																	ipt.type = 'file'
																	ipt.accept = 'application/json'

																	ipt.oninput = (e) => {
																		console.log(ipt?.files)
																		if (ipt?.files?.length) {
																			const reader = new FileReader()

																			reader.onload = async (e) => {
																				if (!e.target?.result) {
																					return
																				}

																				const data: protoRoot.countdownDays.ICountdownDaysData =
																					JSON.parse(
																						String(e.target?.result) || '{}'
																					)
																				if (data) {
																					alert({
																						title: t('replace', {
																							ns: 'prompt',
																						}),
																						content: t('replaceContent', {
																							ns: 'prompt',
																						}),
																						cancelText: t('cancel', {
																							ns: 'prompt',
																						}),
																						confirmText: t('replace', {
																							ns: 'prompt',
																						}),
																						onConfirm() {
																							console.log(data)
																							dispatch(
																								countdownDaysMethods.replaceData(
																									data
																								)
																							)
																						},
																					}).open()
																				}
																			}
																			reader.readAsText(ipt.files[0])
																		}
																	}
																	ipt.click()
																	break
																case 'SaaSFileRename':
																	alert({
																		title: t('SaaSFileRename'),
																		content: t('SaaSFileRenameContent'),
																		cancelText: t('cancel', {
																			ns: 'prompt',
																		}),
																		confirmText: t('rename', {
																			ns: 'prompt',
																		}),
																		onConfirm() {
																			store.dispatch(
																				countdownDaysMethods.syncData({
																					rename: true,
																				})
																			)
																		},
																	}).open()
																	break
																case 'ViewOriginalFile':
																	window.open(
																		'https://cloud.aiiko.club/?p=/appData/NyaNyaToolbox/countdownDays'
																	)
																	break

																case 'OnlineBackup':
																	if (user.isLogin) {
																		showSnackbar(
																			t('onlineBackupEnabledSnackbar')
																		)
																	} else {
																		alert({
																			title: t('enableOnlineBackup'),
																			content: t('enableOnlineBackupContent'),
																			cancelText: t('cancel', {
																				ns: 'prompt',
																			}),
																			confirmText: t('login', {
																				ns: 'prompt',
																			}),
																			onConfirm() {
																				dispatch(
																					layoutSlice.actions.setOpenLoginModal(
																						true
																					)
																				)
																			},
																		}).open()
																	}
																	break

																default:
																	break
															}

															setOpenDownloadDropdown(false)
														},
													})}
												>
													<SakiMenuItem padding='12px 18px' value={'Backup'}>
														<span>
															{t('backup', {
																ns: 'prompt',
															})}
														</span>
													</SakiMenuItem>
													<saki-menu-item padding='12px 18px' value={'Restore'}>
														<span>
															{t('restore', {
																ns: 'prompt',
															})}
														</span>
													</saki-menu-item>
													<saki-menu-item
														padding='12px 18px'
														value={'OnlineBackup'}
													>
														<span
															style={{
																color: user.isLogin
																	? 'var(--saki-default-color)'
																	: '',
															}}
														>
															{user.isLogin
																? t('onlineBackupEnabled')
																: t('enableOnlineBackup')}
														</span>
													</saki-menu-item>
													<saki-menu-item
														padding='12px 18px'
														value={'SaaSFileRename'}
													>
														<span>{t('SaaSFileRename')}</span>
													</saki-menu-item>
													<saki-menu-item
														padding='12px 18px'
														value={'ViewOriginalFile'}
													>
														<span>{t('viewOriginalFile')}</span>
													</saki-menu-item>
												</saki-menu>
											</div>
										</SakiDropdown>
										<SakiButton
											className='rp-m-b-r-create'
											onTap={() => {
												dispatch(
													countdownDaysSlice.actions.setShowType(
														countdownDays.showType === 'List' ? 'Grid' : 'List'
													)
												)
											}}
											type={'CircleIconGrayHover'}
											border='none'
											margin='0 0 0 10px'
											padding='8px 12px'
										>
											{countdownDays.showType === 'List' ? (
												<SakiIcon
													color='#999'
													width='20px'
													height='20px'
													type='List'
												></SakiIcon>
											) : (
												<SakiIcon
													color='#999'
													width='20px'
													height='20px'
													type='Grid'
												></SakiIcon>
											)}
										</SakiButton>
										<SakiButton
											className='rp-m-b-r-create'
											onTap={() => {
												setOpenCreateDayEventModal(true)
											}}
											type={'Primary'}
											border='none'
											margin='0 0 0 10px'
											padding='8px 12px'
										>
											<span>
												{t('create', {
													ns: 'prompt',
												})}
											</span>
										</SakiButton>
									</div>
								</div>
								<div className={'cd-m-l-list ' + countdownDays.showType}>
									{countdownDays.list
										.filter((v) => {
											if (showCategoryId === 'All') return true
											return v.categoryId === showCategoryId
										})
										.map((v, i) => {
											// const nextDay = getCountdownDay(v)

											const cateName = countdownDays.categories?.filter(
												(sv) => sv.id === v.categoryId
											)?.[0]?.name
											return (
												<div
													key={i}
													onContextMenu={(e) => {
														console.log(e)

														setEventItemActiveIndex(i)
														eventItemContextMenuEl.current?.show({
															x: e.pageX,
															y: e.pageY,
															label: i.toString(),
														})
														e.preventDefault()
													}}
													onClick={() => {
														dispatch(
															countdownDaysSlice.actions.setShowEventItemId(
																v?.id || ''
															)
														)
														setOpenCountdownDaysEventDetailModal(true)
													}}
													className='cd-l-item'
												>
													{countdownDays.showType === 'Grid' ? (
														<div
															data-w={config.deviceWH.w}
															className='cd-l-item-grid'
														>
															<CountdownDaysEventDetailComponent
																val={v}
																width={
																	config.deviceWH.w < 737
																		? config.deviceWH.w < 600
																			? config.deviceWH.w < 400
																				? config.deviceWH.w * 0.42
																				: config.deviceWH.w * 0.43
																			: config.deviceWH.w * 0.3
																		: 220
																}
															/>
															{/* <div className='cd-l-i-g-top'>Top</div> */}
														</div>
													) : (
														<div
															className={
																'cd-l-item-list ' +
																(v.repeatType?.type === 'Never'
																	? 'neverRepeat'
																	: '')
															}
														>
															<div className='cd-l-i-left'>
																<div className='cd-l-i-l-name'>
																	<span>{v.name}</span>
																</div>
																<div className='cd-l-i-l-desc'>
																	{/* {v.top ? (
																	<span className='desc-top'>Top</span>
																) : (
																	''
																)} */}
																	{cateName ? (
																		<span className='desc-category'>
																			{v.categoryId ? cateName : ''}
																		</span>
																	) : (
																		''
																	)}
																	<span className='desc-nextDate'>
																		{/* {nextDay.nextDate
																? '' + nextDay.nextDate + ''
																: ''} */}

																		<FormatNextDate val={v} />
																	</span>
																	<span className='desc-repeatType'>
																		{v.repeatType?.num === 0
																			? ''
																			: '· ' +
																			  t('repeat' + v.repeatType?.type, {
																					num: v.repeatType?.num,
																			  })}
																	</span>
																</div>
															</div>
															<div
																className={
																	'cd-l-i-c-day ' +
																	(v.repeatType?.type === 'Never'
																		? 'neverRepeat'
																		: '')
																}
															>
																<span
																	className={
																		Number(v.countdownData?.day) > 100000
																			? 'small'
																			: 'normal'
																	}
																>
																	{v.countdownData?.day}
																</span>

																{/* <div className='cd-l-i-r-type'>{t('day')}</div> */}
															</div>
														</div>
													)}
												</div>
											)
										})}
								</div>
							</div>

							<CreateEventModalComponent
								visible={createEventModalMemo.visible}
								onClose={createEventModalMemo.onClose}
								val={createEventModalMemo.val}
								onComfirm={createEventModalMemo.onComfirm}
							/>

							<CountdownDaysEventDetailModalComponent
								visible={openCountdownDaysEventDetailModal}
								val={
									countdownDays.list.filter(
										(v) => v.id === countdownDays.showEventItemId
									)?.[0]
								}
								onClose={() => {
									setOpenCountdownDaysEventDetailModal(false)
								}}
								onEdit={(val) => {
									setEditEventItem(val)
									setOpenCreateDayEventModal(true)
								}}
							/>

							<SakiContextMenu
								ref={cdItemContextMenuEl}
								z-index='1010'
								onSelectvalue={async (e) => {
									const cate = countdownDays.categories[contentMenuActiveIndex]

									switch (e.detail.value) {
										case 'rename':
											cate &&
												dispatch(
													countdownDaysMethods.addAndUpdateCategory({
														id: cate.id || '',
													})
												)

											break
										case 'delete':
											cate &&
												dispatch(
													countdownDaysMethods.deleteCategory({
														id: cate.id || '',
													})
												)
											break
										default:
											break
									}
								}}
							>
								<saki-context-menu-item
									width='100px'
									font-size='13px'
									padding='12px 10px'
									value='rename'
								>
									<SakiRow alignItems='center' justifyContent='flex-start'>
										<SakiIcon
											width='24px'
											height='13px'
											margin='0 4px 0 0'
											color='#999'
											type='Pen'
										></SakiIcon>
										<div>
											<span>
												{t('rename', {
													ns: 'prompt',
												})}
											</span>
										</div>
									</SakiRow>
								</saki-context-menu-item>

								<saki-context-menu-item
									width='100px'
									font-size='13px'
									padding='12px 10px'
									value='delete'
								>
									<SakiRow alignItems='center' justifyContent='flex-start'>
										<SakiIcon
											width='24px'
											height='16px'
											margin='0 4px 0 0'
											color='#999'
											type='Trash'
										></SakiIcon>

										<div>
											<span>
												{t('delete', {
													ns: 'prompt',
												})}
											</span>
										</div>
									</SakiRow>
								</saki-context-menu-item>
							</SakiContextMenu>

							<SakiContextMenu
								ref={eventItemContextMenuEl}
								z-index='1010'
								onSelectvalue={async (e) => {
									const item = countdownDays.list[eventItemActiveIndex]

									switch (e.detail.value) {
										case 'edit':
											if (item) {
												setEditEventItem(item)
												setOpenCreateDayEventModal(true)
											}

											break
										case 'delete':
											item &&
												dispatch(
													countdownDaysMethods.deleteCountdownDaysEvent({
														id: item.id || '',
													})
												)
											break
										default:
											break
									}
								}}
							>
								<saki-context-menu-item
									width='100px'
									font-size='13px'
									padding='12px 10px'
									value='edit'
								>
									<SakiRow alignItems='center' justifyContent='flex-start'>
										<SakiIcon
											width='24px'
											height='13px'
											margin='0 4px 0 0'
											color='#999'
											type='Pen'
										></SakiIcon>
										<div>
											<span>
												{t('edit', {
													ns: 'prompt',
												})}
											</span>
										</div>
									</SakiRow>
								</saki-context-menu-item>

								<saki-context-menu-item
									width='100px'
									font-size='13px'
									padding='12px 10px'
									value='delete'
								>
									<SakiRow alignItems='center' justifyContent='flex-start'>
										<SakiIcon
											width='24px'
											height='16px'
											margin='0 4px 0 0'
											color='#999'
											type='Trash'
										></SakiIcon>

										<div>
											<span>
												{t('delete', {
													ns: 'prompt',
												})}
											</span>
										</div>
									</SakiRow>
								</saki-context-menu-item>
							</SakiContextMenu>
						</>
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
CountdownDaysPage.getLayout = getLayout

export default CountdownDaysPage
