import Head from 'next/head'
import ToolboxLayout, { getLayout } from '../../layouts/Toolbox'
import Link from 'next/link'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Router, useRouter } from 'next/router'
import path, { format } from 'path'
import store, {
  RootState,
  AppDispatch,
  layoutSlice,
  useAppDispatch,
  methods,
  apiSlice,
  positionSlice,
} from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { bindEvent, snackbar, progressBar, alert } from '@saki-ui/core'
import {
  Debounce,
  deepCopy,
  NRequest,
  QueueLoop,
  WebWorker,
} from '@nyanyajs/utils'
import {
  getRegExp,
  copyText,
  getRandomPassword,
  formatTime,
  formatDuration,
  formatDurationI18n,
  getDistance,
  formatDistance,
} from '../../plugins/methods'
import {
  getDetailedPressureLevel,
  getCelestialTimesRange,
  getSunTimes,
  getMoonTimes,
  getVisibilityAlert,
  defaultWeatherInfo,
  formatAirQuality,
  getAqiDescription,
  getWindDirectionText,
  getUVInfo,
  createSunMoonChart,
  getWindForceLevel,
  formatWeatherDate,
  createWeatherChart,
  WeatherData,
  WeatherAQIData,
  createAQIChart,
  CelestialTimes,
  calculateTwilightTimes,
  createValDataChart,
  PressureLevel,
  WeatherSyncData,
  createWindChart,
  createPrecipitationDataChart,
  createDewPointChart,
  weatherSlice,
  getMaxMinTempWeatherCodes,
  getThemeColors,
  getWeatherVideoUrl,
  getWeatherIcon,
  ntextWcode,
  getWarningColor,
} from '../../store/weather'

import {
  convertTemperature,
  convertPrecipitation,
  convertWindSpeed,
  convertPressure,
  convertVisibility,
} from '@nyanyajs/utils/dist/units/weather'
import { covertTimeFormat } from '@nyanyajs/utils/dist/units/time'
import {
  changeLanguage,
  languages,
  defaultLanguage,
} from '../../plugins/i18n/i18n'
import moment, { unix } from 'moment'
import { configSlice, eventListener, R } from '../../store/config'
import { server } from '../../config'
// import { openWeatherWMOToEmoji } from '@akaguny/open-meteo-wmo-to-emoji'
// import { WeatherCodes } from '@openmeteo/sdk';
import {
  SakiAnimationLoading,
  SakiAsideModal,
  SakiButton,
  SakiCol,
  SakiDropdown,
  SakiIcon,
  SakiInput,
  SakiMenu,
  SakiMenuItem,
  SakiModalHeader,
  SakiRow,
  SakiTitle,
} from '../../components/saki-ui-react/components'
import * as Astronomy from 'astronomy-engine'
import { storage } from '../../store/storage'
import NoSSR from '../../components/NoSSR'
import dynamic from 'next/dynamic'
import { CityInfo } from '../../plugins/http/api/geo'
import { httpApi } from '../../plugins/http/api'
import {
  networkConnectionStatusDetection,
  networkConnectionStatusDetectionEnum,
} from '@nyanyajs/utils/dist/common/common'
import WeatherDetailModal, {
  WarningIcon,
} from '../../components/WeatherDetailModal'

// const NoSSR = ({ children }: PropsType) => {
//   return <React.Fragment>{children}</React.Fragment>
// }

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
    // fallback: process.env.OUTPUT === 'export',
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
  // changeLanguage(params.lang as any)

  // const res = await fetch(`https://.../posts/${params.id}`)
  // const post = await res.json()

  // return { props: { post } }
  return {
    props: {
      // difficulty: params.difficulty,
      lang: params.lang || defaultLanguage,
    },
  }
}

