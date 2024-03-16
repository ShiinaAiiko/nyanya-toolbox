package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/nyanya-toolbox/server/controllers/v1"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/middleware"
)

func (r *Routerv1) InitCountdownDays() {
	c := new(controllersV1.CountdownDaysController)

	role := middleware.RoleMiddlewareOptions{
		BaseUrl: r.BaseUrl,
	}
	r.Group.GET(
		role.SetRole(apiUrls["getUploadTokenOfCountdownDays"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          true,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "protobuf",
		}),
		c.GetUploadToken)
	r.Group.GET(
		role.SetRole(apiUrls["getCountdownDaysFileUrls"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          true,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "protobuf",
		}),
		c.GetCountdownDaysFileUrls)
}
