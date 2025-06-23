import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { Router } from 'next/router'
import '../layouts/Toolbox.scss'
import './[lang]/randomPassword.scss'
import './[lang]/windowsPathToPosixPath.scss'
import './[lang]/avatarBadgeGenerator.scss'
import './[lang]/countdownDays.scss'
import './[lang]/moveCarQRC.scss'
import './[lang]/moveCarQRC/detail.scss'
import './[lang]/fileTransfer.scss'
import './[lang]/countdownDays.scss'
import './[lang]/dateCalculator.scss'
import './[lang]/stopwatch.scss'
import './[lang]/index.scss'
import './[lang]/ip.scss'
import './[lang]/imageColorInversion.scss'
import './[lang]/webScreenRecording.scss'
import '../components/Header.scss'
import '../components/SakiSSOLogin.scss'
import '../components/Statistics.scss'
import '../components/LoadingPage.scss'

import { useRouter } from 'next/router'
import { Provider } from 'react-redux'
import store from '../store'
import Init from '../plugins/init'

import * as nyanyalog from 'nyanyajs-log'
import ErrorBoundary from '../components/ErrorBoundary'

nyanyalog.timer()
nyanyalog.config({
  format: {
    function: {
      fullFunctionChain: false,
    },
    prefixTemplate: '[{{Timer}}] [{{Type}}] [{{File}}]@{{Name}}',
  },
})
// import '../assets/style/base.scss'
function App({ Component, pageProps }: any) {
  const getLayout = Component.getLayout || ((page: any) => page)

  const router = useRouter()

  const ProviderAny = Provider as any

  return (
    <ErrorBoundary>
      <ProviderAny store={store}>
        <>
          <Init />

          {getLayout() ? (
            getLayout(<Component router={router} {...pageProps} />, pageProps)
          ) : (
            <Component router={router} {...pageProps} />
          )}
        </>
      </ProviderAny>
    </ErrorBoundary>
  )
}
export default App
