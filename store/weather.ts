import moment from 'moment'
import { t } from '../plugins/i18n/i18n'

import * as Astronomy from 'astronomy-engine'
import { openWeatherWMOToEmoji } from '@akaguny/open-meteo-wmo-to-emoji'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import store, { ActionParams, layoutSlice } from '.'
import { Debounce, deepCopy } from '@nyanyajs/utils'
import { CityInfo } from '../plugins/http/api/geo'
import { protoRoot } from '../protos'
import { getHash } from '@nyanyajs/utils/dist/file'
import { httpApi } from '../plugins/http/api'
import { saass } from './config'
import { showSnackbar } from '../plugins/methods'
import { storage } from './storage'

export const defaultWeatherInfo = {
  ipv4: '',
  ipv6: '',
  lon: 0,
  lat: 0,
  timezone: '',
  isp: '',
  org: '',
  current: {
    temperature: -273.15,
    apparentTemperature: -273.15,
    visibility: 0,
    relative_humidity_2m: 0,
    weatherCode: '',
    weather: '',
    altitude: 0,
    daysTemperature: [-273.15, -273.15] as number[],
    precipitationHours: 0,
    pressureMsl: 0,
    surfacePressure: 0,
    precipitation: 0,
    precipitationProbability: 0,
    wind_direction_10m: 0,
    wind_speed_10m: 0,
    dew_point_2m: 0,
    wind_gusts_10m: 0,
  },
  current_units: {
    time: 'iso8601',
    interval: 'seconds',
    temperature_2m: '°C',
    weather_code: 'wmo code',
    relative_humidity_2m: '%',
    wind_speed_10m: 'm/s',
    apparent_temperature: '°C',
    dew_point_2m: '°C',
    wind_direction_10m: '°',
    visibility: 'm',
    pressure_msl: 'hPa',
    surface_pressure: 'hPa',
    precipitation: 'mm',
    precipitation_probability: '%',
    wind_gusts_10m: 'm/s',
  },
  daily: {
    temperature_2m_max: [] as number[],
    temperature_2m_min: [] as number[],
    precipitation_probability_max: [] as number[],
    precipitation_probability_min: [] as number[],
    precipitation_probability_mean: [] as number[],
    precipitation_hours: [] as number[],
    precipitation_sum: [] as number[],

    time: [] as string[],
    weathercode: [] as number[],
    maxTempWeatherCodes: [] as number[],
    minTempWeatherCodes: [] as number[],
    wind_speed_10m_max: [] as number[],
    wind_direction_10m_dominant: [] as number[],
    wind_gusts_10m_max: [] as number[],
    sunrise: [] as string[],
    sunset: [] as string[],
    uv_index_clear_sky_max: [] as number[],
    uv_index_max: [] as number[],
  },
  dailyUnits: {
    precipitation_hours: 'h',
    precipitation_probability_max: '%',
    precipitation_probability_mean: '%',
    precipitation_probability_min: '%',
    precipitation_sum: 'mm',
    sunrise: 'iso8601',
    sunset: 'iso8601',
    temperature_2m_max: '°C',
    temperature_2m_min: '°C',
    time: 'iso8601',
    uv_index_clear_sky_max: '',
    uv_index_max: '',
    weathercode: 'wmo code',
    wind_direction_10m_dominant: '°',
    wind_speed_10m_max: 'km/h',
    wind_gusts_10m_max: 'm/s',
  },
  hourly: {
    temperature_2m: [] as number[],
    time: [] as string[],
    weathercode: [] as number[],
    precipitation_probability: [] as number[],
    wind_direction_10m: [] as number[],
    wind_speed_10m: [] as number[],
    wind_gusts_10m: [] as number[],
    precipitation: [] as number[],
    pressure_msl: [] as number[],
    relative_humidity_2m: [] as number[],
    surface_pressure: [] as number[],
    uv_index: [] as number[],
    dew_point_2m: [] as number[],
    visibility: [] as number[],
  },
  hourlyUnits: {
    precipitation: 'mm',
    precipitation_probability: '%',
    pressure_msl: 'hPa',
    relative_humidity_2m: '%',
    dew_point_2m: '°C',
    surface_pressure: 'hPa',
    temperature_2m: '°C',
    time: 'iso8601',
    visibility: 'm',
    weathercode: 'wmo code',
    wind_direction_10m: '°',
    wind_speed_10m: 'km/h',
    wind_gusts_10m: 'm/s',
    uv_index: '',
  },
  airQuality: {
    current: {
      time: [] as string[],
      pm2_5: [] as number[],
      pm10: [] as number[],
      nitrogen_dioxide: [] as number[],
      sulphur_dioxide: [] as number[],
      ozone: [] as number[],
      carbon_monoxide: [] as number[],
      european_aqi: [] as number[],
      us_aqi: [] as number[],
    },
    current_units: {
      time: 'iso8601',
      pm2_5: 'μg/m³',
      pm10: 'μg/m³',
      nitrogen_dioxide: 'μg/m³',
      sulphur_dioxide: 'μg/m³',
      ozone: 'μg/m³',
      carbon_monoxide: 'μg/m³',
      european_aqi: 'EAQI',
      us_aqi: 'USAQI',
    },
    hourly: {
      time: [] as string[],
      pm2_5: [] as number[],
      pm10: [] as number[],
      nitrogen_dioxide: [] as number[],
      sulphur_dioxide: [] as number[],
      ozone: [] as number[],
      carbon_monoxide: [] as number[],
      european_aqi: [] as number[],
      us_aqi: [] as number[],
    },
    hourly_units: {
      time: 'iso8601',
      pm2_5: 'μg/m³',
      pm10: 'μg/m³',
      nitrogen_dioxide: 'μg/m³',
      sulphur_dioxide: 'μg/m³',
      ozone: 'μg/m³',
      carbon_monoxide: 'μg/m³',
      european_aqi: 'EAQI',
      us_aqi: 'USAQI',
    },
    daily: {
      time: [] as string[],
      pm2_5: [] as number[],
      pm10: [] as number[],
      nitrogen_dioxide: [] as number[],
      sulphur_dioxide: [] as number[],
      ozone: [] as number[],
      carbon_monoxide: [] as number[],
      european_aqi: [] as number[],
      us_aqi: [] as number[],
    },
    daily_units: {
      time: 'iso8601',
      pm2_5: 'μg/m³',
      pm10: 'μg/m³',
      nitrogen_dioxide: 'μg/m³',
      sulphur_dioxide: 'μg/m³',
      ozone: 'μg/m³',
      carbon_monoxide: 'μg/m³',
      european_aqi: 'EAQI',
      us_aqi: 'USAQI',
    },
  },
}

let weatherLineColor = 'var(--saki-default-color)'

const { Body, Horizon, Equator, SearchHourAngle, SearchRiseSet } = Astronomy
type Observer = Astronomy.Observer
const { Moon, Sun } = Body

// 定义结果结构
export interface CelestialTimes {
  date: string
  sunrise: string | null
  sunset: string | null
  moonrise: string | null
  moonset: string | null
  solarNoon: string | null
}

export const getSunTimes = (date: Date, celestialTimes: CelestialTimes[]) => {
  let sunrise = ''
  let sunset = ''
  let solarNoon = ''
  let dateUnix = moment(date).unix()
  celestialTimes.some((v, i) => {
    if (dateUnix < moment(v.sunrise).unix()) {
      if (
        dateUnix <
        moment(moment(v.sunrise).format('YYYY-MM-DD 00:00:00')).unix()
      ) {
        return true
      }
    }
    sunrise = v.sunrise || ''
    sunset = v.sunset || ''
    solarNoon = v.solarNoon || ''
  })

  return {
    sunrise,
    sunset,
    solarNoon,
  }
}
export const getMoonTimes = (date: Date, celestialTimes: CelestialTimes[]) => {
  let moonrise = ''
  let moonset = ''
  let dateUnix = moment(date).unix()
  celestialTimes.some((v, i) => {
    const nextV = celestialTimes[i + 1]

    moonrise = v.moonrise || ''
    moonset = v.moonset || ''
    // console.log(177, date, v, nextV)

    if (
      moment(moment(v.moonset).format('YYYY-MM-DD 00:00:00')).unix() !==
      moment(moment(nextV.moonrise).format('YYYY-MM-DD 00:00:00')).unix()
    ) {
      if (
        dateUnix <
        moment(moment(nextV.moonrise).format('YYYY-MM-DD 00:00:00')).unix()
      ) {
        return true
      }
    }

    if (dateUnix < moment(v.moonset).unix()) {
      return true
    }
  })

  return {
    moonrise,
    moonset,
  }
}

// 获取过去 15 天和未来 7 天的天文时间
export function getCelestialTimesRange(
  latitude: number,
  longitude: number,
  altitude: number = 0,
  pastDays: number = 15,
  futureDays: number = 7
): CelestialTimes[] {
  if (
    !isFinite(latitude) ||
    !isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    throw new Error('Invalid latitude or longitude')
  }
  if (pastDays < 0 || futureDays < 0) {
    throw new Error('Days cannot be negative')
  }

  futureDays += 3

  const results: CelestialTimes[] = []
  const observer = new Astronomy.Observer(latitude, longitude, altitude)
  const today = new Date(
    moment().subtract(3, 'days').format('YYYY-MM-DD 01:01:01')
    // moment('2025-05-29 1:00:00').format('YYYY-MM-DD 01:01:01')
  )

  // console.log('177', today)

  for (let i = -pastDays; i < futureDays; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    const times: CelestialTimes = {
      // date: moment(dateStr).format('MM-DD'),
      date: moment(dateStr).add(1, 'days').format('YYYY-MM-DD'),
      sunrise: null,
      sunset: null,
      moonrise: null,
      moonset: null,
      solarNoon: null,
    }

    const startOfDay = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
    )
    // 扩展搜索窗口到 25 小时
    const sunrise = SearchRiseSet(Body.Sun, observer, +1, startOfDay, -1) // 25 hours
    const sunset = SearchRiseSet(Body.Sun, observer, -1, startOfDay, 1.042)
    let moonrise = SearchRiseSet(Body.Moon, observer, +1, startOfDay, 1.042)
    const moonset = SearchRiseSet(Body.Moon, observer, -1, startOfDay, 1.042)

    if (moment(moonrise?.date).unix() > moment(moonset?.date).unix()) {
      const prevDate = new Date(startOfDay)
      prevDate.setDate(date.getDate() - 1)

      moonrise = SearchRiseSet(Body.Moon, observer, +1, prevDate, 1.042)
    }

    if (sunrise) times.sunrise = formatLocalTime(sunrise.date)
    if (sunset) times.sunset = formatLocalTime(sunset.date)
    if (moonrise) {
      times.moonrise = formatLocalTime(moonrise.date)
    } else {
      console.log(`No moonrise found for ${dateStr}`)
    }
    if (moonset) {
      times.moonset = formatLocalTime(moonset.date)
    } else {
      console.log(`No moonset found for ${dateStr}`)
    }

    const solarNoon = calculateSolarNoon(observer, startOfDay)
    if (solarNoon) times.solarNoon = formatLocalTime(solarNoon)

    results.push(times)
  }

  return results.slice(3)
}

// 格式化时间为本地时间
function formatLocalTime(date: Date): string {
  return moment(date).format('YYYY-MM-DD HH:mm:ss')
}

// 计算正午（太阳上中天）
function calculateSolarNoon(observer: Observer, startOfDay: Date): Date | null {
  const solarNoon = Astronomy.SearchHourAngle(
    Astronomy.Body.Sun, // 太阳
    observer, // 观测者
    0, // 时角 = 0（正午）
    startOfDay, // 起始搜索时间
    1 // 搜索天数（默认 1 天）
  )
  return solarNoon.time.date
}
// const init = () => {
//   // 示例调用：北京
//   try {
//     const celestialTimes = getCelestialTimesRange(
//       29.873281,
//       106.381818,
//       193,
//       15,
//       30,
//       new Date().getTimezoneOffset()
//     )
//     console.log('177', new Date().getTimezoneOffset(), celestialTimes)
//   } catch (error) {
//     console.error('Error:', error)
//   }
// }
// init()

