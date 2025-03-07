package conf

import (
	"time"

	"github.com/cherrai/nyanyago-utils/nredis"
)

var Redisdb *nredis.NRedis

var BaseKey = "meow-whisper"

var RedisCacheKeys = map[string]*nredis.RedisCacheKeysType{
	"GetShortUrl": {
		Key:        "GetShortUrl",
		Expiration: 5 * 60 * time.Second,
	},
	"FTShareCode": {
		Key:        "FTShareCode",
		Expiration: 5 * 60 * time.Second,
	},
	"SocketToken": {
		Key:        "SocketToken",
		Expiration: 5 * 60 * time.Second,
	},
	"GetMoveCarQRC": {
		Key:        "GetMoveCarQRC",
		Expiration: 5 * 60 * time.Second,
	},
	"GetMoveCarQRCList": {
		Key:        "GetMoveCarQRCList",
		Expiration: 5 * 60 * time.Second,
	},
	"Regeo": {
		Key:        "Regeo",
		Expiration: 30 * 60 * time.Second,
	},
	"RegeoByAmap": {
		Key:        "RegeoByAmap",
		Expiration: 2 * 60 * time.Second,
	},
}
