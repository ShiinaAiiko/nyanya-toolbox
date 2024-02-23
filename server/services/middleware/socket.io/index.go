package socketioMiddleware

import (
	"github.com/ShiinaAiiko/nyanya-toolbox/server/api"
	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
)

var (
	log              = conf.Log
	namespace        = api.Namespace[api.ApiVersion]
	routeEventName   = api.EventName[api.ApiVersion]["routeEventName"]
	requestEventName = api.EventName[api.ApiVersion]["requestEventName"]
)
