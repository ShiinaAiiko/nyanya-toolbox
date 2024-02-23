package modules

import (
	"encoding/json"
	"net/http"
	"net/url"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/sfu/config"
	"github.com/cherrai/nyanyago-utils/ncredentials"
	// "github.com/go-resty/resty/v2"
)

// var (
// 	request = resty.New()
// )

type CustomData struct {
	SfuUser     string
	SfuPassword string
	RoomId      string
}

func WSAuth(r *http.Request) bool {

	u, _ := url.Parse(r.URL.String())
	values := u.Query()

	log.Info("------------------开始校验------------------")

	token := values.Get("token")

	log.Info("token", token)
	var customData CustomData
	err := json.Unmarshal([]byte(values.Get("customData")), &customData)
	if err != nil {
		log.Error("err: ", err)
		return false
	}

	log.Info("customData", customData, ncredentials.AuthCredentials(customData.SfuUser, customData.SfuPassword, conf.Config.SharedSecret))
	log.Info("Connection succeeded")
	return ncredentials.AuthCredentials(customData.SfuUser, customData.SfuPassword, conf.Config.SharedSecret)
}
