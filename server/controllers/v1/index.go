package controllersV1

import (
	dbxv1 "github.com/ShiinaAiiko/nyanya-toolbox/server/dbx/v1"
	"github.com/cherrai/nyanyago-utils/nlog"
)

var (
	log           = nlog.New()
	moveCarQRCDbx = dbxv1.MoveCarQRCDbx{}
	geoDbx = dbxv1.GeoDbx{}
)
