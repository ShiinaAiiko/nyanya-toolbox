package socketIoControllersV1

import (
	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/protos"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"
	"github.com/cherrai/nyanyago-utils/nsocketio"
	"github.com/cherrai/nyanyago-utils/validation"
	sso "github.com/cherrai/saki-sso-go"
	"github.com/jinzhu/copier"
)

// "github.com/cherrai/saki-sso-go"

// dbxV1 "github.com/ShiinaAiiko/nyanya-toolbox/server/dbx/v1"

type FileTransferControllers struct {
}

func (s *FileTransferControllers) NewConnect(e *nsocketio.EventInstance) error {
	c := e.ConnContext()

	Conn := e.Conn()
	if c.GetSessionCache("deviceId") == nil {
		return nil
	}

	c.SetTag("DeviceId", c.GetSessionCache("deviceId").(string))

	log.Warn(e.Namespace()+" => 连接成功！", Conn.ID(), ", Connection to Successful.")

	return nil

}

func (s *FileTransferControllers) Disconnect(e *nsocketio.EventInstance) error {
	log.Info("FT已经断开了", e.Reason)
	var res response.ResponseProtobufType
	res.Code = 200
	c := e.ConnContext()

	deviceIdAny := e.GetSessionCache("deviceId")
	if deviceIdAny == nil {
		log.Info("deviceId 不存在")
		return nil
	}
	deviceId := e.GetSessionCache("deviceId").(string)

	log.Info("c.GetRoomsWithNamespace()", c.GetRooms(namespace["FileTransfer"]))
	for _, roomId := range c.GetRoomsWithNamespace() {
		connectedDevices := []*protos.DeviceItem{}

		currentDevice := &protos.DeviceItem{
			RoomId:    roomId,
			DeviceId:  deviceId,
			UserAgent: s.getProtoUserAgent(c),
		}

		for _, cc := range c.GetAllConnContextInRoomWithNamespace(roomId) {

			if cc.GetSessionCache("deviceId") == nil {
				continue
			}
			ccDeviceId := cc.GetSessionCache("deviceId").(string)
			if deviceId == ccDeviceId {
				continue
			}

			connectedDevices = append(connectedDevices, &protos.DeviceItem{
				RoomId:    roomId,
				DeviceId:  ccDeviceId,
				UserAgent: s.getProtoUserAgent(cc),
			})
		}
		responseData := protos.LeaveFTRoom_Response{
			CurrentDevice:    currentDevice,
			ConnectedDevices: connectedDevices,
		}

		res.Data = protos.Encode(&responseData)

		log.Info("res", connectedDevices)
		conf.SocketIO.Server.BroadcastToRoom(namespace["FileTransfer"], roomId, conf.SocketRouterEventNames["ExitedFTRoom"], res.ResponseProtoEncode())
	}
	return nil
}

func (s *FileTransferControllers) getProtoUserAgent(c *nsocketio.ConnContext) (userAgent *protos.UserAgent) {

	ua := c.GetSessionCache("userAgent").(*sso.UserAgent)
	userAgent = new(protos.UserAgent)
	copier.Copy(userAgent, ua)
	return

}

func (s *FileTransferControllers) JoinFTRoom(e *nsocketio.EventInstance) error {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	data := new(protos.JoinFTRoom_Request)

	log.Info("JoinFTRoom")
	var err error
	if err = protos.DecodeBase64(e.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.EmitProto(e)
		return err
	}
	// 3、验证参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.RoomId, validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.EmitProto(e)
		return err
	}

	tKey := conf.Redisdb.GetKey("FTShareCode")
	val, err := conf.Redisdb.Get(tKey.GetKey(data.RoomId))
	if err != nil {
		res.Errors(err)
		res.Code = 10001
		res.EmitProto(e)
		return err
	}

	// 未来删除，这是让分享码时刻保持更新
	if err = conf.Redisdb.Set(tKey.GetKey(data.RoomId), data.RoomId, tKey.GetExpiration()); err != nil {
		res.Errors(err)
		res.Code = 10001
		res.EmitProto(e)
		return err
	}

	deviceId := e.GetSessionCache("deviceId").(string)

	if err != nil || val.String() != data.RoomId {
		res.Code = 10004
		res.Errors(err)
		res.EmitProto(e)
		return err
	}

	c := e.ConnContext()

	roomId := data.RoomId

	c.JoinRoom(e.Namespace(), roomId)

	currentDevice := &protos.DeviceItem{
		RoomId:    roomId,
		DeviceId:  deviceId,
		UserAgent: s.getProtoUserAgent(c),
	}

	connectedDevices := []*protos.DeviceItem{}

	for _, cc := range c.GetAllConnContextInRoomWithNamespace(roomId) {

		if cc.GetSessionCache("deviceId") == nil {
			continue
		}
		deviceId := cc.GetSessionCache("deviceId").(string)
		log.Info("deviceId", deviceId, cc, c.GetAllConnContextInRoomWithNamespace(roomId))

		connectedDevices = append(connectedDevices, &protos.DeviceItem{
			RoomId:    roomId,
			DeviceId:  deviceId,
			UserAgent: s.getProtoUserAgent(c),
		})
	}

	responseData := protos.JoinFTRoom_Response{
		CurrentDevice:    currentDevice,
		ConnectedDevices: connectedDevices,
	}

	res.Data = protos.Encode(&responseData)
	res.EmitProto(e)

	c.BroadcastToRoomWithNamespace(roomId, conf.SocketRouterEventNames["JoinedFTRoom"], res.ResponseProtoEncode())

	return nil
}