const WeatherPage = () => {
  const { t, i18n } = useTranslation('weatherPage')
  const [mounted, setMounted] = useState(false)
  const config = useSelector((state: RootState) => state.config)
  const user = useSelector((state: RootState) => state.user)
  const weather = useSelector((state: RootState) => state.weather)

  const { position, language, weatherData } = useSelector(
    (state: RootState) => {
      return {
        position: state.position,
        language: state.config.language,
        weatherData: state.weather.weatherData,
      }
    }
  )
  const { cities } = weatherData

  const [updateTime, setUpdateTime] = useState(new Date().getTime())
  const [loadStatus, setLoadStatus] = useState('loaded')
  const [isInitWData, setIsInitWData] = useState(false)

  const [citiesListType, setCitiesListType] = useState(
    'List' as 'List' | 'Grid'
  )

  // const [loadWeather, setLoadWeather] = useState(false)

  const isSunMonAnima = useRef(true)

  const watchId = useRef(-1)

  const dispatch = useDispatch<AppDispatch>()

  const router = useRouter()

  // const connectionStatus = useRef({
  //   openMeteo: false,

  //   airQualityAPI:  false,
  // })

  useEffect(() => {
    setMounted(true)

    dispatch(
      methods.position.watchPosition({
        watch: false,
      })
    )

    const isCustomLatlng =
      location.search.includes('lat=') && location.search.includes('lng=')

    dispatch(weatherSlice.actions.setAllowSyncCloudData(!isCustomLatlng))

    dispatch(methods.weather.init())

    dispatch(configSlice.actions.setSsoAccount(!isCustomLatlng))

    dispatch(layoutSlice.actions.setLayoutHeader(true))
    ;(async () => {
      const wData = await storage.global.get('CitiesListType')

      setCitiesListType(wData || 'List')

      // const wData: typeof cities = await storage.global.get('citiesWeather')

      // console.log('wData', wData)
      // setCities(
      //   wData?.map((v) => {
      //     return {
      //       ...v,
      //       // updateTime: 0,
      //     }
      //   }) || []
      // // )
      // const tempCurIndex: typeof cities = await storage.global.get('curCityIndex')

      // console.log('wData', wData)
      // setCities(
      //   wData?.map((v) => {
      //     return {
      //       ...v,
      //       // updateTime: 0,
      //     }
      //   }) || []
      // )

      // await dispatch(methods.config.initConnectionOpenMeteo()).unwrap()

      // const res = await R.request({
      //   // headers: {
      //   // 'X-QW-Api-Key': 'C45F5D2MH2',
      //   // },
      //   url: 'https://mc4y3j6emb.re.qweatherapi.com/v7/warning/now?location=116.4074,39.9042&lang=zh&key=C45F5D2MH2',
      // })

      // console.log('X-QW-Apires', res)

      setIsInitWData(true)
      // await dispatch(methods.config.initConnectionAirQualityAPI()).unwrap()
      // await dispatch(methods.config.initConnectionOSM()).unwrap()
    })()

    // dispatch(
    //   positionSlice.actions.setPosition({
    //     ...position,
    //     coords: {
    //       ...position?.coords,
    //       // latitude: 42.097903,
    //       // longitude: 86.473305,
    //       latitude: 29.873281,
    //       longitude: 106.381818,
    //     },
    //   } as any)
    // )

    const timer = setInterval(() => {
      setUpdateTime(new Date().getTime())
      dispatch(
        methods.position.watchPosition({
          watch: false,
        })
      )
    }, 16 * 60 * 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  const { themeColor, themeColors } = useMemo(() => {
    let themeColor: 'Dark' | 'Light' =
      config.deviceType === 'Mobile' ? 'Dark' : 'Light'

    dispatch(layoutSlice.actions.setHeaderColor(themeColor))

    return {
      themeColor,
      themeColors: getThemeColors(themeColor),
    }
  }, [config.deviceType])

  useEffect(() => {
    dispatch(layoutSlice.actions.setLayoutHeaderLogoText(t('pageTitle')))
    // dispatch(
    //   layoutSlice.actions.setLayoutHeaderLogo('/weather-icons/128x128.png')
    // )

    if (location.search.includes('sakiAppPortal=')) {
      const wAny = window as any

      wAny?.sakiui?.appPortal?.setAppInfo?.({
        title: t('pageTitle'),
        logoText: 'Weather',
        url: location.origin + '/weather',
      })

      wAny.loadSakiUI = () => {
        wAny?.sakiui?.appPortal?.setAppInfo?.({
          title: t('pageTitle'),
          logoText: 'Weather',
          url: location.origin + '/weather',
        })
      }
    }
  }, [i18n.language])

  useEffect(() => {
    console.log('getWeather res watchPosition position', isInitWData, position)
    // getWeather(29.873281, 106.381818)

    if (isInitWData && position?.position?.timestamp) {
      const { weather } = store.getState()
      const cities = weather.weatherData.cities
      let tempCities = [...cities]
      if (tempCities.filter((v) => v.curPopsition)?.length) {
        tempCities = tempCities.map((v) => {
          if (v.curPopsition) {
            // console.log(
            //   'getDistance',
            //   getDistance(
            //     v.lat,
            //     v.lng,
            //     position?.coords.latitude,
            //     position?.coords.longitude
            //   )
            // )

            const nLat = position?.position?.coords.latitude || 0
            const nLng = position?.position?.coords.longitude || 0

            return {
              ...v,
              lat: nLat,
              lng: nLng,
              curPopsition: true,
              updateAllTime:
                getDistance(v.lat, v.lng, nLat, nLng) <= 2000
                  ? v.updateAllTime
                  : 0,
              updateCurTime:
                getDistance(v.lat, v.lng, nLat, nLng) <= 2000
                  ? v.updateCurTime
                  : 0,
              sort: 0,
            }
          }
          return v
        })
      } else {
        tempCities.push({
          displayName: '',
          lat: position?.position?.coords.latitude,
          lng: position?.position?.coords.longitude,
          curPopsition: true,
          updateCurTime: 0,
          updateAllTime: 0,
          default: false,
          sort: 0,
        })
      }
      tempCities.sort((a, b) => {
        return a.sort - b.sort
      })

      // setCities(tempCities)

      // setWeatherData()

      dispatch(
        weatherSlice.actions.setWeatherData({
          cities: tempCities,
        })
      )

      !isSetPosition && setIsSetPosition(true)
    }
  }, [position, isInitWData])

  // const [cities, setCities] = useState<WeatherSyncData['cities'][0][]>([])

  const getWeatherData = async () => {
    try {
      if (loadStatus === 'loading') return
      const nowUnix = new Date().getTime()

      const promiseAll: any[] = []

      // 1、先检测是否需要整体更新
      let isUpdateAll = false
      let isUpdateCur = false

      cities.forEach((v, i) => {
        if (
          !isUpdateAll &&
          (!v?.weatherInfo ||
            (openCityDropdown && nowUnix - v.updateAllTime > 30 * 60 * 1000))
        ) {
          console.log('getWeatherData 开始获取 all item', v)

          isUpdateAll = true
        }

        if (
          // !v?.cityInfo ||
          curCityIndex === i &&
          (!v.updateCurTime ||
            !v?.weatherInfo ||
            !v?.weatherInfo?.daily?.time?.length ||
            nowUnix - v.updateCurTime > 15 * 60 * 1000)
        ) {
          isUpdateCur = true

          console.log(
            'getWeatherData 开始获取 item',
            v,
            !v.updateCurTime,
            nowUnix - v.updateCurTime
          )

          // if (ttttt.current >= 1) {
          //   return
          // }

          // getWeather(v.lat, v.lng)

          // ttttt.current += 1

          // promiseAll.push(
          //   new Promise(async (res, rej) => {
          //     const cityInfo = await getCityInfo(v.lat, v.lng)
          //     const weatherInfo = await getWeather(v.lat, v.lng)
          //     // console.log('getCityInfo', cityInfo, weatherInfo)

          //     res({
          //       cityInfo,
          //       weatherInfo,
          //       lat: v.lat,
          //       lng: v.lng,
          //     })
          //   })
          // )
        }
      })

      console.log(
        'getWeatherData isUpdateAll',
        curCityIndex,
        isUpdateAll,
        isUpdateCur
      )

      let tempCities: typeof cities = deepCopy(cities)

      let isSetCities = false

      if (isUpdateAll || isUpdateCur) {
        setLoadStatus('loading')
      }

      if (isUpdateAll) {
        const res = await getAllWeather(
          cities.map((v) => {
            return {
              lat: v.lat,
              lng: v.lng,
            }
          }) || []
        )
        console.log('getWeatherData getWeather all', res)
        if (res?.length) {
          tempCities.map((v, i) => {
            tempCities[i] = {
              ...tempCities[i],
              weatherInfo: {
                ...deepCopy(defaultWeatherInfo),
                ...(v.weatherInfo || {}),
                current: {
                  ...v.weatherInfo?.current,
                  ...res[i].current,
                },
                current_units: {
                  ...v.weatherInfo?.current_units,
                  ...res[i].current_units,
                },
              },
              updateAllTime: new Date().getTime(),
            }
          })
          isSetCities = true
        }
      }
      if (isUpdateCur) {
        const cityItem = tempCities[curCityIndex]
        const gw = await getWeather(cityItem.lat, cityItem.lng)
        const gc = await getCityInfo(cityItem.lat, cityItem.lng)

        if (gw || gc) {
          tempCities[curCityIndex] = {
            ...tempCities[curCityIndex],
            cityInfo: gc || tempCities[curCityIndex].cityInfo,
            weatherInfo: gw || tempCities[curCityIndex].weatherInfo,
            updateCurTime: new Date().getTime(),
          }
        }

        isSetCities = true
      }

      if (isSetCities) {
        dispatch(
          weatherSlice.actions.setWeatherData({
            cities: tempCities,
          })
        )
      }

      setLoadStatus('loaded')
    } catch (error) {
      console.error(error)
    }
  }

  const getCityInfo = async (lat: number, lng: number) => {
    const res = await httpApi.v1.Geo.regeo({
      lat,
      lng,
    })

    console.log('getCityInfo regeo res', cities, res)
    if (res?.address) {
      // const weatherInfo = await getWeather(lat, lng)
      // setCities(
      //   cities.map((v) => {
      //     if (v.lat === lat && v.lng === lng) {
      //       return {
      //         ...v,
      //         cityInfo: res,
      //         weatherInfo: weatherInfo || v.weatherInfo,
      //         updateTime: new Date().getTime(),
      //       }
      //     }
      //     return v
      //   })
      // )
    }

    return res
  }

  const localTimezone = useRef(Intl.DateTimeFormat().resolvedOptions().timeZone)

  const getWeather = async (lat: number, lng: number) => {
    let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=${[
      'temperature_2m',
      'weather_code',
      'relative_humidity_2m',
      'wind_speed_10m',
      'apparent_temperature',
      'dew_point_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'visibility',
      'pressure_msl',
      'surface_pressure',
      'precipitation',
      'precipitation_probability',
      'wind_gusts_10m',
    ].join(',')}&hourly=${[
      'temperature_2m',
      'relative_humidity_2m',
      'weathercode',
      'precipitation_probability',
      'precipitation',
      'pressure_msl',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'uv_index',
      'wind_gusts_10m',
      'dew_point_2m',
      'visibility',
    ].join(',')}&daily=${[
      'temperature_2m_max',
      'temperature_2m_min',
      'weathercode',
      'precipitation_probability_max',
      'precipitation_probability_min',
      'precipitation_probability_mean',
      'precipitation_hours',
      'precipitation_sum',
      'wind_speed_10m_max',
      'wind_direction_10m_dominant',
      'sunrise',
      'sunset',
      'uv_index_max',
      'uv_index_clear_sky_max',
      'wind_direction_10m_dominant',
      'wind_gusts_10m_max',
    ].join(',')}&windspeed_unit=ms&forecast_days=16&past_days=1&timezone=${
      localTimezone.current
    }`

    const connectionStatusOpenMeteo = await networkConnectionStatusDetection(
      networkConnectionStatusDetectionEnum.openMeteo
    )

    // console.log(
    //   'networkConnectionStatusDetection connectionStatusOpenMeteo',
    //   connectionStatusOpenMeteo
    // )

    const res = await R.request({
      method: 'GET',
      url: connectionStatusOpenMeteo
        ? url
        : `${
            server.url
          }/api/v1/net/httpProxy?method=GET&url=${encodeURIComponent(url)}`,
    })

    let data = res?.data?.data as any
    if (connectionStatusOpenMeteo) {
      data = res?.data
    }
    console.log(
      'getCityInfo  getWeather res',
      connectionStatusOpenMeteo,
      res.data
    )
    if (!data?.current) return

    const wi: typeof weatherInfo = {
      ...weatherInfo,
      current: {
        temperature: data?.current?.temperature_2m || -273.15,
        apparentTemperature: data?.current?.apparent_temperature || -273.15,
        // wind_speed_10m:
        //   Number((data?.current?.wind_speed_10m / 3.6).toFixed(1)) || 0,
        wind_speed_10m: data?.current?.wind_speed_10m || 0,
        wind_direction_10m: data?.current?.wind_direction_10m || 0,
        relative_humidity_2m: data?.current?.relative_humidity_2m || 0,
        visibility: data?.current?.visibility || 0,
        weatherCode: data?.current?.weather_code || 0,
        weather: t('weather' + (data?.current?.weather_code || 0), {
          ns: 'sakiuiWeather',
        }),
        daysTemperature: [
          Math.min(...data.hourly?.temperature_2m),
          Math.max(...data.hourly?.temperature_2m),
        ],
        altitude: data.elevation,
        precipitationHours: data.precipitation_hours,
        pressureMsl: data?.current?.pressure_msl,
        surfacePressure: data?.current?.surface_pressure || 0,
        precipitation: data?.current?.precipitation || 0,
        precipitationProbability: data?.current?.precipitation_probability || 0,
        dew_point_2m: data?.current?.dew_point_2m || 0,
        wind_gusts_10m: data?.current?.wind_gusts_10m || 0,
      },
      current_units: data.current_units,
      daily: data.daily,
      dailyUnits: data.daily_units,
      hourly: data.hourly,
      hourlyUnits: data.hourly_units,
      airQuality: await getAirQuality(lat, lng),
      alert: await getAlerts(lat, lng),
    }

    // getUVIndex(lat, lng)

    let temp = data.hourly.temperature_2m.slice(12, 36)
    const h = new Date().getUTCHours()
    if (h >= 0 && h < 12) {
      temp = data.hourly.temperature_2m.slice(0, 24)
    }
    wi.current.daysTemperature = [Math.min(...temp), Math.max(...temp)]

    // const wd = data?.current?.wind_direction_10m || 0

    const codes = getMaxMinTempWeatherCodes(wi)
    // console.log('getMaxMinTempWeatherCodes', codes)

    wi.daily.maxTempWeatherCodes = codes.maxTempWeatherCodes
    wi.daily.minTempWeatherCodes = codes.minTempWeatherCodes

    console.log('getWeather', wi)

    return wi
  }

  const getAllWeather = async (
    latlngs: {
      lat: number
      lng: number
    }[]
  ) => {
    let url = `https://api.open-meteo.com/v1/forecast?latitude=${latlngs
      .map((v) => v.lat)
      .join(',')}&longitude=${latlngs.map((v) => v.lng).join(',')}&current=${[
      'temperature_2m',
      'weather_code',
      'relative_humidity_2m',
      'wind_speed_10m',
      'apparent_temperature',
      'dew_point_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'visibility',
      'pressure_msl',
      'surface_pressure',
      'precipitation',
      'precipitation_probability',
      'wind_gusts_10m',
    ].join(',')}&windspeed_unit=ms&forecast_days=16&past_days=1&timezone=${
      localTimezone.current
    }`

    const connectionStatusOpenMeteo = await networkConnectionStatusDetection(
      networkConnectionStatusDetectionEnum.openMeteo
    )

    // console.log(
    //   'networkConnectionStatusDetection connectionStatusOpenMeteo',
    //   connectionStatusOpenMeteo
    // )

    const res = await R.request({
      method: 'GET',
      url: connectionStatusOpenMeteo
        ? url
        : `${
            server.url
          }/api/v1/net/httpProxy?method=GET&url=${encodeURIComponent(url)}`,
    })

    let data = res?.data?.data as any
    if (connectionStatusOpenMeteo) {
      data = res?.data
    }
    console.log('getWeatherData data', data)
    if (!data?.length) return

    return data.map((v: any) => {
      return {
        current: {
          temperature: v?.current?.temperature_2m || -273.15,
          apparentTemperature: v?.current?.apparent_temperature || -273.15,
          // wind_speed_10m:
          //   Number((v?.current?.wind_speed_10m / 3.6).toFixed(1)) || 0,
          wind_speed_10m: v?.current?.wind_speed_10m || 0,
          wind_direction_10m: v?.current?.wind_direction_10m || 0,
          relative_humidity_2m: v?.current?.relative_humidity_2m || 0,
          visibility: v?.current?.visibility || 0,
          weatherCode: v?.current?.weather_code || 0,
          weather: t('weather' + (v?.current?.weather_code || 0), {
            ns: 'sakiuiWeather',
          }),
          altitude: v.elevation,
          precipitationHours: v.precipitation_hours,
          pressureMsl: v?.current?.pressure_msl,
          surfacePressure: v?.current?.surface_pressure || 0,
          precipitation: v?.current?.precipitation || 0,
          precipitationProbability: v?.current?.precipitation_probability || 0,
          dew_point_2m: v?.current?.dew_point_2m || 0,
          wind_gusts_10m: v?.current?.wind_gusts_10m || 0,
        },
        current_units: v.current_units,
      }
    }) as {
      current: (typeof weatherInfo)['current']
      current_units: (typeof weatherInfo)['current_units']
    }[]
  }

  const getAirQuality = async (lat: number, lng: number) => {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=${[
      'pm2_5',
      'pm10',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'ozone',
      'carbon_monoxide',
      'european_aqi',
      'us_aqi',
    ].join(',')}&hourly=${[
      'pm2_5',
      'pm10',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'ozone',
      'carbon_monoxide',
      'european_aqi',
      'us_aqi',
    ].join(',')}&daily=${[
      'pm2_5',
      'pm10',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'ozone',
      'carbon_monoxide',
      'european_aqi',
      'us_aqi',
    ].join(',')}&forecast_days=7&past_days=1&timezone=${localTimezone.current}`

    const connectionAirQualityAPI = await networkConnectionStatusDetection(
      networkConnectionStatusDetectionEnum.airQualityAPI
    )
    const res = await R.request({
      method: 'GET',
      url: connectionAirQualityAPI
        ? url
        : `${
            server.url
          }/api/v1/net/httpProxy?method=GET&url=${encodeURIComponent(url)}`,
    })

    let data = res?.data?.data as any
    console.log('getWeather airq res', res.data)
    if (connectionAirQualityAPI) {
      data = res?.data
    }
    if (!data?.current) return weatherInfo.airQuality

    const airQuality: typeof weatherInfo.airQuality = {
      ...weatherInfo.airQuality,
      current: data.current,
      current_units: data.current_units,
      hourly: data.hourly,
      hourly_units: data.hourly_units,
      daily: convertHourlyToDaily(data.hourly, false),
      daily_units: data.hourly_units,
    }

    return airQuality
  }

  const getAlerts = async (lat: number, lng: number) => {
    const url = `https://mc4y3j6emb.re.qweatherapi.com/v7/warning/now?location=${
      lng + ',' + lat
    }&lang=${
      config.lang === 'zh-CN'
        ? 'zh'
        : config.lang === 'zh-TW'
        ? 'zh-hant'
        : 'en'
    }&key=4984df9138e04b67a3cb104a96ae0384`

    const res = await R.request({
      method: 'GET',
      url: url,
    })

    let data = res?.data as any

    console.log('getAlerts', res)

    if (data?.code !== '200') return defaultWeatherInfo.alert

    const wi: (typeof defaultWeatherInfo)['alert'] = {
      ...defaultWeatherInfo.alert,
      warning: data?.warning || [],
      refer: data?.refer || [],
    }

    return wi
  }

  const ttttt = useRef(0)

  const [openCityDropdown, setOpenCityDropdown] = useState(false)
  const [openCityExImPortDropdown, setOpenCityExImPortDropdown] =
    useState(false)
  const [openAirQualityDropdown, setOpenAirQualityDropdown] = useState(false)
  const [open15dayForecastDropdown, setOpen15dayForecastDropdown] =
    useState(false)
  const [openSunMoonDropdown, setOpenSunMoonDropdown] = useState(false)

  const airQualityDPList = [
    {
      val: 'Today',
      text: t('today', {
        ns: 'sakiuiWeather',
      }),
    },
    {
      val: '24Hours',
      text: t('24Hours', {
        ns: 'sakiuiWeather',
      }),
    },
    {
      val: '8Days',
      text: t('8Days', {
        ns: 'sakiuiWeather',
      }),
    },
  ]
  const a15dayForecastDPList = [
    {
      val: 'Curve',
      text: t('curve', {
        ns: 'weatherPage',
      }),
    },
    {
      val: 'List',
      text: t('list', {
        ns: 'weatherPage',
      }),
    },
  ]
  const sunMoonDPList = [
    {
      val: 'Today',
      text: t('today', {
        ns: 'sakiuiWeather',
      }),
    },
    {
      val: '45Days',
      text: t('45Days', {
        ns: 'sakiuiWeather',
      }),
    },
  ]

  const [curCityIndex, setCurCityIndex] = useState(-1)
  const curCityIndexDeb = useRef(new Debounce())

  useEffect(() => {
    // storage.global.get('citiesWeather', cities)

    console.log(
      'curCityIndex init',
      cities,
      curCityIndex,
      position.allowWatchPosition
    )

    if (curCityIndex === -1) {
      if (!position.allowWatchPosition) {
        cities.some((v, i) => {
          if (
            v.lat === position.position?.coords.latitude &&
            v.lng === position.position.coords.longitude
          ) {
            setCurCityIndex(i)
            return true
          }
        })
        return
      }
      curCityIndexDeb.current.increase(async () => {
        const val = await storage.global.get('curCityIndex')
        let curI = -1
        cities.some((v, i) => {
          console.log(
            'curCityIndex get',
            v.lat + ';' + v.lng === val,
            v.lat + ';' + v.lng,
            val,
            curCityIndex,
            curCityIndex === -1
          )

          if (v.lat + ';' + v.lng === val) {
            curI = i
            return true
          }
        })
        setCurCityIndex(curI === -1 ? 0 : curI)
      }, 50)
    }
  }, [cities, position.allowWatchPosition, curCityIndex])

  const getWeatherDeb = useRef(new Debounce())

  const [isSetPosition, setIsSetPosition] = useState(false)

  useEffect(() => {
    if (isInitWData && position?.position?.timestamp && cities.length) {
      getWeatherDeb.current.increase(() => {
        getWeatherData()
      }, 500)
    }
  }, [
    position?.position?.timestamp,
    isInitWData,
    openCityDropdown,
    cities,
    curCityIndex,
  ])

  const { weatherInfo, cityInfo, cityItem } = useMemo(() => {
    // let tempCurCityIndex = curCityIndex
    // if (tempCurCityIndex === -1) {
    //   cities.some((v, i) => {
    //     if (v.default) {
    //       tempCurCityIndex = i
    //       return true
    //     }
    //   })
    //   if (tempCurCityIndex === -1) {
    //     tempCurCityIndex = 0
    //   }
    //   setCurCityIndex(tempCurCityIndex)
    // }
    const cityItem = cities?.[curCityIndex === -1 ? 0 : curCityIndex]

    const wi = {
      ...deepCopy(defaultWeatherInfo),
      ...deepCopy(cityItem?.weatherInfo),
    }

    // if (wi) {
    //   wi.current_units.wind_gusts_10m = 'km/h'
    //   wi.current_units.wind_speed_10m = 'km/h'
    //   wi.current.wind_gusts_10m *= 3.6
    //   wi.current.wind_speed_10m *= 3.6

    //   wi.hourlyUnits.wind_gusts_10m = 'km/h'
    //   wi.hourlyUnits.wind_speed_10m = 'km/h'
    //   wi.hourly.wind_gusts_10m.map((v) => v * 3.6)
    //   wi.hourly.wind_speed_10m.map((v) => v * 3.6)

    //   wi.dailyUnits.wind_gusts_10m_max = 'km/h'
    //   wi.dailyUnits.wind_gusts_10m_max = 'km/h'
    //   wi.daily.wind_gusts_10m_max.map((v) => v * 3.6)
    //   wi.daily.wind_speed_10m_max.map((v) => v * 3.6)
    // }

    return {
      weatherInfo: wi || defaultWeatherInfo,
      cityInfo: cityItem?.cityInfo,
      cityItem: {
        ...cityItem,
        weatherInfo: wi,
      },
    }
  }, [cities, isInitWData, openCityDropdown, curCityIndex])

  // useEffect(() => {
  //   if (weather.weatherData.cities?.length) {
  //     setCities(weather.weatherData.cities)
  //   }
  // }, [weather])

  useEffect(() => {
    if (user.isLogin) {
      dispatch(methods.weather.downloadData())
    }
  }, [user.isLogin])

  const deleteCityItem = (i: number) => {
    alert({
      title: t('delete', {
        ns: 'prompt',
      }),
      content: t('deleteThisCity', {
        ns: 'weatherPage',
      }),
      cancelText: t('cancel', {
        ns: 'prompt',
      }),
      confirmText: t('delete', {
        ns: 'prompt',
      }),
      onCancel() {},
      async onConfirm() {
        const tempCities = cities.filter((sv, si) => si !== i)
        dispatch(
          weatherSlice.actions.setWeatherData({
            cities: tempCities,
          })
        )
        dispatch(
          methods.weather.syncData({
            data: {
              cities: tempCities,
            },
          })
        )

        if (cities?.length === 1) {
          setOpenEditCity(false)
        }
      },
    }).open()
  }
  const addCity = (result: NominatimResult) => {
    console.log('addCity result', deepCopy(cities), result)
    if (result) {
      let tempIndex = -1
      let tempCities = cities.map((v, i) => {
        if (v.lat === Number(result.lat) && v.lng === Number(result.lon)) {
          tempIndex = i
          return {
            ...v,
            displayName: result.display_name,
            lat: Number(result.lat),
            lng: Number(result.lon),
          }
        }
        return v
      })

      if (tempIndex < 0) {
        tempCities.push({
          displayName: result.display_name,
          lat: Number(result.lat),
          lng: Number(result.lon),
          curPopsition: false,
          updateAllTime: 0,
          updateCurTime: 0,
          default: false,
          sort: tempCities.length + 1,
        })
      }

      tempCities.sort((a, b) => {
        return a.sort - b.sort
      })

      console.log('addCity tempCities', deepCopy(tempCities))

      dispatch(
        weatherSlice.actions.setWeatherData({
          cities: tempCities,
        })
      )
      dispatch(
        methods.weather.syncData({
          data: {
            cities: tempCities,
          },
        })
      )
      setOpenAddCityPage(false)
    }
  }

  function convertHourlyToDaily(
    hourly: typeof weatherInfo.airQuality.hourly,
    useDaytimeOnly: boolean
  ): typeof weatherInfo.airQuality.daily {
    const hoursPerDay = 24
    const dailyData: typeof weatherInfo.airQuality.daily = {
      time: [],
      pm2_5: [],
      pm10: [],
      nitrogen_dioxide: [],
      sulphur_dioxide: [],
      ozone: [],
      carbon_monoxide: [],
      european_aqi: [],
      us_aqi: [],
    }

    // 获取所有唯一的日期（YYYY-MM-DD）
    const dates = Array.from(
      new Set(hourly.time.map((time) => time.split('T')[0]))
    )

    // 遍历每一天
    dates.forEach((date, dayIndex) => {
      const startIndex = dayIndex * hoursPerDay
      const endIndex = startIndex + hoursPerDay

      // 获取当天的小时索引
      let dayIndices = hourly.time
        .slice(startIndex, endIndex)
        .map((time, index) => index + startIndex)

      // 如果只使用白天（06:00-18:00）
      if (useDaytimeOnly) {
        dayIndices = dayIndices.filter((index) => {
          const hour = new Date(hourly.time[index]).getHours()
          return hour >= 6 && hour < 18
        })
      }

      // 如果当天没有数据，填充默认值
      if (dayIndices.length === 0) {
        dailyData.time.push(date)
        dailyData.pm2_5.push(0)
        dailyData.pm10.push(0)
        dailyData.nitrogen_dioxide.push(0)
        dailyData.sulphur_dioxide.push(0)
        dailyData.ozone.push(0)
        dailyData.carbon_monoxide.push(0)
        dailyData.european_aqi.push(0)
        dailyData.us_aqi.push(0)
        return
      }

      // 计算平均值
      const pm2_5 = dayIndices.map((index) => hourly.pm2_5[index] || 0)
      const pm10 = dayIndices.map((index) => hourly.pm10[index] || 0)
      const nitrogen_dioxide = dayIndices.map(
        (index) => hourly.nitrogen_dioxide[index] || 0
      )
      const sulphur_dioxide = dayIndices.map(
        (index) => hourly.sulphur_dioxide[index] || 0
      )
      const ozone = dayIndices.map((index) => hourly.ozone[index] || 0)
      const carbon_monoxide = dayIndices.map(
        (index) => hourly.carbon_monoxide[index] || 0
      )
      const european_aqi = dayIndices.map(
        (index) => hourly.european_aqi[index] || 0
      )
      const us_aqi = dayIndices.map((index) => hourly.us_aqi[index] || 0)

      const avgPm2_5 = pm2_5.reduce((sum, v) => sum + v, 0) / pm2_5.length
      const avgPm10 = pm10.reduce((sum, v) => sum + v, 0) / pm10.length
      const avgNitrogenDioxide =
        nitrogen_dioxide.reduce((sum, v) => sum + v, 0) /
        nitrogen_dioxide.length
      const avgSulphurDioxide =
        sulphur_dioxide.reduce((sum, v) => sum + v, 0) / sulphur_dioxide.length
      const avgOzone = ozone.reduce((sum, v) => sum + v, 0) / ozone.length
      const avgCarbonMonoxide =
        carbon_monoxide.reduce((sum, v) => sum + v, 0) / carbon_monoxide.length
      const avgEuropeanAqi =
        european_aqi.reduce((sum, v) => sum + v, 0) / european_aqi.length
      const avgUsAqi = us_aqi.reduce((sum, v) => sum + v, 0) / us_aqi.length

      // 填充 daily 数据
      dailyData.time.push(date)
      dailyData.pm2_5.push(Number(avgPm2_5.toFixed(1)))
      dailyData.pm10.push(Number(avgPm10.toFixed(1)))
      dailyData.nitrogen_dioxide.push(Number(avgNitrogenDioxide.toFixed(1)))
      dailyData.sulphur_dioxide.push(Number(avgSulphurDioxide.toFixed(1)))
      dailyData.ozone.push(Number(avgOzone.toFixed(1)))
      dailyData.carbon_monoxide.push(Number(avgCarbonMonoxide.toFixed(1)))
      dailyData.european_aqi.push(Number(avgEuropeanAqi.toFixed(0)))
      dailyData.us_aqi.push(Number(avgUsAqi.toFixed(0)))
    })

    return dailyData
  }

  const curInfo = useMemo(() => {
    const curAQ = formatAirQuality(
      weatherInfo,
      moment().format('YYYY-MM-DD HH:00'),
      'Hourly'
    )
    const todayAQ = formatAirQuality(
      weatherInfo,
      moment().format('YYYY-MM-DD'),
      'Daily'
    )
    const tomorrowAQ = formatAirQuality(
      weatherInfo,
      moment().add(1, 'days').format('YYYY-MM-DD'),
      'Daily'
    )

    let uvIndex = 0
    weatherInfo.hourly.time.some((v, i) => {
      if (
        moment(v).format('YYYY-MM-DD HH:00') ===
        moment().format('YYYY-MM-DD HH:00')
      ) {
        uvIndex = weatherInfo.hourly.uv_index[i]
        return true
      }
    })

    const uvInfo = getUVInfo(uvIndex)

    // let visibilityVal = weatherInfo.current.visibility
    // let visibilityUnit = ''
    // if (weatherInfo.current.visibility < 1000) {
    //   visibilityVal = Math.round(weatherInfo.current.visibility || 0)
    //   visibilityUnit = 'm'
    // }
    // if (weatherInfo.current.visibility < 1000 * 10) {
    //   visibilityVal =
    //     Math.round((weatherInfo.current.visibility || 0) / 10) / 100
    //   visibilityUnit = 'km'
    // }
    // visibilityVal = Math.round((weatherInfo.current.visibility || 0) / 100) / 10
    // visibilityUnit = 'km'

    const nowH = moment().format('YYYY-MM-DD HH:00')
    let nowHIndex = -1
    weatherInfo.hourly.time.some((v, i) => {
      if (nowH === moment(v).format('YYYY-MM-DD HH:00')) {
        nowHIndex = i
        return true
      }
    })

    const precipitation24In = weatherInfo.hourly.time.reduce((t, v, i) => {
      if (i <= nowHIndex && i > nowHIndex - 24) {
        t = t + weatherInfo.hourly.precipitation[i]
      }
      return t
    }, 0)
    const precipitation24Next = weatherInfo.hourly.time.reduce((t, v, i) => {
      // console.log(
      //   'vvvvvv',
      //   nowHIndex,
      //   i,
      //   weatherInfo.hourly.precipitation[i],
      //   moment(v).format('YYYY-MM-DD HH:00')
      // )

      if (i >= nowHIndex && i < nowHIndex + 24) {
        t = t + weatherInfo.hourly.precipitation[i]
      }

      return t
    }, 0)

    const detailedPressureLevel = getDetailedPressureLevel(
      weatherInfo.current.surfacePressure || 0,
      weatherInfo.current.altitude || 0
    )

    const visibilityAlert = getVisibilityAlert(
      convertVisibility(
        weatherInfo.current.visibility,
        weatherInfo.current_units.visibility as any,
        'km'
      )
    )

    return {
      uvIndex: {
        val: uvIndex,
        unit: weatherInfo.dailyUnits.uv_index_max,
        level: uvInfo.level,
        color: uvInfo.color,
        desc: uvInfo.text,
      },
      windy: {
        val: weatherInfo?.current?.wind_speed_10m.toFixed(1),
        unit: weatherInfo?.current_units?.wind_speed_10m,
        // desc: uvInfo.text,
        desc: '',
        level: getWindForceLevel(
          weatherInfo?.current?.wind_speed_10m || 0,
          weatherInfo.current_units.wind_speed_10m
        ),
        color: '',
        direction: getWindDirectionText(
          weatherInfo?.current?.wind_direction_10m || 0,
          true
        ),
      },
      visibility: {
        val: weatherInfo.current.visibility,
        unit: weatherInfo.current_units.visibility,
        desc: visibilityAlert.description,
        level: visibilityAlert.level,
      },
      humidity: {
        val: weatherInfo.current.relative_humidity_2m,
        unit: weatherInfo.current_units.relative_humidity_2m,
        desc: t('currentDewPoint', {
          ns: 'sakiuiWeather',
          num: `${convertTemperature(
            precipitation24Next,
            weatherInfo.current_units.dew_point_2m as any,
            weather.weatherData.units.temperature
          )}${weather.weatherData.units.temperature}`,
        }),
      },
      surfacePressure: {
        val: weatherInfo.current.surfacePressure,
        unit: weatherInfo.current_units.surface_pressure,
        level: detailedPressureLevel.level,
        color: detailedPressureLevel.color,
        desc: detailedPressureLevel.description,
      },
      precipitation: {
        val: precipitation24In,
        unit: weatherInfo.hourlyUnits.precipitation,
        // 0.05cm in last 24 hours
        //         precipitation summary
        // 0 cm precipitation is expected in the next 24 hours

        // last 1 hours: 0 cm
        desc: t('forecastPrecipitation24Hours', {
          ns: 'sakiuiWeather',
          num:
            convertPrecipitation(
              precipitation24Next,
              weatherInfo.hourlyUnits.precipitation as any,
              weather.weatherData.units.precipitation
            ) + weather.weatherData.units.precipitation,
        }),
      },
      curAQ: {
        ...curAQ,
        aqiDesc: getAqiDescription(curAQ.european_aqi),
      },
      todayAQ: {
        ...todayAQ,
        aqiDesc: getAqiDescription(todayAQ.european_aqi),
      },
      tomorrowAQ: {
        ...tomorrowAQ,
        aqiDesc: getAqiDescription(tomorrowAQ.european_aqi),
      },
    }
  }, [
    weatherInfo,
    language,
    config.connectionStatus.sakiuiI18n,
    weather.weatherData.units,
  ])

  const { curAQ, todayAQ, tomorrowAQ, uvIndex, windy, visibility } = curInfo

  const [dayForecastListType, setDayForecastListType] = useState(
    'Curve' as 'Curve' | 'List'
  )
  const [airQualityListType, setAirQualityListType] = useState(
    'Today' as 'Today' | '24Hours' | '8Days'
  )
  const [sunMoonListType, setSunMoonListType] = useState(
    'Today' as 'Today' | '45Days'
  )

  useEffect(() => {
    if (airQualityListType !== 'Today') {
      // aqi-24Hours-chart

      if (airQualityListType === '24Hours') {
        let curIndex = 0
        weatherInfo.airQuality.hourly.time.some((v, i) => {
          const curHour = moment().format('YYYY-MM-DD HH:00')
          const vHour = moment(v).format('YYYY-MM-DD HH:00')

          if (curHour === vHour) {
            curIndex = i
            return true
          }
        })
        console.log('curIndex', weatherInfo.airQuality.hourly, curIndex)
        createAQIChart({
          container: '#aqi-24Hours-chart',
          weatherInfo,
          themeColor,
          type: 'AQI24Hours',
          width: 1680,
          height: 140,
          margin: {
            top: 30,
            bottom: 20,
            right: 0,
            left: 0,
          },
          aqiData: weatherInfo.airQuality.hourly.time
            .slice(0, 96)
            .map((v, i): WeatherAQIData => {
              if (i < curIndex - 1 || i > curIndex + 22) {
                return {
                  aqi: 0,
                  date: '',
                }
              }

              const curHour = moment().format(timeFormat.h)
              const vHour = moment(v).format(timeFormat.h)
              return {
                aqi: weatherInfo.airQuality.hourly.european_aqi[i],
                date:
                  curHour === vHour
                    ? t('now', {
                        ns: 'sakiuiWeather',
                      })
                    : vHour,
              }
            })
            .filter((v) => v.date),
        })
      }

      if (airQualityListType === '8Days') {
        const aqiData = weatherInfo.airQuality.daily.time
          .map((v, i): WeatherAQIData => {
            const vHour = moment(v).format('MM-DD')
            return {
              aqi: weatherInfo.airQuality.daily.european_aqi[i],
              date: vHour,
            }
          })
          .filter((v) => v.aqi)
        createAQIChart({
          container: '#aqi-8Days-chart',
          themeColor,
          weatherInfo,
          type: 'AQI24Hours',
          width: aqiData.length * 70,
          height: 140,
          margin: {
            top: 30,
            bottom: 20,
            right: 0,
            left: 0,
          },
          aqiData: aqiData,
        })
      }
    }
  }, [
    weatherInfo,
    config.lang,
    airQualityListType,
    config.connectionStatus.sakiuiI18n,
    themeColor,
    weather.weatherData.units,
  ])

  useEffect(() => {
    if (weatherInfo?.current?.weather && curAQ.european_aqi) {
      let curIndex = 0

      weatherInfo.hourly.time.some((v, i) => {
        const vHour = moment(v).format('YYYY-MM-DD HH:00')
        const curHour = moment().format('YYYY-MM-DD HH:00')
        // console.log('getWeather curIndex', curHour, vHour)
        if (curHour === vHour) {
          curIndex = i
          return true
        }

        return curIndex
      })

      console.log('getWeather curIndex', curIndex)

      createWeatherChart({
        container: '#hourly-chart',
        weatherInfo,
        themeColor,
        type: 'Hourly',
        width: 1680,
        height: 220,
        margin: {
          top: 110,
          bottom: 30,
          right: 0,
          left: 0,
        },
        data: weatherInfo.hourly.time
          .slice(0, 96)
          .map((v, i): WeatherData => {
            const curHour = moment().format(timeFormat.h)
            const vHour = moment(v).format(timeFormat.h)
            // const vHour = moment(v).format('MM-DD HH')

            if (i < curIndex - 1 || i > curIndex + 22) {
              return {
                week: '',
                shortDate: '',
                date: '',
                hour: '',
                high: 0,
                low: -9999,
                weatherCode: 0,
                maxTempWeatherCode: 0,
                minTempWeatherCode: -9999,
              }
            }
            const highTemp = weatherInfo.hourly.temperature_2m[i]
            const weatherCode = weatherInfo.hourly.weathercode[i]

            return {
              week: v,
              shortDate: v,
              date: v,
              hour:
                curHour === vHour
                  ? t('now', {
                      ns: 'sakiuiWeather',
                    })
                  : vHour,
              high: highTemp,
              low: -9999,
              weatherCode: weatherCode,
              maxTempWeatherCode: weatherInfo.daily.maxTempWeatherCodes[i],
              minTempWeatherCode: -9999,
              precipitationProbabilityMax:
                weatherInfo.hourly.precipitation_probability[i],
              wind_direction_10m: weatherInfo.hourly.wind_direction_10m[i],
              wind_speed_10m: weatherInfo.hourly.wind_speed_10m[i],
            }
          })
          .filter((v) => v.date && v.shortDate),
      })
      createWeatherChart({
        container: '#daily-chart',
        weatherInfo,
        themeColor,
        type: 'Daily',
        width: 1200,
        height: 350,
        margin: {
          top: 125,
          bottom: 160,
          right: 0,
          left: 0,
        },
        data: weatherInfo.daily.time
          .map((v, i): WeatherData => {
            const highTemp = weatherInfo.daily.temperature_2m_max[i]
            const lowTemp = weatherInfo.daily.temperature_2m_min[i]
            const weatherCode = weatherInfo.daily.weathercode[i]

            let date = formatWeatherDate(v)
            return {
              week: date.week,
              shortDate: date?.date || '',
              date: v,
              hour: '0',
              high: highTemp,
              low: lowTemp,
              weatherCode: weatherCode,
              maxTempWeatherCode: weatherInfo.daily.maxTempWeatherCodes[i],
              minTempWeatherCode: weatherInfo.daily.minTempWeatherCodes[i],
              precipitationProbabilityMax:
                weatherInfo.daily.precipitation_probability_max[i],
              precipitationProbabilityMin:
                weatherInfo.daily.precipitation_probability_min[i],
              wind_direction_10m:
                weatherInfo.daily.wind_direction_10m_dominant[i],
              wind_speed_10m: weatherInfo.daily.wind_speed_10m_max[i],
            }
          })
          .filter((v) => v.date && v.shortDate),
      })
    }
    // weatherInfo?.weather && initDailyWeatherChart()
  }, [
    weatherInfo,
    curAQ.european_aqi,
    config.lang,
    dayForecastListType,
    config.connectionStatus.sakiuiI18n,
    themeColor,
    weather.weatherData.units,
  ])

  const [renderSunmoon, setRenderSunmoon] = useState(false)
  const [fixedHeader, setFixedHeader] = useState(false)
  const [bgBlur, setBgBlur] = useState(false)

  useEffect(() => {
    const sunMoonEl = document.body.querySelector('#chart-sunmoon')
    let options = {
      // root: document.body,
      rootMargin: '0px',
      threshold: 1.0,
    }

    let observer = new IntersectionObserver((e) => {
      // if (this.src.indexOf("c61baa0aa19cf71fae58b8f54afc4a60") >= 0) {
      //   console.log("saaaaaaaaaaaa", e, e?.[0]?.target);
      // }
      console.log('imagesssssss obs', e, e?.[0]?.intersectionRatio)
      // if (e?.[0]?.intersectionRatio === 1) {
      //   console.log('imagesssssss obs', e, e?.[0]?.intersectionRatio)
      //   setRenderSunmoon(true)
      // }
      setRenderSunmoon(e?.[0]?.intersectionRatio === 1)
    }, options)
    sunMoonEl && observer.observe(sunMoonEl)

    const scrollEvent = () => {
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop
      console.log(
        'ocument.body wpHeaderEl scrollEvent',
        document.body.scrollTop
      )
      setFixedHeader(scrollTop >= 60)
      setBgBlur(scrollTop >= 100)
    }

    console.log('ocument.body', document.body)
    window.addEventListener('scroll', scrollEvent)

    return () => {
      sunMoonEl && observer.unobserve(sunMoonEl)
      observer.disconnect()
      window.removeEventListener('scroll', scrollEvent)
    }
  }, [mounted])

  const sunMoon = useMemo(() => {
    const celestialTimes = getCelestialTimesRange(
      cityItem?.lat || 0,
      cityItem?.lng || 0,
      cityItem?.weatherInfo?.current?.altitude || 1,
      1,
      45
    )

    let nowDate = new Date()
    // nowDate = new Date('2025-06-13 0:50:00')

    const sunTimes = getSunTimes(nowDate, celestialTimes)

    const moonTimes = getMoonTimes(nowDate, celestialTimes)

    const twilightTimes = calculateTwilightTimes(
      new Date(),
      cityItem?.lat || 0,
      cityItem?.lng || 0,
      cityItem?.weatherInfo?.current?.altitude || 1
    )
    // console.log('晨昏蒙影时间:', twilightTimes, weatherInfo.current)

    return {
      sunrise: new Date(sunTimes.sunrise),
      sunset: new Date(sunTimes.sunset),
      solarNoon: new Date(sunTimes.solarNoon),
      moonrise: new Date(moonTimes.moonrise),
      moonset: new Date(moonTimes.moonset),
      celestialTimes,
      twilightTimes,
    }
    // weatherInfo?.weather && initDailyWeatherChart()
  }, [cityItem, renderSunmoon, weather.weatherData.units])

  useEffect(() => {
    if (
      weatherInfo.current.weather &&
      renderSunmoon &&
      sunMoonListType === 'Today'
    ) {
      let nowDate = new Date()
      createSunMoonChart({
        selector: '#chart-sunmoon',
        nowDate: nowDate,
        themeColor,
        // solarNoon: solarNoon.time.date,
        solarNoon: sunMoon.solarNoon,
        events: [
          {
            type: 'sunrise',
            time: '06:00',
            date: sunMoon.sunrise,
            text: t('sunrise', {
              ns: 'sakiuiWeather',
            }),
            radius: 0,
            startX: 28,
            startY: 0,
          },
          {
            type: 'sunset',
            time: '18:00',
            date: sunMoon.sunset,
            text: t('sunset', {
              ns: 'sakiuiWeather',
            }),
            radius: 0,
            startX: 310,
            startY: 0,
          },
          {
            type: 'moonrise',
            time: '06:00',
            date: sunMoon.moonrise,
            text: t('moonrise', {
              ns: 'sakiuiWeather',
            }),
            radius: 0,
            startX: 75,
            startY: 0,
          },
          {
            type: 'moonset',
            time: '18:00',
            date: sunMoon.moonset,
            text: t('moonset', {
              ns: 'sakiuiWeather',
            }),
            radius: 0,
            startX: 265,
            startY: 0,
          },
        ],
      })
    }
  }, [
    weatherInfo,
    renderSunmoon,
    config.lang,
    sunMoonListType,
    config.connectionStatus.sakiuiI18n,
  ])

  const [openEditCity, setOpenEditCity] = useState(false)
  const [openAddCityPage, setOpenAddCityPage] = useState(false)
  const [addCityName, setAddCityName] = useState('')
  const searchCityNameDeb = useRef(new Debounce())

  interface Address {
    district: string
    state: string
    'ISO3166-2-lvl4': string
    country: string
    country_code: string
  }

  interface NominatimResult {
    place_id: number
    licence: string
    osm_type: string
    osm_id: number
    lat: string
    lon: string
    category: string
    type: string
    place_rank: number
    importance: number
    addresstype: string
    name: string
    display_name: string
    address: Address
    boundingbox: [string, string, string, string]
  }
  const [searchResult, setSearchResult] = useState<NominatimResult[]>([])
  const [searchResultLoading, setSearchResultLoading] = useState('loaded')

  const searchCityName = async (cityName: string) => {
    if (!cityName) {
      setSearchResultLoading('noMore')
      setSearchResult([])
      return
    }
    setSearchResultLoading('loading')
    console.log('searchCityName', cityName)
    const res: any = await httpApi.v1.Geo.search({
      keywords: cityName,
    })
    console.log('searchCityName res', res)
    if (res) {
      if (res?.length) {
        setSearchResult(res)
      } else {
        setSearchResult([res])
      }
    }
    setSearchResultLoading('noMore')
  }

  useEffect(() => {
    searchCityNameDeb.current.increase(() => {
      searchCityName(addCityName)
    }, 1000)
  }, [addCityName])

  const getDisplayName = (cityItem: (typeof cities)[0]) => {
    return cityItem?.displayName
      ? cityItem?.displayName
          .split(',')
          .reverse()
          .reduce((t, v, i, arr) => {
            if (i >= arr.length - 1) {
              t += v.trim()
            }
            return t
          }, '')
      : cityItem?.cityInfo?.address
          ?.split('·')
          .filter((v, i, arr) => {
            return i >= arr.length - 1
          })
          .join('')
  }

  const [openWeatherDetailModalType, setOpenWeatherDetailModalType] = useState<
    | 'surfacePressure'
    | 'windLevel'
    | 'uvIndex'
    | 'visibility'
    | 'precipitation'
    | 'humidity'
    | 'warning'
    | ''
  >('')

  const { weatherVideoUrl, isDusk, isNight, isDawn, timeFormat } =
    useMemo(() => {
      const timeFormat = covertTimeFormat(
        weather.weatherData.units.timeFormat,
        config.lang
      )

      let now = moment()

      // const nextSunMoon = sunMoon.celestialTimes.filter((v) => {
      //   return v.date === moment().add(1, 'days').format('YYYY-MM-DD')
      // })?.[0]

      // console.log(
      //   'getWeatherVideoUrl',
      //   // weatherInfo,
      //   // cities,
      //   // sunMoon,
      //   // nextSunMoon,
      //   now.format('YYYY-MM-DD HH:mm:ss')
      // )

      const twilightStartTime = moment(sunMoon.sunset).unix() - 60 * 60
      const sunsetTime = moment(sunMoon.sunset).unix()
      const sunriseTime = moment(sunMoon.sunrise).unix()

      let isDusk =
        now.unix() > twilightStartTime && now.unix() < sunsetTime + 15 * 60

      let isNight =
        now.unix() >= sunsetTime + 15 * 60 || now.unix() < sunriseTime - 60 * 60

      let isDawn =
        now.unix() >= sunriseTime - 60 * 60 &&
        now.unix() < sunriseTime + 60 * 60

      const weatherVideoUrl = getWeatherVideoUrl(
        weatherInfo?.current?.weatherCode,
        {
          dusk: isDusk,
          night: isNight,
          dawn: isDawn,
          latlng:
            cityItem.cityInfo?.address || cityItem?.lat + cityItem?.lng + '',
        }
      )

      return {
        weatherVideoUrl,
        isDusk,
        isNight,
        isDawn,
        timeFormat,
      }
    }, [cityItem, sunMoon, config.lang])

  const getUpdateTime = (cItem: typeof cityItem) => {
    return Math.max(cItem.updateCurTime || 0, cItem.updateAllTime || 0, 0)
  }

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
        <meta name="description" content={t('subtitle')} />
        <script src="/js/d3.v7.min.js"></script>
        <link
          href="https://cdn.jsdelivr.net/npm/qweather-icons@1.7.0/font/qweather-icons.css"
          rel="stylesheet"
        ></link>
        {/* <script src="https://d3js.org/d3.v7.min.js"></script> */}
      </Head>
      <div
        style={
          {
            '--wp-w': config.deviceWH.w + 'px',
            '--wp-h': config.deviceWH.h + 'px',
          } as any
        }
        className={
          'weather-page ' +
          config.deviceType +
          ' ' +
          themeColor +
          ' ' +
          (fixedHeader ? 'fixedHeader ' : ' ') +
          (bgBlur ? 'bgBlur' : '')
        }
      >
        <div className="wp-main">
          <div className="wp-m-top"></div>

          <div
            style={{
              height:
                (config.deviceType === 'Mobile'
                  ? Math.max(500, Math.min(600, config.deviceWH.h - 50))
                  : Math.max(500, Math.min(600, config.deviceWH.h - 210))) +
                'px',
            }}
            className="wp-top"
          >
            {weatherVideoUrl?.url && mounted ? (
              <video
                ref={(e) => {
                  if (e?.playbackRate) {
                    // e.playbackRate = 0.5
                  }
                }}
                // width={Math.min(700, config.deviceWH.w)}
                // height={Math.min(500, config.deviceWH.h)}
                src={weatherVideoUrl.url}
                autoPlay
                controls={false}
                loop
                muted
                className={config.deviceType}
              ></video>
            ) : (
              ''
            )}

            <div className="wp-t-top">
              <div className="wp-header">
                <div className="wp-h-left">
                  {/* <span className="wp-h-l-cityName">
                {getDisplayName(cityItem)}
              </span> */}
                  <NoSSR>
                    <SakiDropdown
                      ref={
                        bindEvent({
                          close: (e) => {
                            console.log('headerdp close', e.target)
                            setOpenCityDropdown(false)
                          },
                        }) as any
                      }
                      visible={openCityDropdown}
                      floating-direction="Left"
                      z-index="1001"
                      offsetX={config.deviceType === 'Mobile' ? -10 : 0}
                      offsetY={config.deviceType === 'Mobile' ? -10 : 0}
                    >
                      <SakiButton
                        onTap={() => {
                          // onSettings?.('Account')
                          setOpenCityDropdown(!openCityDropdown)
                          setOpenEditCity(false)
                        }}
                        type="Normal"
                        border="none"
                        bgColor={
                          !fixedHeader
                            ? 'rgba(0,0,0,0)'
                            : themeColors['--button-bg-color']
                        }
                        bgHoverColor={
                          !fixedHeader
                            ? 'rgba(0,0,0,0.3)'
                            : themeColors['--button-bg-hover-color']
                        }
                        bgActiveColor={
                          !fixedHeader
                            ? 'rgba(0,0,0,0.5)'
                            : themeColors['--button-bg-active-color']
                        }
                      >
                        {cityItem?.curPopsition ? (
                          <saki-icon
                            width="22px"
                            height="22px"
                            color={
                              !fixedHeader ? '#fff' : themeColors['--c3-color']
                            }
                            margin="0 2px 0 0"
                            type="PositionFill"
                          ></saki-icon>
                        ) : (
                          ''
                        )}
                        <span className="wp-h-l-city text-elipsis">
                          {getDisplayName(cityItem)}
                        </span>
                        <saki-icon
                          width="24px"
                          height="24px"
                          color={
                            !fixedHeader ? '#fff' : themeColors['--c3-color']
                          }
                          type="BottomTriangle"
                        ></saki-icon>
                      </SakiButton>
                      <div slot="main">
                        {mounted ? (
                          <div
                            style={
                              {
                                '--deviceWH-w': config.deviceWH.w + 'px',
                                '--deviceWH-h': config.deviceWH.h + 'px',
                                '--dp-w':
                                  Math.min(360, config.deviceWH.w) + 'px',
                              } as any
                            }
                            className="wp-h-l-cities"
                          >
                            <div className="cities-header">
                              <div className="c-h-left">
                                {config.deviceType === 'Mobile' ? (
                                  <SakiButton
                                    onTap={() => {
                                      setOpenCityDropdown(false)
                                    }}
                                    type="CircleIconGrayHover"
                                    border="none"
                                    margin="0 4px 0 0"
                                  >
                                    <SakiIcon
                                      width="14px"
                                      height="14px"
                                      color="#666"
                                      type="Left"
                                    ></SakiIcon>
                                  </SakiButton>
                                ) : (
                                  ''
                                )}
                                <span>
                                  {t('citiesList', {
                                    ns: 'weatherPage',
                                  })}
                                </span>
                              </div>
                              <div className="c-h-right">
                                {loadStatus === 'loading' &&
                                openCityDropdown ? (
                                  <>
                                    <SakiRow alignItems="center">
                                      <SakiAnimationLoading />
                                      <span
                                        style={{
                                          margin: '0 6px 0 6px',
                                          color: '#999',
                                          fontSize: '12px',
                                          textAlign: 'right',
                                        }}
                                      >
                                        {t('loadWeather', {
                                          ns: 'sakiuiWeather',
                                        })}
                                      </span>
                                    </SakiRow>
                                  </>
                                ) : (
                                  <></>
                                )}

                                {!openEditCity ? (
                                  <SakiButton
                                    onTap={() => {
                                      // onSettings?.('Account')
                                      setOpenAddCityPage(true)
                                      setSearchResult([])
                                      setAddCityName('')
                                    }}
                                    type="CircleIconGrayHover"
                                    border="none"
                                  >
                                    <saki-icon
                                      width="16px"
                                      height="16px"
                                      color="#666"
                                      type="Add"
                                    ></saki-icon>
                                  </SakiButton>
                                ) : (
                                  ''
                                )}

                                {openEditCity ? (
                                  <saki-button
                                    ref={bindEvent({
                                      tap: () => {
                                        setOpenEditCity(!openEditCity)
                                      },
                                    })}
                                    type="Normal"
                                    border="none"
                                  >
                                    <span>
                                      {t('confirm', {
                                        ns: 'prompt',
                                      })}
                                    </span>
                                  </saki-button>
                                ) : (
                                  <SakiButton
                                    onTap={() => {
                                      // onSettings?.('Account')
                                      setOpenEditCity(!openEditCity)
                                    }}
                                    type="CircleIconGrayHover"
                                    border="none"
                                  >
                                    <SakiIcon
                                      width="13px"
                                      height="13px"
                                      color={
                                        openEditCity
                                          ? 'var(--saki-default-color)'
                                          : '#666'
                                      }
                                      type="Pen"
                                    ></SakiIcon>
                                  </SakiButton>
                                )}

                                {!openEditCity ? (
                                  <>
                                    {/* <SakiButton
                                      onTap={() => {
                                        setCitiesListType(
                                          citiesListType === 'List'
                                            ? 'Grid'
                                            : 'List'
                                        )

                                        storage.global.setSync(
                                          'CitiesListType',
                                          citiesListType === 'List'
                                            ? 'Grid'
                                            : 'List'
                                        )
                                      }}
                                      type="CircleIconGrayHover"
                                      border="none"
                                    >
                                      <saki-icon
                                        width="16px"
                                        height="16px"
                                        color="#666"
                                        type={
                                          citiesListType === 'List'
                                            ? 'DeviceList'
                                            : 'Grid'
                                        }
                                      ></saki-icon>
                                    </SakiButton> */}

                                    {/* <SakiDropdown
                                      ref={
                                        bindEvent({
                                          close: (e) => {
                                            console.log(
                                              'headerdp sub close',
                                              e.target
                                            )
                                            e.stopPropagation()

                                            e.preventDefault()
                                            setOpenCityExImPortDropdown(false)
                                          },
                                        }) as any
                                      }
                                      className="openCityExImPortDropdown"
                                      visible={openCityExImPortDropdown}
                                      floating-direction="Left"
                                    >
                                      <SakiButton
                                        onTap={() => {
                                          setOpenCityExImPortDropdown(true)
                                        }}
                                        type="CircleIconGrayHover"
                                        border="none"
                                      >
                                        <saki-icon
                                          width="16px"
                                          height="16px"
                                          color={'#666'}
                                          type="Download"
                                        ></saki-icon>
                                      </SakiButton>
                                      <div slot="main">
                                        <SakiMenu
                                          onSelectvalue={(e) => {
                                            console.log(
                                              'headerdp ',
                                              e.detail.value
                                            )
                                            switch (e.detail.value) {
                                              case 'import':
                                                break
                                              case 'export':
                                                break

                                              default:
                                                break
                                            }

                                            setOpenCityExImPortDropdown(false)
                                          }}
                                        >
                                          {['import', 'export'].map((v, i) => {
                                            return (
                                              <SakiMenuItem value={v} key={i}>
                                                <span
                                                  style={{
                                                    color: '#666',
                                                  }}
                                                >
                                                  {t(v, {
                                                    ns: 'prompt',
                                                  })}
                                                </span>
                                              </SakiMenuItem>
                                            )
                                          })}
                                        </SakiMenu>
                                      </div>
                                    </SakiDropdown> */}
                                  </>
                                ) : (
                                  ''
                                )}
                              </div>
                            </div>
                            <div
                              className={`cities-list ${
                                openEditCity ? 'List' : citiesListType
                              } scrollBarDefault`}
                            >
                              {cities.map((v, i) => {
                                const distance = getDistance(
                                  v.lat,
                                  v.lng,
                                  position?.position?.coords.latitude || 0,
                                  position?.position?.coords.longitude || 0
                                )
                                return (
                                  <div
                                    ref={
                                      bindEvent({
                                        click: async (e: any) => {
                                          dispatch(
                                            weatherSlice.actions.setWeatherData(
                                              {
                                                cities: cities.map((sv, si) => {
                                                  return {
                                                    ...sv,
                                                    default: si === i,
                                                  }
                                                }),
                                              }
                                            )
                                          )

                                          setCurCityIndex(i)
                                          await storage.global.set(
                                            'curCityIndex',
                                            v.lat + ';' + v.lng
                                          )

                                          setOpenCityDropdown(false)
                                        },
                                      }) as any
                                    }
                                    className={
                                      'cities-item ' +
                                      (curCityIndex === i ? 'active' : '')
                                    }
                                    key={i}
                                  >
                                    {openEditCity && !v.curPopsition ? (
                                      <div className="c-i-icon">
                                        <SakiButton
                                          onTap={() => {
                                            deleteCityItem(i)
                                          }}
                                          type="CircleIconGrayHover"
                                          border="none"
                                          margin="0 8px 0 0"
                                          bgColor="transparent"
                                          bgHoverColor="transparent"
                                          bgActiveColor="transparent"
                                        >
                                          <SakiIcon
                                            width="14px"
                                            height="14px"
                                            color="#666"
                                            type="Trash"
                                          ></SakiIcon>
                                        </SakiButton>
                                      </div>
                                    ) : (
                                      ''
                                    )}

                                    <div className="c-i-main">
                                      <div className="c-i-left">
                                        <span>
                                          {v?.curPopsition ? (
                                            <saki-icon
                                              width="18px"
                                              height="18px"
                                              color="#999"
                                              margin="0 2px 0 0"
                                              type="PositionFill"
                                            ></saki-icon>
                                          ) : (
                                            ''
                                          )}

                                          <span>{getDisplayName(v)}</span>
                                          {distance ? (
                                            <span className="distance">
                                              {formatDistance(distance)}
                                            </span>
                                          ) : (
                                            ''
                                          )}
                                        </span>
                                        <span>
                                          {v.cityInfo?.address
                                            .split('·')
                                            .filter((v, i) => i > 0)
                                            .join('·')}
                                        </span>
                                      </div>
                                      <div className="c-i-right">
                                        <span>
                                          {v?.weatherInfo?.current?.temperature}
                                          ℃
                                        </span>
                                        <span>
                                          {v?.weatherInfo?.current?.weather}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            <saki-transition
                              class-name={'w-addcity'}
                              animation-duration="300"
                              data-refresh={config.deviceType}
                              in={openAddCityPage}
                            >
                              <div className={'wp-h-l-addCity '}>
                                <div className="wa-header">
                                  <div className="wa-h-left">
                                    <SakiButton
                                      onTap={() => {
                                        // onSettings?.('Account')
                                        setOpenAddCityPage(false)
                                      }}
                                      type="CircleIconGrayHover"
                                      border="none"
                                    >
                                      <SakiIcon
                                        width="14px"
                                        height="14px"
                                        color="#666"
                                        type="Left"
                                      ></SakiIcon>
                                    </SakiButton>
                                  </div>
                                  <div className="wa-h-right">
                                    <SakiInput
                                      onChangevalue={(e) => {
                                        // console.log("Dom发生了变化", e)
                                        console.log(
                                          'getCityInfo',
                                          e,
                                          moment(e.detail.date).format(
                                            'YYYY-MM-DD HH:mm:ss'
                                          )
                                        )
                                        setAddCityName(e.detail)
                                        // if (!e.detail) {
                                        //   setStartDate?.('')
                                        //   return
                                        // }
                                        // setStartDate?.(
                                        //   moment(e.detail).format(
                                        //     'YYYY-MM-DD HH:mm:ss'
                                        //   )
                                        // )
                                      }}
                                      onFocusfunc={() => {
                                        console.log('focus')
                                        // setOpenStartDateDatePicker(true)
                                      }}
                                      height="40px"
                                      padding="0 4px 0 28px"
                                      value={addCityName}
                                      border-radius="20px"
                                      font-size="14px"
                                      margin="0 0 0 4px"
                                      placeholder={t('enterCityName', {
                                        ns: 'weatherPage',
                                      })}
                                      type={'Search'}
                                      closeIcon={!!addCityName}
                                      color={'#222'}
                                      border="1px solid #eee"
                                      text-align="left"
                                    ></SakiInput>
                                  </div>
                                </div>
                                <div className="wa-main scrollBarDefault">
                                  {searchResultLoading === 'loading' ? (
                                    <div className="wa-loading">
                                      <saki-animation-loading
                                        type="rotateEaseInOut"
                                        width="20px"
                                        height="20px"
                                        border="3px"
                                        border-color="var(--default-color)"
                                      />
                                      <span>
                                        {t('searching', {
                                          ns: 'prompt',
                                        })}
                                      </span>
                                    </div>
                                  ) : (
                                    ''
                                  )}
                                  {searchResult.map((v, i) => {
                                    return (
                                      <div
                                        ref={
                                          bindEvent({
                                            click: () => {
                                              addCity(v)
                                            },
                                          }) as any
                                        }
                                        className={'wa-m-item'}
                                        key={i}
                                      >
                                        <div className="wa-m-i-left">
                                          <span>{v.name}</span>
                                          <span>{v.display_name}</span>
                                        </div>
                                        <div className="wa-m-i-right">
                                          {/* <SakiButton
                                      onTap={() => {
                                        // onSettings?.('Account')
                                        addCity(v)
                                      }}
                                      type="CircleIconGrayHover"
                                      bgColor="transparent"
                                      bgHoverColor="transparent"
                                      bgActiveColor="transparent"
                                      border="none"
                                    >
                                      <saki-icon
                                        width="14px"
                                        height="14px"
                                        color="#999"
                                        type="Add"
                                      ></saki-icon>
                                    </SakiButton> */}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </saki-transition>
                          </div>
                        ) : (
                          ''
                        )}
                      </div>
                    </SakiDropdown>
                  </NoSSR>

                  {/* <div className="wp-h-l-dots">
                {new Array(6).fill(0).map((v, i) => {
                  return <div className="dot-item" key={i}></div>
                })}
              </div> */}
                </div>
                <div className="wp-h-right">
                  {loadStatus === 'loading' ? (
                    <>
                      <SakiRow alignItems="center">
                        <SakiAnimationLoading />
                        <span
                          style={{
                            margin: '0 6px 0 6px',
                            color: 'var(--c1-f-color)',
                            fontSize: '12px',
                            textAlign: 'right',
                          }}
                        >
                          {t('loadWeather', {
                            ns: 'sakiuiWeather',
                          })}
                        </span>
                      </SakiRow>
                    </>
                  ) : getUpdateTime(cityItem) ? (
                    <div className="wp-c-updateTime">
                      {t('updatedTime', {
                        ns: 'sakiuiWeather',
                        time:
                          formatDurationI18n(
                            (new Date().getTime() - getUpdateTime(cityItem)) /
                              1000,
                            false
                          ) ||
                          0 +
                            t('secondTime', {
                              ns: 'prompt',
                            }),
                      })}
                    </div>
                  ) : (
                    ''
                  )}
                </div>
              </div>

              <div className="wp-header2">
                <div className="wp-h-left">
                  {weatherInfo?.alert?.warning?.length ? (
                    <div
                      onClick={() => {
                        setOpenWeatherDetailModalType('warning')
                      }}
                      className="wp-w-button"
                    >
                      <span className="wp-w-text">
                        {t('warning', {
                          ns: 'sakiuiWeather',
                        })}
                        :
                      </span>
                      <div className="wp-w-list">
                        {weatherInfo?.alert?.warning?.map((v, i) => {
                          return (
                            <div className="wp-w-item" key={i}>
                              <WarningIcon
                                width={32}
                                type={v.type}
                                typeName={v.typeName}
                                color={
                                  v.severityColor || getWarningColor(v.severity)
                                }
                                lang={config.lang}
                              ></WarningIcon>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    ''
                  )}
                </div>
                <div className="wp-h-right">
                  <div
                    onClick={() => {
                      // setOpenWeatherDetailModalType('')

                      // console.log("document.body.querySelector('.wp-aq')")

                      const y =
                        (document.body
                          .querySelector('.wp-aq')
                          ?.getBoundingClientRect?.()?.top || 0) - 60 || 0

                      window.scrollTo({
                        top: y,
                        behavior: 'smooth',
                      })
                    }}
                    className={'wp-data-aq '}
                  >
                    <span
                      style={{
                        backgroundColor: curAQ.aqiDesc.color,
                      }}
                      className={'aqi-icon ' + curAQ.aqiDesc.className}
                    >
                      <div className="icon">
                        <NoSSR>
                          <saki-icon
                            width="18px"
                            height="18px"
                            margin="0 0 0 0px"
                            type="Leaf"
                            color={curAQ.aqiDesc.color}
                          ></saki-icon>
                        </NoSSR>
                      </div>

                      <span>
                        {(curAQ.european_aqi || 0) +
                          ' ' +
                          curAQ.aqiDesc.aqiDesc}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="wp-t-bottom">
              <div className="wp-cur">
                <div className="wp-c-top">
                  <div className="wp-c-temp">
                    <div className="wp-data-temp">
                      <span>
                        {convertTemperature(
                          weatherInfo?.current?.temperature,
                          (weatherInfo?.current_units?.temperature_2m as any) ||
                            '°C',
                          weather.weatherData.units.temperature
                        )}
                      </span>
                      <span>
                        <span>{weather.weatherData.units.temperature}</span>
                        {/* <span>{weatherInfo?.current?.weather}</span> */}
                      </span>
                    </div>
                    <div className="wp-data-weather">
                      <span>
                        {t(
                          'weather' + (weatherInfo?.current?.weatherCode || 0),
                          {
                            ns: 'sakiuiWeather',
                          }
                        )}
                      </span>
                    </div>

                    {/* {config.deviceType !== 'Mobile' ? (
                      <div className={'wp-data-item '}>
                        <span
                          style={{
                            backgroundColor: curAQ.aqiDesc.color,
                          }}
                          className={'aqi-icon ' + curAQ.aqiDesc.className}
                        >
                          <div className="icon">
                            <NoSSR>
                              <saki-icon
                                width="14px"
                                height="14px"
                                margin="0 0 0 2px"
                                type="Leaf"
                                color={curAQ.aqiDesc.color}
                              ></saki-icon>
                            </NoSSR>
                          </div>

                          <span>
                            {curAQ.european_aqi + ' ' + curAQ.aqiDesc.aqiDesc}
                          </span>
                        </span>
                      </div>
                    ) : (
                      ''
                    )} */}
                  </div>
                  <div className="wp-c-emoji">
                    <span>
                      {getWeatherIcon(
                        Number(weatherInfo?.current?.weatherCode),
                        {
                          dusk: isDusk,
                          dawn: isDawn,
                          night: isNight,
                        }
                      ) || ''}
                      {/* {openWeatherWMOToEmoji(ntextWcode)?.value || ''} */}
                    </span>

                    <span className="wp-c-e-weather">
                      {t('weather' + (weatherInfo?.current?.weatherCode || 0), {
                        ns: 'sakiuiWeather',
                      })}
                    </span>
                  </div>
                </div>
                <div className="wp-c-bottom">
                  {/* <div className="wp-c-b-left">
                <span>{weatherInfo?.current?.weather}</span>
              </div> */}

                  {weatherInfo?.current?.weather ? (
                    <div className="wp-c-data">
                      <div className="wp-data-item">
                        <saki-icon color="#fff" type="Thermometer"></saki-icon>
                        <span>
                          {t('apparentTemperature', {
                            ns: 'sakiuiWeather',
                          }) +
                            ' ' +
                            (convertTemperature(
                              weatherInfo?.current?.apparentTemperature,
                              (weatherInfo?.current_units
                                .apparent_temperature as any) || '°C',
                              weather.weatherData.units.temperature
                            ) +
                              weather.weatherData.units.temperature)}
                        </span>
                      </div>
                      {/* 
                      {config.deviceType === 'Mobile' ? (
                        <div className={'wp-data-item '}>
                          <saki-icon color="#fff" type="Leaf"></saki-icon>{' '}
                          <span>
                            {t('air', {
                              ns: 'sakiuiWeather',
                            })}
                          </span>
                          <span
                            style={{
                              // backgroundColor: '#fff',
                              backgroundColor: curAQ.aqiDesc.color,
                              height: '20px',
                              borderRadius: '10px',
                              padding: '1px 6px 2px 6px',
                            }}
                            className={'aqi-icon ' + curAQ.aqiDesc.className}
                          >
                            <span>
                              {curAQ.european_aqi + ' ' + curAQ.aqiDesc.aqiDesc}
                            </span>
                          </span>
                        </div>
                      ) : (
                        ''
                      )} */}

                      <div
                        onClick={() => {
                          setOpenWeatherDetailModalType('precipitation')
                        }}
                        className="wp-data-item"
                      >
                        <saki-icon color="#fff" type="Umbrella"></saki-icon>
                        <span>
                          {t('precipitation_probability', {
                            ns: 'sakiuiWeather',
                          }) +
                            ' ' +
                            (weatherInfo?.current?.precipitationProbability +
                              weatherInfo?.current_units
                                ?.precipitation_probability)}
                        </span>
                      </div>
                      <div
                        onClick={() => {
                          setOpenWeatherDetailModalType('precipitation')
                        }}
                        className="wp-data-item"
                      >
                        <saki-icon color="#fff" type="Rainfall"></saki-icon>
                        <span>
                          {t('precipitation', {
                            ns: 'sakiuiWeather',
                          }) +
                            ' ' +
                            (convertPrecipitation(
                              weatherInfo?.current?.temperature,
                              (weatherInfo?.current_units
                                ?.precipitation as any) || 'mm',
                              weather.weatherData.units.precipitation
                            ) +
                              weather.weatherData.units.precipitation)}
                        </span>
                      </div>
                      <div
                        onClick={() => {
                          setOpenWeatherDetailModalType('surfacePressure')
                        }}
                        className="wp-data-item"
                      >
                        <saki-icon
                          color="#fff"
                          type="PressureGauge"
                        ></saki-icon>
                        <span>
                          {t('surfacePressure', {
                            ns: 'sakiuiWeather',
                          }) +
                            ' ' +
                            (convertPressure(
                              weatherInfo?.current?.surfacePressure,
                              (weatherInfo?.current_units
                                ?.surface_pressure as any) || 'hPa',
                              weather.weatherData.units.pressure
                            ) +
                              weather.weatherData.units.pressure)}
                        </span>
                      </div>
                      <div
                        onClick={() => {
                          setOpenWeatherDetailModalType('humidity')
                        }}
                        className="wp-data-item"
                      >
                        <saki-icon color="#fff" type="Humidity"></saki-icon>
                        <span>
                          {t('humidity', {
                            ns: 'sakiuiWeather',
                          }) +
                            ' ' +
                            (curInfo.humidity.val + curInfo.humidity.unit)}
                        </span>
                      </div>
                      <div
                        onClick={() => {
                          setOpenWeatherDetailModalType('windLevel')
                        }}
                        className="wp-data-item"
                      >
                        <saki-icon color="#fff" type="Windmill"></saki-icon>
                        <span>
                          {
                            //   t('windLevel', {
                            //   ns: 'sakiuiWeather',
                            // }) +
                            //   ' ' +
                            windy.direction +
                              ' ' +
                              t('windLevelNum', {
                                ns: 'sakiuiWeather',
                                num: windy.level,
                              })
                          }
                        </span>
                      </div>
                      <div
                        onClick={() => {
                          setOpenWeatherDetailModalType('windLevel')
                        }}
                        className="wp-data-item"
                      >
                        <saki-icon color="#fff" type="Wind"></saki-icon>
                        <span>
                          {t('windSpeed', {
                            ns: 'sakiuiWeather',
                          }) +
                            ' ' +
                            (convertWindSpeed(
                              Number(windy.val),
                              (windy.unit as any) || 'km/h',
                              weather.weatherData.units.windSpeed
                            ) +
                              weather.weatherData.units.windSpeed)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    ''
                  )}
                </div>
              </div>

              <div className="wp-today">
                {weatherInfo.daily?.time?.map((v, i) => {
                  if (i === 0 || i > 2) {
                    return ''
                  }
                  const weathercode = weatherInfo.daily?.weathercode[i]
                  const temperature_2m_max =
                    weatherInfo.daily?.temperature_2m_max[i]
                  const temperature_2m_min =
                    weatherInfo.daily?.temperature_2m_min[i]

                  const maxTempWeatherCode =
                    weatherInfo.daily.maxTempWeatherCodes[i]
                  const minTempWeatherCode =
                    weatherInfo.daily.minTempWeatherCodes[i]

                  return (
                    <div className="wp-t-item" key={i}>
                      <span className="wp-t-i-icon">
                        {getWeatherIcon(Number(weathercode)) || ''}
                      </span>
                      <div className="wp-t-i-data">
                        <span className="wp-t-i-d-date">
                          {moment(v).isSame(moment(), 'day')
                            ? t('today', {
                                ns: 'sakiuiWeather',
                              })
                            : t('tomorrow', {
                                ns: 'sakiuiWeather',
                              })}
                        </span>
                        <span className="wp-t-i-d-temp">
                          {`${convertTemperature(
                            temperature_2m_min,
                            (weatherInfo.dailyUnits
                              .temperature_2m_min as any) || '°C',
                            weather.weatherData.units.temperature
                          )}~${convertTemperature(
                            temperature_2m_max,
                            (weatherInfo.dailyUnits
                              .temperature_2m_max as any) || '°C',
                            weather.weatherData.units.temperature
                          )}${weather.weatherData.units.temperature}`}
                        </span>
                        <span className="wp-t-i-d-weather">
                          <span>
                            {maxTempWeatherCode === minTempWeatherCode
                              ? t('weather' + (weathercode || 0), {
                                  ns: 'sakiuiWeather',
                                })
                              : t('weatherToWeather', {
                                  ns: 'sakiuiWeather',
                                  waether1: t(
                                    'weather' + (maxTempWeatherCode || 0),
                                    {
                                      ns: 'sakiuiWeather',
                                    }
                                  ),
                                  weather2: t(
                                    'weather' + (minTempWeatherCode || 0),
                                    {
                                      ns: 'sakiuiWeather',
                                    }
                                  ),
                                })}
                          </span>
                          <span
                            style={{
                              backgroundColor: (i === 2 ? tomorrowAQ : todayAQ)
                                .aqiDesc.color,
                            }}
                            className={'aqi-icon '}
                          >
                            <span>
                              {(i === 2 ? tomorrowAQ : todayAQ).european_aqi +
                                ' ' +
                                (i === 2 ? tomorrowAQ : todayAQ).aqiDesc
                                  .aqiDesc}
                            </span>
                          </span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="wp-hourly">
            <div className="wp-title">
              <span>
                {t('24hourForecast', {
                  ns: 'sakiuiWeather',
                })}
              </span>
            </div>
            <div className="wp-chart scrollBarHover">
              <svg id="hourly-chart"></svg>
            </div>
          </div>
          <div className="wp-daily">
            <div className="wp-title">
              <span>
                {t('15dayForecast', {
                  ns: 'sakiuiWeather',
                })}
              </span>
              <div className="wt-right">
                <div className="switch-button">
                  <NoSSR>
                    <SakiDropdown
                      ref={
                        bindEvent({
                          close: () => {
                            setOpen15dayForecastDropdown(false)
                          },
                        }) as any
                      }
                      visible={open15dayForecastDropdown}
                      floating-direction="Left"
                    >
                      <SakiButton
                        onTap={() => {
                          setOpen15dayForecastDropdown(true)
                        }}
                        type="Normal"
                        border="none"
                        padding="4px 0px 4px 6px"
                        bgColor={themeColors['--button-bg-color']}
                        bgHoverColor={themeColors['--button-bg-hover-color']}
                        bgActiveColor={themeColors['--button-bg-active-color']}
                      >
                        <span
                          style={{
                            color: themeColors['--c2-color'],
                          }}
                        >
                          {a15dayForecastDPList.filter(
                            (v) => v.val === dayForecastListType
                          )?.[0]?.text || ''}
                        </span>
                        <saki-icon
                          width="24px"
                          height="24px"
                          color={themeColors['--c3-color']}
                          type="BottomTriangle"
                        ></saki-icon>
                      </SakiButton>
                      <div slot="main">
                        <SakiMenu
                          onSelectvalue={(e) => {
                            setDayForecastListType(e.detail.value)
                            setOpen15dayForecastDropdown(false)
                          }}
                        >
                          {a15dayForecastDPList.map((v, i) => {
                            return (
                              <SakiMenuItem value={v.val} key={i}>
                                <span
                                  style={{
                                    color: '#666',
                                  }}
                                >
                                  {v.text}
                                </span>
                              </SakiMenuItem>
                            )
                          })}
                        </SakiMenu>
                      </div>
                    </SakiDropdown>
                  </NoSSR>
                </div>
              </div>
            </div>
            {dayForecastListType === 'Curve' ? (
              <div className="wp-chart scrollBarHover">
                <svg id="daily-chart"></svg>
              </div>
            ) : (
              <div className="wp-list">
                {weatherInfo.daily.time.map((v, i) => {
                  return (
                    <WeatherDayForecastListItem
                      time={v}
                      index={i}
                      weatherInfo={weatherInfo}
                      key={i}
                    ></WeatherDayForecastListItem>
                  )
                })}
              </div>
            )}
            {/* <SakiRow justifyContent="center" alignItems="center">
              <SakiButton
                onTap={() => {}}
                // width="160px"
                margin="10px 0 0"
                padding="6px 20px"
                bgColor="#eee"
                bgHoverColor="#ddd"
                bgActiveColor="#ccc"
              >
                <span>
                  {t('40dayForecast', {
                    ns: 'sakiuiWeather',
                  })}
                </span>
              </SakiButton>
            </SakiRow> */}
          </div>

          <div className="wp-aq">
            <div className="wp-title">
              <span>
                {t('airQuality', {
                  ns: 'sakiuiWeather',
                })}
              </span>
              <div className="wt-right">
                <div className="switch-button">
                  <NoSSR>
                    <SakiDropdown
                      ref={
                        bindEvent({
                          close: () => {
                            setOpenAirQualityDropdown(false)
                          },
                        }) as any
                      }
                      visible={openAirQualityDropdown}
                      floating-direction="Left"
                    >
                      <SakiButton
                        onTap={() => {
                          setOpenAirQualityDropdown(true)
                        }}
                        type="Normal"
                        border="none"
                        padding="4px 0px 4px 6px"
                        bgColor={themeColors['--button-bg-color']}
                        bgHoverColor={themeColors['--button-bg-hover-color']}
                        bgActiveColor={themeColors['--button-bg-active-color']}
                      >
                        <span
                          style={{
                            color: themeColors['--c2-color'],
                          }}
                        >
                          {airQualityDPList.filter(
                            (v) => v.val === airQualityListType
                          )?.[0]?.text || ''}
                        </span>
                        <saki-icon
                          width="24px"
                          height="24px"
                          color={themeColors['--c3-color']}
                          type="BottomTriangle"
                        ></saki-icon>
                      </SakiButton>
                      <div slot="main">
                        <SakiMenu
                          onSelectvalue={(e) => {
                            setAirQualityListType(e.detail.value)
                            setOpenAirQualityDropdown(false)
                          }}
                        >
                          {airQualityDPList.map((v, i) => {
                            return (
                              <SakiMenuItem value={v.val} key={i}>
                                <span
                                  style={{
                                    color: '#666',
                                  }}
                                >
                                  {v.text}
                                </span>
                              </SakiMenuItem>
                            )
                          })}
                        </SakiMenu>
                      </div>
                    </SakiDropdown>
                  </NoSSR>
                </div>
              </div>
            </div>
            {airQualityListType === 'Today' ? (
              <>
                <div className="wp-aq-num">
                  <span>{curAQ.aqiDesc.aqi}</span>
                  <span>{curAQ.aqiDesc.aqiDesc}</span>
                </div>
                <div
                  className="wp-aq-line"
                  style={
                    {
                      '--progress': curAQ.aqiDesc.aqi / 500,
                    } as any
                  }
                ></div>
                <div className="wp-aq-desc">{curAQ.aqiDesc.desc}</div>
                <div className="wp-aq-data">
                  {[
                    'nitrogen_dioxide',
                    'ozone',
                    'pm10',
                    'pm2_5',
                    'carbon_monoxide',
                    'sulphur_dioxide',
                  ].map((v, i) => {
                    return (
                      <div className="wp-aq-d-item" key={i}>
                        <span
                          style={{
                            fontSize: config.lang === 'en-US' ? '13px' : '14px',
                          }}
                          className="item-text"
                        >
                          {t(v, {
                            ns: 'sakiuiWeather',
                          })}
                        </span>
                        <div
                          style={{
                            backgroundColor: getAqiDescription(
                              (curAQ as any)?.[v] || 0
                            ).color,
                          }}
                          className="item-line"
                        ></div>
                        <div className="item-val">
                          <span>{(curAQ as any)?.[v] || 0}</span>
                          <span>
                            {(weatherInfo.airQuality.current_units as any)?.[
                              v
                            ] || ''}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : airQualityListType === '24Hours' ? (
              <div className="wp-chart scrollBarHover">
                <svg id="aqi-24Hours-chart"></svg>
              </div>
            ) : (
              <div className="wp-chart scrollBarHover">
                <svg id="aqi-8Days-chart"></svg>
              </div>
            )}
          </div>

          <div className="wp-sunmoon">
            <div className="wp-title">
              <span>
                {t('sunMoonTimes', {
                  ns: 'sakiuiWeather',
                })}
              </span>
              <div className="wt-right">
                <div className="switch-button">
                  <NoSSR>
                    <SakiDropdown
                      ref={
                        bindEvent({
                          close: () => {
                            setOpenSunMoonDropdown(false)
                          },
                        }) as any
                      }
                      visible={openSunMoonDropdown}
                      floating-direction="Left"
                    >
                      <SakiButton
                        onTap={() => {
                          setOpenSunMoonDropdown(true)
                        }}
                        type="Normal"
                        border="none"
                        padding="4px 0px 4px 6px"
                        bgColor={themeColors['--button-bg-color']}
                        bgHoverColor={themeColors['--button-bg-hover-color']}
                        bgActiveColor={themeColors['--button-bg-active-color']}
                      >
                        <span
                          style={{
                            color: themeColors['--c2-color'],
                          }}
                        >
                          {sunMoonDPList.filter(
                            (v) => v.val === sunMoonListType
                          )?.[0]?.text || ''}
                        </span>
                        <saki-icon
                          width="24px"
                          height="24px"
                          color={themeColors['--c3-color']}
                          type="BottomTriangle"
                        ></saki-icon>
                      </SakiButton>
                      <div slot="main">
                        <SakiMenu
                          onSelectvalue={(e) => {
                            setSunMoonListType(e.detail.value)
                            setOpenSunMoonDropdown(false)
                            setRenderSunmoon(true)
                          }}
                        >
                          {sunMoonDPList.map((v, i) => {
                            return (
                              <SakiMenuItem value={v.val} key={i}>
                                <span
                                  style={{
                                    color: '#666',
                                  }}
                                >
                                  {v.text}
                                </span>
                              </SakiMenuItem>
                            )
                          })}
                        </SakiMenu>
                      </div>
                    </SakiDropdown>
                  </NoSSR>
                </div>
              </div>
            </div>
            {/* <div className="wp-title">太阳 & 月亮</div> */}
            {sunMoonListType === 'Today' ? (
              <div className="wp-s-main">
                <div className="wp-s-chart">
                  <svg id="chart-sunmoon" width="340" height="188"></svg>
                </div>

                <div className="wp-s-data">
                  {[
                    {
                      text: t('daylight', {
                        ns: 'sakiuiWeather',
                      }),
                      time: formatDurationI18n(
                        moment(sunMoon.sunset).unix() -
                          moment(sunMoon.sunrise).unix()
                      ),
                    },
                    {
                      text: t('moonshine', {
                        ns: 'sakiuiWeather',
                      }),
                      time: formatDurationI18n(
                        moment(sunMoon.moonset).unix() -
                          moment(sunMoon.moonrise).unix()
                      ),
                    },
                    {
                      text: t('astronomicalStart', {
                        ns: 'sakiuiWeather',
                      }),
                      time: moment(
                        sunMoon.twilightTimes.astronomical.start
                      ).format(timeFormat.hms),
                    },
                    {
                      text: t('astronomicalEnd', {
                        ns: 'sakiuiWeather',
                      }),
                      time: moment(
                        sunMoon.twilightTimes.astronomical.end
                      ).format(timeFormat.hms),
                    },
                    {
                      text: t('nauticalStart', {
                        ns: 'sakiuiWeather',
                      }),
                      time: moment(sunMoon.twilightTimes.nautical.start).format(
                        timeFormat.hms
                      ),
                    },
                    {
                      text: t('nauticalEnd', {
                        ns: 'sakiuiWeather',
                      }),
                      time: moment(sunMoon.twilightTimes.nautical.end).format(
                        timeFormat.hms
                      ),
                    },
                    {
                      text: t('civilStart', {
                        ns: 'sakiuiWeather',
                      }),
                      time: moment(sunMoon.twilightTimes.civil.start).format(
                        timeFormat.hms
                      ),
                    },
                    {
                      text: t('civilEnd', {
                        ns: 'sakiuiWeather',
                      }),
                      time: moment(sunMoon.twilightTimes.civil.end).format(
                        timeFormat.hms
                      ),
                    },
                    // {
                    //   text: '正午时间',
                    //   time: sunMoon.solarNoon.format('HH:mm:ss'),
                    // },
                  ].map((v, i) => {
                    return (
                      <div className="wp-s-d-item" key={i}>
                        <span>{v.text}</span>
                        <span>{v.time}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              sunMoon.celestialTimes.map((v, i) => {
                return (
                  <SunMoonListItem
                    times={v}
                    index={i}
                    key={i}
                  ></SunMoonListItem>
                )
              })
            )}
          </div>

          <div className="wp-details">
            <div className="wp-title">
              <span>
                {t('weatherDetails', {
                  ns: 'sakiuiWeather',
                })}
              </span>
            </div>
            {/* <div className="wp-title">太阳 & 月亮</div> */}
            <div className="wp-d-list">
              <div
                onClick={() => {
                  setOpenWeatherDetailModalType('surfacePressure')
                }}
                className="wp-l-item"
              >
                <div className="item-title text-elipsis">
                  <div className="i-t-left">
                    <NoSSR>
                      <saki-icon
                        margin="0 4px 0 0"
                        color={themeColors['--c1-color']}
                        width="14px"
                        height="14px"
                        type="PressureGauge"
                      ></saki-icon>
                    </NoSSR>
                    <span>
                      {t('surfacePressure', {
                        ns: 'sakiuiWeather',
                      })}
                    </span>
                  </div>
                  <div className="i-t-right">
                    <span>
                      {/* {t('more', {
                        ns: 'sakiuiWeather',
                      })} */}
                    </span>
                  </div>
                </div>
                <div className="item-val">
                  <span
                    style={{
                      margin: '-10px 0 0',
                    }}
                  >
                    <span>
                      {convertPressure(
                        curInfo.surfacePressure.val,
                        curInfo.surfacePressure.unit as any,
                        weather.weatherData.units.pressure
                      )}
                    </span>
                    <span>{weather.weatherData.units.pressure}</span>
                  </span>
                  <span
                    style={{
                      fontSize: '16px',
                    }}
                  >
                    {curInfo.surfacePressure.level}
                  </span>
                </div>
                <div className="item-desc text-two-elipsis">
                  <span>{curInfo.surfacePressure.desc}</span>
                </div>
              </div>

              <div
                onClick={() => {
                  setOpenWeatherDetailModalType('windLevel')
                }}
                className="wp-l-item"
              >
                <div className="item-title text-elipsis">
                  <NoSSR>
                    <saki-icon
                      margin="0 4px 0 0"
                      color={themeColors['--c1-color']}
                      width="14px"
                      height="14px"
                      type="Windmill"
                    ></saki-icon>
                  </NoSSR>
                  <span>
                    {t('windLevel', {
                      ns: 'sakiuiWeather',
                    })}
                  </span>
                </div>
                <div className="item-val">
                  <span
                    style={{
                      margin: '-10px 0 0',
                    }}
                  >
                    <span>
                      {convertWindSpeed(
                        Number(curInfo.windy.val),
                        curInfo.windy.unit as any,
                        weather.weatherData.units.windSpeed
                      )}
                    </span>
                    <span>{weather.weatherData.units.windSpeed}</span>
                  </span>
                  <span
                    style={{
                      fontSize: '16px',
                    }}
                  >
                    {`${curInfo.windy.direction} ${t('windLevelNum', {
                      ns: 'sakiuiWeather',
                      num: curInfo.windy.level,
                    })}`}
                  </span>
                </div>
                <div className="item-desc text-two-elipsis">
                  <span>{curInfo.windy.desc}</span>
                </div>
              </div>

              <div
                onClick={() => {
                  setOpenWeatherDetailModalType('uvIndex')
                }}
                className="wp-l-item"
              >
                <div className="item-title text-elipsis">
                  <NoSSR>
                    <saki-icon
                      margin="0 4px 0 0"
                      color={themeColors['--c1-color']}
                      width="14px"
                      height="14px"
                      type="UVIndexSunFill"
                    ></saki-icon>
                  </NoSSR>
                  <span>
                    {t('uvIndex', {
                      ns: 'sakiuiWeather',
                    })}
                  </span>
                </div>
                <div className="item-val">
                  <span
                    style={{
                      margin: '-10px 0 0',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '32px',
                      }}
                    >
                      {curInfo.uvIndex.val}
                    </span>
                  </span>
                  <span
                    className={curInfo.uvIndex.color ? 'tag' : ''}
                    style={{
                      backgroundColor: curInfo.uvIndex.color,
                    }}
                    // style={{
                    //   fontSize: '16px',
                    //   color: '#444',
                    // }}
                  >
                    {curInfo.uvIndex.level}
                  </span>
                </div>
                <div className="item-desc text-two-elipsis">
                  <span>{curInfo.uvIndex.desc}</span>
                </div>
              </div>
              <div
                onClick={() => {
                  setOpenWeatherDetailModalType('visibility')
                }}
                className="wp-l-item "
              >
                <div className="item-title text-elipsis">
                  <NoSSR>
                    <saki-icon
                      margin="0 4px 0 0"
                      color={themeColors['--c1-color']}
                      width="14px"
                      height="14px"
                      type="Eye"
                    ></saki-icon>
                  </NoSSR>
                  <span>
                    {t('visibility', {
                      ns: 'sakiuiWeather',
                    })}
                  </span>
                </div>
                <div className="item-val">
                  <span>
                    <span>
                      {convertVisibility(
                        Number(curInfo.visibility.val),
                        curInfo.visibility.unit as any,
                        weather.weatherData.units.visibility
                      )}
                    </span>
                    <span>{weather.weatherData.units.visibility}</span>
                  </span>
                  <span
                    style={{
                      fontSize: '16px',
                    }}
                  >
                    {curInfo.visibility.level}
                  </span>
                </div>
                <div className="item-desc text-two-elipsis">
                  <span>{curInfo.visibility.desc}</span>
                </div>
              </div>
              <div
                onClick={() => {
                  setOpenWeatherDetailModalType('precipitation')
                }}
                className="wp-l-item"
              >
                <div className="item-title text-elipsis">
                  <NoSSR>
                    <saki-icon
                      margin="0 4px 0 0"
                      color={themeColors['--c1-color']}
                      width="14px"
                      height="14px"
                      type="Umbrella"
                    ></saki-icon>
                  </NoSSR>
                  <span>
                    {t('precipitation', {
                      ns: 'sakiuiWeather',
                    })}
                  </span>
                </div>
                <div className="item-val">
                  <span
                    style={{
                      margin: '-10px 0 0',
                    }}
                  >
                    <span>
                      {convertPrecipitation(
                        curInfo.precipitation.val,
                        curInfo.precipitation.unit as any,
                        weather.weatherData.units.precipitation
                      )}
                    </span>
                    <span>{weather.weatherData.units.precipitation}</span>
                  </span>
                  <span
                    style={{
                      fontSize: '16px',
                    }}
                  >
                    {t('past24Hours', {
                      ns: 'sakiuiWeather',
                    })}
                  </span>
                </div>
                <div className="item-desc text-two-elipsis">
                  <span>{curInfo.precipitation.desc}</span>
                </div>
              </div>
              <div
                onClick={() => {
                  setOpenWeatherDetailModalType('humidity')
                }}
                className="wp-l-item"
              >
                <div className="item-title text-elipsis">
                  <NoSSR>
                    <saki-icon
                      margin="0 4px 0 0"
                      color={themeColors['--c1-color']}
                      width="14px"
                      height="14px"
                      type="Humidity"
                    ></saki-icon>
                  </NoSSR>
                  <span>
                    {t('humidity', {
                      ns: 'sakiuiWeather',
                    })}
                  </span>
                </div>
                <div className="item-val">
                  <span>
                    <span>{curInfo.humidity.val}</span>
                    <span>{curInfo.humidity.unit}</span>
                  </span>
                </div>
                <div className="item-desc text-two-elipsis">
                  <span>{curInfo.humidity.desc}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="wp-footer">{t('attribution')}</div>
        </div>
        {/* <div className="wp-cur">
          <span>{position?.coords?.latitude}</span>,
          <span>{position?.coords?.longitude}</span>,
          <span>{position?.coords?.altitude}</span>
        </div> */}

        <WeatherDetailModal
          type={openWeatherDetailModalType}
          weatherInfo={weatherInfo}
          onClose={() => {
            setOpenWeatherDetailModalType('')
          }}
          themeColor={themeColor}
        ></WeatherDetailModal>
      </div>
    </>
  )
}

const WeatherDayForecastListItem = ({
  time,
  index,
  weatherInfo,
}: {
  time: string
  index: number
  weatherInfo: typeof defaultWeatherInfo
}) => {
  const { t, i18n } = useTranslation('weatherPage')

  const weather = useSelector((state: RootState) => state.weather)

  let i = index
  const highTemp = weatherInfo.daily.temperature_2m_max[i]
  const lowTemp = weatherInfo.daily.temperature_2m_min[i]
  const weatherCode = weatherInfo.daily.weathercode[i]

  const temperature_2m_max = weatherInfo.daily?.temperature_2m_max[i]
  const temperature_2m_min = weatherInfo.daily?.temperature_2m_min[i]
  const maxTempWeatherCode = weatherInfo.daily.maxTempWeatherCodes[i]
  const minTempWeatherCode = weatherInfo.daily.minTempWeatherCodes[i]
  const wind_speed_10m = weatherInfo.daily.wind_speed_10m_max[i]
  const wind_direction_10m = weatherInfo.daily.wind_direction_10m_dominant[i]

  let date = formatWeatherDate(time)

  const aq = formatAirQuality(
    weatherInfo,
    moment(time).format('YYYY-MM-DD'),
    'Daily'
  )
  let aqiDesc = getAqiDescription(aq.european_aqi)
  return (
    <div className="WeatherDayForecastListItem">
      <div className="item-date">
        <span>{date.date}</span>
        <span>{date.week}</span>
      </div>
      <div className="item-weatheremoji">
        <span>{getWeatherIcon(Number(weatherCode)) || ''}</span>
      </div>
      <div className="item-weather">
        <span>
          {maxTempWeatherCode === minTempWeatherCode
            ? t('weather' + (weatherCode || 0), {
                ns: 'sakiuiWeather',
              })
            : t('weatherToWeather', {
                ns: 'sakiuiWeather',
                waether1: t('weather' + (maxTempWeatherCode || 0), {
                  ns: 'sakiuiWeather',
                }),
                weather2: t('weather' + (minTempWeatherCode || 0), {
                  ns: 'sakiuiWeather',
                }),
              })}
        </span>
        <span>{`${convertTemperature(
          temperature_2m_min,
          (weatherInfo.dailyUnits.temperature_2m_min as any) || '°C',
          weather.weatherData.units.temperature
        )}~${convertTemperature(
          temperature_2m_max,
          (weatherInfo.dailyUnits.temperature_2m_max as any) || '°C',
          weather.weatherData.units.temperature
        )}${weatherInfo.dailyUnits.temperature_2m_max}`}</span>
      </div>
      <div className="item-aqi">
        <span>
          {getWindDirectionText(wind_direction_10m, true) +
            ' ' +
            t('windLevelNum', {
              ns: 'sakiuiWeather',
              num: getWindForceLevel(
                wind_speed_10m || 0,
                weatherInfo.current_units.wind_speed_10m
              ),
            })}
        </span>
        {aq.european_aqi ? (
          <span
            style={{
              backgroundColor: aqiDesc.color,
            }}
            className={'aqi-icon '}
          >
            <span>{aq.european_aqi + ' ' + aqiDesc.aqiDesc}</span>
          </span>
        ) : (
          ''
        )}
      </div>
    </div>
  )
}
const SunMoonListItem = ({
  index,
  times,
}: {
  index: number
  times: CelestialTimes
}) => {
  const { t, i18n } = useTranslation('weatherPage')
  let i = index
  let date = formatWeatherDate(times.date)

  return (
    <div className="SunMoonListItem">
      <div className="item-date">
        <span>{date.week}</span>
        <span>{date.date}</span>
      </div>
      <div className="item-right">
        <div className="item-sun">
          <span>
            <span>
              {t('sunrise', {
                ns: 'sakiuiWeather',
              })}
            </span>
            <span>{moment(times.sunrise).format('HH:mm:ss')}</span>
          </span>
          <span>
            <span>
              {t('sunset', {
                ns: 'sakiuiWeather',
              })}
            </span>
            <span>{moment(times.sunset).format('HH:mm:ss')}</span>
          </span>

          <span>
            <span>
              {t('daylight', {
                ns: 'sakiuiWeather',
              })}
            </span>
            <span>
              {formatDurationI18n(
                moment(times.sunset).unix() - moment(times.sunrise).unix()
              )}
            </span>
          </span>
        </div>
        <div className="item-moon">
          <span>
            <span>
              {t('moonrise', {
                ns: 'sakiuiWeather',
              })}
            </span>
            <span>{moment(times.moonrise).format('HH:mm:ss')}</span>
          </span>
          <span>
            <span>
              {t('moonset', {
                ns: 'sakiuiWeather',
              })}
            </span>
            <span>{moment(times.moonset).format('HH:mm:ss')}</span>
          </span>

          <span>
            <span>
              {t('moonshine', {
                ns: 'sakiuiWeather',
              })}
            </span>
            <span>
              {formatDurationI18n(
                moment(times.moonset).unix() - moment(times.moonrise).unix()
              )}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

WeatherPage.getLayout = getLayout

export default WeatherPage