export function getVisibilityAlert(visibilityKm: number) {
  let level, description, color

  if (visibilityKm > 10) {
    level = t('visibilityExcellent', { ns: 'weather' })
    description = t('visibilityExcellentClearView', { ns: 'weather' })
    color = '#00CC00' // 绿色，表示极佳能见度
  } else if (visibilityKm >= 4) {
    level = t('visibilityGood', { ns: 'weather' })
    description = t('visibilityGoodClearVision', { ns: 'weather' })
    color = '#66CC33' // 浅绿色，表示良好能见度
  } else if (visibilityKm >= 1) {
    level = t('visibilityModerate', { ns: 'weather' })
    description = t('visibilityModerateLimitedView', { ns: 'weather' })
    color = '#FFA500' // 橙色，表示中等能见度
  } else if (visibilityKm >= 0.5) {
    level = t('visibilityPoor', { ns: 'weather' })
    description = t('visibilityPoorReducedVision', { ns: 'weather' })
    color = '#FF4500' // 橙红色，表示较差能见度
  } else {
    level = t('visibilityVeryPoor', { ns: 'weather' })
    description = t('visibilityVeryPoorSeverelyLimited', { ns: 'weather' })
    color = '#FF0000' // 红色，表示极差能见度
  }

  return {
    level,
    description,
    visibility: visibilityKm,
    color, // 添加颜色属性
  }
}

export type PressureLevel = {
  level: string
  description: string
  color: string
  icon: string
}

export function getDetailedPressureLevel(
  pressure: number,
  altitude: number = 0
): PressureLevel {
  const adjustedStandardPressure = 1013.25 - (altitude / 100) * 12
  const difference = pressure - adjustedStandardPressure

  const levels = [
    {
      threshold: 35,
      level: t('pressureExtremeHigh', { ns: 'weather' }),
      description: t('pressureAbnormallyHigh', { ns: 'weather' }),
      color: '#D50000',
      icon: '☀️',
    },
    {
      threshold: 25,
      level: t('pressureVeryHigh', { ns: 'weather' }),
      description: t('pressureSignificantlyHigh', { ns: 'weather' }),
      color: '#FF5252',
      icon: '☀️',
    },
    {
      threshold: 15,
      level: t('pressureAboveAverage', { ns: 'weather' }),
      description: t('pressureHigherThanNormal', { ns: 'weather' }),
      color: '#FF9800',
      icon: '🌤',
    },
    {
      threshold: 5,
      level: t('pressureSlightlyHigh', { ns: 'weather' }),
      description: t('pressureSlightlyAboveNormal', { ns: 'weather' }),
      color: '#FFEB3B',
      icon: '⛅',
    },
    {
      threshold: -5,
      level: t('pressureNormal', { ns: 'weather' }),
      description: t('pressureWithinNormalRange', { ns: 'weather' }),
      color: '#4CAF50',
      icon: '🌥',
    },
    {
      threshold: -15,
      level: t('pressureSlightlyLow', { ns: 'weather' }),
      description: t('pressureSlightlyBelowNormal', { ns: 'weather' }),
      color: '#2196F3',
      icon: '🌧',
    },
    {
      threshold: -25,
      level: t('pressureBelowAverage', { ns: 'weather' }),
      description: t('pressureSignificantlyLow', { ns: 'weather' }),
      color: '#3F51B5',
      icon: '🌧',
    },
    {
      threshold: -35,
      level: t('pressureVeryLow', { ns: 'weather' }),
      description: t('pressureMarkedlyLow', { ns: 'weather' }),
      color: '#673AB7',
      icon: '⛈',
    },
    {
      threshold: -Infinity,
      level: t('pressureExtremeLow', { ns: 'weather' }),
      description: t('pressureAbnormallyLow', { ns: 'weather' }),
      color: '#9C27B0',
      icon: '🌀',
    },
  ]

  const matchedLevel =
    levels.find((level) => difference > level.threshold) ||
    levels[levels.length - 1]

  // 返回时确保只包含需要的属性
  return {
    level: matchedLevel.level,
    description: matchedLevel.description,
    color: matchedLevel.color,
    icon: matchedLevel.icon,
  }
}

export const getWindDirectionText = (wd: number, short: boolean) => {
  let windDirection = ''
  if (wd >= 337.5 || wd < 22.5) {
    windDirection = t((short ? 'shortW' : 'w') + 'indDirection1', {
      ns: 'weather',
    })
  }
  if (wd >= 22.5 && wd < 67.5) {
    windDirection = t((short ? 'shortW' : 'w') + 'indDirection2', {
      ns: 'weather',
    })
  }
  if (wd >= 67.5 && wd < 112.5) {
    windDirection = t((short ? 'shortW' : 'w') + 'indDirection3', {
      ns: 'weather',
    })
  }
  if (wd >= 112.5 && wd < 157.5) {
    windDirection = t((short ? 'shortW' : 'w') + 'indDirection4', {
      ns: 'weather',
    })
  }
  if (wd >= 157.5 && wd < 202.5) {
    windDirection = t((short ? 'shortW' : 'w') + 'indDirection5', {
      ns: 'weather',
    })
  }
  if (wd >= 202.5 && wd < 247.5) {
    windDirection = t((short ? 'shortW' : 'w') + 'indDirection6', {
      ns: 'weather',
    })
  }
  if (wd >= 247.5 && wd < 292.5) {
    windDirection = t((short ? 'shortW' : 'w') + 'indDirection7', {
      ns: 'weather',
    })
  }
  if (wd >= 292.5 && wd < 337.5) {
    windDirection = t((short ? 'shortW' : 'w') + 'indDirection8', {
      ns: 'weather',
    })
  }
  if (wd === -999) {
    windDirection = t((short ? 'shortW' : 'w') + 'indDirection9', {
      ns: 'weather',
    })
  }
  if (wd === -1) {
    windDirection = t((short ? 'shortW' : 'w') + 'indDirection10', {
      ns: 'weather',
    })
  }

  return windDirection
}

export const formatAirQuality = (
  weatherInfo: typeof defaultWeatherInfo,
  data: string,
  type: 'Hourly' | 'Daily'
): {
  time: string
  pm2_5: number
  pm10: number
  nitrogen_dioxide: number
  sulphur_dioxide: number
  ozone: number
  carbon_monoxide: number
  european_aqi: number
  us_aqi: number
} => {
  let time = ''
  let pm2_5 = 0
  let pm10 = 0
  let nitrogen_dioxide = 0
  let sulphur_dioxide = 0
  let ozone = 0
  let carbon_monoxide = 0
  let european_aqi = 0
  let us_aqi = 0

  if (type === 'Daily') {
    weatherInfo?.airQuality.daily.time.some((v, i) => {
      if (moment(v).format('YYYY-MM-DD') === data) {
        time = v
        pm2_5 = weatherInfo?.airQuality.daily.pm2_5[i]
        pm10 = weatherInfo?.airQuality.daily.pm10[i]
        nitrogen_dioxide = weatherInfo?.airQuality.daily.nitrogen_dioxide[i]
        sulphur_dioxide = weatherInfo?.airQuality.daily.sulphur_dioxide[i]
        ozone = weatherInfo?.airQuality.daily.ozone[i]
        carbon_monoxide = weatherInfo?.airQuality.daily.carbon_monoxide[i]
        european_aqi = weatherInfo?.airQuality.daily.european_aqi[i]
        us_aqi = weatherInfo?.airQuality.daily.us_aqi[i]
        return true
      }
    })
  }

  if (type === 'Hourly') {
    weatherInfo?.airQuality.hourly.time.some((v, i) => {
      if (moment(v).format('YYYY-MM-DD HH:mm') === data) {
        time = v
        pm2_5 = weatherInfo?.airQuality.hourly.pm2_5[i]
        pm10 = weatherInfo?.airQuality.hourly.pm10[i]
        nitrogen_dioxide = weatherInfo?.airQuality.hourly.nitrogen_dioxide[i]
        sulphur_dioxide = weatherInfo?.airQuality.hourly.sulphur_dioxide[i]
        ozone = weatherInfo?.airQuality.hourly.ozone[i]
        carbon_monoxide = weatherInfo?.airQuality.hourly.carbon_monoxide[i]
        european_aqi = weatherInfo?.airQuality.hourly.european_aqi[i]
        us_aqi = weatherInfo?.airQuality.hourly.us_aqi[i]
        return true
      }
    })
  }

  return {
    time,
    pm2_5,
    pm10,
    nitrogen_dioxide,
    sulphur_dioxide,
    ozone,
    carbon_monoxide,
    european_aqi,
    us_aqi,
  }
}
export function getUVInfo(uv: number): {
  level: string
  text: string
  color: string
} {
  if (uv >= 0 && uv <= 2) {
    return {
      level: t('uvIndexLow', {
        ns: 'weather',
      }),
      text: t('uvIndexNoSpecialProtection', {
        ns: 'weather',
      }),
      color: '#4CAF50',
    } // 绿色，低风险
  } else if (uv <= 5) {
    return {
      level: t('uvIndexMedium', {
        ns: 'weather',
      }),
      text: t('uvIndexSuggestHatOrSunscreen', {
        ns: 'weather',
      }),
      color: '#FFC107',
    } // 黄色，中等
  } else if (uv <= 7) {
    return {
      level: t('uvIndexHigh', {
        ns: 'weather',
      }),
      text: t('uvIndexTakeProtectiveMeasures', {
        ns: 'weather',
      }),
      color: '#FF5722',
    } // 橙色，高
  } else if (uv <= 10) {
    return {
      level: t('uvIndexVeryHigh', {
        ns: 'weather',
      }),
      text: t('uvIndexAvoidOutdoorActivities', {
        ns: 'weather',
      }),
      color: '#D81B60',
    } // 红色，很高
  } else {
    return {
      level: t('uvIndexExtreme', {
        ns: 'weather',
      }),
      text: t('uvIndexStronglyAvoidDirectSunlight', {
        ns: 'weather',
      }),
      color: '#B71C1C',
    } // 深红色，极高
  }
}

// 欧洲 AQI 描述
export function getAqiDescription(aqi: number) {
  if (aqi <= 25)
    return {
      aqi,
      aqiDesc: t('excellent', {
        ns: 'weather',
      }),
      className: 'aqi1',
      color: '#2bad2f',
      desc: t('excellentDesc', {
        ns: 'weather',
      }),
    }
  if (aqi <= 50)
    return {
      aqi,
      aqiDesc: t('good', {
        ns: 'weather',
      }),
      className: 'aqi1',
      color: '#37d43c',
      desc: t('goodDesc', {
        ns: 'weather',
      }),
    }
  if (aqi <= 100)
    return {
      aqi,
      aqiDesc: t('fair', {
        ns: 'weather',
      }),
      className: 'aqi1',
      color: '#ffb000',
      desc: t('fairDesc', {
        ns: 'weather',
      }),
    }
  if (aqi <= 150)
    return {
      aqi,
      aqiDesc: t('mild', {
        ns: 'weather',
      }),
      className: 'aqi1',
      color: '#ff4d00',
      desc: t('mildDesc', {
        ns: 'weather',
      }),
    }
  if (aqi <= 200)
    return {
      aqi,
      aqiDesc: t('moderate', {
        ns: 'weather',
      }),
      className: 'aqi1',
      color: '#f0000c',
      desc: t('moderateDesc', {
        ns: 'weather',
      }),
    }
  if (aqi <= 300)
    return {
      aqi,
      aqiDesc: t('severe', {
        ns: 'weather',
      }),
      className: 'aqi1',
      color: '#9f0047',
      desc: t('severeDesc', {
        ns: 'weather',
      }),
    }
  return {
    aqi,
    aqiDesc: t('verySevere', {
      ns: 'weather',
    }),
    className: 'aqi1',
    color: '#84002c',
    desc: t('verySevereDesc', {
      ns: 'weather',
    }),
  }
}

interface SunMoonEvent {
  type: string
  time: string
  date?: Date
  text: string
  radius: number
  startX: number
  startY: number
  x?: number
  y?: number
}

