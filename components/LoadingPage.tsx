import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import NoSSR from '../components/NoSSR'
import { bindEvent, snackbar } from '@saki-ui/core'
import { useRouter } from 'next/router'

const LoadingPage = (): JSX.Element => {
  const { t, i18n } = useTranslation()

  const [mounted, setMounted] = useState(false)

  const [sakiuiInit, setSakiuiInit] = useState(false)
  const [loadProgressBar, setLoadProgressBar] = useState(false)
  const [progressBar, setProgressBar] = useState(0.01)
  const [hideLoading, setHideLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const htmlEl = document.querySelector('html')
    if (htmlEl) {
      htmlEl.style.overflow = 'hidden'
    }
    setMounted(true)
    setProgressBar(progressBar + 0.2 >= 1 ? 1 : progressBar + 0.2)
  }, [])

  useEffect(() => {
    if (loadProgressBar && sakiuiInit && mounted) {
      progressBar < 1 &&
        setTimeout(() => {
          setProgressBar(1)

          if (location.search.includes('sakiAppPortal=')) {
            const wAny = window as any

            wAny?.sakiui?.appPortal?.loaded?.()
          }
        }, 0)
    }
  }, [loadProgressBar, sakiuiInit, mounted])

  return (
    <div
      onTransitionEnd={() => {
        console.log('onTransitionEnd')
        // setHideLoading(true)
      }}
      className={
        'il-loading active ' +
        // (!(appStatus.noteInitStatus && appStatus.sakiUIInitStatus)
        // 	? 'active '
        // 	: '') +
        (hideLoading ? 'hide' : '')
      }
    >
      <NoSSR>
        <saki-init
          ref={bindEvent({
            mounted(e) {
              setSakiuiInit(true)
            },
          })}
        ></saki-init>
      </NoSSR>
      <div className="loading-logo">
        <img src={'/icons/256x256.png'} alt="" crossOrigin="anonymous" />
      </div>
      <div className="loading-progress-bar">
        <NoSSR>
          <saki-linear-progress-bar
            ref={bindEvent({
              loaded: () => {
                console.log('progress-bar', progressBar)
                setProgressBar(0)
                setTimeout(() => {
                  progressBar < 1 &&
                    setProgressBar(
                      progressBar + 0.2 >= 1 ? 1 : progressBar + 0.2
                    )
                }, 0)
                setLoadProgressBar(true)
              },
              transitionEnd: (e: CustomEvent) => {
                console.log('progress-bar', e)
                if (e.detail === 1) {
                  const el: HTMLDivElement | null =
                    document.querySelector('.il-loading')
                  if (el) {
                    const animation = el.animate(
                      [
                        {
                          opacity: 1,
                        },
                        {
                          opacity: 0,
                        },
                      ],
                      {
                        duration: 500,
                        iterations: 1,
                      }
                    )
                    animation.onfinish = () => {
                      el.style.display = 'none'
                      // setHideLoading(true)

                      const htmlEl = document.querySelector('html')
                      if (htmlEl) {
                        htmlEl.style.overflow = ''
                      }
                      setHideLoading(true)
                    }
                  }
                }
              },
            })}
            max-width="280px"
            transition="width 1s"
            width="100%"
            height="10px"
            progress={progressBar}
            border-radius="5px"
          ></saki-linear-progress-bar>
        </NoSSR>
      </div>
    </div>
  )
}

export default LoadingPage
