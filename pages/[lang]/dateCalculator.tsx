import Head from 'next/head'
import ToolboxLayout, { getLayout } from '../../layouts/Toolbox'
import Link from 'next/link'
import { useEffect, useState } from 'react'
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
import { bindEvent, snackbar, progressBar } from '@saki-ui/core'
import { deepCopy, QueueLoop } from '@nyanyajs/utils'
import {
	getRegExp,
	copyText,
	getRandomPassword,
	showSnackbar,
} from '../../plugins/methods'
import {
	changeLanguage,
	languages,
	defaultLanguage,
} from '../../plugins/i18n/i18n'
import {
	SakiButton,
	SakiInput,
	SakiTabs,
	SakiTabsItem,
} from '../../components/saki-ui-react/components'
import moment from 'moment'

const CountDaysComponent = () => {
	const { t, i18n } = useTranslation('dateCalculatorPage')
	const config = useSelector((state: RootState) => state.config)

	const [startDate, setStartDate] = useState('')
	const [endDate, setEndDate] = useState('')

	const [timeDiff, setTimeDiff] = useState(0)
	const [showTimeDiff, setShowTimeDiff] = useState(false)
	const [openStartDateDatePicker, setOpenStartDateDatePicker] = useState(false)
	const [openEndDateDatePicker, setOpenEndDateDatePicker] = useState(false)

	return (
		<div className='dc-m-count-days'>
			<div className='dc-m-i-item'>
				<SakiInput
					onChangevalue={(e) => {
						const dateArr = e.detail.split('-')
						const y = Number(dateArr[0])
						const m = Number(dateArr[1])
						const d = Number(dateArr[2])
						const date = new Date(y + '-' + m + '-' + d)
						const t = date.getTime()

						if (!!t && y > 1000 && m >= 0 && m <= 11 && d >= 0 && d <= 31) {
							setStartDate(e.detail)
						}
					}}
					onPressenter={() => {}}
					onFocus={() => {
						setOpenStartDateDatePicker(true)
					}}
					width='100%'
					padding='28px 0px 14px'
					value={startDate ? moment(startDate).format('YYYY-M-D') : ''}
					border-radius='10px'
					font-size='16px'
					margin='20px 0 0'
					placeholder={t('startDate')}
					border='1px solid var(--defaul-color)'
					placeholderAnimation='MoveUp'
				></SakiInput>
				<saki-button
					ref={bindEvent({
						tap: () => {
							setOpenStartDateDatePicker(false)
							setOpenEndDateDatePicker(false)
							setStartDate(moment().format('YYYY-M-D'))
						},
					})}
					margin='20px 0 0'
					padding='12px 18px'
					font-size='14px'
					border='none'
					color='var(--saki-default-color)'
				>
					<span>{t('Today')}</span>
				</saki-button>
			</div>
			<saki-date-picker
				ref={bindEvent({
					close: () => {
						setOpenStartDateDatePicker(false)
					},
					selectdate: (e) => {
						console.log(e)
						setStartDate(e.detail.date)
						setOpenStartDateDatePicker(false)
					},
				})}
				date={startDate}
				visible={openStartDateDatePicker}
				time-picker
			></saki-date-picker>
			<div className='dc-m-i-item'>
				<SakiInput
					onChangevalue={(e) => {
						const dateArr = e.detail.split('-')
						const y = Number(dateArr[0])
						const m = Number(dateArr[1])
						const d = Number(dateArr[2])
						const date = new Date(y + '-' + m + '-' + d)
						const t = date.getTime()

						if (!!t && y > 1000 && m >= 0 && m <= 11 && d >= 0 && d <= 31) {
							setEndDate(e.detail)
						}
					}}
					onPressenter={() => {}}
					onFocus={() => {
						setOpenEndDateDatePicker(true)
					}}
					width='100%'
					padding='28px 0px 14px'
					value={endDate ? moment(endDate).format('YYYY-M-D') : ''}
					border-radius='10px'
					font-size='16px'
					margin='20px 0 0'
					placeholder={t('endDate')}
					border='1px solid var(--defaul-color)'
					placeholderAnimation='MoveUp'
				></SakiInput>
				<saki-button
					ref={bindEvent({
						tap: () => {
							setOpenStartDateDatePicker(false)
							setOpenEndDateDatePicker(false)
							setEndDate(moment().format('YYYY-M-D'))
						},
					})}
					margin='20px 0 0'
					padding='12px 18px'
					font-size='14px'
					border='none'
					color='var(--saki-default-color)'
				>
					<span>{t('Today')}</span>
				</saki-button>
			</div>
			<saki-date-picker
				ref={bindEvent({
					close: () => {
						setOpenEndDateDatePicker(false)
					},
					selectdate: (e) => {
						console.log(e)
						setEndDate(e.detail.date)
						setOpenEndDateDatePicker(false)
					},
				})}
				date={endDate}
				visible={openEndDateDatePicker}
				time-picker
			></saki-date-picker>
			<div className='dc-m-buttons'>
				<SakiButton
					onTap={() => {
						setStartDate('')
						setEndDate('')
						setShowTimeDiff(false)
						setOpenStartDateDatePicker(false)
						setOpenEndDateDatePicker(false)
					}}
					margin='20px 0 0 10px'
					padding='12px 18px'
					font-size='16px'
					type='Normal'
				>
					<span>
						{t('clear', {
							ns: 'prompt',
						})}
					</span>
				</SakiButton>
				<saki-button
					ref={bindEvent({
						tap: () => {
							if (!endDate || !startDate) {
								showSnackbar(
									t('noDateSelectedYet', {
										ns: 'prompt',
									})
								)
								return
							}
							setTimeDiff(
								Math.floor(
									(new Date(endDate).getTime() -
										new Date(startDate).getTime()) /
										(3600 * 24 * 1000)
								)
							)

							setOpenStartDateDatePicker(false)
							setOpenEndDateDatePicker(false)
							setShowTimeDiff(true)
						},
					})}
					margin='20px 0 0 10px'
					padding='12px 18px'
					font-size='16px'
					type='Primary'
				>
					<span>{t('calculateDuration')}</span>
				</saki-button>
			</div>
			{showTimeDiff ? (
				<div className='dc-m-results'>
					<div className='dc-m-r-item'>
						<div className='dc-m-r-i-title'>{t('daysBetweenTwoDates')}</div>
						<div className='dc-m-r-i-value'>
							{Math.floor(timeDiff * 100) / 100}
						</div>
					</div>
					<div className='dc-m-r-item'>
						<div className='dc-m-r-i-title'>{t('weeksBetweenTwoDates')}</div>
						<div className='dc-m-r-i-value'>
							{Math.floor((timeDiff / 7) * 100) / 100}
						</div>
					</div>
					<div className='dc-m-r-item'>
						<div className='dc-m-r-i-title'>{t('monthsBetweenTwoDates')}</div>
						<div className='dc-m-r-i-value'>
							{Math.floor((timeDiff / 30) * 100) / 100}
						</div>
					</div>
					<div className='dc-m-r-item'>
						<div className='dc-m-r-i-title'>{t('yearsBetweenTwoDates')}</div>
						<div className='dc-m-r-i-value'>
							{Math.floor((timeDiff / 365) * 100) / 100}
						</div>
					</div>
				</div>
			) : (
				''
			)}
		</div>
	)
}
const AddDaysComponent = () => {
	const { t, i18n } = useTranslation('dateCalculatorPage')
	const config = useSelector((state: RootState) => state.config)

	const [startDate, setStartDate] = useState('')

	const [year, setYear] = useState('')
	const [month, setMonth] = useState('')
	const [week, setWeek] = useState('')
	const [day, setDay] = useState('')

	const [newDate, setNewDate] = useState('')
	const [showTimeDiff, setShowTimeDiff] = useState(false)
	const [openStartDateDatePicker, setOpenStartDateDatePicker] = useState(false)

	return (
		<div className='dc-m-add-days'>
			<div className='dc-m-i-item'>
				<SakiInput
					onChangevalue={(e) => {
						const dateArr = e.detail.split('-')
						const y = Number(dateArr[0])
						const m = Number(dateArr[1])
						const d = Number(dateArr[2])
						const date = new Date(y + '-' + m + '-' + d)
						const t = date.getTime()

						if (!!t && y > 1000 && m >= 0 && m <= 11 && d >= 0 && d <= 31) {
							setStartDate(e.detail)
						}
					}}
					onPressenter={() => {}}
					onFocus={() => {
						setOpenStartDateDatePicker(true)
					}}
					width='100%'
					padding='28px 0px 14px'
					value={startDate ? moment(startDate).format('YYYY-M-D') : ''}
					border-radius='10px'
					font-size='16px'
					margin='20px 0 0'
					placeholder={t('startDate')}
					border='1px solid var(--defaul-color)'
					placeholderAnimation='MoveUp'
				></SakiInput>
				<saki-button
					ref={bindEvent({
						tap: () => {
							setOpenStartDateDatePicker(false)
							setStartDate(moment().format('YYYY-M-D'))
						},
					})}
					margin='20px 0 0'
					padding='12px 18px'
					font-size='14px'
					border='none'
					color='var(--saki-default-color)'
				>
					<span>{t('Today')}</span>
				</saki-button>
			</div>
			<saki-date-picker
				ref={bindEvent({
					close: () => {
						setOpenStartDateDatePicker(false)
					},
					selectdate: (e) => {
						setStartDate(e.detail.date)
						setOpenStartDateDatePicker(false)
					},
				})}
				date={startDate}
				visible={openStartDateDatePicker}
				time-picker
			></saki-date-picker>

			<div className='dc-m-i-item'>
				<SakiInput
					onChangevalue={(e) => {
						setYear(e.detail)
					}}
					onPressenter={() => {}}
					width='100%'
					padding='28px 0px 14px'
					value={year}
					border-radius='10px'
					font-size='16px'
					margin='20px 0 0'
					placeholder={t('years')}
					border='1px solid var(--defaul-color)'
					placeholderAnimation='MoveUp'
					type='Number'
				></SakiInput>
				<SakiInput
					onChangevalue={(e) => {
						setMonth(e.detail)
					}}
					onPressenter={() => {}}
					width='100%'
					padding='28px 0px 14px'
					value={month}
					border-radius='10px'
					font-size='16px'
					margin='20px 0 0'
					placeholder={t('months')}
					border='1px solid var(--defaul-color)'
					placeholderAnimation='MoveUp'
					type='Number'
				></SakiInput>
				<SakiInput
					onChangevalue={(e) => {
						setWeek(e.detail)
					}}
					onPressenter={() => {}}
					width='100%'
					padding='28px 0px 14px'
					value={week}
					border-radius='10px'
					font-size='16px'
					margin='20px 0 0'
					placeholder={t('weeks')}
					border='1px solid var(--defaul-color)'
					placeholderAnimation='MoveUp'
					type='Number'
				></SakiInput>
				<SakiInput
					onChangevalue={(e) => {
						setDay(e.detail)
					}}
					onPressenter={() => {}}
					width='100%'
					padding='28px 0px 14px'
					value={day}
					border-radius='10px'
					font-size='16px'
					margin='20px 0 0'
					placeholder={t('days')}
					border='1px solid var(--defaul-color)'
					placeholderAnimation='MoveUp'
					type='Number'
				></SakiInput>
			</div>
			<div className='dc-m-buttons'>
				<SakiButton
					onTap={() => {
						setStartDate('')

						setYear('')
						setMonth('')
						setWeek('')
						setDay('')

						setOpenStartDateDatePicker(false)
						setShowTimeDiff(false)
					}}
					margin='20px 0 0 10px'
					padding='12px 18px'
					font-size='16px'
					type='Normal'
				>
					<span>
						{t('clear', {
							ns: 'prompt',
						})}
					</span>
				</SakiButton>
				<saki-button
					ref={bindEvent({
						tap: () => {
							if (!startDate) {
								showSnackbar(
									t('noDateSelectedYet', {
										ns: 'prompt',
									})
								)
								return
							}

							console.log(startDate)
							let td = new Date(startDate)
							const d = Number(day) * 3600 * 24
							const w = Number(week) * 3600 * 24 * 7
							const tm = Number(month) + td.getMonth() + 1
							const m = tm % 12
							const y = Number(year) + Math.floor(tm / 12)

							// console.log(d, w)
							td = new Date(`${td.getFullYear() + y}-${m}-${td.getDate()}`)

							const nd = Math.floor(new Date(td).getTime() / 1000) + d + w
							let newDateStr = ''

							console.log('nd', nd)

							const ndm = moment(nd * 1000)
							newDateStr = ndm.format('LLdddd')
							if (config.lang === 'en-US') {
								newDateStr = ndm.format('dddd, LL')
							}

							setNewDate(nd ? newDateStr : t('unexplainableDate'))

							setOpenStartDateDatePicker(false)
							setShowTimeDiff(true)
						},
					})}
					margin='20px 0 0 10px'
					padding='12px 18px'
					font-size='16px'
					type='Primary'
				>
					<span>{t('calculateNewDate')}</span>
				</saki-button>
			</div>
			{showTimeDiff ? (
				<div className='dc-m-results'>
					<div className='dc-m-r-item'>
						<div className='dc-m-r-i-title'>{t('newDate')}</div>
						<div className='dc-m-r-i-value'>{newDate}</div>
					</div>
				</div>
			) : (
				''
			)}
		</div>
	)
}

