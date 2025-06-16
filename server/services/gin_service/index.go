package gin_service

import (
	"net/http"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/routers"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/middleware"

	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/cherrai/nyanyago-utils/nstrings"
	"github.com/gin-gonic/gin"
)

var log = nlog.New()

var Router *gin.Engine

func Init() {
	gin.SetMode(conf.Config.Server.Mode)

	// Router = gin.New()
	InitRouter()
	run()
}

func InitRouter() {
	// 处理跨域
	// // 错误中间件
	Router.Use(middleware.Error())
	Router.Use(middleware.Cors("*"))
	Router.NoMethod(func(ctx *gin.Context) {
		ctx.String(200, "Meow Whisper!\nNot method.")
	})
	Router.Use(middleware.CheckRouteMiddleware())
	Router.Use(middleware.RoleMiddleware())
	Router.Use(middleware.Params())
	// // 处理返回值
	Router.Use(middleware.Response())
	// // 请求时间中间件
	Router.Use(middleware.RequestTime())
	// // 处理解密加密
	// Router.Use(middleware.Encryption())
	Router.Use(middleware.Authorize())
	Router.GET("/socket.io/*any", gin.WrapH(conf.SocketIO.Server))
	Router.POST("/socket.io/*any", gin.WrapH(conf.SocketIO.Server))

	// midArr := [...]gin.HandlerFunc{GinMiddleware("*"), middleware.Authorize()}
	// fmt.Println(midArr)
	// for _, midFunc := range midArr {
	// 	//fmt.Println(index, "\t",value)
	// 	Router.Use(midFunc)
	// }
	Router.StaticFS("/s", http.Dir("./static"))
	// Router.StaticFile("/favicon.ico", "./client/out/favicon.ico")
	// Router.StaticFile("/", "./client/out/index.html")
	routers.InitRouter(Router)

}

func run() {
	log.Info("Gin Http server created successfully. Listening at :" + nstrings.ToString(conf.Config.Server.Port))
	if err := Router.Run(":" + nstrings.ToString(conf.Config.Server.Port)); err != nil {
		log.Error("failed run app: ", err)

		// time.AfterFunc(500*time.Millisecond, func() {
		// 	run(router)
		// })
	} else {
	}
}
