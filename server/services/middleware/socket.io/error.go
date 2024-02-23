package socketioMiddleware

import (
	"reflect"

	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"

	"github.com/cherrai/nyanyago-utils/nsocketio"
)

func Error() nsocketio.HandlerFunc {
	return func(c *nsocketio.EventInstance) error {
		// roles := c.MustGet("roles").(*RoleOptionsType)
		defer func() {
			// fmt.Println("Error middleware.2222222222222")
			if err := recover(); err != nil {
				log.FullCallChain("<"+c.EventName()+">"+" Socket Error: "+err.(error).Error(), "Error")

				var res response.ResponseProtobufType
				res.Code = 10001
				switch reflect.TypeOf(err).String() {
				case "string":
					res.Data = err.(string)
					break
				case "*errors.errorString":
					res.Data = err.(error).Error()
					break
				}
				res.CallSocketIo(c)
			}
		}()
		c.Next()
		return nil
	}
}
