package routerV1

import (
	controllersV1 "github.com/ShiinaAiiko/nyanya-toolbox/server/controllers/v1"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/middleware"
)

func (r *Routerv1) InitFileTransfer() {
	ftc := new(controllersV1.FileTransferController)

	role := middleware.RoleMiddlewareOptions{
		BaseUrl: r.BaseUrl,
	}
	r.Group.GET(
		role.SetRole(apiUrls["getFileTransferShareCode"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          false,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "protobuf",
		}),
		ftc.GetShareCode)
	r.Group.POST(
		role.SetRole(apiUrls["connectFileTransferRoom"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          false,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "protobuf",
		}),
		ftc.ConnectFTRoom)
	r.Group.POST(
		role.SetRole(apiUrls["reconnectFileTransferRoom"], &middleware.RoleOptionsType{
			CheckApp:           false,
			Authorize:          false,
			RequestEncryption:  false,
			ResponseEncryption: false,
			ResponseDataType:   "protobuf",
		}),
		ftc.ReconnectFTRoom)
}
