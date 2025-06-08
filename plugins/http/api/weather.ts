import * as proto from '../../../protos'
import * as coding from '../../../protos/socketioCoding'
import protoRoot from '../../../protos/proto'
import store from '../../../store'
import { RSA, AES } from '@nyanyajs/utils'
import { NSocketIoClient, NRequest } from '@nyanyajs/utils'
import { R } from '../../../store/config'
import { RequestProtobuf, getUrl } from '.'
// import { e2eeDecryption, e2eeEncryption } from '../common'

const { ResponseDecode, ParamsEncode } = NRequest.protobuf

export const Weather = () => {
  return {
    async GetUploadToken(
      params: protoRoot.weather.GetUploadTokenOfWeather.IRequest
    ) {
      const { api } = store.getState()

      return await RequestProtobuf<protoRoot.weather.GetUploadTokenOfWeather.IResponse>(
        {
          method: 'GET',
          url: getUrl(
            api.apiUrls.v1.baseUrl,
            api.apiUrls.v1.getUploadTokenOfWeather
          ),

          data: NRequest.protobuf.ParamsEncode<protoRoot.weather.GetUploadTokenOfWeather.IRequest>(
            params,
            protoRoot.weather.GetUploadTokenOfWeather.Request
          ),
        },
        protoRoot.weather.GetUploadTokenOfWeather.Response
      )
    },
    async GetFileUrls() {
      const { api } = store.getState()

      return await RequestProtobuf<protoRoot.weather.GetWeatherFileUrls.IResponse>(
        {
          method: 'GET',
          url: getUrl(
            api.apiUrls.v1.baseUrl,
            api.apiUrls.v1.getWeatherFileUrls
          ),

          data: NRequest.protobuf.ParamsEncode<protoRoot.weather.GetWeatherFileUrls.IRequest>(
            {},
            protoRoot.weather.GetWeatherFileUrls.Request
          ),
        },
        protoRoot.weather.GetWeatherFileUrls.Response
      )
    },
  }
}
