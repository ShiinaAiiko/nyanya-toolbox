package controllersV1

import (
	"time"

	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/protos"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"
	"github.com/cherrai/nyanyago-utils/ncredentials"
	"github.com/cherrai/nyanyago-utils/nint"
	"github.com/cherrai/nyanyago-utils/nshortid"
	"github.com/cherrai/nyanyago-utils/nstrings"
	"github.com/cherrai/nyanyago-utils/ntimer"
	"github.com/cherrai/nyanyago-utils/validation"
	"github.com/pion/turn/v2"

	// "github.com/cherrai/nyanyago-utils/validation"
	"github.com/gin-gonic/gin"
)

type FileTransferController struct {
}

func (ftc *FileTransferController) GetShareCode(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	data := new(protos.GetShareCode_Request)

	log.Info("JoinRoom")
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}
	log.Info(data)
	// 3、验证参数

	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.DeviceId, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	// shareCode := nstrings.ToString(nint.GetRandomNum(1, 9))
	shareCode := nshortid.GetRandomStringInSpecifiedRange("ABCDEFG", 1) + nstrings.ToString(nint.GetRandomNum(100000, 999999))

	token := nshortid.GetShortId(36)

	tKey := conf.Redisdb.GetKey("SocketToken")
	if err = conf.Redisdb.Set(tKey.GetKey(token), token, tKey.GetExpiration()); err != nil {
		res.Code = 10001
		res.Errors(err)
		res.Call(c)
		return
	}

	sKey := conf.Redisdb.GetKey("FTShareCode")
	if err = conf.Redisdb.Set(sKey.GetKey(shareCode), shareCode, sKey.GetExpiration()); err != nil {
		res.Code = 10001
		res.Errors(err)
		res.Call(c)
		return
	}

	t := time.Duration(conf.Config.Turn.Auth.Duration+10000) * time.Second

	username := data.DeviceId
	expired := time.Now().Add(t).Unix()
	username = nstrings.ToString(expired) + ":" + username
	// turnserver 这个值 static-auth-secret=1234567890
	key := "VisdZfSooYoi3WyE"
	hmac := hmac.New(sha1.New, []byte(key))
	hmac.Write([]byte(username))
	// base64.StdEncoding.EncodeToString(hmac.)
	// fmt.Println(hex.EncodeToString(hmac.Sum([]byte(""))))
	password := base64.StdEncoding.EncodeToString(hmac.Sum([]byte("")))

	u, p := username, password

	log.Info("password", password)

	u1, p2, err := turn.GenerateLongTermCredentials(conf.Config.Turn.Auth.Secret, t)
	if err != nil {
		res.Code = 10001
		res.Errors(err)
		res.Call(c)
		return
	}
	ntimer.SetTimeout(func() {

		log.Info(hmac.Sum([]byte("")))
		log.Info("password", username, password)
		log.Info(11221212121, u1, p2)
	}, 2000)

	st := time.Duration(conf.Config.Sfu.Auth.Duration) * time.Second

	su, sp := ncredentials.GenerateCredentials(conf.Config.Sfu.Auth.Secret, st)

	responseData := protos.GetShareCode_Response{
		ShareCode:   shareCode,
		Token:       token,
		SfuUser:     su,
		SfuPassword: sp,
		TurnServer: &protos.TurnServer{
			Urls: []string{
				conf.Config.Turn.Address,
			},
			Username:   u,
			Credential: p,
		},
	}

	res.Data = protos.Encode(&responseData)

	res.Call(c)
}

