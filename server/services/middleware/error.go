package middleware

import (
	"fmt"
	"reflect"
	"runtime"

	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"

	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/gin-gonic/gin"
)

var (
	Log = nlog.New()
)

func Error() gin.HandlerFunc {
	return func(c *gin.Context) {
		// roles := c.MustGet("roles").(*RoleOptionsType)
		defer func() {
			// fmt.Println("Error middleware.2222222222222")
			// fmt.Println("roles1", roles)
			// fmt.Println("Error mid getRoles", roles.ResponseDataType)
			if err := recover(); err != nil {
				Log.Error("<"+c.Request.URL.Path+">", "Gin Error: ", err.(error))
				for i := 2; i < 10; i++ {
					_, fn, line, _ := runtime.Caller(i)
					fmt.Println("file:", fn, "line:", line)
				}
				var res response.ResponseType
				res.Code = 10001
				switch reflect.TypeOf(err).String() {
				case "string":
					res.Error = err.(string)
				case "*errors.errorString":
					res.Error = err.(error).Error()
				case "runtime.errorString":
					res.Error = err.(error).Error()
				}
				res.Call(c)
				c.Abort()
			}
		}()
		c.Next()
	}
}