const DateCalculatorPage = () => {
	const { t, i18n } = useTranslation('dateCalculatorPage')
	const [mounted, setMounted] = useState(false)

	const [length, setLength] = useState(16)
	const [passwordInclude, setPasswordInclude] = useState<
		('Number' | 'Character')[]
	>(['Number'])
	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => {
		setMounted(true)
	}, [])
	useEffect(() => {
		dispatch(layoutSlice.actions.setLayoutHeaderLogoText(t('pageTitle')))
	}, [i18n.language])

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
			<div className='date-calculator-page'>
				<div className='dc-main'>
					<div className='dc-m-title'>{t('pageTitle')}</div>
					<div className='dc-m-subtitle'>{t('subtitle')}</div>

					{mounted && (
						<>
							<div className='dc-m-tabs'>
								<SakiTabs
									type='Flex'
									// header-background-color='rgb(245, 245, 245)'
									header-max-width='740px'
									// header-border-bottom='none'
									header-padding='0 10px'
									header-item-min-width='80px'
									activeTabLabel={'countDays'}
									onTap={(e) => {
										// console.log('tap', e)
										// setActiveTabLabel(e.detail.label)
										// setOpenDropDownMenu(false)
									}}
								>
									<SakiTabsItem
										font-size='14px'
										label='countDays'
										name={t('countDays')}
									>
										<CountDaysComponent></CountDaysComponent>
									</SakiTabsItem>
									<SakiTabsItem
										font-size='14px'
										label='addDays'
										name={t('addDays')}
									>
										<AddDaysComponent></AddDaysComponent>
									</SakiTabsItem>
								</SakiTabs>
							</div>
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

DateCalculatorPage.getLayout = getLayout

export default DateCalculatorPage
