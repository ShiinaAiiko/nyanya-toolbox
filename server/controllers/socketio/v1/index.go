package socketIoControllersV1

import (

	// "github.com/cherrai/saki-sso-go"

	"time"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/protos"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/typings"
	"github.com/jinzhu/copier"
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

func (bc *BaseController) NewConnect(e *nsocketio.EventInstance) error {
	var res response.ResponseProtobufType
	Conn := e.Conn()
	c := e.ConnContext()
	log.Info("正在进行连接.")
	queryMap := map[string]string{}
	query := typings.SocketQuery{}
	// log.Info(Conn.URL().RawQuery)

	var err error
	if err = qs.Unmarshal(&queryMap, Conn.URL().RawQuery); err != nil {
		res.Code = 10002
		res.Errors(err)
		Conn.Emit(conf.SocketRouterEventNames["Error"], res.GetResponse())
		log.Info("------Close------")
		defer Conn.Close()
		return err
	}
	data := new(protos.RequestType)
	if err = protos.DecodeBase64(queryMap["data"], data); err != nil {
		res.Code = 10002
		res.Errors(err)
		Conn.Emit(conf.SocketRouterEventNames["Error"], res.GetResponse())
		log.Info("------Close------")
		defer Conn.Close()
		return err
	}
	log.Info("data", data)

	query.Token = data.Token
	query.DeviceId = data.DeviceId
	copier.Copy(&query.UserAgent, data.UserAgent)

	getUser, err := conf.SSO.Verify(query.Token, query.DeviceId, &query.UserAgent)

	// log.Info(query.Token, query.DeviceId, &query.UserAgent)
	log.Info(1, getUser, 2, err)
	if err != nil || getUser == nil || getUser.UserInfo.Uid == "" {
		res.Code = 10004
		res.Errors(err)
		// res.Data = "SSO Error: " + err.Error()
		Conn.Emit(conf.SocketRouterEventNames["Error"], res.GetResponse())
		log.Info("------Close------")
		defer Conn.Close()
		return err
	} else {
		log.Info("getUser", getUser)
		log.Info(1, conf.SocketIO.GetConnContextByTag(conf.SocketRouterNamespace["Base"], "DeviceId", query.DeviceId))
		log.Info(2)
		// 	// 检测之前是否登录过了，登录过把之前的实例干掉
		for _, v := range conf.SocketIO.GetConnContextByTag(conf.SocketRouterNamespace["Base"], "DeviceId", query.DeviceId) {
			log.Info(v.Conn.ID(), Conn.ID())
			if v.Conn.ID() == Conn.ID() {
				continue
			}
			// // 1、发送信息告知对方下线
			// var res response.ResponseProtobufType
			// res.Code = 200
			// res.Data = protos.Encode(&protos.OnForceOffline_Response{})
			// eventName := conf.SocketRouterEventNames["OnForceOffline"]
			// responseData := res.GetResponse()
			// isEmit := v.Emit(eventName, responseData)
			// if isEmit {
			// 2、断开连接
			log.Info("有另外一个设备在线")
			go v.Close()
			// }
		}
		// log.Info("UID " + strconv.FormatInt(getUser.Payload.Uid, 10) + ", Connection to Successful.")
		// log.Info("/ UID", getUser.Payload.Uid)

		c.SetSessionCache("loginTime", time.Now().Unix())
		c.SetSessionCache("userInfo", getUser.UserInfo)
		c.SetSessionCache("deviceId", query.DeviceId)
		c.SetSessionCache("userAgent", &query.UserAgent)
		c.SetTag("Uid", getUser.UserInfo.Uid)
		c.SetTag("DeviceId", query.DeviceId)

		log.Warn("SocketIO Client连接成功：", Conn.ID(), "/ UID", getUser.UserInfo.Uid)

		// // 	// sc.SetUserInfo(&ret.Payload)

		// // log.Info("------ 1、检测其他设备是否登录------")
		// // 1、检测其他设备是否登录
		// sc := e.ServerContext()
		// getConnContext := sc.GetConnContextByTag(conf.SocketRouterNamespace["Base"], "Uid", getUser.UserInfo.Uid)
		// // log.Info("当前ID", c.ID())
		// // log.Info("有哪些设备在线", getConnContext)

		// onlineDeviceListMap := map[string]*protos.OnlineDeviceList{}
		// onlineDeviceList := []*protos.OnlineDeviceList{}
		// // 2、遍历设备实例、告诉对方上线了
		// for _, cctx := range getConnContext {
		// 	// log.Info(c)
		// 	// uid := cctx.GetTag("Uid")
		// 	// log.Info(uid)
		// 	deviceId := cctx.GetTag("DeviceId")
		// 	// log.Info(deviceId)

		// 	// userInfo
		// 	cctxSsoUser := new(protos.SSOUserInfo)
		// 	cctxUserInfoInteface := cctx.GetSessionCache("userInfo")
		// 	if cctxUserInfoInteface == nil {
		// 		continue
		// 	}
		// 	cctxUserInfo := cctxUserInfoInteface.(*sso.UserInfo)
		// 	copier.Copy(cctxSsoUser, cctxUserInfo)

		// 	// userAgent
		// 	cctxProtoUserAgent := new(protos.UserAgent)
		// 	cctxUserAgentInteface := cctx.GetSessionCache("userAgent")
		// 	if cctxUserAgentInteface == nil {
		// 		continue
		// 	}
		// 	cctxUserAgent := cctxUserAgentInteface.(*sso.UserAgent)
		// 	copier.Copy(cctxProtoUserAgent, cctxUserAgent)

		// 	// loginTime
		// 	cctxLoginTimeInterface := cctx.GetSessionCache("loginTime")
		// 	if cctxLoginTimeInterface == nil {
		// 		continue
		// 	}
		// 	onlineDeviceListMap[deviceId] = &protos.OnlineDeviceList{
		// 		UserInfo:  cctxSsoUser,
		// 		LoginTime: cctxLoginTimeInterface.(int64),
		// 		UserAgent: cctxProtoUserAgent,
		// 		Location:  "",
		// 		DeviceId:  deviceId,
		// 	}
		// 	onlineDeviceList = append(onlineDeviceList, onlineDeviceListMap[deviceId])
		// }
		// log.Info("onlineDeviceList", len(onlineDeviceListMap))

		// currentDevice := onlineDeviceListMap[data.DeviceId]
		// for _, cctx := range getConnContext {
		// 	// deviceId := cctx.GetTag("DeviceId")
		// 	// log.Info(deviceId)

		// 	// if deviceId == data.DeviceId {
		// 	// 	// log.Info("乃是自己也")
		// 	// } else {

		// 	// }
		// 	// userAesKey1 := conf.EncryptionClient.GetUserAesKeyByDeviceId(conf.Redisdb, deviceId)

		// 	var res response.ResponseProtobufType
		// 	res.Code = 200

		// 	res.Data = protos.Encode(&protos.OtherDeviceOnline_Response{
		// 		CurrentDevice:    currentDevice,
		// 		OnlineDeviceList: onlineDeviceList,
		// 	})

		// 	eventName := conf.SocketRouterEventNames["OtherDeviceOnline"]
		// 	responseData := res.GetResponse()
		// 	cctx.Emit(eventName, responseData)
		// 	// isEmit := cctx.Emit(eventName, responseData)
		// 	// if isEmit {
		// 	// 	// 发送成功或存储到数据库
		// 	// } else {
		// 	// 	// 存储到数据库作为离线数据
		// 	// }

		// }
	}

	return nil
}

func (bc *BaseController) Disconnect(e *nsocketio.EventInstance) error {
	// c := e.ConnContext()

	log.Info("已经断开了", e.Reason)

	// // 1、检测其他设备是否登录
	// sc := e.ServerContext()

	// getConnContext := sc.GetConnContextByTag(conf.SocketRouterNamespace["Base"], "Uid", c.GetTag("Uid"))
	// log.Info("当前ID", c.ID())
	// log.Info("有哪些设备在线", getConnContext)

	// onlineDeviceListMap := map[string]*protos.OnlineDeviceList{}
	// onlineDeviceList := []*protos.OnlineDeviceList{}
	// // 2、遍历设备实例、告诉对方上线了
	// for _, cctx := range getConnContext {
	// 	// log.Info(c)
	// 	// uid := cctx.GetTag("Uid")
	// 	// log.Info(uid)
	// 	deviceId := cctx.GetTag("DeviceId")
	// 	// log.Info(deviceId)

	// 	// userInfo
	// 	cctxSsoUser := new(protos.SSOUserInfo)
	// 	cctxUserInfoInteface := cctx.GetSessionCache("userInfo")
	// 	if cctxUserInfoInteface == nil {
	// 		continue
	// 	}
	// 	cctxUserInfo := cctxUserInfoInteface.(*sso.UserInfo)
	// 	copier.Copy(cctxSsoUser, cctxUserInfo)

	// 	// userAgent
	// 	cctxProtoUserAgent := new(protos.UserAgent)
	// 	cctxUserAgentInteface := cctx.GetSessionCache("userAgent")
	// 	if cctxUserAgentInteface == nil {
	// 		continue
	// 	}
	// 	cctxUserAgent := cctxUserAgentInteface.(*sso.UserAgent)
	// 	copier.Copy(cctxProtoUserAgent, cctxUserAgent)

	// 	// loginTime
	// 	cctxLoginTimeInterface := cctx.GetSessionCache("loginTime")
	// 	if cctxLoginTimeInterface == nil {
	// 		continue
	// 	}
	// 	onlineDeviceListMap[deviceId] = &protos.OnlineDeviceList{
	// 		UserInfo:  cctxSsoUser,
	// 		LoginTime: cctxLoginTimeInterface.(int64),
	// 		UserAgent: cctxProtoUserAgent,
	// 		Location:  "",
	// 		DeviceId:  deviceId,
	// 	}
	// 	onlineDeviceList = append(onlineDeviceList, onlineDeviceListMap[deviceId])
	// }

	// deviceId := c.GetSessionCache("deviceId")
	// if deviceId == nil {
	// 	return nil
	// }
	// currentDevice := onlineDeviceListMap[deviceId.(string)]

	// for _, cctx := range getConnContext {
	// 	// deviceId := cctx.GetTag("DeviceId")
	// 	// log.Info(deviceId)

	// 	// if deviceId == queryData.DeviceId {
	// 	// 	log.Info("乃是自己也")
	// 	// }else{

	// 	// }
	// 	// userAesKey1 := conf.EncryptionClient.GetUserAesKeyByDeviceId(conf.Redisdb, deviceId)

	// 	// log.Info("userAesKey SendJoinAnonymousRoomMessage", userAesKey)

	// 	var res response.ResponseProtobufType
	// 	res.Code = 200

	// 	res.Data = protos.Encode(&protos.OtherDeviceOffline_Response{
	// 		CurrentDevice:    currentDevice,
	// 		OnlineDeviceList: onlineDeviceList,
	// 	})

	// 	eventName := conf.SocketRouterEventNames["OtherDeviceOffline"]
	// 	responseData := res.GetResponse()
	// 	cctx.Emit(eventName, responseData)

	// 	// c.Close()
	// 	// isEmit := cctx.Emit(eventName, responseData)
	// 	// if isEmit {
	// 	// 	// 发送成功或存储到数据库
	// 	// } else {
	// 	// 	// 存储到数据库作为离线数据
	// 	// }

	// }

	return nil
}
