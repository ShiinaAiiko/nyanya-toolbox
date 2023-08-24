package routers

import (
	routerV1 "github.com/ShiinaAiiko/nyanya-toolbox/server/routers/v1"

	"github.com/gin-gonic/gin"
)

func InitRouter(r *gin.Engine) {
	rv1 := routerV1.Routerv1{
		Engine:  r,
		BaseUrl: "/api/v1",
	}
	rv1.Init()
}
