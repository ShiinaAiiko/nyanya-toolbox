import Head from 'next/head'
import { getLayout } from '../../layouts/Toolbox'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { RootState, layoutSlice } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  changeLanguage,
  languages,
  defaultLanguage,
} from '../../plugins/i18n/i18n'
const json = require('../../public/appList.json')
const appList: {
  title: {
    [lang: string]: string
  }
  url: string
  logo: string
  logoText: string
}[] = json.appList

const IndexPage = () => {
  const { t, i18n } = useTranslation('')
  const [mounted, setMounted] = useState(false)
  const config = useSelector((state: RootState) => state.config)
  const router = useRouter()

  const dispatch = useDispatch()

  console.log('appListappList', appList)

  useEffect(() => {
    setMounted(true)

    const init = async () => {
      console.log('langg')
      const lang = localStorage.getItem('language') || ''
      // if (lang === 'system') {
      // 	return
      // }
      config.pwaApp &&
        lang &&
        router.replace(
          'https://tools.aiiko.club/' + (lang !== 'system' ? lang : '')
        )
    }
    init()
  }, [config.pwaApp])

  useEffect(() => {
    dispatch(
      layoutSlice.actions.setLayoutHeaderLogoText(
        t('appTitle', {
          ns: 'common',
        })
      )
    )
  }, [i18n.language])

  return (
    <>
      <Head>
        <title>
          {t('appTitle', {
            ns: 'common',
          })}
        </title>
        <meta
          name="description"
          content={t('appSubtitle', {
            ns: 'common',
          })}
        />
      </Head>
      <div className="index-page">
        <div className="ip-main">
          <div className="ip-m-title">
            {t('appTitle', {
              ns: 'common',
            })}
          </div>
          <div className="ip-m-subtitle">
            {t('appSubtitle', {
              ns: 'common',
            })}
          </div>
          <div className="ip-c-list">
            {appList.map((v, i) => {
              const urls = v.url.split('/')
              let ns = urls[urls.length - 1] + 'Page'
              if (v.url.indexOf('trip.') >= 0) {
                ns = 'tripPage'
              }
              let title = t('pageTitle', {
                ns,
              })
              let description = t('subtitle', {
                ns,
              })

              if (title === 'pageTitle') {
                title = v.title[config.lang]
              }
              if (description === 'subtitle') {
                description = title
              }

              let url = v.url.replace(
                'tools.aiiko.club/',
                'tools.aiiko.club/' +
                  // 'http://192.168.204.132:23200/' +
                  (router.query.lang ? router.query.lang + '/' : '')
              )
              if (mounted) {
                url = url.replace(
                  'https://tools.aiiko.club',
                  location?.origin.indexOf('192.168.') >= 0
                    ? location?.origin
                    : 'https://tools.aiiko.club'
                )
              }
              return (
                <a
                  key={i}
                  href={url}
                  target={config.pwaApp ? '' : '_blank'}
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                  className={'ip-c-l-item des'}
                >
                  <div className={'ip-c-l-i-top'}>
                    <div className={'ip-c-l-i-logo'}>
                      {mounted && (
                        <saki-avatar
                          nickname={v.logoText}
                          border-radius={'6px'}
                          width="50px"
                          height="50px"
                          src={v.logo || ''}
                          lazyload={false}
                        ></saki-avatar>
                      )}
                    </div>
                    <div className={'ip-c-l-i-right'}>
                      <div className={'ip-c-l-i-appName'} title={title}>
                        <div className={'appName text-elipsis'}>{title}</div>
                      </div>
                      <div
                        className={
                          'ip-c-l-i-description text-two-elipsis'
                          // + (sv?.description ? "text-two-elipsis" : "")
                        }
                      >
                        {description}
                      </div>
                    </div>
                  </div>
                  <div className={'ip-c-l-i-border'}></div>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
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
  return {
    props: {
      lang: params.lang || defaultLanguage,
    },
  }
}
IndexPage.getLayout = getLayout

export default IndexPage
