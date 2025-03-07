package main

import (
	"context"
	"os"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	mongodb "github.com/ShiinaAiiko/nyanya-toolbox/server/db/mongo"
	redisdb "github.com/ShiinaAiiko/nyanya-toolbox/server/db/redis"
	dbxV1 "github.com/ShiinaAiiko/nyanya-toolbox/server/dbx/v1"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/gin_service"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/i18n"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/socketio_service"

	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/cherrai/nyanyago-utils/nredis"
	"github.com/cherrai/nyanyago-utils/ntimer"
	"github.com/cherrai/nyanyago-utils/saass"
	sso "github.com/cherrai/saki-sso-go"

	// sfu "github.com/pion/ion-sfu/pkg/sfu"

	"github.com/go-redis/redis/v8"
)

var (
	log    = nlog.New()
	geoDbx = new(dbxV1.GeoDbx)
)

// 文件到期后根据时间进行删除 未做
func main() {
	nlog.SetPrefixTemplate("[{{Timer}}] [{{Type}}] [{{Date}}] [{{File}}]@{{Name}}")
	nlog.SetName("SAaSS")

	conf.G.Go(func() error {
		configPath := ""
		for k, v := range os.Args {
			switch v {
			case "--config":
				if os.Args[k+1] != "" {
					configPath = os.Args[k+1]
				}

			}
		}
		if configPath == "" {
			log.Error("Config file does not exist.")
			return nil
		}
		conf.GetConfig(configPath)

		// Connect to redis.
		redisdb.ConnectRedis(&redis.Options{
			Addr:     conf.Config.Redis.Addr,
			Password: conf.Config.Redis.Password, // no password set
			DB:       conf.Config.Redis.DB,       // use default DB
		})

		conf.Redisdb = nredis.New(context.Background(), &redis.Options{
			Addr:     conf.Config.Redis.Addr,
			Password: conf.Config.Redis.Password, // no password set
			DB:       conf.Config.Redis.DB,       // use default DB
		}, conf.BaseKey, log)
		conf.Redisdb.CreateKeys(conf.RedisCacheKeys)

		conf.SSO = sso.New(&sso.SakiSsoOptions{
			AppId:  conf.Config.SSO.AppId,
			AppKey: conf.Config.SSO.AppKey,
			Host:   conf.Config.SSO.Host,
			Rdb:    conf.Redisdb,
		})

		conf.SAaSS = saass.New(&saass.Options{
			AppId:      conf.Config.Saass.AppId,
			AppKey:     conf.Config.Saass.AppKey,
			BaseUrl:    conf.Config.Saass.BaseUrl,
			ApiVersion: conf.Config.Saass.ApiVersion,
		})

		mongodb.ConnectMongoDB(conf.Config.Mongodb.Currentdb.Uri, conf.Config.Mongodb.Currentdb.Name)

		i18n.InitI18n()

		// log.Info("conf.Config.Mongodb.Currentdb", conf.Config.Mongodb.Currentdb)
		socketio_service.Init()

		ntimer.SetTimeout(func() {

			geoDbx.InitCity()
			// methods.GetCityBoundaries(conf.Config.CityVersion)

			log.Info("Done.")
		}, 1500)

		gin_service.Init()
		return nil
	})

	conf.G.Error(func(err error) {
		log.Error(err)
	})
	conf.G.Wait()
}
