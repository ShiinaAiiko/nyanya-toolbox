package socketIoControllersV1

import (

	// "github.com/cherrai/saki-sso-go"

	"time"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/protos"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"
	"github.com/pasztorpisti/qs"

	// dbxV1 "github.com/ShiinaAiiko/nyanya-toolbox/server/dbx/v1"
	"github.com/cherrai/nyanyago-utils/nsocketio"
)

var (
	// messagesDbx      = dbxV1.MessagesDbx{}
	// contactDbx       = dbxV1.ContactDbx{}
	// groupDbx         = dbxV1.GroupDbx{}
	log       = conf.Log
	namespace = conf.SocketRouterNamespace
)

type BaseController struct {
}

func (bc *BaseController) Connect(e *nsocketio.EventInstance) error {

	var res response.ResponseType
	log.Info("/ => 正在进行连接.")
	// Conn := e.Conn()

	c := e.ConnContext()
	log.Info(c)

	queryMap := map[string]string{}

	err := qs.Unmarshal(&queryMap, c.Conn.URL().RawQuery)
	if err != nil {
		res.Code = 10002
		res.Errors(err)
		c.Emit(conf.SocketRouterEventNames["Error"], res.GetResponse())
		go c.Close()
		return err
	}

	data := new(protos.RequestType)
	if err = protos.DecodeBase64(queryMap["data"], data); err != nil {
		res.Code = 10002
		res.Errors(err)
		c.Emit(conf.SocketRouterEventNames["Error"], res.GetResponse())
		go c.Close()
		return err
	}
	log.Info("data", data)

	tKey := conf.Redisdb.GetKey("SocketToken")
	val, err := conf.Redisdb.Get(tKey.GetKey(data.Token))
	if err != nil || val.String() != data.Token {
		res.Code = 10004
		res.Errors(err)
		c.Emit(conf.SocketRouterEventNames["Error"], res.GetResponse())
		go c.Close()
		return err
	}

	conf.Redisdb.Delete(tKey.GetKey(data.Token))

	c.SetSessionCache("loginTime", time.Now().Unix())
	c.SetSessionCache("deviceId", data.DeviceId)
	c.SetSessionCache("userAgent", data.UserAgent)
	c.SetTag("DeviceId", data.DeviceId)

	log.Info("/ " + ", Connection to Successful.")

	return nil
}

func (bc *BaseController) Disconnect(e *nsocketio.EventInstance) error {

	log.Info("/ => 已经断开了")

	return nil
}
