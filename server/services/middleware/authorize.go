package middleware

import (
	"encoding/json"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"

	sso "github.com/cherrai/saki-sso-go"

	"github.com/gin-gonic/gin"
)

func CheckAuthorize(c *gin.Context) int64 {
	// 解析用户数据
	token := c.GetString("token")
	deviceId := c.GetString("deviceId")
	// log.Info(deviceId, token)
	userAgent := new(sso.UserAgent)
	userAgentAny, isUserAgentAny := c.Get("userAgent")
	// log.Info(userAgentAny)
	if !isUserAgentAny {
		return 10004
	}
	if token == "" || deviceId == "" || userAgent == nil {
		return 10004
	}
	userAgent = userAgentAny.(*sso.UserAgent)
	// Log.Info("token, deviceId, userAgent", deviceId, *userAgent)
	ret, err := conf.SSO.Verify(token, deviceId, userAgent)
	// log.Info(ret, err)
	if err != nil {
		return 10004
	}
	if ret != nil && ret.UserInfo.Uid != "" {
		c.Set("userInfo", ret.UserInfo)
		c.Set("loginInfo", ret.LoginInfo)
		c.Set("deviceId", ret.LoginInfo.DeviceId)

		return 200
	}
	return 10004
}

func Authorize() gin.HandlerFunc {
	return func(c *gin.Context) {
		if _, isStaticServer := c.Get("isStaticServer"); isStaticServer {
			c.Next()
			return
		}
		if _, isWsServer := c.Get("WsServer"); isWsServer {
			c.Next()
			return
		}

		roles := new(RoleOptionsType)
		getRoles, isRoles := c.Get("roles")
		if isRoles {
			roles = getRoles.(*RoleOptionsType)
		}

		// Log.Info("------Authorize------", roles.Authorize)

		if roles.Authorize {
			res := response.ResponseProtobufType{}
			res.Code = 10004

			if code := CheckAuthorize(c); code == 10004 {
				res.Code = 10004
				res.Call(c)
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

func ConvertResponseJson(jsonStr []byte) (sso.UserInfo, error) {
	var m sso.UserInfo
	err := json.Unmarshal([]byte(jsonStr), &m)
	if err != nil {
		Log.Info("Unmarshal with error: %+v\n", err)
		return m, err
	}
	return m, nil
}
