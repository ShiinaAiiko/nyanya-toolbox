import * as proto from '../../../protos'
import * as coding from '../../../protos/socketioCoding'
import protoRoot from '../../../protos/proto'
import store from '../../../store'
import { RSA, AES, deepCopy } from '@nyanyajs/utils'
import { NSocketIoClient, NRequest } from '@nyanyajs/utils'
import { R } from '../../../store/config'
import { RequestProtobuf, getUrl } from '.'
import { server } from '../../../config'
import {
  networkConnectionStatusDetection,
  networkConnectionStatusDetectionEnum,
} from '@nyanyajs/utils/dist/common/common'
// import { e2eeDecryption, e2eeEncryption } from '../common'

const { ResponseDecode, ParamsEncode } = NRequest.protobuf

export interface CityInfo {
  country: string
  state: string
  region: string
  city: string
  town: string
  road: string
  address: string
  lat: number
  lng: number
}

export const Geo = () => {
  return {
    regeo: async ({ lat, lng }: { lat: number; lng: number }) => {
      const { config } = store.getState()

      let newCi: CityInfo = {
        country: '',
        state: '',
        region: '',
        city: '',
        town: '',
        road: '',
        address: '',
        lat,
        lng,
      }

      const osmAPI = async () => {
        const res: any = await R.request({
          method: 'GET',
          url: `
          https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=12&accept-language=${config.lang}
          `,
        })
        console.log('GetCity regeo osm', res.data)
        let tempCI: typeof newCi = deepCopy(newCi)
        if (!res?.data?.name) {
          return tempCI
        }
        const data = res.data as any
        tempCI = {
          country: data.address.country || '',
          state: data.address.state || '',
          region: data.address.state_district || data.address.region || '',
          city: data.address.city || data.address.county,
          town:
            data.address.town ||
            data.address.village ||
            data.address.suburb ||
            '',
          road: data.address.road || '',

          address: '',
          lat,
          lng,
        }
        tempCI.address = (
          data.display_name
            ? (data.display_name as string)
                .split(',')
                .reverse()
                .map((v) => v.replace(/[0-9,\-/]+/g, '').trim())
            : [newCi.country, newCi.state, newCi.region, newCi.city, newCi.town]
        )
          .filter((v) => v)
          .join('·')

        return tempCI
      }

      const connectionOpenStreetMap = await networkConnectionStatusDetection(
        networkConnectionStatusDetectionEnum.openStreetMap
      )
      // console.log(
      //   'networkConnectionStatusDetection connectionOpenStreetMap',
      //   connectionOpenStreetMap
      // )
      if (connectionOpenStreetMap) {
        newCi = await osmAPI()
        return newCi
      }

      const res = await R.request({
        method: 'GET',
        url:
          // `https://restapi.amap.com/v3/geocode/regeo?output=json&location=104.978701,24.900169&key=fb7fdf3663af7a532b8bdcd1fc3e6776&radius=100&extensions=all`
          // `https://restapi.amap.com/v3/geocode/regeo?output=json&location=${lon},${lat}&key=fb7fdf3663af7a532b8bdcd1fc3e6776&radius=100&extensions=all`
          // `https://nominatim.aiiko.club/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=${zoom}&addressdetails=1&accept-language=zh-CN`,
          server.url +
          `/api/v1/geocode/regeo?latitude=${lat}&longitude=${lng}&platform=Amap`,
        // `https://tools.aiiko.club/api/v1/geocode/regeo?latitude=${lat}&longitude=${lon}&platform=Amap`
      })

      if (res?.data?.code !== 200 || !res?.data?.data?.country) {
        newCi = await osmAPI()
        return newCi
      }

      const data = res.data.data as any
      console.log('GetCity regeo', data)

      newCi = {
        country: data.country,
        state: data.state,
        region: data.region,
        city: data.city,
        town: data.town,
        road: data.road,
        address: [data.country, data.state, data.region, data.city, data.town]
          .filter((v) => v)
          .join('·'),
        lat,
        lng,
      }

      return newCi
    },
    search: async ({ keywords }: { keywords: string }) => {
      const { config } = store.getState()

      const connectionOpenStreetMap = await networkConnectionStatusDetection(
        networkConnectionStatusDetectionEnum.openStreetMap
      )
      // console.log(
      //   'networkConnectionStatusDetection connectionOpenStreetMap',
      //   connectionOpenStreetMap
      // )
      if (connectionOpenStreetMap) {
        const res = await R.request({
          method: 'GET',
          url: `https://nominatim.openstreetmap.org/search?q=${keywords}&format=jsonv2&addressdetails=1&accept-language=${config.lang}`,
        })
        if (res.data) {
          return res.data
        }
      }

      const res = await R.request({
        method: 'GET',
        url:
          // `https://restapi.amap.com/v3/geocode/regeo?output=json&location=104.978701,24.900169&key=fb7fdf3663af7a532b8bdcd1fc3e6776&radius=100&extensions=all`
          // `https://restapi.amap.com/v3/geocode/regeo?output=json&location=${lon},${lat}&key=fb7fdf3663af7a532b8bdcd1fc3e6776&radius=100&extensions=all`
          // `https://nominatim.aiiko.club/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=${zoom}&addressdetails=1&accept-language=zh-CN`,
          // server.url +
          `https://nominatim.aiiko.club/search?q=${keywords}&format=jsonv2&addressdetails=1&accept-language=${config.lang}`,
        // `https://tools.aiiko.club/api/v1/geocode/regeo?latitude=${lat}&longitude=${lon}&platform=Amap`
      })
      return res.data
    },
  }
}
