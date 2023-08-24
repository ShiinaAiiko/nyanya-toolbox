package routerV1

import (
	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/gin-gonic/gin"
)

var (
	log = nlog.New()
)

type Routerv1 struct {
	Engine  *gin.Engine
	Group   *gin.RouterGroup
	BaseUrl string
}

func (r *Routerv1) Init() {
	r.Group = r.Engine.Group(r.BaseUrl)
	r.InitNet()
}
