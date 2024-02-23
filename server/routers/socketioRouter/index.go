package socketioRouter

import (
	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/routers/socketioRouter/v1"
)

var namespace = conf.SocketRouterNamespace
var eventName = conf.SocketRouterEventNames

func InitRouter() {
	// fmt.Println(conf.SocketIoServer)

	rv1 := socketioRouter.V1{
		Server: conf.SocketIO,
		Router: socketioRouter.RouterV1{
			Base:         namespace["Base"],
			FileTransfer: namespace["FileTransfer"],
		},
	}
	rv1.Init()
	rv1.InitFileTransfer()
}
