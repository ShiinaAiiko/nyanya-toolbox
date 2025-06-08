import React, { useEffect, useState } from 'react'
import qs from 'qs'
import { RootState } from '../store'

import { useSelector, useStore, useDispatch } from 'react-redux'

import axios, { AxiosRequestConfig } from 'axios'

import store, { userSlice } from '../store'
import { snackbar } from '@saki-ui/core'
import moment from 'moment'
import { t } from './i18n/i18n'

export const getRegExp = (type: 'email') => {
  return /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
}
export const emojiToText = (message: string) => {
  return message.replace(
    /<img [^>]*class=['"]([^'"]+)[^>]*src=['"]([^'"]+)[^>]*data-name=['"]([^'"]+)[^>]*>/g,
    (el: string, className: string, src: string, name: string) => {
      if (className === 'mwc-emoji') {
        return '[' + name + ']'
      }
      console.log(el)
      // 暂时不允许这种方式发图片。
      return ''
    }
  )
}

export const emojiToImg = (message: string) => {
  return message.replace(/\[(.+?)\]/g, (el: string, name: string) => {
    // console.log(el, name)
    const { emoji } = store.getState()
    let obj = emoji.emojiListObj[name]
    if (obj) {
      return `<img class="mwc-emoji" 
        alt="${obj.name}" 
        title="${obj.name}"
        src="${obj.src}" 
        data-name="${obj.name}">`
    }
    return el
  })
}
export const isInPwa = () => {
  // return true
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any)?.standalone ||
    document.referrer.includes('android-app://')
  )
}

export const copyText = (text: string) => {
  if (window.isSecureContext && navigator.clipboard) {
    navigator.clipboard.writeText(text)
  } else {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
    } catch (err) {
      console.error('Unable to copy to clipboard', err)
    }
    document.body.removeChild(textArea)
  }
}

export const random = (min: number, max: number) => {
  var newMin = min || 0
  var newMax = max || 10
  return min !== undefined && max !== undefined
    ? String(Math.floor(Math.random() * (newMax - newMin) + newMin))
    : String(Math.floor(Math.random() * 10))
}
export const getRandomPassword = (
  num: number = 0,
  include: ('Number' | 'Character')[]
) => {
  let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let number = '0123456789'
  let character = '#$%&()*+,-.:;<=>?@[]^_{|}~'

  let randStr = '' + alphabet

  if (include.includes('Number')) {
    randStr += number
  }
  if (include.includes('Character')) {
    randStr += character
  }

  let randNum = Number(random(0, alphabet.length - 1))
  let str = randStr.substring(randNum, randNum + 1)

  for (let i = 1; i < num; i++) {
    randNum = Number(random(0, randStr.length - 1))
    str += randStr.substring(randNum, randNum + 1)
  }
  return str
}

export const download = async (src: string, filename: string) => {
  const res = await axios.get(src, {
    responseType: 'blob',
  })
  var a = document.createElement('a')
  // var filename = src.substring(src.lastIndexOf('/') + 1) + '.' + fileSuffix
  // console.log('download', filename, src, fileSuffix)
  a.href = window.URL.createObjectURL(res.data)
  a.download = filename
  a.target = '_blank'
  URL.revokeObjectURL(src)
  a.click()
}

export const downloadFile = async (file: File, filename: string) => {
  var a = document.createElement('a')
  a.href = window.URL.createObjectURL(file)
  a.download = filename
  a.target = '_blank'
  a.click()
  URL.revokeObjectURL(a.href)
}

export const developing = () => {
  snackbar({
    message: '该功能暂未开放',
    autoHideDuration: 2000,
    vertical: 'top',
    horizontal: 'center',
    backgroundColor: 'var(--saki-default-color)',
    color: '#fff',
  }).open()
}

export const Query = (
  url: string,
  query: {
    [k: string]: string
  }
) => {
  let obj: {
    [k: string]: string
  } = {}
  let o = Object.assign(obj, query)
  let s = qs.stringify(
    Object.keys(o).reduce(
      (fin, cur) => (o[cur] !== '' ? { ...fin, [cur]: o[cur] } : fin),
      {}
    )
  )
  return url + (s ? '?' + s : '')
}

