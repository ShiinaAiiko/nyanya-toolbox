import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { RootState, AppDispatch, methods, apiSlice } from '../store'
import { useSelector, useStore, useDispatch } from 'react-redux'

import * as nyanyalog from 'nyanyajs-log'
import { initPublic } from './public'
import { sakiui, meowApps } from '../config'
import Script from 'next/script'

nyanyalog.timer()

const Init = () => {
  const dispatch = useDispatch<AppDispatch>()

  const router = useRouter()
  useEffect(() => {
    initPublic()
    const init = async () => {
      await dispatch(methods.config.init()).unwrap()
    }
    init()
  }, [])

  // console.log('413213213')
  console.log('router1', router, router.query.lang)

  return (
    <>
      <Head>
        <link
          rel="icon"
          href={
            router.pathname.includes('/weather')
              ? '/weather-icons/64x64.ico'
              : '/favicon.ico'
          }
        />
        <link
          rel="manifest"
          href={`${
            router.query.lang && router.query.lang !== 'en-US'
              ? '/' + router.query.lang
              : ''
          }/${
            router.pathname.includes('/weather') ? 'weather-' : ''
          }manifest.json`}
        />

        <link rel="stylesheet" type="text/css" href="/color.css"></link>

        <script src="/js/sw-register.js" defer></script>

        <meta httpEquiv="X-UA-Compatible" content="IE=edge"></meta>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        ></meta>

        <script noModule src={meowApps.jsurl} async></script>
        <script type="module" src={meowApps.esmjsurl} async></script>
        <script noModule src={sakiui.jsurl} async></script>
        <script type="module" src={sakiui.esmjsurl} async></script>
      </Head>
    </>
  )
}

export default Init
