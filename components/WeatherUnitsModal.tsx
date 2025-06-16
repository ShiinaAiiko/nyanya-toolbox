import React, { useEffect, useMemo, useRef, useState } from 'react'
import store, { RootState, AppDispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { bindEvent, snackbar, progressBar, alert } from '@saki-ui/core'
import { deepCopy } from '@nyanyajs/utils'
import { weatherSlice } from '../store/weather'
import { configSlice, eventListener, R } from '../store/config'
import {
  SakiAsideModal,
  SakiButton,
  SakiCol,
  SakiDropdown,
  SakiIcon,
  SakiMenu,
  SakiMenuItem,
  SakiModalHeader,
} from '../components/saki-ui-react/components'
import NoSSR from '../components/NoSSR'

const WeatherUnitsModal = ({ visible }: { visible: boolean }) => {
  const { t, i18n } = useTranslation('weatherPage')
  const { config, weather } = useSelector((state: RootState) => {
    const { config, weather } = state
    return {
      config,
      weather,
    }
  })
  const dispatch = useDispatch<AppDispatch>()

  const [openTypeDP, setOpenTypeDP] = useState('')

  return (
    <NoSSR>
      <SakiAsideModal
        ref={
          bindEvent({
            close: () => {
              eventListener.dispatch('CloseModal:WeatherUnitsModal', true)
            },
          }) as any
        }
        onLoaded={() => {
          eventListener.dispatch('LoadModal:WeatherUnitsModal', true)
        }}
        width="100%"
        height="100%"
        max-width={
          config.deviceType === 'Mobile'
            ? '100%'
            : Math.min(400, config.deviceWH.w) + 'px'
        }
        max-height={
          config.deviceType === 'Mobile'
            ? '80%'
            : Math.min(400, config.deviceWH.h) + 'px'
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
        visible={visible}
        overflow="hidden"
        zIndex={200}
      >
        <div className={'weather-units-modal ' + config.deviceType}>
          <div className="wu-header">
            <SakiModalHeader
              border={false}
              back-icon={false}
              close-icon={true}
              right-width={'56px'}
              ref={
                bindEvent({
                  close() {
                    eventListener.dispatch('CloseModal:WeatherUnitsModal', true)
                  },
                }) as any
              }
              title={t('unitModalPageTitle', {
                ns: 'weatherPage',
              })}
            />
          </div>
          <div className="wu-main scrollBarHover">
            <div className="wu-list">
              {Object.keys(weather.selectUnits).map((v, i) => {
                const list: any[] = (weather.selectUnits as any)[v]

                const key = v.replace('Units', '')
                const val: string = (weather.weatherData.units as any)?.[key]

                // console.log('unit', key, val, v, weather.weatherData)

                return (
                  <div className="wu-l-item" key={i}>
                    <div className="item-left">
                      {t(v.replace('Units', 'Unit'), {
                        na: 'weatherPage',
                      })}
                    </div>
                    <div className="item-right">
                      <SakiDropdown
                        visible={openTypeDP === v}
                        floating-direction="Left"
                        z-index="1001"
                        ref={
                          bindEvent({
                            close: (e) => {
                              setOpenTypeDP('')
                            },
                          }) as any
                        }
                      >
                        <SakiButton
                          onTap={() => {
                            setOpenTypeDP(v)
                          }}
                          type="Normal"
                          border="none"
                          padding="4px 6px"
                        >
                          <span
                            style={{
                              color: '#999',
                            }}
                            className=" text-elipsis"
                          >
                            {key === 'timeFormat'
                              ? t(val, {
                                  ns: 'weatherPage',
                                })
                              : val}
                          </span>
                          <SakiIcon
                            width="10px"
                            height="10px"
                            color={'#999'}
                            type="Bottom"
                            margin={'0 0 0 6px'}
                          ></SakiIcon>
                        </SakiButton>
                        <div slot="main">
                          <SakiMenu
                            onSelectvalue={(e) => {
                              console.log('unit', e.detail.value)

                              const tempUnits: any = {
                                ...deepCopy(weather.weatherData.units),
                              }

                              tempUnits[key] = e.detail.value

                              dispatch(
                                weatherSlice.actions.setWeatherUnits(tempUnits)
                              )

                              setOpenTypeDP('')
                            }}
                          >
                            {list.map((sv, si) => {
                              return (
                                <SakiMenuItem
                                  padding="10px 18px"
                                  value={sv}
                                  key={si}
                                  active={sv === val}
                                >
                                  <span>
                                    {key === 'timeFormat'
                                      ? t(sv, {
                                          ns: 'weatherPage',
                                        })
                                      : sv}
                                  </span>
                                </SakiMenuItem>
                              )
                            })}
                          </SakiMenu>
                        </div>
                      </SakiDropdown>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </SakiAsideModal>
    </NoSSR>
  )
}

export default WeatherUnitsModal
