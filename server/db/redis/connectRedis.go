package redisdb

import (
	"context"
	"time"

	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/go-redis/redis/v8"
)

// 声明一个全局的rdb变量
var Rdb *redis.Client
var ctx = context.Background()

var (
	Log = nlog.New()
)

func ConnectRedis(option *redis.Options) {
	Rdb = redis.NewClient(option)

	Set("ConnectRedis", "Connected to Redis!", 1*time.Second)
	val, err := Rdb.Get(ctx, "ConnectRedis").Result()
	if err != nil {
		Log.Info("Redis connection error: ", err)
		return
	}
	Log.Info(val)

}
func Set(key string, value interface{}, expiration time.Duration) error {
	err := Rdb.Set(ctx, key, value, expiration).Err()
	if err != nil {
		return err
	}
	return nil
}

//func Expire()

func Get(key string) (string, error) {
	val, err := Rdb.Get(ctx, key).Result()
	if err != nil {
		return "", err
	}
	return val, nil
}
