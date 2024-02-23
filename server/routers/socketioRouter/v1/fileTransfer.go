package socketioRouter

import (
	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	socketIoControllersV1 "github.com/ShiinaAiiko/nyanya-toolbox/server/controllers/socketio/v1"
)

func (v V1) InitFileTransfer() {
	r := v.Router

	fc := socketIoControllersV1.FileTransferControllers{}

	// s.OnConnect(r.Chat, func(s socketio.Conn) error {
	// 	fmt.Println(r.Chat+"连接成功：", s.ID())
	// 	return nil
	// })
	v.Server.OnConnect(r.FileTransfer, fc.NewConnect)
	v.Server.OnDisconnect(r.FileTransfer, fc.Disconnect)

	v.Server.Router(r.FileTransfer, conf.SocketRequestEventNames["JoinFTRoom"], fc.JoinFTRoom)
	v.Server.Router(r.FileTransfer, conf.SocketRequestEventNames["LeaveFTRoom"], fc.LeaveFTRoom)
	v.Server.Router(r.FileTransfer, conf.SocketRequestEventNames["IncreaseFTRoomTimeLimit"], fc.IncreaseFTRoomTimeLimit)
	v.Server.Router(r.FileTransfer, conf.SocketRequestEventNames["Data"], fc.Data)

}
