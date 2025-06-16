import React, { useEffect, useRef, useState } from 'react'
// import { layoutSlice, ModalType } from '../store/layout'
import store, { AppDispatch, RootState } from '../store'
import { useSelector } from 'react-redux'
import { progressBar } from '@saki-ui/core'
import { useTranslation } from 'react-i18next'
import moment from 'moment'
import { eventListener } from '../store/config'
import { Debounce } from '@nyanyajs/utils'
import WeatherUnitsModal from './WeatherUnitsModal'
// import FindLocationComponent from './FindLocation'
// import CreateCustomTripComponent from './CreateCustomTrip'
// import VisitedCitiesModal from './VisitedCities'
// import JourneyMemoriesModal from './JourneyMemories'
// import AddVehicleComponent from './Vehicle'
// import ReplayTripComponent from './ReplayTrip'
// import TripHistoryComponent from './TripHistory'
// import LoginComponent from './Login'
// import SettingsComponent from './Settings'
// import { useDispatch } from 'react-redux'
// import TripEditComponent from './TripEdit'

const d = new Debounce()

export const LoadModalsComponent = () => {
  const { t, i18n } = useTranslation('prompt')
  const layout = useSelector((state: RootState) => state.layout)

  const [openModalType, setOpenModalType] = useState([] as string[])
  const [isChildLoadedType, setIsChildLoadedType] = useState([] as string[])
  const [loadModalType, setLoadModalType] = useState([] as string[])
  const modalPageTitles = useRef({} as Record<string, string>)

  const pb = useRef(progressBar())
  const timer = useRef<NodeJS.Timeout>()

  const components: {
    type: string
    name: any
    component: React.JSX.Element
  }[] = [
    {
      type: 'WeatherUnitsModal',
      name: t('editTrip', {
        ns: 'tripPage',
      }),
      component: (
        <WeatherUnitsModal
          visible={openModalType.includes('WeatherUnitsModal')}
        />
      ),
    },
  ]
  useEffect(() => {
    components.forEach((v) => {
      eventListener.on('LoadModal:' + v.type, () => {
        console.log('OpenModal loadFunc', v.type)
        loadFunc(v.type)
      })
      eventListener.on('CloseModal:' + v.type, () => {
        setOpenModalType(openModalType.filter((sv) => sv !== v.type))
      })
      eventListener.on(
        'OpenModal:' + v.type,
        ({ pageTitle }: { pageTitle: string }) => {
          console.log(
            'OpenModal',
            isChildLoadedType.includes(v.type),
            openModalType.includes(v.type),
            v.type,
            pageTitle
          )

          // console.log(type, !load, isChildLoaded)
          if (!loadModalType.includes(v.type)) {
            pb.current.open()

            modalPageTitles.current[v.type] = t('loadComponent', {
              ns: 'prompt',
              name: pageTitle,
            })

            pb.current.setProgress({
              progress: 0,
              tipText: modalPageTitles.current[v.type],
            })

            let progress = 0
            timer.current = setInterval(() => {
              progress = progress + 0.04
              progress = progress >= 0.9 ? 0.9 : progress
              pb.current.setProgress({
                progress: progress,
                tipText: modalPageTitles.current[v.type],
              })
            }, 500)

            setLoadModalType(
              loadModalType.filter((sv) => sv !== v.type).concat(v.type)
            )
          }
          if (isChildLoadedType.includes(v.type)) {
            loadFunc(v.type)
          }
        }
      )
    })

    return () => {
      components.forEach((v) => {
        eventListener.removeEvent('LoadModal:' + v.type)
        eventListener.removeEvent('CloseModal:' + v.type)
        eventListener.removeEvent('OpenModal:' + v.type)
      })
    }
  }, [openModalType, isChildLoadedType, loadModalType])

  const loadFunc = (type: string) => {
    if (!isChildLoadedType.includes(type)) {
      clearInterval(timer.current)
      pb.current.setProgress({
        progress: 1,
        tipText: modalPageTitles.current[type],
        onAnimationEnd() {
          pb.current.close()
          setIsChildLoadedType(
            isChildLoadedType.filter((v) => v !== type).concat(type)
          )
          setOpenModalType(openModalType.filter((v) => v !== type).concat(type))
        },
      })
      return
    }
    setOpenModalType(openModalType.filter((v) => v !== type).concat(type))
  }

  return (
    <>
      {/* <NoSSR>
				<saki-modal></saki-modal>
			</NoSSR> */}
      {components.map((v, i) => {
        return (
          <div key={i}>
            {loadModalType?.includes(v.type) ? v.component : ''}
          </div>
        )
      })}
    </>
  )
}

export default LoadModalsComponent
