import Head from 'next/head'
import ToolboxLayout from '../layouts/Toolbox'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import FooterComponent from '../components/Footer'
import path from 'path'
import {
	RootState,
	AppDispatch,
	layoutSlice,
	useAppDispatch,
	methods,
	apiSlice,
} from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { bindEvent, snackbar, progressBar } from '@saki-ui/core'
import { deepCopy, NyaNyaWasm, QueueLoop } from '@nyanyajs/utils'
import { getRegExp, copyText, getRandomPassword } from '../plugins/methods'
// import { getGeoInfo } from 'findme-js'

const IpPage = () => {
	const { t, i18n } = useTranslation('ipPage')
	const [mounted, setMounted] = useState(false)

	const [ip, setIp] = useState('')
	const [password, setPassword] = useState('')
	const [length, setLength] = useState(16)
	const [passwordInclude, setPasswordInclude] = useState<
		('Number' | 'Character')[]
	>(['Number'])

	const [ipInfo, setIpInfo] = useState<
		{
			key: string
			value: string
		}[]
	>([])

	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => {
		setMounted(true)
		// findIpInfo('')

		setPassword(getRandomPassword(length, passwordInclude))
	}, [])

	useEffect(() => {
		dispatch(layoutSlice.actions.setLayoutHeaderLogoText(t('pageTitle')))
	}, [i18n.language])

	const findIpInfo = async (ip: string) => {
		if (!ip) {
			snackbar({
				message: t('ipEmptyTip', {
					ns: 'prompt',
				}),
				autoHideDuration: 2000,
				vertical: 'top',
				horizontal: 'center',
				backgroundColor: 'var(--primary-color)',
				color: '#fff',
			}).open()
			return
		}
		const res = await (
			await fetch(
				'http://ip-api.com/json/' +
					(ip === 'me' ? '' : ip) +
					`?fields=status,message,continent,continentCode,country,countryCode,region,\
    regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`
			)
		).json()
		console.log(
			'findIpInfo',
			res,
			Object.keys(res).map((k) => {
				return {
					key: k,
					value: res[k],
				}
			})
		)
		setIpInfo(
			Object.keys(res).map((k) => {
				return {
					key: k,
					value: res[k],
				}
			})
		)
		snackbar({
			message: t('getSuccessfully', {
				ns: 'prompt',
			}),
			autoHideDuration: 2000,
			vertical: 'top',
			horizontal: 'center',
			backgroundColor: 'var(--primary-color)',
			color: '#fff',
		}).open()
	}

	return (
		<>
			<Head>
				<title>
					{t('pageTitle', {
						ns: 'ipPage',
					}) +
						' - ' +
						t('appTitle', {
							ns: 'common',
						})}
				</title>
			</Head>
			<div className='ip-page'>
				<div className='ip-main'>
					<div className='ip-m-title'>{t('pageTitle')}</div>
					<div className='ip-m-subtitle'>{t('subtitle')}</div>

					{mounted && (
						<>
							<saki-input
								ref={bindEvent({
									changevalue(e) {
										setIp(e.detail)
									},
								})}
								width='100%'
								padding='16px 20px'
								value={ip}
								border-radius='10px'
								font-size='16px'
								margin='30px 0 0'
								placeholder={t('inputPlaceholder')}
								border='1px solid var(--default-color)'
							></saki-input>
						</>
					)}

					{mounted && (
						<>
							<div className='ip-m-buttons'>
								<div className='ip-m-b-left'></div>
								<div className='ip-m-b-center'></div>
								<div className='ip-m-b-right'>
									<saki-button
										ref={bindEvent({
											tap: () => {
												findIpInfo('me')
											},
										})}
										margin='0 0 0 10px'
										padding='8px 18px'
										font-size='14px'
										type='Normal'
									>
										{t('myIPDetails')}
									</saki-button>
									<saki-button
										ref={bindEvent({
											tap: async () => {
												const api = await NyaNyaWasm.WasmAPI()
												console.log('api', api)
												console.log('api', await api.net.lookupIP('im.aiiko.club'))
												// findIpInfo(ip)
											},
										})}
										margin='0 0 0 10px'
										padding='8px 18px'
										font-size='14px'
										type='Primary'
									>
										{t('search')}
									</saki-button>
								</div>
							</div>
						</>
					)}
					{ipInfo.length ? (
						<div className='ip-m-details'>
							<saki-title level='3' color='default'>
								{t('IPDetails') + ' '}
								{`<${
									ipInfo.filter((v) => {
										return v.key === 'query'
									})?.[0]?.value || ''
								}>`}
							</saki-title>
							<div className='ip-m-d-list'>
								<div className='header'>
									<div>Keyword</div>
									<div>Detail</div>
								</div>
								{ipInfo.map((v) => {
									console.log(v)
									return (
										<div>
											<div>{v.key}</div>
											<div>{v.value}</div>
										</div>
									)
								})}
							</div>
						</div>
					) : (
						''
					)}
					<div
						style={{
							margin: '150px 0 0',
						}}
					></div>
					{mounted && <FooterComponent></FooterComponent>}
				</div>
			</div>
		</>
	)
}
IpPage.getLayout = function getLayout(page: any) {
	return <ToolboxLayout>{page}</ToolboxLayout>
}

export default IpPage
