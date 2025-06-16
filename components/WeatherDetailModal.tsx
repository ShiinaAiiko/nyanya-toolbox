import Head from 'next/head'
import ToolboxLayout, { getLayout } from '../layouts/Toolbox'
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
} from '../store'
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
} from '../plugins/methods'
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
} from '../store/weather'
import {
  changeLanguage,
  languages,
  defaultLanguage,
} from '../plugins/i18n/i18n'
import moment, { unix } from 'moment'
import { configSlice, eventListener, R } from '../store/config'
import { server } from '../config'
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
} from '../components/saki-ui-react/components'
import * as Astronomy from 'astronomy-engine'
import { storage } from '../store/storage'
import NoSSR from '../components/NoSSR'
import dynamic from 'next/dynamic'
import { CityInfo } from '../plugins/http/api/geo'
import { httpApi } from '../plugins/http/api'
import {
  networkConnectionStatusDetection,
  networkConnectionStatusDetectionEnum,
} from '@nyanyajs/utils/dist/common/common'
import { covertTimeFormat } from '@nyanyajs/utils/dist/units/time'
import {
  convertPrecipitation,
  convertPressure,
  convertTemperature,
  convertVisibility,
} from '@nyanyajs/utils/dist/units/weather'

export const WarningIcon = ({
  width = 40,
  type,
  typeName,
  color,
  lang,
}: {
  width: number
  type: string
  typeName: string
  color: string
  lang: string
}) => {
  const { t, i18n } = useTranslation('weatherPage')

  let tempColor = color

  if (color === 'Yellow') {
    tempColor = '#ffd700'
  }

  if (color === 'Orange') {
    tempColor = '#ff9518'
  }

  if (color === 'Red') {
    tempColor = '#ed2246'
  }

  const text = t('warningType' + type, {
    ns: 'sakiuiWeather',
  })

  // console.log('WarningIcon', type, color)

  return (
    <div
      style={
        {
          '--wi-color': tempColor || '#ff9518',
          '--wi-width': width + 'px',
        } as any
      }
      className={
        'warning-icon-component ' + (lang === 'en-US' ? 'minText' : '')
      }
    >
      <i className={'wi-icon qi-' + type}></i>
      <span className="wi-text">
        {text.length > (lang === 'en-US' ? 12 : 3)
          ? t('warningTitle', {
              ns: 'sakiuiWeather',
              color: '',
              type: '',
            }).trim()
          : text}
        {/* {typeName} */}
      </span>
    </div>
  )
}

