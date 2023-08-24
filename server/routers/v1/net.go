package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/nyanya-toolbox/server/controllers/v1"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/middleware"
)

func (r *Routerv1) InitNet() {
	ic := new(controllersV1.IpController)

	role := middleware.RoleMiddlewareOptions{
		BaseUrl: r.BaseUrl,
	}
	r.Group.GET(
		role.SetRole("/ip/details", &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          false,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "json",
		}),
		ic.IpDetails)
	r.Group.GET(
		role.SetRole("/url/toIp", &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          false,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "json",
		}),
		ic.UrlToIp)
}