func (ftc *FileTransferController) ConnectFTRoom(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	data := new(protos.ConnectFTRoom_Request)

	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}
	log.Info(data)

	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.ShareCode, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.DeviceId, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	sKey := conf.Redisdb.GetKey("FTShareCode")
	val, err := conf.Redisdb.Get(sKey.GetKey(data.ShareCode))
	if err != nil || val.String() == "" {
		res.Errors(err)
		res.Code = 10004
		res.Call(c)
		return
	}

	token := nshortid.GetShortId(36)

	tKey := conf.Redisdb.GetKey("SocketToken")
	if err = conf.Redisdb.Set(tKey.GetKey(token), token, tKey.GetExpiration()); err != nil {
		res.Code = 10001
		res.Errors(err)
		res.Call(c)
	}

	t := time.Duration(conf.Config.Turn.Auth.Duration) * time.Second

	username := data.DeviceId
	expired := time.Now().Add(t).Unix()
	username = nstrings.ToString(expired) + ":" + username
	// turnserver 这个值 static-auth-secret=1234567890
	key := "VisdZfSooYoi3WyE"
	hmac := hmac.New(sha1.New, []byte(key))
	hmac.Write([]byte(username))
	// base64.StdEncoding.EncodeToString(hmac.)
	password := base64.StdEncoding.EncodeToString(hmac.Sum([]byte("")))

	u, p := username, password

	log.Info("password", password)

	// u, p, err := turn.GenerateLongTermCredentials(conf.Config.Turn.Auth.Secret, t)
	// if err != nil {
	// 	res.Code = 10001
	// 	res.Errors(err)
	// 	res.Call(c)
	// 	return
	// }

	st := time.Duration(conf.Config.Sfu.Auth.Duration) * time.Second

	su, sp := ncredentials.GenerateCredentials(conf.Config.Sfu.Auth.Secret, st)

	responseData := protos.ConnectFTRoom_Response{
		Token:       token,
		SfuUser:     su,
		SfuPassword: sp,
		TurnServer: &protos.TurnServer{
			Urls: []string{
				conf.Config.Turn.Address,
			},
			Username:   u,
			Credential: p,
		},
	}

	res.Data = protos.Encode(&responseData)
	res.Call(c)
}

func (ftc *FileTransferController) ReconnectFTRoom(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	data := new(protos.ReconnectFTRoom_Request)

	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}
	log.Info(data)

	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.ShareCode, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.DeviceId, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	sKey := conf.Redisdb.GetKey("FTShareCode")

	if err = conf.Redisdb.Set(sKey.GetKey(data.ShareCode), data.ShareCode, sKey.GetExpiration()); err != nil {
		res.Code = 10001
		res.Errors(err)
		res.Call(c)
		return
	}

	token := nshortid.GetShortId(36)

	tKey := conf.Redisdb.GetKey("SocketToken")
	if err = conf.Redisdb.Set(tKey.GetKey(token), token, tKey.GetExpiration()); err != nil {
		res.Code = 10001
		res.Errors(err)
		res.Call(c)
	}

	t := time.Duration(conf.Config.Turn.Auth.Duration) * time.Second

	username := data.DeviceId
	expired := time.Now().Add(t).Unix()
	username = nstrings.ToString(expired) + ":" + username
	// turnserver 这个值 static-auth-secret=1234567890
	key := "VisdZfSooYoi3WyE"
	hmac := hmac.New(sha1.New, []byte(key))
	hmac.Write([]byte(username))
	// base64.StdEncoding.EncodeToString(hmac.)
	password := base64.StdEncoding.EncodeToString(hmac.Sum([]byte("")))

	u, p := username, password

	log.Info("password", password)

	// u, p, err := turn.GenerateLongTermCredentials(conf.Config.Turn.Auth.Secret, t)
	// if err != nil {
	// 	res.Code = 10001
	// 	res.Errors(err)
	// 	res.Call(c)
	// 	return
	// }

	st := time.Duration(conf.Config.Sfu.Auth.Duration) * time.Second

	su, sp := ncredentials.GenerateCredentials(conf.Config.Sfu.Auth.Secret, st)

	responseData := protos.ReconnectFTRoom_Response{
		Token:       token,
		SfuUser:     su,
		SfuPassword: sp,
		TurnServer: &protos.TurnServer{
			Urls: []string{
				conf.Config.Turn.Address,
			},
			Username:   u,
			Credential: p,
		},
	}

	res.Data = protos.Encode(&responseData)
	res.Call(c)
}