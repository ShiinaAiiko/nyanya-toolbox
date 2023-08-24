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
}
