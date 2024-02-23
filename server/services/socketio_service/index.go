package socketio_service

import (
	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/routers/socketioRouter"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/gin_service"
	socketioMiddleware "github.com/ShiinaAiiko/nyanya-toolbox/server/services/middleware/socket.io"

	"github.com/cherrai/nyanyago-utils/nsocketio"
	"github.com/gin-gonic/gin"
	socketio "github.com/googollee/go-socket.io"
)

var (
	log = conf.Log
)
var Server *socketio.Server

// var Router *gin.Engine
// 个人也是一个room，roomId：U+UID
// 群组也是一个room，roomId：G+UID
// ChatMessage 发送消息
// 直接发给对应的roomId即可

// InputStatus 发送正在输入状态
// 直接发给对应的roomId即可

// OnlineStatus 在线状态
// 发送给好友关系存在的roomId

func Init() {
	defer func() {
		if err := recover(); err != nil {
			log.FullCallChain(err.(error).Error(), "error")
		}
	}()
	gin.SetMode(conf.Config.Server.Mode)

	gin_service.Router = gin.New()

	conf.SocketIO = nsocketio.New(&nsocketio.Options{
		RDB: conf.Redisdb,
		RedisAdapterOptions: &socketio.RedisAdapterOptions{
			Addr:    conf.Config.Redis.Addr,
			Prefix:  "socket.io",
			Network: "tcp",
		},
		Log: log,
	})

	// 处理中间件
	conf.SocketIO.Use(socketioMiddleware.Error())
	conf.SocketIO.Use(socketioMiddleware.RoleMiddleware())
	conf.SocketIO.Use(socketioMiddleware.Response())
	conf.SocketIO.Use(socketioMiddleware.ParamsMiddleware())

	socketioRouter.InitRouter()

	// http.Handle("/socket.io/", Server)
	// http.Handle("/", http.FileServer(http.Dir("./asset")))
	// log.Println("Serving at localhost:8000...")
	// log.Fatal(http.ListenAndServe(":8000", nil))

	log.Info("[Socket.IO] server created successfully.")

	// http://localhost:23161
}

// package socketio_service

// import (
// 	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
// 	"github.com/ShiinaAiiko/nyanya-toolbox/server/routers/socketioRouter"

// 	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/gin_service"
// 	socketioMiddleware "github.com/ShiinaAiiko/nyanya-toolbox/server/services/middleware/socket.io"

// 	"github.com/cherrai/nyanyago-utils/nlog"
// 	"github.com/cherrai/nyanyago-utils/nsocketio"
// 	"github.com/gin-gonic/gin"
// 	socketio "github.com/googollee/go-socket.io"
// )

// var (
// 	log = nlog.New()
// )

// // var Router *gin.Engine
// // 个人也是一个room，roomId：U+UID
// // 群组也是一个room，roomId：G+UID
// // ChatMessage 发送消息
// // 直接发给对应的roomId即可

// // InputStatus 发送正在输入状态
// // 直接发给对应的roomId即可

// // OnlineStatus 在线状态
// // 发送给好友关系存在的roomId

// func Init() {
// 	defer func() {
// 		if err := recover(); err != nil {
// 			log.Error(err)
// 		}
// 	}()
// 	gin.SetMode(conf.Config.Server.Mode)
// 	gin_service.Router = gin.New()

// 	// conf.Redisdb
// 	// fmt.Println("Server", Server)

// 	Server := socketio.NewServer(nil)

// 	conf.SocketIO = nsocketio.New(&nsocketio.Options{
// 		RDB: conf.Redisdb,
// 		RedisAdapterOptions: &socketio.RedisAdapterOptions{
// 			Addr:    conf.Config.Redis.Addr,
// 			Prefix:  "socket.io",
// 			Network: "tcp",
// 		},
// 		Server: Server,
// 	})
// 	// conf.SocketIO.Server = Server

// 	// 处理中间件
// 	conf.SocketIO.Use(socketioMiddleware.RoleMiddleware())
// 	conf.SocketIO.Use(socketioMiddleware.Response())
// 	conf.SocketIO.Use(socketioMiddleware.Error())
// 	conf.SocketIO.Use(socketioMiddleware.Decryption())

// 	socketioRouter.InitRouter()

// 	// // redis 适配器
// 	_, err := Server.Adapter(&socketio.RedisAdapterOptions{
// 		Addr:    conf.Config.Redis.Addr,
// 		Prefix:  "socket.io",
// 		Network: "tcp",
// 	})
// 	if err != nil {
// 		log.Error("error:", err)
// 	}

// 	log.Info("[Socket.IO] server created successfully.")

// 	// 接收”bye“事件
// 	Server.OnEvent("/", "bye", func(s socketio.Conn, msg string) string {
// 		last := s.Context().(string)
// 		s.Emit("bye", msg)

// 		log.Info("============>", last, msg)
// 		//s.Close()
// 		return last
// 	})

// 	Server.OnError("/", func(s socketio.Conn, e error) {
// 		log.Error("连接错误:", e)
// 	})
// 	Server.OnDisconnect("/", func(s socketio.Conn, reason string) {
// 		log.Warn(s.ID()+"关闭了连接：", reason)
// 	})

// 	log.Info("	Server", Server)

// 	// go Server.Serve()
// 	go func() {
// 		if err := Server.Serve(); err != nil {
// 			log.Error("[Socket.IO]socketio listen error: ", err)
// 		}
// 	}()
// 	defer Server.Close()

// 	conf.SocketIO.Init()
// }

// func ErrorMiddleware() {
// 	defer func() {
// 		if err := recover(); err != nil {
// 			log.Error("=========Socket.IO ErrorMiddleware=========")
// 			log.Error(err)
// 			log.Error("=========Socket.IO ErrorMiddleware=========")
// 		}
// 	}()
// }
