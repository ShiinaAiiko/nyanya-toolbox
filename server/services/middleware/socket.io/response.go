package socketioMiddleware

import (
	"github.com/cherrai/nyanyago-utils/nsocketio"
)

func Response() nsocketio.HandlerFunc {
	return func(c *nsocketio.EventInstance) error {
		defer func() {
			// var res response.ResponseProtobufType
			// log.Info("Response")
			getProtobufDataResponse, _ := c.Get("protobuf")
			// log.Info("getProtobufDataResponse", getProtobufDataResponse)

			// 暂定默认需要加密
			// userAesKeyInterface, exists := c.Get("userAesKey")
			// // log.Info("c.EventName()", c.EventName())
			// log.Info("userAesKeyInterface, exists", userAesKeyInterface, exists, !exists)
			// if !exists {
			// 	baseCC := c.ServerContext().GetConnContext(namespace["base"], c.ConnContext().ID())
			// 	res.Code = 10009
			// 	baseCC.Emit(routeEventName["error"], res.GetResponse())
			// 	return
			// }
			// log.Info("userAesKeyInterface, exists", userAesKeyInterface, exists, !exists)
			// log.Info("userAesKey", userAesKey)
			requestId := c.GetParamsString("requestId")
			// log.Info("requestId", requestId)

			// log.Info(res.Encryption(userAesKey, getProtobufDataResponse))

			c.Emit(map[string]interface{}{
				"data":      getProtobufDataResponse,
				"requestId": requestId,
			})
			// c.Emit(routeEventName["error"], res.GetResponse())

			// log.Info("getProtobufDataResponse", getProtobufDataResponse)
		}()

		c.Next()
		return nil
	}
}