export const showSnackbar = (
  message: string,
  color?: string,
  backgroundColor?: string
) => {
  snackbar({
    message,
    autoHideDuration: 2000,
    vertical: 'top',
    horizontal: 'center',
    backgroundColor: backgroundColor || 'var(--primary-color)',
    color: color || '#fff',
  }).open()
}

export const hidePhone = (phone: string) => {
  if (phone.length >= 11) {
    return phone
      .split('')
      .map((v, i) => {
        if (i < 3 || i > 8) {
          return v
        }
        return '*'
      })
      .join('')
  }
  return phone
    .split('')
    .map((v, i) => {
      if (i < 2 || i > 5) {
        return v
      }
      return '*'
    })
    .join('')
}

export const formatTime = (time: number, format: string[]) => {
  let str = ''
  if (format.includes('h')) {
    const h = Math.floor(time / 3600000)
    str = str + `${String(h).padStart(2, '0')}`
  }
  if (format.includes('m')) {
    str && (str = str + ':')
    const m = Math.floor(time / 60000)
    str = str + `${String(m).padStart(2, '0')}`
  }
  if (format.includes('s')) {
    str && (str = str + ':')
    const s = Math.floor(time / 1000) % 60
    str = str + `${String(s).padStart(2, '0')}`
  }
  if (format.includes('ms')) {
    str && (str = str + '.')
    const ms = Math.floor(time / 10) % 100
    str = str + `${String(ms).padStart(2, '0')}`
  }
  return str
}

export const formatDuration = (timestamp: number, fields: string[]) => {
  const h = Math.floor(timestamp / 3600)
  const m = Math.floor(timestamp / 60) % 60
  const s = Math.floor(timestamp % 60)

  if (!fields.length) {
    return h + 'h ' + (m + 'm ') + (s + 's ')
  }

  return (
    (h === 0 && fields.includes('h') ? '' : h + 'h ') +
    (m === 0 && fields.includes('m') ? '' : m + 'm ') +
    (s === 0 && fields.includes('s') ? '' : s + 's ')
  )
}

export const formatDurationI18n = (
  timestamp: number,
  full = true,
  fields: string[] = ['h', 'm', 's']
) => {
  const h = Math.floor(timestamp / 3600)
  const m = Math.floor(timestamp / 60) % 60
  const s = Math.floor(timestamp % 60)

  let str = ''
  if (full) {
    str =
      h +
      t('hourTime', {
        ns: 'prompt',
      }) +
      (m +
        t('minuteTime', {
          ns: 'prompt',
        })) +
      (s +
        t('secondTime', {
          ns: 'prompt',
        }))
  } else {
    str =
      (h === 0 && fields.includes('h')
        ? ''
        : h +
          t('hourTime', {
            ns: 'prompt',
          })) +
      (m === 0 && fields.includes('m')
        ? ''
        : m +
          t('minuteTime', {
            ns: 'prompt',
          })) +
      (s === 0 && fields.includes('s')
        ? ''
        : s +
          t('secondTime', {
            ns: 'prompt',
          }))
  }

  return str.trim()
}



// 单位米

export const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  let radLat1 = (lat1 * Math.PI) / 180.0
  let radLat2 = (lat2 * Math.PI) / 180.0
  let a = radLat1 - radLat2
  let b = (lon1 * Math.PI) / 180.0 - (lon2 * Math.PI) / 180.0
  let s =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin(a / 2), 2) +
          Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
      )
    )
  s = s * 6378.137
  s = Math.round(s * 1000000) / 1000
  return s
}

export const formatDistance = (distance: number) => {
  if (distance < 1000) {
    return Math.round(distance || 0) + ' m'
  }
  if (distance < 1000 * 10) {
    return Math.round((distance || 0) / 10) / 100 + ' km'
  }
  return Math.round((distance || 0) / 100) / 10 + ' km'
}