export const createSunMoonChart = ({
  selector,
  nowDate,
  solarNoon,
  events,
  isSunMonAnima = true,
}: {
  selector: string
  nowDate: Date
  solarNoon: Date
  events: SunMoonEvent[]
  isSunMonAnima?: boolean
}) => {
  const svg = d3.select(selector)

  if (!svg) return

  // console.log('SearchRiseSet ', 5555, events)
  svg.selectAll('*').remove()

  const width = +svg.attr('width')
  const height = +svg.attr('height')
  const centerY = height / 2 + 55 // 统一 y 坐标
  const radius = 140 // 日出日落弧线半径
  const moonRadius = radius * 0.68 // 月出月落弧线半径

  events.forEach((v) => {
    if (v.type === 'sunrise' || v.type === 'sunset') {
      v.radius = radius
    } else {
      v.radius = moonRadius
    }
  })

  // 定义 xScale (仅用于弧线中心计算)
  const totalWidth = width - 100 // 留边距，50 到 350
  const xScale = d3
    .scaleTime()
    .domain([new Date(2025, 4, 28, 0, 0), new Date(2025, 4, 28, 24, 0)])
    .range([50, 50 + totalWidth]) // x 坐标范围：50 到 350

  // 事件数据

  // 计算事件点的 x 坐标（仅用于弧线中心）
  events.forEach((event) => {
    event.x = xScale(timeToDate(event.time))
  })

  function timeToDate(time: string) {
    const [hours, minutes] = time.split(':').map(Number)
    return new Date(2025, 4, 28, hours, minutes)
  }

  const textFontSize = '12px'

  // 为每对事件创建弧线
  events.forEach((event, i) => {
    if (i % 2 === 0) {
      // 每对的第一个事件
      const startEvent = event
      const endEvent = events[i + 1]
      const centerX = ((startEvent.x || 0) + (endEvent.x || 0)) / 2 // 动态中心 x 坐标

      // 创建弧线
      const arc = d3
        .arc<any>()
        .innerRadius(event.radius)
        .outerRadius(event.radius + 0)
        .startAngle(-Math.PI / 2) // 左端
        .endAngle(Math.PI / 2) // 右端

      // 添加弧线
      svg
        .append('path')
        .attr('transform', `translate(${centerX}, ${centerY})`)
        .attr('d', arc)
        .attr('fill', 'none')
        .attr('stroke', event.radius === radius ? '#e9da07' : '#a2d8fa')
        .attr('stroke-width', event.radius === radius ? 2 : 2)
        .attr('stroke-dasharray', '5,4')

      // 计算端点位置（目标 x 值）
      const targetStartX = centerX + event.radius * Math.cos(-Math.PI / 2) // 左端
      const targetEndX = centerX + event.radius * Math.cos(Math.PI / 2) // 右端

      // 添加起始标签
      const startText = svg
        .append('text')
        .attr('class', 'time-label')
        .attr('x', targetStartX)
        .attr('y', event.startY + centerY + 20) // 标签位于弧线下方
        .attr('text-anchor', 'middle')
        .attr('font-size', textFontSize)
        .attr('dy', '0.35em')
      // .text(startEvent.text)

      // 获取文本宽度并调整 x 坐标
      const startBBox = startText.node()?.getBBox()
      const startWidth = startBBox?.width || 0

      const sx = startEvent.startX - startWidth / 20
      startText.html((d) => {
        // const textArr = startEvent.text.split('/')
        return `
              <tspan x="${sx}" dy="0">${
          startEvent.text
          // moment(startEvent?.date).format('MM-DD')
        }</tspan>
              <tspan x="${sx}" dy="1.4em">${moment(startEvent?.date).format(
          'HH:mm'
        )}</tspan>
            `
      })

      // 添加结束标签
      const endText = svg
        .append('text')
        .attr('class', 'time-label')
        .attr('x', targetEndX)
        .attr('y', event.startY + centerY + 20) // 标签位于弧线下方
        .attr('text-anchor', 'middle')
        .attr('font-size', textFontSize)
        .attr('dy', '0.35em')
      // .text(endEvent.text)

      // 获取文本宽度并调整 x 坐标
      const endBBox = endText.node()?.getBBox()
      const endWidth = endBBox?.width || 0

      const ex = endEvent.startX - endWidth / 20
      endText.html((d) => {
        // const textArr = endEvent.text.split('/')
        return `
              <tspan x="${ex}" dy="0">${
          endEvent.text
          // moment(endEvent?.date).format('MM-DD')
        }</tspan>
              <tspan x="${ex}" dy="1.4em">${moment(endEvent?.date).format(
          'HH:mm'
        )}</tspan>
            `
      })
      const nowTime = moment(nowDate).unix()
      const startTime = moment(startEvent?.date).unix()
      const endTime = moment(endEvent?.date).unix()

      // console.log(
      //   'SearchRiseSet 1111',
      //   moment().format('YYYY-MM-DD HH:mm:ss'),
      //   moment(startEvent?.date).format('YYYY-MM-DD HH:mm:ss'),
      //   startEvent,
      //   events
      // )
      // console.log('SearchRiseSet 2222', startEvent?.date)
      // console.log(
      //   'SearchRiseSet ',
      //   moment().format('YYYY-MM-DD HH:mm:ss'),
      //   moment(startEvent?.date).format('YYYY-MM-DD HH:mm:ss'),
      //   moment(endEvent?.date).format('YYYY-MM-DD HH:mm:ss')
      //   // nowTime,
      //   // startTime,
      //   // endTime,
      //   // nowTime - startTime,
      //   // endTime - startTime,
      //   // (nowTime - startTime) / (endTime - startTime)
      // )

      // 添加太阳或月亮图标
      // let manualRatio = event.radius === radius ? 0.7 : 0.8 // 太阳和月亮的比例，分别设置
      let manualRatio =
        nowTime > endTime
          ? 1
          : nowTime < startTime
          ? 0
          : (nowTime - startTime) / (endTime - startTime)
      let clampedRatio = Math.max(0, Math.min(1, manualRatio)) // 限制在 0 到 1 之间

      // 使用角度插值器
      const angleInterpolator = d3.interpolate(-Math.PI / 1, Math.PI * 0) // 从 -90° 到 0° (0 到 0.5)
      let currentAngle = angleInterpolator(clampedRatio)

      // 计算初始图标位置
      let iconX = centerX + event.radius * Math.cos(currentAngle)
      let iconY = centerY + event.radius * Math.sin(currentAngle)

      if (event.radius === radius) {
        // 太阳图标
        const sunIcon = svg
          .append('text')
          .attr('class', 'sun-icon')
          .attr('x', iconX)
          .attr('y', iconY)
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('font-size', '18px')
          .text('☀️')
          .transition()
          .duration(isSunMonAnima ? 2000 : 0) // 动画时长 2 秒
          .tween('arc', () => {
            const interpolate = d3.interpolate(0, clampedRatio)
            return function (t: any) {
              const ratio = interpolate(t)
              const angle = angleInterpolator(ratio)
              const x = centerX + event.radius * Math.cos(angle)
              const y = centerY + event.radius * Math.sin(angle)
              d3.select(this).attr('x', x).attr('y', y)
            }
          })

        // svg
        //   .append('text')
        //   .attr('class', 'sun-icon')
        //   .attr('x', iconX)
        //   .attr('y', iconY)
        //   .attr('text-anchor', 'middle')
        //   .attr('dy', '0.35em')
        //   .attr('font-size', '18px')
        //   .text(formatTime((endTime - startTime) * 1000, ['h', 'm', 's']))

        // 定义弧线路径生成器
        const arcPath = d3
          .arc<any>()
          .innerRadius(0)
          .outerRadius(event.radius)
          .startAngle(-Math.PI / 2) // 起始角度
          .endAngle(0) // 结束角度 (0.5 对应 0°)

        // 添加红色扇形
        const fanShape = svg
          .append('path')
          .attr('class', 'sun-fan-shape')
          .attr('fill', '#e6e188')
          .attr('opacity', '0.7')
          .attr('transform', `translate(${centerX}, ${centerY})`)
          .attr('d', arcPath(0)) // 初始角度为 0
          .transition()
          .duration(isSunMonAnima ? 2000 : 0) // 同步动画时长
          .attrTween('d', () => {
            let clampedRatio = Math.max(
              0,
              Math.min(1, manualRatio === 1 ? 0 : manualRatio)
            ) // 限制在 0 到 1 之间

            const interpolate = d3.interpolate(0, clampedRatio)

            return function (t: any) {
              const ratio = interpolate(t)
              // console.log(
              //   'clampedRatio',
              //   clampedRatio,
              //   -Math.PI / 2,
              //   Math.PI * ratio
              // )

              const startAngle = -Math.PI / 2
              const arcTween = d3
                .arc()
                .innerRadius(0)
                .outerRadius(event.radius)
                .startAngle(startAngle)
                .endAngle(startAngle + Math.PI * ratio) // 0 到 0.5 对应 0 到 90°
              return (arcTween as any)()
            }
          })
      } else {
        // 月亮图标
        const moonIcon = svg
          .append('text')
          .attr('class', 'moon-icon')
          .attr('x', iconX)
          .attr('y', iconY)
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('font-size', '18px')
          .text('🌙')
          .transition()
          .duration(isSunMonAnima ? 2000 : 0) // 动画时长 2 秒
          .tween('arc', () => {
            const interpolate = d3.interpolate(0, clampedRatio)
            return function (t: any) {
              const ratio = interpolate(t)
              const angle = angleInterpolator(ratio)
              const x = centerX + event.radius * Math.cos(angle)
              const y = centerY + event.radius * Math.sin(angle)
              d3.select(this).attr('x', x).attr('y', y)
            }
          })

        // 定义弧线路径生成器
        const arcPath = d3
          .arc<any>()
          .innerRadius(0)
          .outerRadius(event.radius)
          .startAngle(-Math.PI / 2) // 起始角度
          .endAngle(0) // 结束角度 (0.5 对应 0°)

        // 添加红色扇形
        const fanShape = svg
          .append('path')
          .attr('class', 'moon-fan-shape')
          .attr('fill', '#c5dfee')
          .attr('opacity', '0.5')
          .attr('transform', `translate(${centerX}, ${centerY})`)
          .attr('d', arcPath(0)) // 初始角度为 0
          .transition()
          .duration(isSunMonAnima ? 2000 : 0) // 同步动画时长
          .attrTween('d', () => {
            let clampedRatio = Math.max(
              0,
              Math.min(1, manualRatio === 1 ? 0 : manualRatio)
            ) // 限制在 0 到 1 之间

            const interpolate = d3.interpolate(0, clampedRatio)

            return function (t: any) {
              const ratio = interpolate(t)

              const startAngle = -Math.PI / 2
              const arcTween = d3
                .arc()
                .innerRadius(0)
                .outerRadius(event.radius)
                .startAngle(startAngle)
                .endAngle(startAngle + Math.PI * ratio) // 0 到 0.5 对应 0 到 90°
              return (arcTween as any)()
            }
          })
      }
    }
  })

  // 添加结束标签
  const noonText = svg
    .append('text')
    .attr('class', 'time-label')
    .attr('x', width / 2)
    .attr('y', centerY + 20) // 标签位于弧线下方
    .attr('text-anchor', 'middle')
    .attr('font-size', textFontSize)
    .attr('dy', '0.35em')
    .html((d) => {
      return `
              <tspan x="${width / 2}" dy="0">${t('noon', {
        ns: 'weather',
      })}</tspan>
              <tspan x="${width / 2}" dy="1.4em">${moment(solarNoon).format(
        'HH:mm:ss'
      )}</tspan>
            `
    })

  // isSunMonAnima = false
}

export function formatWeatherDate(date: string) {
  const today = moment().startOf('day')
  const inputDate = moment(date).startOf('day')
  const diffDays = inputDate.diff(today, 'days')

  let week = ''
  // 判断日期
  switch (diffDays) {
    case -1:
      week = t('yesterday', {
        ns: 'weather',
      })
      break
    case 0:
      week = t('today', {
        ns: 'weather',
      })
      break
    case 1:
      week = t('tomorrow', {
        ns: 'weather',
      })
      break
    default:
      // 其他日期返回星期几
      week = inputDate.format('ddd') // 返回"周一"到"周日"
      break
  }

  return {
    week,
    date: inputDate.format('MM/DD'),
  }
}

