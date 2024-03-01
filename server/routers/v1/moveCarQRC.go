package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/nyanya-toolbox/server/controllers/v1"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/middleware"
)

func (r *Routerv1) InitMoveCarQRC() {
	c := new(controllersV1.MoveCarQRCController)

	role := middleware.RoleMiddlewareOptions{
		BaseUrl: r.BaseUrl,
	}
	r.Group.POST(
		role.SetRole(apiUrls["createMoveCarQRC"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          true,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "protobuf",
		}),
		c.CreateMoveCarQRC)

	r.Group.POST(
		role.SetRole(apiUrls["updateMoveCarQRC"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          true,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "protobuf",
		}),
		c.UpdateMoveCarQRC)

	r.Group.GET(
		role.SetRole(apiUrls["getMoveCarQRCList"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          true,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "protobuf",
		}),
		c.GetMoveCarQRCList)

	r.Group.POST(
		role.SetRole(apiUrls["deleteMoveCarQRC"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          true,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "protobuf",
		}),
		c.DeleteMoveCarQRC)

	r.Group.GET(
		role.SetRole(apiUrls["getMoveCarQRC"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          false,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "protobuf",
		}),
		c.GetMoveCarQRC)

	r.Group.POST(
		role.SetRole(apiUrls["sendEmail"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          false,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "protobuf",
		}),
		c.SendEmail)
}
