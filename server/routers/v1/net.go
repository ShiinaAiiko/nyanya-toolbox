package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/nyanya-toolbox/server/controllers/v1"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/middleware"
)

func (r *Routerv1) InitNet() {
	ic := new(controllersV1.IpController)
	gc := new(controllersV1.GeoController)

	role := middleware.RoleMiddlewareOptions{
		BaseUrl: r.BaseUrl,
	}
	r.Group.GET(
		role.SetRole(apiUrls["ipDetails"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          false,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "json",
		}),
		ic.IpDetails)

	r.Group.GET(
		role.SetRole(apiUrls["urlToIp"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          false,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "json",
		}),
		ic.UrlToIp)

	r.Group.GET(
		role.SetRole(apiUrls["httpProxy"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          false,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "json",
		}),
		ic.HttpProxy)

	r.Group.GET(
		role.SetRole(apiUrls["regeo"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          false,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "json",
		}),
		gc.Regeo)

	r.Group.GET(
		role.SetRole(apiUrls["geo"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          false,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "json",
		}),
		gc.Geo)
}