export function getWindForceLevel(windSpeed: number, unit: string): number {
  const thresholds = [
    0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7,
  ]
  for (let i = 0; i < thresholds.length; i++) {
    if (
      windSpeed <
      thresholds[i] * (unit === 'm/s' ? 1 : unit === 'km/h' ? 3.6 : 1)
    )
      return i
  }
  return 12 // 风速 >= 32.7 m/s 为 12 级
}

export interface WeatherData {
  week: string
  shortDate: string
  date: string
  hour: string
  high: number
  low: number
  weatherCode: number
  maxTempWeatherCode: number
  minTempWeatherCode: number
  precipitationProbabilityMax?: number
  precipitationProbabilityMin?: number
  wind_direction_10m?: number
  wind_speed_10m?: number
}

export interface WeatherAQIData {
  aqi: number
  date: string
}

export interface WeatherValData {
  val: number
  unit: string
  date: string
}

interface ChartOptions {
  container: string | HTMLElement
  weatherInfo: typeof defaultWeatherInfo
  type:
    | 'Hourly'
    | 'Daily'
    | 'AQI24Hours'
    | 'AQI8Days'
    | 'SurfacePressure24Hours'
    | 'Wind24H'
    | 'Wind15D'
    | 'Humidity'
    | 'UV'
  width: number
  height: number
  margin: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

interface WeatherWindData {
  wind_direction_10m: number
  wind_speed_10m: number
  wind_gusts_10m: number
  unit: string
  date: string
}

interface WeatherPrecipitationData {
  precipitation: number
  precipitation_probability: number
  date: string
}

interface WeatherChartOptions extends ChartOptions {
  data?: WeatherData[]
  aqiData?: WeatherAQIData[]
  valData?: WeatherValData[]
  windData?: WeatherWindData[]
  precipitationData?: WeatherPrecipitationData[]
}

export function createAQIChart(options: WeatherChartOptions) {
  // 默认配置
  const defaultOptions = {
    width: 800,
    height: 180,
  }

  let weatherInfo = options.weatherInfo

  // 合并配置
  const config = { ...defaultOptions, ...options }

  // 设置图表尺寸和边距
  const margin = config.margin
  const width = config.width - margin.left - margin.right
  const height = config.height - margin.top - margin.bottom

  const aqiData = config?.aqiData || []

  console.log('aqiData', aqiData)

  // 选择或创建容器
  const container =
    typeof config.container === 'string'
      ? (d3.select(config.container).node() as HTMLElement)
      : config.container

  if (!container || !aqiData.length) return

  container.style.width = config.width + 'px'
  container.style.height = config.height + 'px'

  // 清空容器
  container.innerHTML = ''

  // 创建SVG元素
  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  // 创建比例尺
  const xScale = d3
    .scaleBand()
    .domain(aqiData.map((d) => d.date + '\n' + d.date))
    .range([0, width])
    .padding(0.1)

  let arr = []
  let min = d3.min(aqiData, (d) => d.aqi) || 0
  let max = d3.max(aqiData, (d) => d.aqi) || 0
  const tempRange = max - min
  const buffer = tempRange * 0.1
  arr = [min - tempRange, max + buffer]
  const yScale = d3.scaleLinear().domain(arr).range([height, 0])

  // 定义AQI颜色范围（根据常见的AQI颜色标准）
  const aqiColorScale = d3
    .scaleLinear<string>()
    .domain([0, 25, 50, 100, 150, 200, 300]) // AQI关键阈值
    .range([
      '#2bad2f', // 优: 绿色
      '#37d43c', // 良: 黄色
      '#ffb000', // 轻度污染: 橙色
      '#ff4d00', // 中度污染: 红色
      '#f0000c', // 重度污染: 紫色
      '#9f0047', // 严重污染: 褐红色
      '#84002c', // 严重污染上限
    ])

  // 创建渐变定义
  const defs = svg.append('defs')
  const linearGradient = defs
    .append('linearGradient')
    .attr('id', 'aqi-line-gradient')
    .attr('gradientUnits', 'userSpaceOnUse')
    .attr('x1', 0)
    .attr('y1', height)
    .attr('x2', width)
    .attr('y2', height)

  // 根据AQI数据动态添加渐变停止点
  aqiData.forEach((d, i) => {
    const offset = (i / (aqiData.length - 1)) * 100
    linearGradient
      .append('stop')
      .attr('offset', `${offset}%`)
      .attr('stop-color', aqiColorScale(d.aqi))
  })

  // 创建折线生成器
  const lineHigh = d3
    .line<WeatherAQIData>()
    .x((d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
    .y((d) => yScale(d.aqi))
    .curve(d3.curveCatmullRom.alpha(0.5))

  // 绘制高温折线 - 第一段虚线，使用渐变色
  svg
    .append('path')
    .datum([aqiData[0], aqiData[1]])
    .attr('class', 'line-high')
    .attr('d', lineHigh)
    .attr('fill', 'none')
    .attr('stroke', 'url(#aqi-line-gradient)') // 应用渐变
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '3,3')

  // 绘制高温折线 - 其余部分实线，使用渐变色
  svg
    .append('path')
    .datum(aqiData.slice(1))
    .attr('class', 'line-high')
    .attr('d', lineHigh)
    .attr('fill', 'none')
    .attr('stroke', 'url(#aqi-line-gradient)') // 应用渐变
    .attr('stroke-width', 2)

  // 添加高温数据点
  svg
    .selectAll('.dot-high')
    .data(aqiData)
    .enter()
    .append('circle')
    .attr('class', 'dot-high')
    .attr('cx', (d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
    .attr('cy', (d) => yScale(d.aqi))
    .attr('r', 3)
    .attr('stroke', '#ccc')
    .attr('fill', (d) => aqiColorScale(d.aqi)) // 数据点也用AQI颜色

  // // 在高温点上方添加温度文字
  // svg
  //   .selectAll('.high-text')
  //   .data(aqiData)
  //   .enter()
  //   .append('text')
  //   .attr('class', 'high-text')
  //   .attr('x', (d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
  //   .attr('y', (d) => yScale(d.aqi) - 10)
  //   .attr('text-anchor', 'middle')
  //   // .attr('fill', (d) => aqiColorScale(d.aqi)) // 文字也用AQI颜色
  //   .html((d) => {
  //     const x = xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2

  //     const aqiDesc = getAqiDescription(d.aqi)
  //     return `
  //       <tspan x="${x}" >${`${aqiDesc.aqi} ${aqiDesc.aqiDesc}`}</tspan>
  //       `
  //   })
  svg
    .selectAll('.day-top-label')
    .data(aqiData)
    .enter()
    .append('text')
    .attr('class', 'day-top-label')
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .attr('fill', '#666')
    .html((d) => {
      const x = xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2

      const aqiDesc = getAqiDescription(d.aqi)
      return `
        <tspan x="${x}" dy="7.7em">${d.date}</tspan>
        `
    })
  svg
    .selectAll('.day-top-label-group')
    .data(aqiData)
    .enter()
    .append('g') // 创建一个 <g> 组来包含背景和文本
    .attr('class', 'day-top-label-group')
    .each(function (d) {
      const group = d3.select(this)
      const x = xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2
      const aqiDesc = getAqiDescription(d.aqi)
      const textContent = `${aqiDesc.aqi} ${aqiDesc.aqiDesc}`

      // 模拟 padding 的值（单位：像素）
      const paddingX = 4 // 水平 padding
      const paddingY = 2 // 垂直 padding

      // 添加背景矩形
      const rect = group
        .append('rect')
        .attr('class', 'label-bg')
        .attr('x', x - 20) // 初始 x，稍后调整
        .attr('y', (d) => yScale(aqiDesc.aqi) - 25)
        .attr('width', 40)
        .attr('height', 20)
        .attr('rx', 10)
        .attr('ry', 10)
        // .attr('fill', aqiColorScale(d.aqi)) // 背景色根据 AQI 值
        .attr('fill', aqiDesc.color) // 背景色根据 AQI 值
        .attr('opacity', 0.8) // 背景稍透明，可调整
        .each(function () {
          const rect = d3.select(this)
          const text = group.select('text') // 稍后添加的 text 元素
          const bbox = (text.node() as SVGTextElement)?.getBBox()
          if (bbox) {
            // 动态调整矩形大小，包含 padding
            rect
              .attr('x', x - bbox.width / 2 - paddingX)
              .attr('width', bbox.width + 2 * paddingX)
              .attr('height', bbox.height + 2 * paddingY)
          }
        })

      // 添加文本
      const text = group
        .append('text')
        .attr('class', 'aqi-label')
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#FFFFFF') // 文字颜色：白色，可根据需要调整
        .append('tspan')
        .attr('x', x)
        .attr('y', (d) => yScale(aqiDesc.aqi) - 12)
        .text(textContent)

      // 动态调整矩形大小
      const bbox = (text.node() as SVGTextElement | null)?.getBBox()
      if (bbox) {
        // 矩形宽度根据文字宽度动态调整，加上两侧 padding
        const w = bbox.width + 2 * paddingX
        const h = bbox.height + 2 * paddingY
        rect
          .attr('x', x - bbox.width / 2 - paddingX) // 居中并留出左侧 padding
          .attr('width', w) // 宽度 = 文字宽度 + 两侧 padding
          .attr('height', h) // 高度 = 文字高度 + 两侧 padding
          .attr('rx', h / 2)
          .attr('ry', h / 2)
          .attr('y', bbox.y - paddingY)
        // .attr('y', (d) => yScale(aqiDesc.aqi) - 25 - paddingY)
      }
    })

  return {
    updateData: (newData: WeatherData[]) => {
      // 更新数据的逻辑
    },
    destroy: () => {
      container.innerHTML = ''
    },
  }
}

export function createValDataChart(options: WeatherChartOptions) {
  // 默认配置
  const defaultOptions = {
    width: 800,
    height: 180,
  }

  let weatherInfo = options.weatherInfo

  // 合并配置
  const config = { ...defaultOptions, ...options }

  // 设置图表尺寸和边距
  const margin = config.margin
  const width = config.width - margin.left - margin.right
  const height = config.height - margin.top - margin.bottom

  const valData = config?.valData || []

  console.log('valData', valData)

  // 选择或创建容器
  const container =
    typeof config.container === 'string'
      ? (d3.select(config.container).node() as HTMLElement)
      : config.container

  if (!container || !valData.length) return

  container.style.width = config.width + 'px'
  container.style.height = config.height + 'px'

  // 清空容器
  container.innerHTML = ''

  // 创建SVG元素
  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  // 创建比例尺
  const xScale = d3
    .scaleBand()
    .domain(valData.map((d) => d.date + '\n' + d.date))
    .range([0, width])
    .padding(0.1)

  let arr = []
  let min = d3.min(valData, (d) => d.val) || 0
  let max = d3.max(valData, (d) => d.val) || 0
  const tempRange = max - min
  const buffer = tempRange * 0.1
  arr = [min - tempRange, max + buffer]
  const yScale = d3.scaleLinear().domain(arr).range([height, 0])

  // 定义AQI颜色范围（根据常见的AQI颜色标准）
  const aqiColorScale = d3
    .scaleLinear<string>()
    .domain([970, 985, 995, 1005, 1013.25, 1020, 1030, 1040.5, 1050]) // AQI关键阈值
    .range([
      '#673AB7',
      '#3F51B5',
      '#2196F3',
      '#4CAF50',
      '#FFEB3B',
      '#FF9800',
      '#FF5252',
      '#D50000',
    ])

  // 创建渐变定义
  const defs = svg.append('defs')
  const linearGradient = defs
    .append('linearGradient')
    .attr('id', 'aqi-line-gradient')
    .attr('gradientUnits', 'userSpaceOnUse')
    .attr('x1', 0)
    .attr('y1', height)
    .attr('x2', width)
    .attr('y2', height)

  // 根据AQI数据动态添加渐变停止点
  valData.forEach((d, i) => {
    const offset = (i / (valData.length - 1)) * 100
    linearGradient
      .append('stop')
      .attr('offset', `${offset}%`)
      .attr('stop-color', aqiColorScale(d.val))
  })

  // 创建折线生成器
  const lineHigh = d3
    .line<WeatherValData>()
    .x((d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
    .y((d) => yScale(d.val))
    .curve(d3.curveCatmullRom.alpha(0.5))

  // 绘制高温折线 - 第一段虚线，使用渐变色
  svg
    .append('path')
    .datum([valData[0], valData[1]])
    .attr('class', 'line-high')
    .attr('d', lineHigh)
    .attr('fill', 'none')
    .attr('stroke', 'url(#aqi-line-gradient)') // 应用渐变
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '3,3')

  // 绘制高温折线 - 其余部分实线，使用渐变色
  svg
    .append('path')
    .datum(valData.slice(1))
    .attr('class', 'line-high')
    .attr('d', lineHigh)
    .attr('fill', 'none')
    .attr('stroke', 'url(#aqi-line-gradient)') // 应用渐变
    .attr('stroke-width', 2)

  // 添加高温数据点
  svg
    .selectAll('.dot-high')
    .data(valData)
    .enter()
    .append('circle')
    .attr('class', 'dot-high')
    .attr('cx', (d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
    .attr('cy', (d) => yScale(d.val))
    .attr('r', 3)
    .attr('stroke', '#ccc')
    .attr('fill', (d) => aqiColorScale(d.val)) // 数据点也用AQI颜色

  svg
    .selectAll('.day-top-label')
    .data(valData)
    .enter()
    .append('text')
    .attr('class', 'day-top-label')
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .attr('fill', '#666')
    .html((d) => {
      const x = xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2

      const aqiDesc = getAqiDescription(d.val)
      return `
        <tspan x="${x}" dy="7.7em">${d.date}</tspan>
        `
    })
  svg
    .selectAll('.day-top-label-group')
    .data(valData)
    .enter()
    .append('g') // 创建一个 <g> 组来包含背景和文本
    .attr('class', 'day-top-label-group')
    .each(function (d) {
      const group = d3.select(this)
      const x = xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2
      const press = getDetailedPressureLevel(
        d.val,
        weatherInfo.current.altitude
      )
      // 模拟 padding 的值（单位：像素）
      const paddingX = 4 // 水平 padding
      const paddingY = 2 // 垂直 padding

      // 添加背景矩形
      // const rect = group
      //   .append('rect')
      //   .attr('class', 'label-bg')
      //   .attr('x', x - 20) // 初始 x，稍后调整
      //   .attr('y', () => yScale(d.val) - 25)
      //   .attr('width', 40)
      //   .attr('height', 20)
      //   .attr('rx', 10)
      //   .attr('ry', 10)
      //   // .attr('fill', aqiColorScale(d.aqi)) // 背景色根据 AQI 值
      //   .attr('fill', press.color) // 背景色根据 AQI 值
      //   .attr('opacity', 0.8) // 背景稍透明，可调整
      //   .each(function () {
      //     const rect = d3.select(this)
      //     const text = group.select('text') // 稍后添加的 text 元素
      //     const bbox = (text.node() as SVGTextElement)?.getBBox()
      //     if (bbox) {
      //       // 动态调整矩形大小，包含 padding
      //       rect
      //         .attr('x', x - bbox.width / 2 - paddingX)
      //         .attr('width', bbox.width + 2 * paddingX)
      //         .attr('height', bbox.height + 2 * paddingY)
      //     }
      //   })

      // 添加文本
      const text = group
        .append('text')
        .attr('class', 'aqi-label')
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#000') // 文字颜色：白色，可根据需要调整
        .append('tspan')
        .attr('x', x)
        .attr('y', () => yScale(d.val) - 12)
        .html(() => {
          const x = xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2

          return `
        <tspan x="${x}" y="${yScale(d.val) - 18}">${`${d.val}`}</tspan>
        <tspan x="${x}" y="${yScale(d.val) - 4}">${`${press.level}`}</tspan>
        `
        })

      // // 动态调整矩形大小
      // const bbox = (text.node() as SVGTextElement | null)?.getBBox()
      // if (bbox) {
      //   // 矩形宽度根据文字宽度动态调整，加上两侧 padding
      //   const w = bbox.width + 2 * paddingX
      //   const h = bbox.height + 2 * paddingY
      //   rect
      //     .attr('x', x - bbox.width / 2 - paddingX) // 居中并留出左侧 padding
      //     .attr('width', w) // 宽度 = 文字宽度 + 两侧 padding
      //     .attr('height', h) // 高度 = 文字高度 + 两侧 padding
      //     .attr('rx', h / 2)
      //     .attr('ry', h / 2)
      //     .attr('y', (d) => yScale(d.val) - 26 - paddingY)
      // }
    })

  return {
    updateData: (newData: WeatherData[]) => {
      // 更新数据的逻辑
    },
    destroy: () => {
      container.innerHTML = ''
    },
  }
}

export function createWindChart(options: WeatherChartOptions) {
  // 默认配置
  const defaultOptions = {
    width: 800,
    height: 180,
  }

  let weatherInfo = options.weatherInfo

  // 合并配置
  const chartConfig = { ...defaultOptions, ...options }

  // 设置图表尺寸和边距
  const margin = chartConfig.margin
  const width = chartConfig.width - margin.left - margin.right
  const height = chartConfig.height - margin.top - margin.bottom

  const windData = chartConfig?.windData || []

  // 选择或创建容器
  const container =
    typeof chartConfig.container === 'string'
      ? (d3.select(chartConfig.container).node() as HTMLElement)
      : chartConfig.container

  // console.log('container', windData, container)

  if (!container || !windData.length) return

  container.style.width = chartConfig.width + 'px'
  container.style.height = chartConfig.height + 'px'

  // 清空容器
  container.innerHTML = ''

  // 创建SVG元素
  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  // 创建比例尺
  const xScale = d3
    .scaleBand()
    .domain(windData.map((d) => d.date + '\n' + d.date))
    .range([0, width])
    .padding(0.1)

  let arr = []
  let min = d3.min(windData, (d) => d.wind_speed_10m) || 0
  let max = d3.max(windData, (d) => d.wind_gusts_10m) || 0
  const tempRange = max - min
  const buffer = tempRange * 0.1
  arr = [min - tempRange, max + buffer]
  const yScale = d3.scaleLinear().domain(arr).range([height, 0])

  // 创建折线生成器
  const lineHigh = d3
    .line<WeatherWindData>()
    .x((d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
    .y((d) => yScale(d.wind_gusts_10m))
    .curve(d3.curveCatmullRom.alpha(0.5))

  // 绘制高温折线 - 第一段虚线，使用渐变色
  svg
    .append('path')
    .datum([windData[0], windData[1]])
    .attr('class', 'line-high')
    .attr('d', lineHigh)
    .attr('fill', 'none')
    .attr('stroke', '#f29cb2')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '3,3')

  // 绘制高温折线 - 其余部分实线，使用渐变色
  svg
    .append('path')
    .datum(windData.slice(1))
    .attr('class', 'line-high')
    .attr('d', lineHigh)
    .attr('fill', 'none')
    .attr('stroke', '#f29cb2')
    .attr('stroke-width', 2)

  // 添加高温数据点
  svg
    .selectAll('.dot-high')
    .data(windData)
    .enter()
    .append('circle')
    .attr('class', 'dot-high')
    .attr('cx', (d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
    .attr('cy', (d) => yScale(d.wind_gusts_10m))
    .attr('r', 3)
    .attr('stroke', '#f29cb2')
    .attr('fill', '#fff') // 数据点也用AQI颜色

  svg
    .selectAll('.high-text')
    .data(windData)
    .enter()
    .append('text')
    .attr('class', 'high-text')
    .attr('x', (d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
    .attr('y', (d) => yScale(d.wind_gusts_10m) - 10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('fill', '#666')
    .text((d) => `${d.wind_gusts_10m + ' ' + d.unit}`)

  const speedLineHigh = d3
    .line<WeatherWindData>()
    .x((d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
    .y((d) => yScale(d.wind_speed_10m))
    .curve(d3.curveCatmullRom.alpha(0.5))

  // 绘制高温折线 - 第一段虚线，使用渐变色
  svg
    .append('path')
    .datum([windData[0], windData[1]])
    .attr('class', 'line-low')
    .attr('d', speedLineHigh)
    .attr('fill', 'none')
    .attr('stroke', '#60d0fa')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '3,3')

  // 绘制高温折线 - 其余部分实线，使用渐变色
  svg
    .append('path')
    .datum(windData.slice(1))
    .attr('class', 'line-low')
    .attr('d', speedLineHigh)
    .attr('fill', 'none')
    .attr('stroke', '#60d0fa')
    .attr('stroke-width', 2)

  // 添加高温数据点
  svg
    .selectAll('.dot-low')
    .data(windData)
    .enter()
    .append('circle')
    .attr('class', 'dot-high')
    .attr('cx', (d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
    .attr('cy', (d) => yScale(d.wind_speed_10m))
    .attr('r', 3)
    .attr('stroke', '#60d0fa')
    .attr('fill', '#fff') // 数据点也用AQI颜色

  svg
    .selectAll('.low-text')
    .data(windData)
    .enter()
    .append('text')
    .attr('class', 'low-text')
    .attr('x', (d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
    .attr('y', (d) => yScale(d.wind_speed_10m) + 20)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('fill', '#666')
    .text((d) => `${d.wind_speed_10m + ' ' + d.unit}`)

  if (chartConfig.type === 'Wind24H') {
    svg
      .selectAll('.day-top-label')
      .data(windData)
      .enter()
      .append('text')
      // .attr('x', (d) => {
      //   return xScale(d.shortDate + '\n' + d.date)! + xScale.bandwidth() / 2
      // })
      // .attr('y', 0)
      .attr('class', 'day-top-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#666')
      .html((d) => {
        const x = xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2

        return `
        <tspan x="${x}" dy="-36">${d.date}</tspan>

        <tspan x="${x}" dy="${'9.5em'}">${getWindDirectionText(
          d.wind_direction_10m || 0,
          true
        )}</tspan>
        `
      })
  }

  if (chartConfig.type === 'Wind15D') {
    svg
      .selectAll('.day-top-label')
      .data(windData)
      .enter()
      .append('text')
      // .attr('x', (d) => {
      //   return xScale(d.shortDate + '\n' + d.date)! + xScale.bandwidth() / 2
      // })
      // .attr('y', 0)
      .attr('class', 'day-top-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#666')
      .html((d) => {
        const x = xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2

        const dateArr = d.date.split(',')

        return `
        <tspan x="${x}" dy="-56">${dateArr[0]}</tspan>
        <tspan x="${x}" dy="1.3em">${dateArr[1]}</tspan>

        <tspan x="${x}" dy="${'9.5em'}">${getWindDirectionText(
          d.wind_direction_10m || 0,
          true
        )}</tspan>
        `
      })
  }

  return {
    updateData: (newData: WeatherData[]) => {
      // 更新数据的逻辑
    },
    destroy: () => {
      container.innerHTML = ''
    },
  }
}

export function createPrecipitationDataChart(options: WeatherChartOptions) {
  // 默认配置
  const defaultOptions = {
    width: 800,
    height: 180,
  }

  let weatherInfo = options.weatherInfo

  // 合并配置
  const chartConfig = { ...defaultOptions, ...options }

  // 设置图表尺寸和边距
  const margin = chartConfig.margin
  const width = chartConfig.width - margin.left - margin.right
  const height = chartConfig.height - margin.top - margin.bottom

  const precipitationData = chartConfig?.precipitationData || []

  // 选择或创建容器
  const container =
    typeof chartConfig.container === 'string'
      ? (d3.select(chartConfig.container).node() as HTMLElement)
      : chartConfig.container

  // console.log('container', precipitationData, container)

  if (!container || !precipitationData.length) return

  container.style.width = chartConfig.width + 'px'
  container.style.height = chartConfig.height + 'px'

  // 清空容器
  container.innerHTML = ''

  // 创建SVG元素
  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  // 创建比例尺
  const xScale = d3
    .scaleBand()
    .domain(precipitationData.map((d) => d.date + '\n' + d.date))
    .range([0, width])
    .padding(0.1)

  // let arr = []
  // let min = d3.min(precipitationData, (d) => d.wind_speed_10m) || 0
  // let max = d3.max(precipitationData, (d) => d.wind_gusts_10m) || 0
  // const tempRange = max - min
  // const buffer = tempRange * 0.1
  // arr = [min - tempRange, max + buffer]
  // const yScale = d3.scaleLinear().domain(arr).range([height, 0])

  svg
    .selectAll('.day-top-label-group')
    .data(precipitationData)
    .enter()
    .append('g') // 创建一个 <g> 组来包含背景和文本
    .attr('class', 'day-top-label-group')
    .each(function (d) {
      const group = d3.select(this)

      const x = xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2

      // console.log('height', height, d)

      if (chartConfig.type === 'Hourly' || chartConfig.type === 'Humidity') {
        const text = group
          .append('text')
          .attr('class', 'aqi-label')
          .attr('text-anchor', 'middle')
          .attr('font-size', '14px')
          .attr('fill', '#666')
          .append('tspan')
          .attr('x', x - 12)
          .attr('y', -10)
          .text(`${d.date}`)
      }
      if (chartConfig.type === 'Daily') {
        const wd = formatWeatherDate(d.date)
        const text = group
          .append('text')
          .attr('class', 'aqi-label')
          .attr('text-anchor', 'middle')
          .attr('font-size', '14px')
          .attr('fill', '#666')
          .append('tspan')
          .attr('x', x - 12)
          .attr('y', -30)
          .text(`${wd.week}`)
        const text3 = group
          .append('text')
          .attr('class', 'aqi-label')
          .attr('text-anchor', 'middle')
          .attr('font-size', '14px')
          .attr('fill', '#666')
          .append('tspan')
          .attr('x', x - 12)
          .attr('y', -12)
          .text(`${wd.date}`)
      }

      const text1 = group
        .append('text')
        .attr('class', 'aqi-label')
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#666')
        .append('tspan')
        .attr('x', x - 9)
        .attr('y', 140)
        .text(
          `${d.precipitation_probability}${weatherInfo.hourlyUnits.precipitation_probability}`
        )

      if (chartConfig.type === 'Hourly' || chartConfig.type === 'Daily') {
        const text2 = group
          .append('text')
          .attr('class', 'aqi-label')
          .attr('text-anchor', 'middle')
          .attr('font-size', '14px')
          .attr('fill', '#666')
          .append('tspan')
          .attr('x', x - 9)
          .attr('y', 158)
          .text(`${d.precipitation}${weatherInfo.hourlyUnits.precipitation}`)
      }

      // 添加背景矩形
      const w = 12
      const rect = group
        .append('rect')
        .attr('class', 'label-bg')
        .attr('x', x - 16) // 初始 x，稍后调整
        // .attr('y', (d) => yScale(aqiDesc.aqi) - 25)
        .attr('width', w)
        .attr('height', height)
        .attr('rx', w / 2)
        .attr('ry', w / 2)
        .attr('fill', '#eee') // 背景色根据 AQI 值
        .attr('opacity', 0.8) // 背景稍透明，可调整
      const h1 = height * (d.precipitation_probability / 100)
      const rect1 = group
        .append('rect')
        .attr('class', 'label-bg')
        .attr('x', x - 16) // 初始 x，稍后调整
        .attr('y', height - height * (d.precipitation_probability / 100))
        .attr('width', w)
        .attr('height', h1)
        .attr('rx', w / 2)
        .attr('ry', w / 2)
        .attr('fill', '#f29cb2') // 背景色根据 AQI 值
        .attr('opacity', 0.8) // 背景稍透明，可调整
    })

  return {
    updateData: (newData: WeatherData[]) => {
      // 更新数据的逻辑
    },
    destroy: () => {
      container.innerHTML = ''
    },
  }
}

export function createDewPointChart(options: WeatherChartOptions) {
  // 默认配置
  const defaultOptions = {
    width: 800,
    height: 180,
  }

  let weatherInfo = options.weatherInfo

  // 合并配置
  const chartConfig = { ...defaultOptions, ...options }

  // 设置图表尺寸和边距
  const margin = chartConfig.margin
  const width = chartConfig.width - margin.left - margin.right
  const height = chartConfig.height - margin.top - margin.bottom

  const valData = chartConfig?.valData || []

  // 选择或创建容器
  const container =
    typeof chartConfig.container === 'string'
      ? (d3.select(chartConfig.container).node() as HTMLElement)
      : chartConfig.container

  // console.log('container', valData, container)

  if (!container || !valData.length) return

  container.style.width = chartConfig.width + 'px'
  container.style.height = chartConfig.height + 'px'

  // 清空容器
  container.innerHTML = ''

  // 创建SVG元素
  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  // 创建比例尺
  const xScale = d3
    .scaleBand()
    .domain(valData.map((d) => d.date + '\n' + d.date))
    .range([0, width])
    .padding(0.1)

  let arr = []
  let min = d3.min(valData, (d) => d.val) || 0
  let max = d3.max(valData, (d) => d.val) || 0
  const tempRange = max - min
  const buffer = tempRange * 0.1
  arr = [min - tempRange, max + buffer]

  if (chartConfig.type === 'Humidity') {
    arr = [min - tempRange, max + buffer]
  }
  if (chartConfig.type === 'UV') {
    arr = [min - 1, max]
  }

  const yScale = d3.scaleLinear().domain(arr).range([height, 0])

  // 创建折线生成器
  const lineHigh = d3
    .line<WeatherValData>()
    .x((d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
    .y((d) => yScale(d.val))
    .curve(d3.curveCatmullRom.alpha(0.5))

  // 定义渐变
  const defs = svg.append('defs')
  const gradient = defs
    .append('linearGradient')
    .attr('id', 'area-gradient')
    .attr('gradientUnits', 'userSpaceOnUse')
    .attr('x1', 0)
    .attr('y1', height)
    .attr('x2', 0)
    .attr('y2', 0)

  if (chartConfig.type === 'Humidity') {
    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(242, 173, 190,0.1)')

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(242, 173, 190,0.7)')
  }
  if (chartConfig.type === 'UV') {
    const colors = ['#4CAF50', '#FFC107', '#FF5722', '#D81B60', '#B71C1C']
    const maxInfo = getUVInfo(max)
    const opacity = 'cc'

    let curIndex = 0
    colors.some((v, i) => {
      if (v === maxInfo.color) {
        curIndex = i
        return true
      }
    })

    for (let i = 0; i <= curIndex; i++) {
      gradient
        .append('stop')
        .attr('offset', (100 / (curIndex + 1)) * i + '%')
        .attr('stop-color', colors[i] + opacity)
    }
  }
  // 创建面积生成器
  const area = d3
    .area<WeatherValData>()
    .x((d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
    .y0(height)
    .y1((d) => yScale(d.val))

  // 添加填充区域
  svg
    .append('path')
    .datum(valData)
    .attr('fill', 'url(#area-gradient)')
    .attr('d', area)

  // // 绘制高温折线 - 第一段虚线，使用渐变色
  svg
    .append('path')
    .datum([valData[0], valData[1]])
    .attr('class', 'line-high')
    .attr('d', lineHigh)
    .attr('fill', 'none')
    .attr('stroke', '#f29cb2')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '3,3')

  // 添加折线
  svg
    .append('path')
    .datum(valData.slice(1))
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 2)
    .attr('stroke', '#f29cb2')
    .attr('d', lineHigh)

  // 添加数据点
  svg
    .selectAll('.dot')
    .data(valData)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', (d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
    .attr('cy', (d) => yScale(d.val) || 0)
    .attr('r', 4)
    .attr('stroke', '#f29cb2')
    .attr('fill', '#fff') // 数据点也用AQI颜色

  svg
    .selectAll('.high-text')
    .data(valData)
    .enter()
    .append('text')
    .attr('class', 'high-text')
    .attr('x', (d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
    .attr('y', (d) => yScale(d.val) - 10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('fill', '#666')
    .text((d) => `${d.val + ' ' + d.unit}`)

  svg
    .selectAll('.day-top-label')
    .data(valData)
    .enter()
    .append('text')
    .attr('class', 'day-top-label')
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .attr('fill', '#666')
    .html((d) => {
      const x = xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2

      return `
        <tspan x="${x}" dy="-45">${d.date}</tspan>
        `
    })

  const lineHigh1 = d3
    .line<WeatherValData>()
    .x((d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2)
    .y((d) => height)
  svg
    .append('path')
    .datum(valData)
    .attr('class', 'line-high')
    .attr('d', lineHigh1)
    .attr('fill', 'none')
    .attr('stroke', 'rgba(242, 173, 190, 0.3)')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '3,3')

  svg
    .selectAll('.vertical-line')
    .data(valData)
    .enter()
    .append('line')
    .attr('class', 'vertical-line')
    .attr('x1', (d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2) // X 坐标居中
    .attr('x2', (d) => xScale(d.date + '\n' + d.date)! + xScale.bandwidth() / 2) // X 坐标居中
    .attr('y1', height)
    .attr('y2', (d) => yScale(d.val))
    .attr('stroke', 'rgba(242, 173, 190, 0.3)')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '3,3')

  return {
    updateData: (newData: WeatherData[]) => {
      // 更新数据的逻辑
    },
    destroy: () => {
      container.innerHTML = ''
    },
  }
}

export function createWeatherChart(options: WeatherChartOptions) {
  // 默认配置
  const defaultOptions = {
    width: 800,
    height: 180,
  }

  const state = store.getState()

  let weatherInfo = options.weatherInfo

  // 合并配置
  const config = { ...defaultOptions, ...options }

  // 设置图表尺寸和边距
  const margin = config.margin
  const width = config.width - margin.left - margin.right
  const height = config.height - margin.top - margin.bottom

  const data = config?.data || []

  console.log(
    'getWeather createWeatherChart',
    config.weatherInfo,
    data,
    width,
    config
  )

  // 选择或创建容器
  const container =
    typeof config.container === 'string'
      ? (d3.select(config.container).node() as HTMLElement)
      : config.container

  if (!container && !data?.length) return

  container.style.width = config.width + 'px'
  container.style.height = config.height + 'px'

  // 清空容器
  container.innerHTML = ''

  // 创建SVG元素
  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  // 创建比例尺
  const xScale = d3
    .scaleBand()
    .domain(data.map((d) => d.shortDate + '\n' + d.date))
    .range([0, width])
    .padding(0.1)

  let arr = [
    (d3.min(data, (d) => d.low) || 0) - 2,
    (d3.max(data, (d) => d.high) || 0) + 2,
  ]

  if (options.type === 'Hourly') {
    let min = d3.min(data, (d) => d.high) || 0
    let max = d3.max(data, (d) => d.high) || 0
    const tempRange = max - min
    const buffer = tempRange * 0.1 // 如果温差<10°C，上下各加5°C缓冲
    arr = [min - tempRange, max + buffer]
    // arr = [
    //   (d3.min(config.data, (d) => d.high) || 0) - (max + min) / 2 - 2,
    //   (d3.max(config.data, (d) => d.high) || 0) + 1,
    // ]
    // console.log(
    //   'yScale',
    //   config.data.map((v) => {
    //     return {
    //       low: v.low,
    //       hight: v.high,
    //     }
    //   }),
    //   arr,
    //   min,
    //   max,
    //   (max - min) / 5
    // )
  }
  const yScale = d3.scaleLinear().domain(arr).range([height, 0])

  if (config.type === 'Daily' || config.type === 'Hourly') {
    // 创建折线生成器
    const lineHigh = d3
      .line<WeatherData>()
      .x((d) => xScale(d.shortDate + '\n' + d.date)! + xScale.bandwidth() / 2)
      .y((d) => yScale(d.high))
      .curve(d3.curveCatmullRom.alpha(0.5))

    // 绘制高温折线 - 第一段虚线
    svg
      .append('path')
      .datum([data[0], data[1]])
      .attr('class', 'line-high')
      .attr('d', lineHigh)
      .attr('fill', 'none')
      .attr('stroke', weatherLineColor)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,3')

    // 绘制高温折线 - 其余部分实线
    svg
      .append('path')
      .datum(data.slice(1))
      .attr('class', 'line-high')
      .attr('d', lineHigh)
      .attr('fill', 'none')
      .attr('stroke', weatherLineColor)
      .attr('stroke-width', 2)

    // 添加高温数据点
    svg
      .selectAll('.dot-high')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot-high')
      .attr(
        'cx',
        (d) => xScale(d.shortDate + '\n' + d.date)! + xScale.bandwidth() / 2
      )
      .attr('cy', (d) => yScale(d.high))
      .attr('r', 3)
      .attr('stroke', '#ccc')
      .attr('fill', '#fff')

    // 在高温点上方添加温度文字
    svg
      .selectAll('.high-text')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'high-text')
      .attr(
        'x',
        (d) => xScale(d.shortDate + '\n' + d.date)! + xScale.bandwidth() / 2
      )
      .attr('y', (d) => yScale(d.high) - 10)
      .attr('text-anchor', 'middle')
      //     .attr('font-size', '14px')
      //     .attr('fill', '#444')
      .text((d) => `${d.high}°`)

    if (config.type === 'Daily') {
      const lineLow = d3
        .line<WeatherData>()
        .x((d) => xScale(d.shortDate + '\n' + d.date)! + xScale.bandwidth() / 2)
        .y((d) => yScale(d.low))
        .curve(d3.curveCatmullRom.alpha(0.5))

      // 绘制低温折线 - 第一段虚线
      svg
        .append('path')
        .datum([data[0], data[1]])
        .attr('class', 'line-low')
        .attr('d', lineLow)
        .attr('fill', 'none')
        .attr('stroke', weatherLineColor)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '3,3')

      // 绘制低温折线 - 其余部分实线
      svg
        .append('path')
        .datum(data.slice(1))
        .attr('class', 'line-low')
        .attr('d', lineLow)
        .attr('fill', 'none')
        .attr('stroke', weatherLineColor)
        .attr('stroke-width', 2)
      // 添加低温数据点
      svg
        .selectAll('.dot-low')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'dot-low')
        .attr(
          'cx',
          (d) => xScale(d.shortDate + '\n' + d.date)! + xScale.bandwidth() / 2
        )
        .attr('cy', (d) => yScale(d.low))
        .attr('r', 3)
        .attr('stroke', '#ccc')
        .attr('fill', '#fff')

      // 在低温点下方添加温度文字
      svg
        .selectAll('.low-text')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'low-text')
        .attr(
          'x',
          (d) => xScale(d.shortDate + '\n' + d.date)! + xScale.bandwidth() / 2
        )
        .attr('y', (d) => yScale(d.low) + 20)
        .attr('text-anchor', 'middle')
        //     .attr('font-size', '14px')
        //     .attr('fill', '#444')
        .text((d) => `${d.low}°`)
    }

    if (config.type === 'Hourly') {
      // 添加日期标签
      svg
        .selectAll('.day-top-label')
        .data(data)
        .enter()
        .append('text')
        // .attr('x', (d) => {
        //   return xScale(d.shortDate + '\n' + d.date)! + xScale.bandwidth() / 2
        // })
        // .attr('y', 0)
        .attr('class', 'day-top-label')
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#666')
        .html((d) => {
          const x =
            xScale(d.shortDate + '\n' + d.date)! + xScale.bandwidth() / 2

          let topEmojiEm = '1.8em'
          let bottomTextEm = '7.1em'

          if (d.precipitationProbabilityMax) {
            topEmojiEm = '1.5em'
            bottomTextEm = '6.1em'
          }

          const wcode = Number(d.weatherCode || 0)

          // console.log('dddddddd', d, weatherInfo.airQuality)

          const aq = formatAirQuality(
            weatherInfo,
            moment(d.date).format('YYYY-MM-DD HH:mm'),
            'Hourly'
          )

          const aqiDesc = getAqiDescription(aq.european_aqi)

          return `
        <tspan x="${x}" dy="-95">${d.hour}</tspan>
        <tspan font-size="20px"  x="${x}" dy="${topEmojiEm}">
            ${openWeatherWMOToEmoji(wcode)?.value || ''}</tspan>
        ${
          d.precipitationProbabilityMax
            ? `
            <tspan font-size="14px" x="${x}" dy="1.4em">
                ${d.precipitationProbabilityMax}%
            </tspan>`
            : ``
        }
        <tspan x="${x}" dy="1.5em">${t('weather' + wcode, {
            ns: 'weather',
          })}</tspan>
        <tspan x="${x}" dy="${bottomTextEm}">${getWindDirectionText(
            d.wind_direction_10m || 0,
            true
          )}</tspan>
        <tspan x="${x}" dy="1.3em">${t('windLevelNum', {
            ns: 'weather',
            num: getWindForceLevel(
              d.wind_speed_10m || 0,
              weatherInfo.current_units.wind_speed_10m
            ),
          })}</tspan>
        <tspan 
         fill="${aqiDesc.color}" x="${x - 3}" dy="1.3em">${
            // aq.european_aqi ? aqiDesc.aqiDesc : ''
            ''
          }</tspan>
        `
        })

      svg
        .selectAll('.day-top-label-group')
        .data(data)
        .enter()
        .append('g') // 创建一个 <g> 组来包含背景和文本
        .attr('class', 'day-top-label-group')
        .attr('y', '5.1em')
        .each(function (d) {
          const group = d3.select(this)

          const x =
            xScale(d.shortDate + '\n' + d.date)! + xScale.bandwidth() / 2

          const paddingX = 6 // 水平 padding
          const paddingY = 2 // 垂直 padding

          const aq = formatAirQuality(
            weatherInfo,
            moment(d.date).format('YYYY-MM-DD HH:mm'),
            'Hourly'
          )
          const aqiDesc = getAqiDescription(aq.european_aqi)
          const textContent = `${aqiDesc.aqi} ${aqiDesc.aqiDesc}`

          if (!aqiDesc.aqi) return
          // 添加背景矩形
          const rect = group
            .append('rect')
            .attr('class', 'label-bg')
            .attr('x', x - 20) // 初始 x，稍后调整
            // .attr('y', (d) => yScale(aqiDesc.aqi) - 25)
            .attr('width', 40)
            .attr('height', 20)
            .attr('rx', 10)
            .attr('ry', 10)
            .attr('fill', aqiDesc.color) // 背景色根据 AQI 值
            .attr('opacity', 0.8) // 背景稍透明，可调整
            .each(function () {
              const rect = d3.select(this)
              const text = group.select('text') // 稍后添加的 text 元素
              const bbox = (text.node() as SVGTextElement)?.getBBox()
              if (bbox) {
                // 动态调整矩形大小，包含 padding
                rect
                  .attr('x', x - bbox.width / 2 - paddingX)
                  .attr('width', bbox.width + 2 * paddingX)
                  .attr('height', bbox.height + 2 * paddingY)
              }
            })

          // 添加文本
          const text = group
            .append('text')
            .attr('class', 'aqi-label')
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('fill', '#fff') // 文字颜色：白色，可根据需要调整
            .append('tspan')
            .attr('x', x)
            .attr('y', 100)
            .text(textContent)

          // 动态调整矩形大小
          const bbox = (text.node() as SVGTextElement | null)?.getBBox()
          if (bbox) {
            // 矩形宽度根据文字宽度动态调整，加上两侧 padding
            const w = bbox.width + 2 * paddingX
            const h = bbox.height + 2 * paddingY
            rect
              .attr('x', x - bbox.width / 2 - paddingX) // 居中并留出左侧 padding
              .attr('width', w) // 宽度 = 文字宽度 + 两侧 padding
              .attr('height', h) // 高度 = 文字高度 + 两侧 padding
              .attr('rx', h / 2)
              .attr('ry', h / 2)
              // .attr('y', 85)
              .attr('y', bbox.y - paddingY)
            // .attr('y', '6.1em')
          }
        })
    }

    if (config.type === 'Daily') {
      // 添加日期标签
      svg
        .selectAll('.day-top-label')
        .data(data)
        .enter()
        .append('text')
        // .attr('x', (d) => {
        //   return xScale(d.shortDate + '\n' + d.date)! + xScale.bandwidth() / 2
        // })
        // .attr('y', 0)
        .attr('class', 'day-top-label')
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#666')
        .html((d) => {
          const x =
            xScale(d.shortDate + '\n' + d.date)! + xScale.bandwidth() / 2

          let topEmojiEm = '1.8em'
          let bottomEmojiEm = '7.4em'
          let bottomTextEm = '2.6em'

          if (d.precipitationProbabilityMax) {
            topEmojiEm = '1.5em'
            bottomEmojiEm = '6.8em'
            bottomTextEm = '2.5em'
          }
          if (d.precipitationProbabilityMin) {
            bottomEmojiEm = '7.2em'
            bottomTextEm = '1.5em'
          }
          if (d.precipitationProbabilityMax && d.precipitationProbabilityMin) {
            bottomEmojiEm = '6.5em'
            bottomTextEm = '1.5em'
          }

          const maxWcode = Number(d.maxTempWeatherCode || 0)
          const minWcode = Number(d.minTempWeatherCode || 0)

          const aq = formatAirQuality(
            weatherInfo,
            moment(d.date).format('YYYY-MM-DD HH:mm'),
            'Hourly'
          )
          const aqiDesc = getAqiDescription(aq.european_aqi)

          return `
        <tspan x="${x}" dy="-110">${d.week}</tspan>
        <tspan x="${x}" dy="1.3em">${d.shortDate}</tspan>

        <tspan font-size="20px"  x="${x}" dy="${topEmojiEm}">
            ${openWeatherWMOToEmoji(maxWcode)?.value || ''}</tspan>
        ${
          d.precipitationProbabilityMax
            ? `
            <tspan font-size="14px" x="${x}" dy="1.4em">
                ${d.precipitationProbabilityMax}%
            </tspan>`
            : ``
        }
        <tspan x="${x}" dy="1.5em">${t('weather' + maxWcode, {
            ns: 'weather',
          })}</tspan>

        
        <tspan font-size="20px" x="${x}" dy="${bottomEmojiEm}">${
            openWeatherWMOToEmoji(minWcode)?.value || ''
          }</tspan>
        ${
          d.precipitationProbabilityMin
            ? `
            <tspan font-size="14px" x="${x}" dy="1.4em">
                ${d.precipitationProbabilityMin}%
            </tspan>`
            : ``
        }
        <tspan x="${x}" dy="1.5em">${t('weather' + minWcode, {
            ns: 'weather',
          })}</tspan>
        <tspan x="${x}" dy="${bottomTextEm}">${getWindDirectionText(
            d.wind_direction_10m || 0,
            true
          )}</tspan>
        <tspan x="${x}" dy="1.3em">${t('windLevelNum', {
            ns: 'weather',
            num: getWindForceLevel(
              d.wind_speed_10m || 0,
              weatherInfo.current_units.wind_speed_10m
            ),
          })}</tspan>
        <tspan fill="${aqiDesc.color}" x="${x - 3}" dy="1.3em">${
            // aq.european_aqi ? aqiDesc.aqiDesc : ''
            ''
          }</tspan>
        `
        })

      svg
        .selectAll('.day-top-label-group')
        .data(data)
        .enter()
        .append('g') // 创建一个 <g> 组来包含背景和文本
        .attr('class', 'day-top-label-group')
        .each(function (d) {
          const group = d3.select(this)

          const x =
            xScale(d.shortDate + '\n' + d.date)! + xScale.bandwidth() / 2

          const paddingX = 4 // 水平 padding
          const paddingY = 2 // 垂直 padding

          const aq = formatAirQuality(
            weatherInfo,
            moment(d.date).format('YYYY-MM-DD'),
            'Daily'
          )
          const aqiDesc = getAqiDescription(aq.european_aqi)
          const textContent = `${aqiDesc.aqi} ${aqiDesc.aqiDesc}`

          if (!aqiDesc.aqi) return
          // 添加背景矩形
          const rect = group
            .append('rect')
            .attr('class', 'label-bg')
            .attr('x', x - 20) // 初始 x，稍后调整
            // .attr('y', (d) => yScale(aqiDesc.aqi) - 25)
            .attr('width', 40)
            .attr('height', 20)
            .attr('rx', 10)
            .attr('ry', 10)
            .attr('fill', aqiDesc.color) // 背景色根据 AQI 值
            .attr('opacity', 0.8) // 背景稍透明，可调整
            .each(function () {
              const rect = d3.select(this)
              const text = group.select('text') // 稍后添加的 text 元素
              const bbox = (text.node() as SVGTextElement)?.getBBox()
              if (bbox) {
                // 动态调整矩形大小，包含 padding
                rect
                  .attr('x', x - bbox.width / 2 - paddingX)
                  .attr('width', bbox.width + 2 * paddingX)
                  .attr('height', bbox.height + 2 * paddingY)
              }
            })

          // 添加文本
          const text = group
            .append('text')
            .attr('class', 'aqi-label')
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('fill', '#fff') // 文字颜色：白色，可根据需要调整
            .append('tspan')
            .attr('x', x)
            // .attr('y', '16em')
            .attr('y', 210)
            // .attr('y', 0)
            .text(textContent)

          // 动态调整矩形大小
          const bbox = (text.node() as SVGTextElement | null)?.getBBox()
          if (bbox) {
            // 矩形宽度根据文字宽度动态调整，加上两侧 padding
            const w = bbox.width + 2 * paddingX
            const h = bbox.height + 2 * paddingY
            rect
              .attr('x', x - bbox.width / 2 - paddingX) // 居中并留出左侧 padding
              .attr('width', w) // 宽度 = 文字宽度 + 两侧 padding
              .attr('height', h) // 高度 = 文字高度 + 两侧 padding
              .attr('rx', h / 2)
              .attr('ry', h / 2)
              // .attr('y', '12.2em')
              .attr('y', bbox.y - paddingY)
            // .attr('y', state.config.deviceType === 'Mobile' ? 198 : 195)
          }
        })
    }
  }

  // 返回图表实例，可用于后续操作
  return {
    updateData: (newData: WeatherData[]) => {
      // 更新数据的逻辑
    },
    destroy: () => {
      container.innerHTML = ''
    },
  }
}

interface TwilightTimes {
  astronomical: { start?: Date; end?: Date }
  nautical: { start?: Date; end?: Date }
  civil: { start?: Date; end?: Date }
}

export function calculateTwilightTimes(
  date: Date = new Date(),
  lat: number,
  lon: number,
  elevation: number = 0
): TwilightTimes {
  const observer = new Astronomy.Observer(lat, lon, elevation)
  const body = Astronomy.Body.Sun

  const twilightTypes = [
    { name: 'astronomical', angle: -18 },
    { name: 'nautical', angle: -12 },
    { name: 'civil', angle: -6 },
  ]

  const result: TwilightTimes = {
    astronomical: {},
    nautical: {},
    civil: {},
  }

  for (const type of twilightTypes) {
    // 晨光开始（太阳上升至目标高度角）
    const start = Astronomy.SearchAltitude(
      body,
      observer,
      +1,
      date,
      -1,
      type.angle
    )

    // 昏影结束（太阳下降至目标高度角）
    const end = Astronomy.SearchAltitude(
      body,
      observer,
      -1,
      date,
      1,
      type.angle
    )

    // 将结果存入对应字段
    result[type.name as keyof TwilightTimes] = {
      start: start?.date,
      end: end?.date,
    }
  }

  return result
}

let name = 'weather'

export interface WeatherSyncData {
  cities: {
    lat: number
    lng: number
    displayName: string
    cityInfo?: CityInfo
    weatherInfo?: typeof defaultWeatherInfo
    curPopsition: boolean
    updateTime: number
    default: boolean
    sort: number
  }[]
  lastUpdateTime: number
}

export const weatherSlice = createSlice({
  name,
  initialState: {
    lastUpdateTime: 0,
    weatherData: {
      cities: [],
      lastUpdateTime: 0,
    } as WeatherSyncData,
    allowSyncCloudData: true,
  },
  reducers: {
    setAllowSyncCloudData: (
      state,
      params: ActionParams<(typeof state)['allowSyncCloudData']>
    ) => {
      state.allowSyncCloudData = params.payload
    },
    setLastUpdateTime: (
      state,
      params: ActionParams<(typeof state)['lastUpdateTime']>
    ) => {
      state.lastUpdateTime = params.payload
    },
    setWeatherData: (
      state,
      params: ActionParams<(typeof state)['weatherData']>
    ) => {
      // console.log('params.payload.cities ', deepCopy(params.payload.cities))

      let defaultIndex = -1
      params.payload.cities = params.payload.cities.map((v, i) => {
        if (v.default && defaultIndex === -1) {
          defaultIndex = i
        }
        return {
          ...v,
          sort: v.curPopsition ? 0 : v.sort,
          default: defaultIndex === i,
        }
      })

      params.payload.cities.sort((a, b) => {
        return a.sort - b.sort
      })

      // console.log('params.payload.cities ', deepCopy(params.payload.cities))
      state.weatherData = params.payload
    },
  },
})

const d = new Debounce()

export const weatherMethods = {
  init: createAsyncThunk(name + '/init', async (_, thunkAPI) => {
    const data = await storage.global.get('WeatherSyncData')

    if (data?.lastUpdateTime) {
      thunkAPI.dispatch(weatherSlice.actions.setWeatherData(data))
    }
  }),

  downloadData: createAsyncThunk(
    name + '/downloadData',
    async (_, thunkAPI) => {
      try {
        const { user, weather } = store.getState()

        if (!weather.allowSyncCloudData) {
          return
        }

        thunkAPI.dispatch(
          layoutSlice.actions.setLayoutHeaderLoading({
            loading: true,
            text: t('syncing', {
              ns: 'countdownDaysPage',
            }),
          })
        )
        // 远程数据同步下来
        const res = await httpApi.v1.Weather.GetFileUrls()
        console.log(
          '开始下载并同步 downloadData',
          res,
          res.data.fileInfo?.lastModified
        )
        if (res.code === 200 && res?.data?.urls?.domainUrl) {
          // 线上对比
          if (
            Number(res?.data?.fileInfo?.lastModified) ===
            weather.weatherData.lastUpdateTime
          ) {
            console.log(
              '开始下载并同步 老版本',
              Number(res?.data?.fileInfo?.lastModified),
              weather.weatherData.lastUpdateTime
            )
            thunkAPI.dispatch(
              layoutSlice.actions.setLayoutHeaderLoading({
                loading: false,
              })
            )

            return
          }

          const url =
            (res.data.urls?.domainUrl || '') +
            res.data.urls?.shortUrl +
            '?timestamp=' +
            new Date().getTime()

          const data: WeatherSyncData = await (await fetch(url)).json()
          console.log(
            '开始下载并同步 下载中',
            data,
            Number(res.data.fileInfo?.lastModified) -
              weather.weatherData.lastUpdateTime
          )
          if (!data?.lastUpdateTime) {
            thunkAPI.dispatch(
              layoutSlice.actions.setLayoutHeaderLoading({
                loading: false,
              })
            )
            return
          }

          // 检测线下对比是否更新
          if (
            Number(data.lastUpdateTime) <= weather.weatherData.lastUpdateTime
          ) {
            console.log('开始下载并同步 老版本')
            thunkAPI.dispatch(
              layoutSlice.actions.setLayoutHeaderLoading({
                loading: false,
              })
            )

            return
          }
          console.log('开始下载并同步', url, data)

          console.log(data)
          // const tempCities = [...weather.weatherData.cities]
          // data?.cities?.forEach((v) => {
          //   if (!v.curPopsition) {
          //     let curIndex = -1
          //     tempCities.some((sv, si) => {
          //       if (v.lat === sv.lat && v.lng === sv.lng) {
          //         curIndex = si
          //         return true
          //       }
          //     })

          //     if (curIndex >= 0) {
          //       tempCities[curIndex] = {
          //         ...tempCities[curIndex],
          //         ...v,
          //       }
          //     } else {
          //       tempCities.push(v)
          //     }
          //   }
          // })

          thunkAPI.dispatch(
            weatherSlice.actions.setWeatherData({
              cities: data.cities,
              lastUpdateTime: data.lastUpdateTime,
            })
          )
        } else {
          // store.dispatch(
          //   countdownDaysSlice.actions.setDownloadDataStatus({
          //     ...store.getState().countdownDays.downloadDataStatus,
          //     saass: true,
          //   })
          // )
        }
        thunkAPI.dispatch(
          layoutSlice.actions.setLayoutHeaderLoading({
            loading: false,
          })
        )
      } catch (error) {
        console.error(error)
        showSnackbar(
          t('failedToConnectToApp', {
            appName: 'SAaSS',
            ns: 'prompt',
          })
        )
      }
    }
  ),
  syncData: createAsyncThunk(
    name + '/syncData',
    async (
      {
        data,
      }: {
        data: {
          cities: WeatherSyncData['cities']
        }
      },
      thunkAPI
    ) => {
      d.increase(async () => {
        const { user, weather } = store.getState()

        if (!weather.allowSyncCloudData) {
          return
        }

        const weatherSyncData: WeatherSyncData = {
          cities: data.cities,
          lastUpdateTime: new Date().getTime(),
        }

        storage.global.setSync('WeatherSyncData', weatherSyncData)

        if (!user.isLogin) {
          console.log('未登录')
          return
        }
        thunkAPI.dispatch(
          layoutSlice.actions.setLayoutHeaderLoading({
            loading: true,
            text: t('syncing', {
              ns: 'countdownDaysPage',
            }),
          })
        )

        const blob = new Blob([JSON.stringify(weatherSyncData)], {
          type: 'application/json',
        })

        console.log(blob)

        const reader = new FileReader()

        reader.onload = async (e) => {
          if (!e.target?.result) {
            thunkAPI.dispatch(
              layoutSlice.actions.setLayoutHeaderLoading({
                loading: false,
              })
            )
            return
          }

          const hash = await getHash(e.target.result, 'SHA-256')

          console.log(hash, blob.size)

          // http://192.168.204.132:16100/s/IkO0aOU2fs

          const res = await httpApi.v1.Weather.GetUploadToken({
            size: blob.size,
            hash: hash,
            lastUpdateTime: weatherSyncData.lastUpdateTime,
          })

          console.log('res', res)

          if (res.code === 200) {
            const { uploadFile } = saass
            // const { uploadFile } = SAaSS.api
            const file = new File(
              [blob],
              (res.data.fileInfo?.name || '') + res.data.fileInfo?.suffix,
              {
                type: res.data.fileInfo?.type || '',
                lastModified: weatherSyncData.lastUpdateTime,
              }
            )

            uploadFile({
              file,
              url:
                res.data.apiUrl?.replace(
                  'http://127.0.0.1',
                  'http://192.168.204.132'
                ) || '',
              token: res.data.token || '',
              chunkSize: Number(res.data.chunkSize || 0),
              uploadedOffset:
                res.data.uploadedOffset?.map((v) => Number(v)) || [],

              uploadedTotalSize: Number(res.data.uploadedTotalSize || 0),
              onprogress(options) {
                console.log(
                  'onprogress ',
                  weatherSyncData.lastUpdateTime,
                  options
                )
              },
              onsuccess(options) {
                console.log(
                  'onsuccess',
                  options,
                  (res.data.urls?.domainUrl || '') + options.shortUrl
                )
                // showSnackbar(
                //   t('uploadedSuccessfully', {
                //     ns: 'prompt',
                //   })
                // )
                thunkAPI.dispatch(
                  layoutSlice.actions.setLayoutHeaderLoading({
                    loading: false,
                  })
                )
              },
              onerror(err) {
                console.log('onerror', err)
                thunkAPI.dispatch(
                  layoutSlice.actions.setLayoutHeaderLoading({
                    loading: false,
                  })
                )
              },
            })
          }
        }

        reader.readAsArrayBuffer(blob)

        // storage.global.setSync('countdownDays-lastUpdateTime', params.payload)
      }, 2000)
    }
  ),
}
