package middleware

import (
	"github.com/ShiinaAiiko/nyanya-toolbox/server/protos"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"
	sso "github.com/cherrai/saki-sso-go"
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/copier"
)

func Params() gin.HandlerFunc {
	return func(c *gin.Context) {
		if _, isHttpServer := c.Get("isHttpServer"); !isHttpServer {
			c.Next()
			return
		}

		roles := new(RoleOptionsType)
		getRoles, isRoles := c.Get("roles")
		if isRoles {
			roles = getRoles.(*RoleOptionsType)
		}

		if roles.ResponseDataType == "protobuf" {
			res := response.ResponseProtobufType{}
			res.Code = 10015
			data := ""
			switch c.Request.Method {
			case "GET":
				data = c.Query("data")

			case "POST":
				data = c.PostForm("data")
			default:
				break
			}
			c.Set("data", data)
			// log.Info("data", data)

			dataProto := new(protos.RequestType)

			var err error
			if err = protos.DecodeBase64(data, dataProto); err != nil {
				res.Error = err.Error()
				res.Code = 10002
				res.Call(c)
				c.Abort()
				return
			}
			// log.Info(dataProto)
			c.Set("data", dataProto.Data)
			c.Set("token", dataProto.Token)
			c.Set("deviceId", dataProto.DeviceId)
			c.Set("language", dataProto.Language)

			ua := new(sso.UserAgent)
			copier.Copy(ua, dataProto.UserAgent)
			c.Set("userAgent", ua)

			c.Next()
			return
		}

		c.Next()
	}
}