const WeatherDetailModal = ({
  type,
  weatherInfo,
  onClose,
  themeColor,
}: {
  type:
    | 'surfacePressure'
    | 'windLevel'
    | 'uvIndex'
    | 'visibility'
    | 'precipitation'
    | 'humidity'
    | 'warning'
    | ''
  weatherInfo: typeof defaultWeatherInfo
  onClose: () => void
  themeColor: 'Dark' | 'Light'
}) => {
  const { t, i18n } = useTranslation('weatherPage')
  const { config, weather } = useSelector((state: RootState) => {
    const { config, weather } = state
    return { config, weather }
  })
  const dispatch = useDispatch<AppDispatch>()

  const {
    surfacePressure,
    uvList,
    visibilityList,
    last24HoursPrecipitationList,
  } = useMemo(() => {
    const timeFormat = covertTimeFormat(
      weather.weatherData.units.timeFormat,
      config.lang
    )

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
          const curHour = moment().format(timeFormat.h)
          const vHour = moment(v).format(timeFormat.h)

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
                    ns: 'sakiuiWeather',
                  })
                : vHour,
          }
        })
        .slice(curIndex - 1, curIndex + 23)
    }

    if (type === 'windLevel') {
      setTimeout(() => {
        createWindChart({
          container: '#wind-chart',
          weatherInfo,
          themeColor,
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
              const curHour = moment().format(timeFormat.h)
              const vHour = moment(v).format(timeFormat.h)

              return {
                wind_direction_10m: weatherInfo.hourly.wind_direction_10m[i],
                wind_speed_10m: weatherInfo.hourly.wind_speed_10m[i],
                wind_gusts_10m: weatherInfo.hourly.wind_gusts_10m[i],
                unit: weather.weatherData.units.windSpeed,
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
        createWindChart({
          container: '#wind-15-chart',
          weatherInfo,
          themeColor,
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
          val: convertPrecipitation(
            weatherInfo.hourly.time.reduce((t, sv, si) => {
              if (si <= curIndex && si > curIndex - v) {
                t = t + weatherInfo.hourly.precipitation[si]
              }
              return t
            }, 0),
            weatherInfo.hourlyUnits.precipitation as any,
            weather.weatherData.units.precipitation
          ),
        }
      })
      setTimeout(() => {
        createPrecipitationDataChart({
          container: '#precipitation-24h-chart',
          weatherInfo,
          type: 'Hourly',
          themeColor,
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
              const curHour = moment().format(timeFormat.h)
              const vHour = moment(v).format(timeFormat.h)

              return {
                precipitation: weatherInfo.hourly.precipitation[i],
                precipitation_probability:
                  weatherInfo.hourly.precipitation_probability[i],
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
        createPrecipitationDataChart({
          container: '#precipitation-15d-chart',
          weatherInfo,
          themeColor,
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
          themeColor,
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
              const curHour = moment().format(timeFormat.h)
              const vHour = moment(v).format(timeFormat.h)
              return {
                precipitation: weatherInfo.hourly.precipitation[i],
                precipitation_probability:
                  weatherInfo.hourly.relative_humidity_2m[i],
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

        createDewPointChart({
          container: '#dew-point-chart',
          weatherInfo,
          themeColor,
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
              const curHour = moment().format(timeFormat.h)
              const vHour = moment(v).format(timeFormat.h)

              let temp = convertTemperature(
                weatherInfo.hourly.dew_point_2m?.[i] || 0,
                weatherInfo.hourlyUnits.dew_point_2m as any,
                weather.weatherData.units.temperature
              )
              return {
                val: temp,
                unit: weather.weatherData.units.temperature,
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
          const curHour = moment().format(timeFormat.h)
          const vHour = moment(v).format(timeFormat.h)

          const visibilityAlert = getVisibilityAlert(
            weatherInfo.hourly.visibility?.[i] || 0
          )
          return {
            val:
              convertVisibility(
                visibilityAlert.visibility,
                'm',
                weather.weatherData.units.visibility
              ) + weather.weatherData.units.visibility,
            level: visibilityAlert.level,
            color: visibilityAlert.color,
            weatherCode: weatherInfo.hourly.weathercode[i],
            date:
              curHour === vHour
                ? t('now', {
                    ns: 'sakiuiWeather',
                  })
                : vHour,
          }
        })
        .slice(curIndex - 1, curIndex + 23)
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
        const curHour = moment().format(timeFormat.h)
        const vHour = moment(v).format(timeFormat.h)

        const uvInfo = getUVInfo(weatherInfo.daily.uv_index_max?.[i] || 0)

        const d = formatWeatherDate(v)
        return {
          val: weatherInfo.daily.uv_index_max?.[i] || 0,
          level: uvInfo.level,
          color: uvInfo.color,
          weatherCode: weatherInfo.hourly.weathercode[i],
          date: d?.date,
          week: d.week,
        }
      })

      setTimeout(() => {
        createDewPointChart({
          container: '#uvIndex-24h-chart',
          weatherInfo,
          themeColor,
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
              const curHour = moment().format(timeFormat.h)
              const vHour = moment(v).format(timeFormat.h)
              return {
                val: weatherInfo.hourly.uv_index?.[i] || 0,
                unit: weatherInfo.hourlyUnits.uv_index,
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
      }, 20)
    }

    // console.log('visibilityList', weatherInfo.hourly, visibilityList)

    return {
      surfacePressure,
      uvList,
      visibilityList,
      last24HoursPrecipitationList,
    }
  }, [type, weatherInfo, config.lang, weather.weatherData.units])

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
        max-width={
          config.deviceType === 'Mobile'
            ? '100%'
            : Math.min(600, config.deviceWH.w) + 'px'
        }
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
        zIndex={100}
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
                ns: 'sakiuiWeather',
              })}
            >
              <div slot="right">
                <SakiButton
                  onTap={() => {
                    eventListener.dispatch('OpenModal:WeatherUnitsModal', {
                      pageTitle: t('unitModalPageTitle', {
                        ns: 'weatherPage',
                      }),
                    })
                  }}
                  type="CircleIconGrayHover"
                  border="none"
                  margin={'0 10px 0 0'}
                >
                  <SakiRow justifyContent="flex-start" alignItems="center">
                    <saki-icon
                      width="20px"
                      color="#666"
                      type="Settings"
                    ></saki-icon>
                    {/* <span>
                      {t('unit', {
                        ns: 'weatherPage',
                      })}
                    </span> */}
                  </SakiRow>
                </SakiButton>
              </div>
            </SakiModalHeader>
          </div>
          <div className="wd-main scrollBarHover">
            {type === 'surfacePressure' ? (
              <div className="wd-surfacePressure">
                <SakiTitle level={4} margin="0 0 4px 20px" fontWeight="700">
                  <span>
                    {t('24Hours', {
                      ns: 'sakiuiWeather',
                    })}
                  </span>
                </SakiTitle>
                <div className="wp-sp-list">
                  {surfacePressure.map((v, i) => {
                    return (
                      <div className="sp-item" key={i}>
                        <div className="sp-dete">{v.date}</div>
                        <div className="sp-val">
                          <span>
                            {convertPressure(
                              v.val,
                              v.unit as any,
                              weather.weatherData.units.pressure
                            )}
                          </span>
                          <span>{weather.weatherData.units.pressure}</span>
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
                      ns: 'sakiuiWeather',
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
                        ns: 'sakiuiWeather',
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
                        ns: 'sakiuiWeather',
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
                      ns: 'sakiuiWeather',
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
                        ns: 'sakiuiWeather',
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
                        ns: 'sakiuiWeather',
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
                      ns: 'sakiuiWeather',
                    })}
                  </span>
                </SakiTitle>
                <div className="wd-precipitationSummary">
                  {last24HoursPrecipitationList.map((v, i) => {
                    return (
                      <div className={'wd-ps-item'} key={i}>
                        <span>
                          {t('last24HoursPrecipitation', {
                            ns: 'sakiuiWeather',
                            time: v.hours,
                            num:
                              Math.round(v.val * 100) / 100 +
                              weather.weatherData.units.precipitation,
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
                      ns: 'sakiuiWeather',
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
                      ns: 'sakiuiWeather',
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
                      ns: 'sakiuiWeather',
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
                      ns: 'sakiuiWeather',
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
                      ns: 'sakiuiWeather',
                    })}
                  </span>
                </SakiTitle>
                <div className="wp-sp-list visibility">
                  {visibilityList.map((v, i) => {
                    return (
                      <div className="sp-item" key={i}>
                        <div className="sp-dete">{v.date}</div>
                        <div className="sp-weatherCode">
                          <span>{getWeatherIcon(v.weatherCode) || ''}</span>
                          <span>
                            {t('weather' + (v.weatherCode || 0), {
                              ns: 'sakiuiWeather',
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
                      ns: 'sakiuiWeather',
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
                      ns: 'sakiuiWeather',
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
                          <span>{getWeatherIcon(v.weatherCode) || ''}</span>
                          <span>
                            {t('weather' + (v.weatherCode || 0), {
                              ns: 'sakiuiWeather',
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
            ) : type === 'warning' ? (
              <div className="wd-warning wd-surfacePressure">
                {weatherInfo?.alert?.warning?.map((v, i) => {
                  return (
                    <div className="wp-w-item" key={i}>
                      <div className="wp-w-header">
                        <div className="wp-wi-left">
                          <WarningIcon
                            width={60}
                            type={v.type}
                            typeName={v.typeName}
                            color={
                              v.severityColor || getWarningColor(v.severity)
                            }
                            lang={config.lang}
                          ></WarningIcon>
                        </div>
                        <div className="wp-wi-right">
                          <span className="wp-wi-title">
                            {v.title}
                            {/* {t('fullWarningTitle', {
                              ns: 'sakiuiWeather',
                              author: v.sender,
                              type: t('warningType' + v.type, {
                                ns: 'sakiuiWeather',
                              }),
                              color: t(v.severityColor.toLowerCase(), {
                                ns: 'sakiuiColor',
                              }),
                            })} */}
                          </span>
                          <span className="wp-wi-time">
                            {t('pubTime', {
                              ns: 'sakiuiWeather',
                              time: moment(v.pubTime).format(
                                'YYYY-MM-DD HH:mm:ss'
                              ),
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="wp-w-bottom">
                        <div className="wp-w-b-desc">
                          <span>{v.text}</span>
                        </div>
                        <div className="wp-w-b-source">
                          <span>
                            {t('startTime', {
                              ns: 'sakiuiWeather',
                              time: moment(v.startTime).format(
                                'YYYY-MM-DD HH:mm:ss'
                              ),
                            })}
                          </span>
                          <span>
                            {t('endTime', {
                              ns: 'sakiuiWeather',
                              time: moment(v.endTime).format(
                                'YYYY-MM-DD HH:mm:ss'
                              ),
                            })}
                          </span>
                          {weatherInfo?.alert?.refer?.sources.map((v, i) => {
                            return (
                              <span key={i}>
                                {t('sourceText', {
                                  ns: 'sakiuiWeather',
                                  text: v,
                                })}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
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

export default WeatherDetailModal
