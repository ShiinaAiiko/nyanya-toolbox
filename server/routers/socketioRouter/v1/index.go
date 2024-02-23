package socketioRouter

import (
	socketIoControllersV1 "github.com/ShiinaAiiko/nyanya-toolbox/server/controllers/socketio/v1"

	"github.com/cherrai/nyanyago-utils/nsocketio"
)

type V1 struct {
	Server *nsocketio.NSocketIO
	Router RouterV1
}

type RouterV1 struct {
	Base         string
	FileTransfer string
}

func (v V1) Init() {
	r := v.Router

	// s.OnConnect(r.Chat, func(s socketio.Conn) error {
	// 	fmt.Println(r.Chat+"连接成功：", s.ID())
	// 	return nil
	// })

	// r := v.Router
	bc := new(socketIoControllersV1.BaseController)
	v.Server.OnConnect(r.Base, bc.Connect)
	v.Server.OnDisconnect(r.Base, bc.Disconnect)

}
