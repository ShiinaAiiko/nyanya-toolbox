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
} from '../../store/weather'
import {
  changeLanguage,
  languages,
  defaultLanguage,
} from '../../plugins/i18n/i18n'
import moment, { unix } from 'moment'
import { configSlice, R } from '../../store/config'
import { server } from '../../config'
import { openWeatherWMOToEmoji } from '@akaguny/open-meteo-wmo-to-emoji'
import {
  SakiAnimationLoading,
  SakiAsideModal,
  SakiButton,
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

  const { position, language } = useSelector((state: RootState) => {
    return {
      position: state.position,
      language: state.config.language,
    }
  })

  const [updateTime, setUpdateTime] = useState(new Date().getTime())
  const [loadStatus, setLoadStatus] = useState('loaded')
  const [isInitWData, setIsInitWData] = useState(false)

  const [loadWeather, setLoadWeather] = useState(false)

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

      await dispatch(methods.config.initConnectionOpenMeteo()).unwrap()
      setIsInitWData(true)
      await dispatch(methods.config.initConnectionAirQualityAPI()).unwrap()
      await dispatch(methods.config.initConnectionOSM()).unwrap()
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
    }, 15 * 60 * 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    dispatch(layoutSlice.actions.setLayoutHeaderLogoText(t('pageTitle')))

    if (location.search.includes('sakiAppPortal=')) {
      const wAny = window as any

      wAny?.sakiui?.appPortal?.setAppTitle?.(t('pageTitle'))

      wAny.loadSakiUI = () => {
        wAny?.sakiui?.appPortal?.setAppTitle?.(t('pageTitle'))
      }
    }
  }, [i18n.language])

  useEffect(() => {
    console.log('getWeather res watchPosition position', isInitWData, position)
    // getWeather(29.873281, 106.381818)

    if (isInitWData && position?.position?.timestamp) {
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
            return {
              ...v,
              lat: position?.position?.coords.latitude || 0,
              lng: position?.position?.coords.longitude || 0,
              curPopsition: true,
              updateTime:
                getDistance(
                  v.lat,
                  v.lng,
                  position?.position?.coords.latitude || 0,
                  position?.position?.coords.longitude || 0
                ) <= 1000
                  ? v.updateTime
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
          updateTime: 0,
          default: false,
          sort: 0,
        })
      }
      tempCities.sort((a, b) => {
        return a.sort - b.sort
      })

      setCities(tempCities)

      !isSetPosition && setIsSetPosition(true)
    }
  }, [position, isInitWData])

  const [cities, setCities] = useState<WeatherSyncData['cities'][0][]>([])

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

  function getMaxMinTempWeatherCodes(data: typeof weatherInfo): {
    maxTempWeatherCodes: number[]
    minTempWeatherCodes: number[]
  } {
    const maxTempWeatherCodes: number[] = []
    const minTempWeatherCodes: number[] = []
    const hoursPerDay = 24
    const dayStartHour = 6 // 白天开始时间（06:00）
    const dayEndHour = 18 // 白天结束时间（18:00）

    // 遍历每天的日期
    data.daily.time.forEach((day, dayIndex) => {
      // 获取当天的每小时数据
      const startIndex = dayIndex * hoursPerDay
      const endIndex = startIndex + hoursPerDay
      const dailyHourlyTemps = data.hourly.temperature_2m.slice(
        startIndex,
        endIndex
      )
      const dailyHourlyCodes = data.hourly.weathercode.slice(
        startIndex,
        endIndex
      )
      const dailyHourlyTimes = data.hourly.time.slice(startIndex, endIndex)

      // 获取当天的最高和最低温度
      const maxTemp = data.daily.temperature_2m_max[dayIndex]
      const minTemp = data.daily.temperature_2m_min[dayIndex]

      // 找出最高温度的所有小时索引
      const maxTempIndices = dailyHourlyTemps
        .map((temp, index) => (temp === maxTemp ? index : -1))
        .filter((index) => index !== -1)

      // 找出最低温度的所有小时索引
      const minTempIndices = dailyHourlyTemps
        .map((temp, index) => (temp === minTemp ? index : -1))
        .filter((index) => index !== -1)

      // 获取白天时段（06:00-18:00）的索引
      const dayIndices = dailyHourlyTimes
        .map((time, index) => {
          const hour = new Date(time).getHours()
          return hour >= dayStartHour && hour < dayEndHour ? index : -1
        })
        .filter((index) => index !== -1)

      // 获取最高温度的 weatherCode
      const maxCode = getRepresentativeWeatherCode(
        maxTempIndices,
        dayIndices,
        dailyHourlyCodes,
        data.daily.weathercode[dayIndex]
      )

      // 获取最低温度的 weatherCode
      const minCode = getRepresentativeWeatherCode(
        minTempIndices,
        dayIndices,
        dailyHourlyCodes,
        data.daily.weathercode[dayIndex]
      )

      maxTempWeatherCodes.push(maxCode)
      minTempWeatherCodes.push(minCode)
    })

    return {
      maxTempWeatherCodes,
      minTempWeatherCodes,
    }
  }

  // 辅助函数：选择最具代表性的 weatherCode
  function getRepresentativeWeatherCode(
    tempIndices: number[],
    dayIndices: number[],
    weatherCodes: number[],
    dailyWeatherCode: number
  ): number {
    // 如果没有有效索引，返回 daily.weathercode
    if (tempIndices.length === 0) return dailyWeatherCode

    // 检查是否有温度索引在白天时段
    const dayTempIndices = tempIndices.filter((index) =>
      dayIndices.includes(index)
    )

    if (dayTempIndices.length > 0) {
      // 如果最高/最低温度出现在白天，优先选择白天的 weatherCode
      const dayTempCodes = dayTempIndices.map((index) => weatherCodes[index])
      return getMostCommonWeatherCode(dayTempCodes, dailyWeatherCode)
    } else {
      // 如果温度不在白天，计算白天时段的 weatherCode 频率
      const dayWeatherCodes = dayIndices.map((index) => weatherCodes[index])
      return getMostCommonWeatherCode(dayWeatherCodes, dailyWeatherCode)
    }
  }

  // 辅助函数：选择最常见的 weatherCode
  function getMostCommonWeatherCode(
    codes: number[],
    dailyWeatherCode: number
  ): number {
    if (codes.length === 0) return dailyWeatherCode

    const codeFrequency: { [key: number]: number } = {}
    codes.forEach((code) => {
      codeFrequency[code] = (codeFrequency[code] || 0) + 1
    })

    let selectedCode = codes[0]
    let maxFrequency = 0
    for (const [code, freq] of Object.entries(codeFrequency)) {
      if (freq > maxFrequency) {
        maxFrequency = freq
        selectedCode = Number(code)
      } else if (freq === maxFrequency && Number(code) === dailyWeatherCode) {
        selectedCode = Number(code)
      }
    }

    return selectedCode
  }

  const localTimezone = useRef(Intl.DateTimeFormat().resolvedOptions().timeZone)

  const getWeather = async (lat: number, lng: number) => {
    setLoadStatus('loading')

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=${[
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
    const res = await R.request({
      method: 'GET',
      url: config.connectionStatus.openMeteo
        ? url
        : `${
            server.url
          }/api/v1/net/httpProxy?method=GET&url=${encodeURIComponent(url)}`,
    })

    let data = res?.data?.data as any
    if (config.connectionStatus.openMeteo) {
      data = res?.data
    }
    console.log(
      'getCityInfo  getWeather res',
      config.connectionStatus.openMeteo,
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
        weatherCode: data?.current?.weather_code || '',
        weather: t('weather' + (data?.current?.weather_code || 0), {
          ns: 'weather',
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

    // setWeatherInfo(wi)
    setLoadStatus('loaded')

    // setTimeout(() => {
    // }, 700)
    // setCities(
    //   cities.map((v) => {
    //     if (v.lat === lat && v.lng === lng) {
    //       return {
    //         ...v,
    //         weatherInfo: wi,
    //         updateTime: new Date().getTime(),
    //       }
    //     }
    //     return v
    //   })
    // )

    return wi
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

    const res = await R.request({
      method: 'GET',
      url: config.connectionStatus.airQualityAPI
        ? url
        : `${
            server.url
          }/api/v1/net/httpProxy?method=GET&url=${encodeURIComponent(url)}`,
    })

    let data = res?.data?.data as any
    console.log('getWeather airq res', res.data)
    if (config.connectionStatus.airQualityAPI) {
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

  const getUVIndex = async (lat: number, lng: number) => {
    const res = await R.request({
      method: 'GET',
      url: `https://currentuvindex.com/api/v1/uvi?latitude=${lat}&longitude=${lng}`,
    })

    const data = res?.data?.data as any
    console.log('getUVIndex airq res', res.data)

    // if (res?.data?.code !== 200 || !data) return weatherInfo.airQuality
    // const airQuality: typeof weatherInfo.airQuality = {
    //   ...weatherInfo.airQuality,
    //   current: data.current,
    //   current_units: data.current_units,
    //   hourly: data.hourly,
    //   hourly_units: data.hourly_units,
    //   daily: convertHourlyToDaily(data.hourly, false),
    //   daily_units: data.hourly_units,
    // }

    // return airQuality
  }

  const ttttt = useRef(0)

  const [openCityDropdown, setOpenCityDropdown] = useState(false)
  const [openAirQualityDropdown, setOpenAirQualityDropdown] = useState(false)
  const [open15dayForecastDropdown, setOpen15dayForecastDropdown] =
    useState(false)
  const [openSunMoonDropdown, setOpenSunMoonDropdown] = useState(false)

  const airQualityDPList = [
    {
      val: 'Today',
      text: t('today', {
        ns: 'weather',
      }),
    },
    {
      val: '24Hours',
      text: t('24Hours', {
        ns: 'weather',
      }),
    },
    {
      val: '8Days',
      text: t('8Days', {
        ns: 'weather',
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
        ns: 'weather',
      }),
    },
    {
      val: '45Days',
      text: t('45Days', {
        ns: 'weather',
      }),
    },
  ]

  const [curCityIndex, setCurCityIndex] = useState(-1)
  const curCityIndexDeb = useRef(new Debounce())

  useEffect(() => {
    // storage.global.get('citiesWeather', cities)

    console.log('curCityIndex', position.allowWatchPosition)

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
      curCityIndexDeb.current.increase(() => {
        console.log('curCityIndex get', curCityIndex, curCityIndex === -1)
        storage.global.get('curCityIndex').then((val) => {
          cities.some((v, i) => {
            if (v.lat + ';' + v.lng === val) {
              setCurCityIndex(i)
              return true
            }
          })
        })
      }, 50)
    }
  }, [cities, position.allowWatchPosition, curCityIndex])

  const getWeatherDeb = useRef(new Debounce())

  const [isSetPosition, setIsSetPosition] = useState(false)

  useEffect(() => {
    if (isInitWData && position?.position?.timestamp && cities.length) {
      const nowUnix = new Date().getTime()

      const promiseAll: any[] = []

      let tempCities: typeof cities = deepCopy(cities)

      getWeatherDeb.current.increase(() => {
        console.log('getCityInfo 开始获取', tempCities)
        tempCities.forEach((v, i) => {
          if (
            !v.updateTime ||
            !v?.weatherInfo ||
            // !v?.cityInfo ||
            (curCityIndex === i
              ? nowUnix - v.updateTime > 15 * 60 * 1000
              : openCityDropdown
              ? nowUnix - v.updateTime > 12 * 60 * 60 * 1000
              : false)
          ) {
            console.log(
              'getCityInfo 开始获取 item',
              v,
              !v.updateTime,
              nowUnix - v.updateTime
            )

            // if (ttttt.current >= 1) {
            //   return
            // }

            // getWeather(v.lat, v.lng)

            ttttt.current += 1

            promiseAll.push(
              new Promise(async (res, rej) => {
                const cityInfo = await getCityInfo(v.lat, v.lng)
                const weatherInfo = await getWeather(v.lat, v.lng)
                // console.log('getCityInfo', cityInfo, weatherInfo)

                res({
                  cityInfo,
                  weatherInfo,
                  i,
                })
              })
            )
          }
        })

        // console.log('getCityInfo', promiseAll.length)

        if (promiseAll.length) {
          setLoadWeather(true)
          Promise.all(promiseAll)
            .then((res) => {
              res.forEach((val) => {
                console.log('getCityInfo 开始获取 ppppp', val)

                tempCities[val.i] = {
                  ...tempCities[val.i],
                  cityInfo: val?.cityInfo || tempCities[val.i].cityInfo,
                  weatherInfo:
                    val?.weatherInfo || tempCities[val.i].weatherInfo,
                  updateTime: new Date().getTime(),
                }
              })
              setCities(tempCities)

              storage.global.getAndSet('WeatherSyncData', async (val) => {
                return {
                  cities: tempCities,
                  lastUpdateTime: val.lastUpdateTime,
                }
              })
              // storage.global.setSync('citiesWeather', tempCities)
              // console.log('getCityInfo 结束获取', tempCities)
              setLoadWeather(false)
            })
            .catch(() => {
              setLoadWeather(false)
            })
        }
      }, 700)
    }
  }, [position?.position?.timestamp, isInitWData, openCityDropdown, cities])

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

    const wi: typeof defaultWeatherInfo = deepCopy(cityItem?.weatherInfo)

    if (wi) {
      wi.current_units.wind_gusts_10m = 'km/h'
      wi.current_units.wind_speed_10m = 'km/h'
      wi.current.wind_gusts_10m *= 3.6
      wi.current.wind_speed_10m *= 3.6

      wi.hourlyUnits.wind_gusts_10m = 'km/h'
      wi.hourlyUnits.wind_speed_10m = 'km/h'
      wi.hourly.wind_gusts_10m.map((v) => v * 3.6)
      wi.hourly.wind_speed_10m.map((v) => v * 3.6)

      wi.dailyUnits.wind_gusts_10m_max = 'km/h'
      wi.dailyUnits.wind_gusts_10m_max = 'km/h'
      wi.daily.wind_gusts_10m_max.map((v) => v * 3.6)
      wi.daily.wind_speed_10m_max.map((v) => v * 3.6)
    }

    return {
      weatherInfo: wi || defaultWeatherInfo,
      cityInfo: cityItem?.cityInfo,
      cityItem: {
        ...cityItem,
        weatherInfo: wi,
      },
    }
  }, [cities, isInitWData, openCityDropdown, curCityIndex])
  useEffect(() => {
    if (weather.weatherData.cities?.length) {
      setCities(weather.weatherData.cities)
    }
  }, [weather])

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
        setCities(tempCities)
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
          updateTime: 0,
          default: false,
          sort: tempCities.length + 1,
        })
      }

      tempCities.sort((a, b) => {
        return a.sort - b.sort
      })

      console.log('addCity tempCities', deepCopy(tempCities))

      setCities(tempCities)
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

    let visibilityVal = 0
    let visibilityUnit = ''
    if (weatherInfo.current.visibility < 1000) {
      visibilityVal = Math.round(weatherInfo.current.visibility || 0)
      visibilityUnit = 'm'
    }
    if (weatherInfo.current.visibility < 1000 * 10) {
      visibilityVal =
        Math.round((weatherInfo.current.visibility || 0) / 10) / 100
      visibilityUnit = 'km'
    }
    visibilityVal = Math.round((weatherInfo.current.visibility || 0) / 100) / 10
    visibilityUnit = 'km'

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

    const visibilityAlert = getVisibilityAlert(visibilityVal)

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
        val: visibilityVal,
        unit: visibilityUnit,
        desc: visibilityAlert.description,
        level: visibilityAlert.level,
      },
      humidity: {
        val: weatherInfo.current.relative_humidity_2m,
        unit: weatherInfo.current_units.relative_humidity_2m,
        desc: t('currentDewPoint', {
          ns: 'weather',
          num: `${weatherInfo.current.dew_point_2m}${weatherInfo.current_units.dew_point_2m}`,
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
          ns: 'weather',
          num:
            precipitation24Next.toFixed(1) +
            weatherInfo.hourlyUnits.precipitation,
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
  }, [weatherInfo, language])

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
              const curHour = moment().format('HH:00')
              const vHour = moment(v).format('HH:00')
              return {
                aqi: weatherInfo.airQuality.hourly.european_aqi[i],
                date:
                  curHour === vHour
                    ? t('now', {
                        ns: 'weather',
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
  }, [weatherInfo, config.lang, airQualityListType])

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
            const curHour = moment().format('HH:00')
            const vHour = moment(v).format('HH:00')
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
                      ns: 'weather',
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
          .filter((v) => v.date),
      })
      createWeatherChart({
        container: '#daily-chart',
        weatherInfo,
        type: 'Daily',
        width: 1200,
        height: 350,
        margin: {
          top: 125,
          bottom: 160,
          right: 0,
          left: 0,
        },
        data: weatherInfo.daily.time.map((v, i): WeatherData => {
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
        }),
      })
    }
    // weatherInfo?.weather && initDailyWeatherChart()
  }, [weatherInfo, curAQ.european_aqi, config.lang, dayForecastListType])

  const [renderSunmoon, setRenderSunmoon] = useState(false)
  const [fixedHeader, setFixedHeader] = useState(false)

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
      // console.log('scrollEvent', document.body.scrollTop)
      setFixedHeader(document.body.scrollTop >= 60)
    }

    document.body.addEventListener('scroll', scrollEvent)

    return () => {
      sunMoonEl && observer.unobserve(sunMoonEl)
      observer.disconnect()
      document.body.removeEventListener('scroll', scrollEvent)
    }
  }, [])

  const sunMoon = useMemo(() => {
    // console.log('weatherInfo?.current?.weather', weatherInfo?.current)

    // const { Body, Horizon, Equator, SearchHourAngle, SearchRiseSet, Observer } =
    //   Astronomy

    // let date = new Date() // 指定日期

    // // date = new Date('2025-05-29 02:00:00')
    // // date = new Date('2025-05-29 08:00:00')
    // // date = new Date('2025-05-29 12:00:00')
    // // date = new Date('2025-05-29 18:00:00')
    // // date = new Date('2025-05-29 21:00:00')
    // // date = new Date('2025-05-29 22:00:00')

    // const observer = new Observer(
    //   position?.coords.latitude || 0,
    //   position?.coords.longitude || 0,
    //   position?.coords.altitude || 0
    // )

    // const tempDate = new Date(moment().format('YYYY-MM-DD 00:00:00'))

    // // 计算日出和日落
    // let sunrise = SearchRiseSet(Body.Sun, observer, +1, date, -1) // +1 表示升起
    // let sunset = SearchRiseSet(Body.Sun, observer, -1, date, -1) // -1 表示落下

    // console.log(
    //   'tempDate',
    //   moment(sunrise?.date).unix() < moment(tempDate).unix(),
    //   moment(sunset?.date).unix() < moment(tempDate).unix()
    // )
    // if (
    //   moment(sunrise?.date).unix() < moment(tempDate).unix() &&
    //   moment(sunset?.date).unix() < moment(tempDate).unix()
    // ) {
    //   const prevDate = new Date(date)
    //   prevDate.setDate(date.getDate() + 1)
    //   // 如果是，则改用前一天的日落时间
    //   sunrise = SearchRiseSet(Body.Sun, observer, +1, prevDate, -1) // +1 表示升起
    // }
    // console.log(
    //   'SearchRiseSet',
    //   moment().format('YYYY-MM-DD HH:mm:ss'),
    //   moment('2025-05-27T21:53:51+00:00').format('YYYY-MM-DD HH:mm:ss'),
    //   moment(sunrise?.date).format('YYYY-MM-DD HH:mm:ss'),
    //   moment(sunrise?.date).format('YYYY-MM-DD') !==
    //     moment().format('YYYY-MM-DD')
    // )
    // console.log('SearchRiseSet 0000', sunrise?.date)

    // console.log(
    //   'tempDate',
    //   moment(sunset?.date).format('YYYY-MM-DD HH:mm:ss'),
    //   moment(sunset?.date).unix() < moment(tempDate).unix()
    // )
    // if (
    //   (sunset?.date.getTime() || 0) - (sunrise?.date.getTime() || 0) >
    //     12 * 60 * 60 * 1000 ||
    //   moment(sunset?.date).unix() < moment(tempDate).unix()
    //   // ||moment(sunset?.date).format('YYYY-MM-DD') !==
    //   //   moment().format('YYYY-MM-DD')
    // ) {
    //   const prevDate = new Date(date)
    //   prevDate.setDate(
    //     date.getDate() -
    //       1 +
    //       (moment(sunset?.date).unix() < moment(tempDate).unix() ? 1 : 0)
    //   )
    //   // 如果是，则改用前一天的日落时间
    //   sunset = SearchRiseSet(Astronomy.Body.Sun, observer, -1, prevDate, +1)
    // }

    // // console.log('sunrise', moment(sunrise?.date).format('YYYY-MM-DD HH:mm:ss'))
    // // console.log(
    // //   'sunrise sunset',
    // //   moment(sunset?.date).format('YYYY-MM-DD HH:mm:ss')
    // // )

    // // 计算月出和月落
    // let moonrise = SearchRiseSet(Body.Moon, observer, +1, date, -1)
    // const prevDate = new Date(date)
    // prevDate.setDate(date.getDate() + 1)
    // let moonset = SearchRiseSet(Body.Moon, observer, -1, prevDate, -1)

    // console.log(
    //   'tempDate',
    //   moment(moonrise?.date).format('YYYY-MM-DD HH:mm:ss'),
    //   moment(moonrise?.date).unix() < moment(tempDate).unix(),
    //   moment(moonset?.date).unix() < moment(tempDate).unix()
    // )
    // if (
    //   moment(moonrise?.date).unix() < moment(tempDate).unix() &&
    //   moment(moonset?.date).unix() < moment(tempDate).unix()
    // ) {
    //   const prevDate = new Date(date)
    //   prevDate.setDate(date.getDate() + 1)
    //   // 如果是，则改用前一天的日落时间
    //   moonrise = SearchRiseSet(Body.Moon, observer, +1, prevDate, -1) // +1 表示升起
    // }

    // console.log(
    //   'tempDate moonset',
    //   moment(moonset?.date).format('YYYY-MM-DD HH:mm:ss'),

    //   (moonset?.date.getTime() || 0) - (moonrise?.date.getTime() || 0) >
    //     12 * 60 * 60 * 1000,
    //   moment(moonset?.date).unix() < moment(tempDate).unix()
    // )
    // if (
    //   (moonset?.date.getTime() || 0) - (moonrise?.date.getTime() || 0) >
    //     12 * 60 * 60 * 1000 ||
    //   moment(moonset?.date).unix() < moment(tempDate).unix()
    //   // ||  moment(moonset?.date).format('YYYY-MM-DD') !==
    //   // moment().format('YYYY-MM-DD')
    // ) {
    //   const prevDate = new Date(date)
    //   prevDate.setDate(
    //     date.getDate() -
    //       1 +
    //       (moment(moonset?.date).unix() < moment(tempDate).unix() ? 1 : 0)
    //   )
    //   // 如果是，则改用前一天的日落时间
    //   moonset = SearchRiseSet(Body.Moon, observer, -1, prevDate, +1)
    // }
    // console.log(
    //   'tempDate moonset',
    //   moment(moonset?.date).format('YYYY-MM-DD HH:mm:ss')
    // )
    // const astroDawn = Astronomy.SearchAltitude(
    //   Body.Sun,
    //   observer,
    //   -18,
    //   date,
    //   +1,
    //   position?.coords.altitude || 0
    // )
    // // console.log('Astronomical Twilight Begin:', astroDawn?.date.toISOString())

    // const solarNoon = Astronomy.SearchHourAngle(
    //   Astronomy.Body.Sun, // 太阳
    //   observer, // 观测者
    //   0, // 时角 = 0（正午）
    //   date, // 起始搜索时间
    //   -1 // 搜索天数（默认 1 天）
    // )
    // // console.log('Solar Noon (UTC):', solarNoon.time.date.toISOString())
    // // console.log('Solar Noon (Local):', solarNoon.time.date.toLocaleString())

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

    // console.log(
    //   '177',
    //   celestialTimes,
    //   celestialTimes.map((v) => {
    //     return {
    //       date: v.date,
    //       moonrise: v.moonrise,
    //       moonset: v.moonset,
    //     }
    //   }),
    //   sunTimes,
    //   getSunTimes(new Date('2025-05-29 23:01:00'), celestialTimes),
    //   getSunTimes(new Date('2025-05-29 24:0:00'), celestialTimes),
    //   moonTimes,
    //   getMoonTimes(new Date('2025-06-15 21:01:00'), celestialTimes),
    //   getMoonTimes(new Date('2025-06-15 23:54:00'), celestialTimes),
    //   getMoonTimes(new Date('2025-06-15 24:0:00'), celestialTimes)
    // )

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
  }, [cityItem, renderSunmoon])

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
        // solarNoon: solarNoon.time.date,
        solarNoon: sunMoon.solarNoon,
        events: [
          {
            type: 'sunrise',
            time: '06:00',
            date: sunMoon.sunrise,
            text: t('sunrise', {
              ns: 'weather',
            }),
            radius: 0,
            startX: 32,
            startY: 0,
          },
          {
            type: 'sunset',
            time: '18:00',
            date: sunMoon.sunset,
            text: t('sunset', {
              ns: 'weather',
            }),
            radius: 0,
            startX: 314,
            startY: 0,
          },
          {
            type: 'moonrise',
            time: '06:00',
            date: sunMoon.moonrise,
            text: t('moonrise', {
              ns: 'weather',
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
              ns: 'weather',
            }),
            radius: 0,
            startX: 268,
            startY: 0,
          },
        ],
      })
    }
  }, [weatherInfo, renderSunmoon, config.lang, sunMoonListType])

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
      ? cityItem?.displayName.split(',')?.[0].trim()
      : cityItem?.cityInfo?.address?.split('·').filter((v, i, arr) => {
          return i === arr.length - 1
        })?.[0]
  }

  const [openWeatherDetailModalType, setOpenWeatherDetailModalType] = useState<
    | 'surfacePressure'
    | 'windLevel'
    | 'uvIndex'
    | 'visibility'
    | 'precipitation'
    | 'humidity'
    | ''
  >('')

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
        {/* <script src="https://d3js.org/d3.v7.min.js"></script> */}
      </Head>
      <div
        style={{} as any}
        className={'weather-page ' + (fixedHeader ? 'fixedHeader' : '')}
      >
        <div className="wp-main">
          <div className="wp-header">
            <div className="wp-h-left">
              {/* <span className="wp-h-l-cityName">
                {getDisplayName(cityItem)}
              </span> */}
              <NoSSR>
                <SakiDropdown
                  ref={
                    bindEvent({
                      close: () => {
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
                  >
                    {cityItem?.curPopsition ? (
                      <saki-icon
                        width="22px"
                        height="22px"
                        color="#999"
                        margin="0 2px 0 0"
                        type="PositionFill"
                      ></saki-icon>
                    ) : (
                      ''
                    )}
                    <span className="wp-h-l-city">
                      {getDisplayName(cityItem)}
                    </span>
                    <saki-icon
                      width="24px"
                      height="24px"
                      color="#999"
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
                            '--dp-w': Math.min(350, config.deviceWH.w) + 'px',
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
                            {loadWeather && openCityDropdown ? (
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
                                      ns: 'weatherPage',
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
                          </div>
                        </div>
                        <div className="cities-list scrollBarDefault">
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
                                      setCities(
                                        cities.map((sv, si) => {
                                          return {
                                            ...sv,
                                            default: si === i,
                                          }
                                        })
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
                                      {v?.weatherInfo?.current?.temperature}℃
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
                                  color="#444"
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
              {loadWeather ? (
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
                        ns: 'weatherPage',
                      })}
                    </span>
                  </SakiRow>
                </>
              ) : cityItem?.updateTime ? (
                <div className="wp-c-updateTime">
                  {t('updatedTime', {
                    ns: 'weather',
                    time:
                      formatDurationI18n(
                        (new Date().getTime() - cityItem?.updateTime) / 1000,
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

          <div className="wp-cur">
            <div className="wp-c-top">
              <div className="wp-c-temp">
                <div className="wp-data-temp">
                  <span>{weatherInfo?.current?.temperature}</span>
                  <span>
                    <span>℃</span>
                    {/* <span>{weatherInfo?.current?.weather}</span> */}
                  </span>
                </div>
                <div className="wp-data-weather">
                  <span>
                    {t('weather' + (weatherInfo?.current?.weatherCode || 0), {
                      ns: 'weather',
                    })}
                  </span>
                </div>

                {config.deviceType !== 'Mobile' ? (
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
                )}
              </div>
              <div className="wp-c-emoji">
                <span>
                  {openWeatherWMOToEmoji(
                    Number(weatherInfo?.current?.weatherCode)
                  )?.value || ''}
                </span>

                <span className="wp-c-e-weather">
                  {t('weather' + (weatherInfo?.current?.weatherCode || 0), {
                    ns: 'weather',
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
                    <saki-icon color="#444" type="Thermometer"></saki-icon>
                    <span>
                      {t('apparentTemperature', {
                        ns: 'weather',
                      }) +
                        ' ' +
                        (weatherInfo?.current?.apparentTemperature + '℃')}
                    </span>
                  </div>

                  {config.deviceType === 'Mobile' ? (
                    <div className={'wp-data-item '}>
                      <saki-icon color="#444" type="Leaf"></saki-icon>{' '}
                      <span>
                        {t('air', {
                          ns: 'weather',
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
                  )}

                  <div
                    onClick={() => {
                      setOpenWeatherDetailModalType('precipitation')
                    }}
                    className="wp-data-item"
                  >
                    <saki-icon color="#444" type="Umbrella"></saki-icon>
                    <span>
                      {t('precipitation_probability', {
                        ns: 'weather',
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
                    <saki-icon color="#444" type="Rainfall"></saki-icon>
                    <span>
                      {t('precipitation', {
                        ns: 'weather',
                      }) +
                        ' ' +
                        (weatherInfo?.current?.precipitation +
                          weatherInfo?.current_units?.precipitation)}
                    </span>
                  </div>
                  <div
                    onClick={() => {
                      setOpenWeatherDetailModalType('surfacePressure')
                    }}
                    className="wp-data-item"
                  >
                    <saki-icon color="#444" type="PressureGauge"></saki-icon>
                    <span>
                      {t('surfacePressure', {
                        ns: 'weather',
                      }) +
                        ' ' +
                        (weatherInfo?.current?.surfacePressure +
                          weatherInfo?.current_units?.surface_pressure)}
                    </span>
                  </div>
                  <div
                    onClick={() => {
                      setOpenWeatherDetailModalType('humidity')
                    }}
                    className="wp-data-item"
                  >
                    <saki-icon color="#444" type="Humidity"></saki-icon>
                    <span>
                      {t('humidity', {
                        ns: 'weather',
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
                    <saki-icon color="#444" type="Windmill"></saki-icon>
                    <span>
                      {
                        //   t('windLevel', {
                        //   ns: 'weather',
                        // }) +
                        //   ' ' +
                        windy.direction +
                          ' ' +
                          t('windLevelNum', {
                            ns: 'weather',
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
                    <saki-icon color="#444" type="Wind"></saki-icon>
                    <span>
                      {t('windSpeed', {
                        ns: 'weather',
                      }) +
                        ' ' +
                        windy.val +
                        windy.unit}
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
                    {openWeatherWMOToEmoji(Number(weathercode))?.value || ''}
                  </span>
                  <div className="wp-t-i-data">
                    <span className="wp-t-i-d-date">
                      {moment(v).isSame(moment(), 'day')
                        ? t('today', {
                            ns: 'weather',
                          })
                        : t('tomorrow', {
                            ns: 'weather',
                          })}
                    </span>
                    <span className="wp-t-i-d-temp">{`${temperature_2m_min}~${temperature_2m_max}${weatherInfo.dailyUnits.temperature_2m_max}`}</span>
                    <span className="wp-t-i-d-weather">
                      <span>
                        {maxTempWeatherCode === minTempWeatherCode
                          ? t('weather' + (weathercode || 0), {
                              ns: 'weather',
                            })
                          : t('weatherToWeather', {
                              ns: 'weather',
                              waether1: t(
                                'weather' + (maxTempWeatherCode || 0),
                                {
                                  ns: 'weather',
                                }
                              ),
                              weather2: t(
                                'weather' + (minTempWeatherCode || 0),
                                {
                                  ns: 'weather',
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
                            (i === 2 ? tomorrowAQ : todayAQ).aqiDesc.aqiDesc}
                        </span>
                      </span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="wp-hourly">
            <div className="wp-title">
              <span>
                {t('24hourForecast', {
                  ns: 'weather',
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
                  ns: 'weather',
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
                      >
                        <span
                          style={{
                            color: '#666',
                          }}
                        >
                          {a15dayForecastDPList.filter(
                            (v) => v.val === dayForecastListType
                          )?.[0]?.text || ''}
                        </span>
                        <saki-icon
                          width="24px"
                          height="24px"
                          color="#999"
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
                    ns: 'weather',
                  })}
                </span>
              </SakiButton>
            </SakiRow> */}
          </div>

          <div className="wp-aq">
            <div className="wp-title">
              <span>
                {t('airQuality', {
                  ns: 'weather',
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
                      >
                        <span
                          style={{
                            color: '#666',
                          }}
                        >
                          {airQualityDPList.filter(
                            (v) => v.val === airQualityListType
                          )?.[0]?.text || ''}
                        </span>
                        <saki-icon
                          width="24px"
                          height="24px"
                          color="#999"
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
                            ns: 'weather',
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
                  ns: 'weather',
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
                      >
                        <span
                          style={{
                            color: '#666',
                          }}
                        >
                          {sunMoonDPList.filter(
                            (v) => v.val === sunMoonListType
                          )?.[0]?.text || ''}
                        </span>
                        <saki-icon
                          width="24px"
                          height="24px"
                          color="#999"
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
                        ns: 'weather',
                      }),
                      time: formatDurationI18n(
                        moment(sunMoon.sunset).unix() -
                          moment(sunMoon.sunrise).unix()
                      ),
                    },
                    {
                      text: t('moonshine', {
                        ns: 'weather',
                      }),
                      time: formatDurationI18n(
                        moment(sunMoon.moonset).unix() -
                          moment(sunMoon.moonrise).unix()
                      ),
                    },
                    {
                      text: t('astronomicalStart', {
                        ns: 'weather',
                      }),
                      time: moment(
                        sunMoon.twilightTimes.astronomical.start
                      ).format('HH:mm:ss'),
                    },
                    {
                      text: t('astronomicalEnd', {
                        ns: 'weather',
                      }),
                      time: moment(
                        sunMoon.twilightTimes.astronomical.end
                      ).format('HH:mm:ss'),
                    },
                    {
                      text: t('nauticalStart', {
                        ns: 'weather',
                      }),
                      time: moment(sunMoon.twilightTimes.nautical.start).format(
                        ' HH:mm:ss'
                      ),
                    },
                    {
                      text: t('nauticalEnd', {
                        ns: 'weather',
                      }),
                      time: moment(sunMoon.twilightTimes.nautical.end).format(
                        'HH:mm:ss'
                      ),
                    },
                    {
                      text: t('civilStart', {
                        ns: 'weather',
                      }),
                      time: moment(sunMoon.twilightTimes.civil.start).format(
                        'HH:mm:ss'
                      ),
                    },
                    {
                      text: t('civilEnd', {
                        ns: 'weather',
                      }),
                      time: moment(sunMoon.twilightTimes.civil.end).format(
                        'HH:mm:ss'
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
                  ns: 'weather',
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
                        color="#444"
                        width="14px"
                        height="14px"
                        type="PressureGauge"
                      ></saki-icon>
                    </NoSSR>
                    <span>
                      {t('surfacePressure', {
                        ns: 'weather',
                      })}
                    </span>
                  </div>
                  <div className="i-t-right">
                    <span>
                      {/* {t('more', {
                        ns: 'weather',
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
                    <span>{curInfo.surfacePressure.val}</span>
                    <span>{curInfo.surfacePressure.unit}</span>
                  </span>
                  <span
                    style={{
                      fontSize: '16px',
                      color: '#444',
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
                      color="#444"
                      width="14px"
                      height="14px"
                      type="Windmill"
                    ></saki-icon>
                  </NoSSR>
                  <span>
                    {t('windLevel', {
                      ns: 'weather',
                    })}
                  </span>
                </div>
                <div className="item-val">
                  <span
                    style={{
                      margin: '-10px 0 0',
                    }}
                  >
                    <span>{curInfo.windy.val}</span>
                    <span>{curInfo.windy.unit}</span>
                  </span>
                  <span
                    style={{
                      fontSize: '16px',
                      color: '#444',
                    }}
                  >
                    {`${curInfo.windy.direction} ${t('windLevelNum', {
                      ns: 'weather',
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
                      color="#444"
                      width="14px"
                      height="14px"
                      type="UVIndexSunFill"
                    ></saki-icon>
                  </NoSSR>
                  <span>
                    {t('uvIndex', {
                      ns: 'weather',
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
                      color="#444"
                      width="14px"
                      height="14px"
                      type="Eye"
                    ></saki-icon>
                  </NoSSR>
                  <span>
                    {t('visibility', {
                      ns: 'weather',
                    })}
                  </span>
                </div>
                <div className="item-val">
                  <span>
                    <span>{curInfo.visibility.val}</span>
                    <span>{curInfo.visibility.unit}</span>
                  </span>
                  <span
                    style={{
                      fontSize: '16px',
                      color: '#444',
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
                      color="#444"
                      width="14px"
                      height="14px"
                      type="Umbrella"
                    ></saki-icon>
                  </NoSSR>
                  <span>
                    {t('precipitation', {
                      ns: 'weather',
                    })}
                  </span>
                </div>
                <div className="item-val">
                  <span
                    style={{
                      margin: '-10px 0 0',
                    }}
                  >
                    <span>{curInfo.precipitation.val.toFixed(1)}</span>
                    <span>{curInfo.precipitation.unit}</span>
                  </span>
                  <span
                    style={{
                      fontSize: '16px',
                      color: '#444',
                    }}
                  >
                    {t('past24Hours', {
                      ns: 'weather',
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
                      color="#444"
                      width="14px"
                      height="14px"
                      type="Humidity"
                    ></saki-icon>
                  </NoSSR>
                  <span>
                    {t('humidity', {
                      ns: 'weather',
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
        ></WeatherDetailModal>
      </div>
    </>
  )
}

const WeatherDetailModal = ({
  type,
  weatherInfo,
  onClose,
}: {
  type:
    | 'surfacePressure'
    | 'windLevel'
    | 'uvIndex'
    | 'visibility'
    | 'precipitation'
    | 'humidity'
    | ''
  weatherInfo: typeof defaultWeatherInfo
  onClose: () => void
}) => {
  const { t, i18n } = useTranslation('weatherPage')
  const config = useSelector((state: RootState) => state.config)
  const dispatch = useDispatch<AppDispatch>()

  const {
    surfacePressure,
    uvList,
    visibilityList,
    last24HoursPrecipitationList,
  } = useMemo(() => {
    let curIndex = 0

    const curHour = moment().format('YYYY-MM-DD HH:00')
    weatherInfo.hourly.time.some((v, i) => {
      const vHour = moment(v).format('YYYY-MM-DD HH:00')
      // console.log('getWeather curIndex', curHour, vHour)
      if (curHour === vHour) {
        curIndex = i
        return true
      }

      return curIndex
    })

    let surfacePressure: {
      val: number
      unit: string
      pressureLevel: PressureLevel
      date: string
    }[] = []

    if (type === 'surfacePressure') {
      surfacePressure = weatherInfo.hourly.time
        .slice(0, 96)
        .map((v, i) => {
          const curHour = moment().format('HH:00')
          const vHour = moment(v).format('HH:00')

          const press = getDetailedPressureLevel(
            weatherInfo.hourly.surface_pressure[i],
            weatherInfo.current.altitude
          )
          return {
            val: weatherInfo.hourly.surface_pressure[i],
            unit: weatherInfo.hourlyUnits.surface_pressure,
            pressureLevel: press,
            date:
              curHour === vHour
                ? t('now', {
                    ns: 'weather',
                  })
                : vHour,
          }
        })
        .slice(curIndex - 1, curIndex + 22)
    }

    if (type === 'windLevel') {
      setTimeout(() => {
        createWindChart({
          container: '#wind-chart',
          weatherInfo,
          type: 'Wind24H',
          width: 70 * 24 + 18 * 2,
          height: 150,
          margin: {
            top: 50,
            bottom: 20,
            right: 18,
            left: 18,
          },
          windData: weatherInfo.hourly.time
            .slice(0, 96)
            .map((v, i) => {
              if (i < curIndex - 1 || i > curIndex + 22) {
                return {
                  wind_direction_10m: 0,
                  wind_speed_10m: 0,
                  wind_gusts_10m: 0,
                  date: '',
                  unit: '',
                }
              }
              const curHour = moment().format('HH:00')
              const vHour = moment(v).format('HH:00')
              return {
                wind_direction_10m: weatherInfo.hourly.wind_direction_10m[i],
                wind_speed_10m: weatherInfo.hourly.wind_speed_10m[i],
                wind_gusts_10m: weatherInfo.hourly.wind_gusts_10m[i],
                unit: weatherInfo.hourlyUnits.wind_speed_10m,
                date:
                  curHour === vHour
                    ? t('now', {
                        ns: 'weather',
                      })
                    : vHour,
              }
            })
            .filter((v) => v.date),
        })
        createWindChart({
          container: '#wind-15-chart',
          weatherInfo,
          type: 'Wind15D',
          width: 70 * weatherInfo.daily.time.length + 18 * 2,
          height: 168,
          margin: {
            top: 68,
            bottom: 10,
            right: 18,
            left: 18,
          },
          windData: weatherInfo.daily.time
            .map((v, i) => {
              const wDate = formatWeatherDate(v)
              return {
                wind_direction_10m:
                  weatherInfo.daily.wind_direction_10m_dominant[i],
                wind_speed_10m: weatherInfo.daily.wind_speed_10m_max[i],
                wind_gusts_10m: weatherInfo.daily.wind_gusts_10m_max[i],
                unit: weatherInfo.dailyUnits.wind_speed_10m_max,
                date: wDate.week + ',' + wDate.date,
              }
            })
            .filter((v) => v.date),
        })
      }, 20)
    }

    let last24HoursPrecipitationList: {
      hours: number
      val: number
    }[] = []

    if (type === 'precipitation') {
      last24HoursPrecipitationList = [1, 2, 3, 6, 9, 12, 18, 24].map((v) => {
        return {
          hours: v,
          val: weatherInfo.hourly.time.reduce((t, sv, si) => {
            if (si <= curIndex && si > curIndex - v) {
              const vHour = moment(sv).format('YYYY-MM-DD HH:00')

              t = t + weatherInfo.hourly.precipitation[si]
            }
            return t
          }, 0),
        }
      })
      setTimeout(() => {
        createPrecipitationDataChart({
          container: '#precipitation-24h-chart',
          weatherInfo,
          type: 'Hourly',
          width: 70 * 24 + 18 * 2,
          height: 190,
          margin: {
            top: 25,
            bottom: 45,
            right: 18,
            left: 18,
          },
          precipitationData: weatherInfo.hourly.time
            .slice(0, 96)
            .map((v, i) => {
              if (i < curIndex - 1 || i > curIndex + 22) {
                return {
                  precipitation: 0,
                  precipitation_probability: 0,
                  date: '',
                }
              }
              const curHour = moment().format('HH:00')
              const vHour = moment(v).format('HH:00')
              return {
                precipitation: weatherInfo.hourly.precipitation[i],
                precipitation_probability:
                  weatherInfo.hourly.precipitation_probability[i],
                date:
                  curHour === vHour
                    ? t('now', {
                        ns: 'weather',
                      })
                    : vHour,
              }
            })
            .filter((v) => v.date),
        })
        createPrecipitationDataChart({
          container: '#precipitation-15d-chart',
          weatherInfo,
          type: 'Daily',
          width: 70 * 17 + 18 * 2,
          height: 210,
          margin: {
            top: 45,
            bottom: 45,
            right: 18,
            left: 18,
          },
          precipitationData: weatherInfo.daily.time.map((v, i) => {
            return {
              precipitation: weatherInfo.daily.precipitation_sum?.[i] || 0,
              precipitation_probability:
                weatherInfo.daily.precipitation_probability_mean[i],
              date: v,
            }
          }),
        })
      }, 20)
    }

    if (type === 'humidity') {
      setTimeout(() => {
        createPrecipitationDataChart({
          container: '#humidity-24h-chart',
          weatherInfo,
          type: 'Humidity',
          width: 70 * 24 + 18 * 2,
          height: 170,
          margin: {
            top: 25,
            bottom: 25,
            right: 18,
            left: 18,
          },
          precipitationData: weatherInfo.hourly.time
            .slice(0, 96)
            .map((v, i) => {
              if (i < curIndex - 1 || i > curIndex + 22) {
                return {
                  precipitation: 0,
                  precipitation_probability: 0,
                  date: '',
                }
              }
              const curHour = moment().format('HH:00')
              const vHour = moment(v).format('HH:00')
              return {
                precipitation: weatherInfo.hourly.precipitation[i],
                precipitation_probability:
                  weatherInfo.hourly.relative_humidity_2m[i],
                date:
                  curHour === vHour
                    ? t('now', {
                        ns: 'weather',
                      })
                    : vHour,
              }
            })
            .filter((v) => v.date),
        })

        createDewPointChart({
          container: '#dew-point-chart',
          weatherInfo,
          type: 'Humidity',
          width: 70 * 24 + 18 * 2,
          height: 150,
          margin: {
            top: 65,
            bottom: 10,
            right: 28,
            left: 8,
          },
          valData: weatherInfo.hourly.time
            .slice(0, 96)
            .map((v, i) => {
              if (i < curIndex - 1 || i > curIndex + 22) {
                return {
                  val: 0,
                  unit: '',
                  date: '',
                }
              }
              const curHour = moment().format('HH:00')
              const vHour = moment(v).format('HH:00')
              return {
                val: weatherInfo.hourly.dew_point_2m?.[i] || 0,
                unit: weatherInfo.hourlyUnits.dew_point_2m,
                date:
                  curHour === vHour
                    ? t('now', {
                        ns: 'weather',
                      })
                    : vHour,
              }
            })
            .filter((v) => v.date),
        })
      }, 20)
    }

    let visibilityList: {
      val: string
      level: string
      weatherCode: number
      color: string
      date: string
    }[] = []
    if (type === 'visibility') {
      visibilityList = weatherInfo.hourly.time
        .slice(0, 96)
        .map((v, i) => {
          const curHour = moment().format('HH:00')
          const vHour = moment(v).format('HH:00')

          const visibilityAlert = getVisibilityAlert(
            weatherInfo.hourly.visibility?.[i] || 0
          )
          return {
            val: formatDistance(visibilityAlert.visibility),
            level: visibilityAlert.level,
            color: visibilityAlert.color,
            weatherCode: weatherInfo.hourly.weathercode[i],
            date:
              curHour === vHour
                ? t('now', {
                    ns: 'weather',
                  })
                : vHour,
          }
        })
        .slice(curIndex - 1, curIndex + 22)
    }

    let uvList: {
      val: number
      level: string
      weatherCode: number
      color: string
      date: string
      week: string
    }[] = []
    if (type === 'uvIndex') {
      uvList = weatherInfo.daily.time.map((v, i) => {
        const curHour = moment().format('HH:00')
        const vHour = moment(v).format('HH:00')

        const uvInfo = getUVInfo(weatherInfo.daily.uv_index_max?.[i] || 0)

        const d = formatWeatherDate(v)
        return {
          val: weatherInfo.daily.uv_index_max?.[i] || 0,
          level: uvInfo.level,
          color: uvInfo.color,
          weatherCode: weatherInfo.hourly.weathercode[i],
          date: d.date,
          week: d.week,
        }
      })

      setTimeout(() => {
        createDewPointChart({
          container: '#uvIndex-24h-chart',
          weatherInfo,
          type: 'UV',
          width: 70 * 24 + 18 * 2,
          height: 150,
          margin: {
            top: 65,
            bottom: 10,
            right: 28,
            left: 8,
          },
          valData: weatherInfo.hourly.time
            .slice(0, 96)
            .map((v, i) => {
              if (i < curIndex - 1 || i > curIndex + 22) {
                return {
                  val: 0,
                  unit: '',
                  date: '',
                }
              }
              const curHour = moment().format('HH:00')
              const vHour = moment(v).format('HH:00')
              return {
                val: weatherInfo.hourly.uv_index?.[i] || 0,
                unit: weatherInfo.hourlyUnits.uv_index,
                date:
                  curHour === vHour
                    ? t('now', {
                        ns: 'weather',
                      })
                    : vHour,
              }
            })
            .filter((v) => v.date),
        })
      }, 20)
    }

    // console.log('visibilityList', weatherInfo.hourly, visibilityList)

    return {
      surfacePressure,
      uvList,
      visibilityList,
      last24HoursPrecipitationList,
    }
  }, [type, weatherInfo, config.lang])

  return (
    <NoSSR>
      <SakiAsideModal
        ref={
          bindEvent({
            close: () => {
              onClose()
            },
          }) as any
        }
        onLoaded={() => {}}
        width="100%"
        height="100%"
        max-width={config.deviceType === 'Mobile' ? '100%' : '500px'}
        max-height={
          config.deviceType === 'Mobile'
            ? '80%'
            : Math.min(600, config.deviceWH.h) + 'px'
        }
        vertical={config.deviceType === 'Mobile' ? 'Bottom' : 'Center'}
        horizontal={'Center'}
        offset-x={'0px'}
        offset-y={'0px'}
        mask
        mask-closable={config.deviceType === 'Mobile'}
        maskBackgroundColor={'rgba(0,0,0,0.3)'}
        border-radius={config.deviceType === 'Mobile' ? '10px 10px 0 0' : ''}
        border={config.deviceType === 'Mobile' ? 'none' : ''}
        background-color="#fff"
        visible={type !== ''}
        overflow="hidden"
      >
        <div className={'weather-detail-modal ' + config.deviceType}>
          <div className="wd-header">
            <SakiModalHeader
              border={false}
              back-icon={false}
              close-icon={true}
              right-width={'56px'}
              ref={
                bindEvent({
                  close() {
                    onClose()
                  },
                }) as any
              }
              title={t(type, {
                ns: 'weather',
              })}
            />
          </div>
          <div className="wd-main scrollBarHover">
            {type === 'surfacePressure' ? (
              <div className="wd-surfacePressure">
                <SakiTitle level={4} margin="0 0 4px 20px" fontWeight="700">
                  <span>
                    {t('24Hours', {
                      ns: 'weather',
                    })}
                  </span>
                </SakiTitle>
                <div className="wp-sp-list">
                  {surfacePressure.map((v, i) => {
                    return (
                      <div className="sp-item" key={i}>
                        <div className="sp-dete">{v.date}</div>
                        <div className="sp-val">
                          <span>{v.val}</span>
                          <span>{v.unit}</span>
                        </div>
                        <div className="sp-level">{v.pressureLevel.level}</div>
                        <div className="sp-color">
                          <div
                            style={{
                              backgroundColor: v.pressureLevel.color,
                            }}
                            className="sp-progress"
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* <div className="wp-chart scrollBarHover">
                  <svg id="surfacePressure-chart"></svg>
                </div> */}
              </div>
            ) : type === 'windLevel' ? (
              <div className="wd-wind">
                <SakiTitle
                  level={2}
                  margin="0 0 18px 18px"
                  color="#000"
                  fontWeight="700"
                >
                  <span>
                    {t('24hourForecast', {
                      ns: 'weather',
                    })}
                  </span>
                </SakiTitle>
                <div className="wp-chart scrollBarHover">
                  <svg id="wind-chart"></svg>
                </div>
                <div className="wd-color">
                  <div className="wd-c-item">
                    <span>
                      {t('wind_gusts', {
                        ns: 'weather',
                      })}
                    </span>
                    <div
                      style={
                        {
                          '--bg-color': '#f5acba',
                        } as any
                      }
                      className="item-progress"
                    ></div>
                  </div>
                  <div className="wd-c-item">
                    <span>
                      {t('wind_speed', {
                        ns: 'weather',
                      })}
                    </span>
                    <div
                      style={
                        {
                          '--bg-color': '#60d0fa',
                        } as any
                      }
                      className="item-progress"
                    ></div>
                  </div>
                </div>

                <SakiTitle
                  level={2}
                  margin="0 0 18px 18px"
                  color="#000"
                  fontWeight="700"
                >
                  <span>
                    {t('15dayForecast', {
                      ns: 'weather',
                    })}
                  </span>
                </SakiTitle>
                <div className="wp-chart scrollBarHover">
                  <svg id="wind-15-chart"></svg>
                </div>

                <div className="wd-color">
                  <div className="wd-c-item">
                    <span>
                      {t('wind_gusts', {
                        ns: 'weather',
                      })}
                    </span>
                    <div
                      style={
                        {
                          '--bg-color': '#f5acba',
                        } as any
                      }
                      className="item-progress"
                    ></div>
                  </div>
                  <div className="wd-c-item">
                    <span>
                      {t('wind_speed', {
                        ns: 'weather',
                      })}
                    </span>
                    <div
                      style={
                        {
                          '--bg-color': '#60d0fa',
                        } as any
                      }
                      className="item-progress"
                    ></div>
                  </div>
                </div>
              </div>
            ) : type === 'precipitation' ? (
              <div className="wd-precipitation">
                <SakiTitle
                  level={2}
                  margin="0 0 18px 18px"
                  color="#000"
                  fontWeight="700"
                >
                  <span>
                    {t('precipitationSummary', {
                      ns: 'weather',
                    })}
                  </span>
                </SakiTitle>
                <div className="wd-precipitationSummary">
                  {last24HoursPrecipitationList.map((v, i) => {
                    return (
                      <div className={'wd-ps-item'} key={i}>
                        <span>
                          {t('last24HoursPrecipitation', {
                            ns: 'weather',
                            time: v.hours,
                            num:
                              Math.round(v.val * 100) / 100 +
                              weatherInfo.current_units.precipitation,
                          })}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <SakiTitle
                  level={2}
                  margin="18px 0 18px 18px"
                  color="#000"
                  fontWeight="700"
                >
                  <span>
                    {t('hourlyPrecipitationProbability', {
                      ns: 'weather',
                    })}
                  </span>
                </SakiTitle>

                <div className="wp-chart scrollBarHover">
                  <svg id="precipitation-24h-chart"></svg>
                </div>

                <SakiTitle
                  level={2}
                  margin="18px 0 18px 18px"
                  color="#000"
                  fontWeight="700"
                >
                  <span>
                    {t('dailyPrecipitationProbability', {
                      ns: 'weather',
                    })}
                  </span>
                </SakiTitle>

                <div className="wp-chart scrollBarHover">
                  <svg id="precipitation-15d-chart"></svg>
                </div>
              </div>
            ) : type === 'humidity' ? (
              <div className="wd-humidity">
                <SakiTitle
                  level={2}
                  margin="18px 0 18px 18px"
                  color="#000"
                  fontWeight="700"
                >
                  <span>
                    {t('hourlyHumidity', {
                      ns: 'weather',
                    })}
                  </span>
                </SakiTitle>

                <div className="wp-chart scrollBarHover">
                  <svg id="humidity-24h-chart"></svg>
                </div>

                <SakiTitle
                  level={2}
                  margin="18px 0 18px 18px"
                  color="#000"
                  fontWeight="700"
                >
                  <span>
                    {t('dailyDewPoint', {
                      ns: 'weather',
                    })}
                  </span>
                </SakiTitle>

                <div className="wp-chart scrollBarHover">
                  <svg id="dew-point-chart"></svg>
                </div>
              </div>
            ) : type === 'visibility' ? (
              <div className="wd-surfacePressure">
                <SakiTitle level={4} margin="0 0 4px 20px" fontWeight="700">
                  <span>
                    {t('24Hours', {
                      ns: 'weather',
                    })}
                  </span>
                </SakiTitle>
                <div className="wp-sp-list visibility">
                  {visibilityList.map((v, i) => {
                    return (
                      <div className="sp-item" key={i}>
                        <div className="sp-dete">{v.date}</div>
                        <div className="sp-weatherCode">
                          <span>
                            {openWeatherWMOToEmoji(v.weatherCode)?.value || ''}
                          </span>
                          <span>
                            {t('weather' + (v.weatherCode || 0), {
                              ns: 'weather',
                            })}
                          </span>
                        </div>
                        <div className="sp-val">
                          <span>{v.val}</span>
                        </div>
                        {config.deviceType !== 'Mobile' ? (
                          <div className="sp-level">{v.level}</div>
                        ) : (
                          ''
                        )}
                        <div className="sp-color">
                          {config.deviceType === 'Mobile' ? (
                            <div className="sp-level">{v.level}</div>
                          ) : (
                            ''
                          )}
                          <div
                            style={{
                              backgroundColor: v.color,
                            }}
                            className="sp-progress"
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : type === 'uvIndex' ? (
              <div className="wd-humidity wd-surfacePressure">
                <SakiTitle
                  level={2}
                  margin="0 0 18px 18px"
                  color="#000"
                  fontWeight="700"
                >
                  <span>
                    {t('24hourForecast', {
                      ns: 'weather',
                    })}
                  </span>
                </SakiTitle>

                <div className="wp-chart scrollBarHover">
                  <svg id="uvIndex-24h-chart"></svg>
                </div>

                <SakiTitle
                  level={2}
                  margin="10px 0 18px 18px"
                  color="#000"
                  fontWeight="700"
                >
                  <span>
                    {t('15dayForecast', {
                      ns: 'weather',
                    })}
                  </span>
                </SakiTitle>
                <div className="wp-sp-list visibility uvIndex">
                  {uvList.map((v, i) => {
                    return (
                      <div className="sp-item" key={i}>
                        <div className="sp-dete">
                          <span>{v.week}</span>
                          <span className="date">{v.date}</span>
                        </div>
                        <div className="sp-weatherCode">
                          <span>
                            {openWeatherWMOToEmoji(v.weatherCode)?.value || ''}
                          </span>
                          <span>
                            {t('weather' + (v.weatherCode || 0), {
                              ns: 'weather',
                            })}
                          </span>
                        </div>
                        <div className="sp-val">
                          <span>{v.val}</span>
                        </div>
                        {config.deviceType !== 'Mobile' ? (
                          <div className="sp-level">{v.level}</div>
                        ) : (
                          ''
                        )}
                        <div className="sp-color">
                          {config.deviceType === 'Mobile' ? (
                            <div className="sp-level">{v.level}</div>
                          ) : (
                            ''
                          )}
                          <div
                            style={{
                              backgroundColor: v.color,
                            }}
                            className="sp-progress"
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              ''
            )}
          </div>
        </div>
      </SakiAsideModal>
    </NoSSR>
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
        <span>{openWeatherWMOToEmoji(Number(weatherCode))?.value || ''}</span>
      </div>
      <div className="item-weather">
        <span>
          {maxTempWeatherCode === minTempWeatherCode
            ? t('weather' + (weatherCode || 0), {
                ns: 'weather',
              })
            : t('weatherToWeather', {
                ns: 'weather',
                waether1: t('weather' + (maxTempWeatherCode || 0), {
                  ns: 'weather',
                }),
                weather2: t('weather' + (minTempWeatherCode || 0), {
                  ns: 'weather',
                }),
              })}
        </span>
        <span>{`${temperature_2m_min}~${temperature_2m_max}${weatherInfo.dailyUnits.temperature_2m_max}`}</span>
      </div>
      <div className="item-aqi">
        <span>
          {getWindDirectionText(wind_direction_10m, true) +
            ' ' +
            t('windLevelNum', {
              ns: 'weather',
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
                ns: 'weather',
              })}
            </span>
            <span>{moment(times.sunrise).format('HH:mm:ss')}</span>
          </span>
          <span>
            <span>
              {t('sunset', {
                ns: 'weather',
              })}
            </span>
            <span>{moment(times.sunset).format('HH:mm:ss')}</span>
          </span>

          <span>
            <span>
              {t('daylight', {
                ns: 'weather',
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
                ns: 'weather',
              })}
            </span>
            <span>{moment(times.moonrise).format('HH:mm:ss')}</span>
          </span>
          <span>
            <span>
              {t('moonset', {
                ns: 'weather',
              })}
            </span>
            <span>{moment(times.moonset).format('HH:mm:ss')}</span>
          </span>

          <span>
            <span>
              {t('moonshine', {
                ns: 'weather',
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
