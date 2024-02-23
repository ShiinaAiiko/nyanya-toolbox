package socketioMiddleware

import (
	"reflect"

	"github.com/cherrai/nyanyago-utils/nsocketio"
)

// 默认全部都要进行加密，且全部输出protobuf
// 全部都要进行权限校验
// 所以权限暂时弃用
func ParamsMiddleware() nsocketio.HandlerFunc {
	return func(e *nsocketio.EventInstance) error {
		paramsDataMap := e.GetParamsMap("data")

		for k, v := range paramsDataMap {
			e.Set(k, v)
		}

		switch reflect.TypeOf(paramsDataMap["data"]).String() {
		case "map[string]interface {}":
			mapData := paramsDataMap["data"].(map[string]interface{})
			for k, v := range mapData {
				log.Info(k, v)
				e.Set(k, v)
			}
		default:
			e.Set("data", paramsDataMap["data"])

		}
		// for _, v := range paramsDataMap["data"] {

		// }
		e.Next()
		return nil
	}
}
