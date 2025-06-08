package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/nyanya-toolbox/server/controllers/v1"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/middleware"
)

func (r *Routerv1) InitWeather() {
	c := new(controllersV1.WeatherController)

	role := middleware.RoleMiddlewareOptions{
		BaseUrl: r.BaseUrl,
	}
	r.Group.GET(
		role.SetRole(apiUrls["getUploadTokenOfWeather"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          true,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "protobuf",
		}),
		c.GetUploadToken)
	r.Group.GET(
		role.SetRole(apiUrls["getWeatherFileUrls"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          true,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "protobuf",
		}),
		c.GetWeatherFileUrls)
}
