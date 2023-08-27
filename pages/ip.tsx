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
import { getGeoInfo } from 'findme-js'

const IpPage = () => {
	const { t, i18n } = useTranslation('ipPage')
	const [mounted, setMounted] = useState(false)
	const api = useSelector((state: RootState) => state.api)

	const [ip, setIp] = useState(
		''
		// 'google.com'
		// 'aiiko.club',
	)
	const [isMyIp, setIsMyIp] = useState(false)
	const [loading, setLoading] = useState(false)
	const [connectionOSM, setConnectionOSM] = useState(true)
	const [map, setMap] = useState<any>()

	const [ipInfo, setIpInfo] = useState<{
		ipv4: string
		ipv6: string
		country: string
		regionName: string
		city: string
		lon: string
		lat: string
		timezone: string
		isp: string
		org: string
	}>({
		ipv4: '',
		ipv6: '',
		country: '',
		regionName: '',
		city: '',
		lon: '',
		lat: '',
		timezone: '',
		isp: '',
		org: '',
	})

	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => {
		setMounted(true)
		const init = async () => {
			try {
				setConnectionOSM(
					(await fetch('https://tile.openstreetmap.org')).status === 200
				)
			} catch (error) {
				// console.log(error)
				setConnectionOSM(false)
			}
		}
		init()
		// setTimeout(() => {
		// 	findIpInfo('aiiko.club')
		// }, 1000)
	}, [])

	useEffect(() => {
		dispatch(layoutSlice.actions.setLayoutHeaderLogoText(t('pageTitle')))
	}, [i18n.language])

	const findIpInfo = async (ip: string) => {
		try {
			console.log(ip, 'ip')
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
			setLoading(true)

			const res = await (
				await fetch(
					api.apiUrl +
						api.apiUrls.v1.baseUrl +
						api.apiUrls.v1.ipDetails +
						'?ip=' +
						(ip === 'me' ? '' : ip) +
						'&language=' +
						i18n.language
				)
			).json()
			console.log('res', res)
			if (res?.code === 200 && res?.data?.lat) {
				const ipInfoObj = {
					ipv4: res?.data?.ipv4,
					ipv6: res?.data?.ipv6,
					country: res?.data?.country,
					regionName: res?.data?.regionName,
					city: res?.data?.city,
					lon: res?.data?.lon,
					lat: res?.data?.lat,
					timezone: res?.data?.timezone,
					isp: res?.data?.isp,
					org: res?.data?.org,
				}
				setIpInfo(ipInfoObj)
				const L = (window as any).L
				if (L) {
					var m = map

					if (!m) {
						m = L.map('ip-m-d-map', {
							// center: [Number(res?.data?.lat), Number(res?.data?.lon)],
						})
						m.setView(
							[Number(ipInfoObj.lat), Number(ipInfoObj.lon)],
							// [
							//   120.3814, -1.09],
							connectionOSM ? 13 : 9
						)
						setMap(m)
					} else {
						m.panTo([Number(ipInfoObj.lat), Number(ipInfoObj.lon)])
					}
					console.log('connectionOSM', connectionOSM)
					L.tileLayer(
						// 'GaoDe.Normal.Map',
						connectionOSM
							? `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
							: 'https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}',
						// : 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
						// `https://c.tile.openstreetmap.org/{z}/{x}/{y}.png`,
						// `https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}`,
						// `https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}`,
						{
							maxZoom: 19,
							attribution: `&copy; ${
								connectionOSM
									? '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
									: '<a href="https://map.geoq.cn/copyright">ArcGIS</a>'
							}`,
						}
					).addTo(m)
					L.marker([Number(ipInfoObj.lat), Number(ipInfoObj.lon)])
						.addTo(m)
						.bindPopup(
							`${ipInfoObj.ipv4}`
							// `${ipInfoObj.country}, ${ipInfoObj.regionName}, ${ipInfoObj.city}`
						)
						.openPopup()
					// console.log('map', map)
				}
				setLoading(false)
				snackbar({
					message: t('querySuccessfully', {
						ns: 'prompt',
					}),
					autoHideDuration: 2000,
					vertical: 'top',
					horizontal: 'center',
					backgroundColor: 'var(--primary-color)',
					color: '#fff',
				}).open()
			} else {
				snackbar({
					message: t('queryFailed', {
						ns: 'prompt',
					}),
					autoHideDuration: 2000,
					vertical: 'top',
					horizontal: 'center',
					backgroundColor: '#f06386',
					color: '#fff',
				}).open()
				setLoading(false)
			}
		} catch (error) {
			console.error(error)
			snackbar({
				message: String(error),
				autoHideDuration: 2000,
				vertical: 'top',
				horizontal: 'center',
				backgroundColor: '#f06386',
				color: '#fff',
			}).open()
			setLoading(false)
		}
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
				<link
					rel='stylesheet'
					href='https://unpkg.com/leaflet@1.9.3/dist/leaflet.css'
					integrity='sha256-kLaT2GOSpHechhsozzB+flnD+zUyjE2LlfWPgU04xyI='
					crossOrigin=''
				/>
				<script
					src='https://unpkg.com/leaflet@1.9.3/dist/leaflet.js'
					integrity='sha256-WBkoXOwTeyKclOHuWtc+i2uENFpDZ9YPdf5Hf+D7ewM='
					crossOrigin=''
				></script>
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
									pressenter() {
										findIpInfo(ip)
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
                        setIsMyIp(true)
												findIpInfo('me')
											},
										})}
										margin='0 0 0 10px'
										padding='8px 18px'
										font-size='14px'
										type='Normal'
										loading={isMyIp && loading}
									>
										{t('myIPDetails')}
									</saki-button>
									<saki-button
										ref={bindEvent({
											tap: async () => {
												// const api = await NyaNyaWasm.WasmAPI()
												// console.log('api', api)
												// console.log('api', await api.net.lookupIP('im.aiiko.club'))
                        setIsMyIp(false)
												findIpInfo(ip)
											},
										})}
										margin='0 0 0 10px'
										padding='8px 18px'
										font-size='14px'
										type='Primary'
										loading={!isMyIp && loading}
									>
										{t('search')}
									</saki-button>
								</div>
							</div>
						</>
					)}
					{ipInfo?.country ? (
						<div className='ip-m-details'>
							<saki-title level='3' color='default'>
								{t('IPDetails') + ' '}
								{/* {`<${ipInfo?.ipv4}>`} */}
							</saki-title>
							<div className='ip-m-d-list'>
								<div className='list-header'>
									<div>{t('keyword')}</div>
									<div>{t('detail')}</div>
								</div>
								<div className='list-item'>
									<div>{t('ipv4')}</div>
									<div>{ipInfo.ipv4 || '---'}</div>
								</div>
								<div className='list-item'>
									<div>{t('ipv6')}</div>
									<div>{ipInfo.ipv6 || '---'}</div>
								</div>
								<div className='list-item'>
									<div>{t('country')}</div>
									<div>{ipInfo.country || '---'}</div>
								</div>
								<div className='list-item'>
									<div>{t('regionName')}</div>
									<div>{ipInfo.regionName || '---'}</div>
								</div>
								<div className='list-item'>
									<div>{t('city')}</div>
									<div>{ipInfo.city || '---'}</div>
								</div>
								<div className='list-item'>
									<div>{t('isp')}</div>
									<div>{ipInfo.isp || '---'}</div>
								</div>
								<div className='list-item'>
									<div>{t('org')}</div>
									<div>{ipInfo.org || '---'}</div>
								</div>
								<div className='list-item'>
									<div>{t('lat')}</div>
									<div>{ipInfo.lat || '---'}</div>
								</div>
								<div className='list-item'>
									<div>{t('lon')}</div>
									<div>{ipInfo.lon || '---'}</div>
								</div>
								<div className='list-item'>
									<div>{t('timezone')}</div>
									<div>{ipInfo.timezone || '---'}</div>
								</div>
								{true ? (
									<div id='ip-m-d-map'></div>
								) : (
									<div className='ip-map-none'>
										<span>
											{t('connectMapFailed', {
												ns: 'prompt',
											})}
										</span>
									</div>
								)}
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
					<FooterComponent></FooterComponent>
				</div>
			</div>
		</>
	)
}
IpPage.getLayout = function getLayout(page: any) {
	return <ToolboxLayout>{page}</ToolboxLayout>
}

export default IpPage
