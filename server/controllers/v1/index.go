package controllersV1

import (
	dbxv1 "github.com/ShiinaAiiko/nyanya-toolbox/server/dbx/v1"
	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/go-resty/resty/v2"
)

var (
	log           = nlog.New()
	moveCarQRCDbx = dbxv1.MoveCarQRCDbx{}
	restyClient   = resty.New()
)