func (s *FileTransferControllers) LeaveFTRoom(e *nsocketio.EventInstance) error {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	data := new(protos.LeaveFTRoom_Request)

	log.Info("LeaveFTRoom")

	var err error
	if err = protos.DecodeBase64(e.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.EmitProto(e)
		return err
	}
	// 3、验证参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.RoomId, validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.EmitProto(e)
		return err
	}

	deviceId := e.GetSessionCache("deviceId").(string)

	c := e.ConnContext()

	roomId := data.RoomId

	if !c.LeaveRoom(e.Namespace(), roomId) {
		res.Code = 10001
		res.Errors(err)
		res.EmitProto(e)
		return err
	}

	currentDevice := &protos.DeviceItem{
		RoomId:    roomId,
		DeviceId:  deviceId,
		UserAgent: s.getProtoUserAgent(c),
	}

	connectedDevices := []*protos.DeviceItem{}

	for _, cc := range c.GetAllConnContextInRoomWithNamespace(roomId) {

		if cc.GetSessionCache("deviceId") == nil {
			continue
		}
		deviceId := cc.GetSessionCache("deviceId").(string)

		connectedDevices = append(connectedDevices, &protos.DeviceItem{
			RoomId:    roomId,
			DeviceId:  deviceId,
			UserAgent: s.getProtoUserAgent(cc),
		})
	}

	responseData := protos.LeaveFTRoom_Response{
		CurrentDevice:    currentDevice,
		ConnectedDevices: connectedDevices,
	}

	res.Data = protos.Encode(&responseData)
	res.EmitProto(e)

	c.BroadcastToRoomWithNamespace(roomId, conf.SocketRouterEventNames["ExitedFTRoom"], res.ResponseProtoEncode())
	return nil
}

func (s *FileTransferControllers) IncreaseFTRoomTimeLimit(e *nsocketio.EventInstance) error {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	data := new(protos.IncreaseFTRoomTimeLimit_Request)

	var err error
	if err = protos.DecodeBase64(e.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.EmitProto(e)
		return err
	}
	// 3、验证参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.RoomId, validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.EmitProto(e)
		return err
	}

	sKey := conf.Redisdb.GetKey("FTShareCode")

	if err = conf.Redisdb.Set(sKey.GetKey(data.RoomId), data.RoomId, sKey.GetExpiration()); err != nil {
		res.Code = 10001
		res.Errors(err)
		res.EmitProto(e)
		return err
	}

	responseData := protos.IncreaseFTRoomTimeLimit_Response{}

	res.Data = protos.Encode(&responseData)
	res.EmitProto(e)

	return nil
}

func (s *FileTransferControllers) Data(e *nsocketio.EventInstance) error {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	log.Info(e.GetString("roomId"))
	log.Info(e.Get("type"))
	log.Info(e.Get("deviceId"))
	// log.Info(e.Get("data"))
	roomId := e.GetString("roomId")

	// // 2、获取参数
	// data := new(protos.LeaveFTRoom_Request)

	// var err error
	// if err = protos.DecodeBase64(e.GetString("data"), data); err != nil {
	// 	res.Error = err.Error()
	// 	res.Code = 10002
	// 	res.EmitProto(e)
	// 	return err
	// }
	// // 3、验证参数
	// if err = validation.ValidateStruct(
	// 	data,
	// 	validation.Parameter(&data.RoomId, validation.Required()),
	// ); err != nil {
	// 	res.Errors(err)
	// 	res.Code = 10002
	// 	res.EmitProto(e)
	// 	return err
	// }

	// deviceId := e.GetSessionCache("deviceId").(string)

	c := e.ConnContext()

	// roomId := data.RoomId

	// if !c.LeaveRoom(e.Namespace(), roomId) {
	// 	res.Code = 10001
	// 	res.Errors(err)
	// 	res.EmitProto(e)
	// 	return err
	// }

	// userAgent := e.GetSessionCache("userAgent").(*protos.UserAgent)

	// currentDevice := &protos.DeviceItem{
	// 	RoomId:    roomId,
	// 	DeviceId:  deviceId,
	// 	UserAgent: userAgent,
	// }

	// connectedDevices := []*protos.DeviceItem{}

	// for _, cc := range c.GetAllConnContextInRoomWithNamespace(roomId) {

	// 	deviceId := cc.GetSessionCache("deviceId").(string)
	// 	userAgent := cc.GetSessionCache("userAgent").(*protos.UserAgent)

	// 	connectedDevices = append(connectedDevices, &protos.DeviceItem{
	// 		RoomId:    roomId,
	// 		DeviceId:  deviceId,
	// 		UserAgent: userAgent,
	// 	})
	// }

	// responseData := protos.LeaveFTRoom_Response{
	// 	CurrentDevice:    currentDevice,
	// 	ConnectedDevices: connectedDevices,
	// }

	// res.Data = protos.Encode(&responseData)
	// res.EmitProto(e)

	c.BroadcastToRoomWithNamespace(roomId, conf.SocketRouterEventNames["Data"], e.GetData("data"))
	return nil
}
