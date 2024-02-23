package controllersV1

import (
	"github.com/ShiinaAiiko/nyanya-toolbox/server/models"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/protos"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"
	"github.com/cherrai/nyanyago-utils/validation"
	sso "github.com/cherrai/saki-sso-go"
	"github.com/jinzhu/copier"

	// "github.com/cherrai/nyanyago-utils/validation"
	"github.com/gin-gonic/gin"
)

type MoveCarQRCController struct {
}

func (ftc *MoveCarQRCController) CreateMoveCarQRC(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	data := new(protos.CreateMoveCarQRC_Request)

	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}
	// log.Info(data)
	// 3、验证参数

	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.MoveCarQRC, validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}
	if err = validation.ValidateStruct(
		data.MoveCarQRC,
		validation.Parameter(&data.MoveCarQRC.Phone, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.MoveCarQRC.CarNumber, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.MoveCarQRC.Slogan, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	userInfoAny, exists := c.Get("userInfo")
	if userInfoAny == nil || !exists {
		res.Code = 10004
		res.Call(c)
		return
	}

	userInfo := userInfoAny.(*sso.UserInfo)

	// log.Info("userInfo", userInfo)
	// log.Info("data", data)
	moveCarQRC, err := moveCarQRCDbx.CreateMoveCarQRC(&models.MoveCarQRC{
		AuthorId: userInfo.Uid,

		Phone:     data.MoveCarQRC.Phone,
		CarNumber: data.MoveCarQRC.CarNumber,
		Slogan:    data.MoveCarQRC.Slogan,
		Email:     data.MoveCarQRC.Email,
		Wechat:    data.MoveCarQRC.Wechat,

		ColorTheme: data.MoveCarQRC.ColorTheme,

		Status: 1,
	})
	if err != nil {
		res.Errors(err)
		res.Code = 10016
		res.Call(c)
		return
	}
	// log.Info(moveCarQRC)

	moveCarQRCProtoData := new(protos.MoveCarQRCItem)
	copier.Copy(moveCarQRCProtoData, moveCarQRC)

	responseData := protos.CreateMoveCarQRC_Response{
		MoveCarQRC: moveCarQRCProtoData,
	}

	res.Data = protos.Encode(&responseData)

	res.Call(c)
}

func (ftc *MoveCarQRCController) GetMoveCarQRCList(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	data := new(protos.GetMoveCarQRCList_Request)

	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}
	// log.Info(data)
	// 3、验证参数

	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.Sort, validation.Enum([]string{"CreateTimeASC", "CreateTimeDESC"}), validation.Required()),
		validation.Parameter(&data.PageNum, validation.GreaterEqual(int64(1)), validation.Required()),
		validation.Parameter(&data.PageSize, validation.NumRange(int64(1), int64(50)), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	userInfoAny, exists := c.Get("userInfo")
	if userInfoAny == nil || !exists {
		res.Code = 10004
		res.Call(c)
		return
	}

	userInfo := userInfoAny.(*sso.UserInfo)

	// log.Info("userInfo", userInfo)
	// log.Info("data", data)
	results, err := moveCarQRCDbx.GetMoveCarQRCList(userInfo.Uid,
		data.PageNum, data.PageSize, data.Sort)
	if err != nil {
		res.Errors(err)
		res.Code = 10016
		res.Call(c)
		return
	}
	log.Info("results", results)

	list := []*protos.MoveCarQRCItem{}
	for _, v := range results {
		moveCarQRCProtoData := new(protos.MoveCarQRCItem)
		copier.Copy(moveCarQRCProtoData, v)

		list = append(list, moveCarQRCProtoData)
	}

	responseData := protos.GetMoveCarQRCList_Response{
		Total: int64(len(list)),
		List:  list,
	}

	res.Data = protos.Encode(&responseData)

	res.Call(c)
}

func (ftc *MoveCarQRCController) GetMoveCarQRC(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	data := new(protos.GetMoveCarQRC_Request)

	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}
	// log.Info(data)
	// 3、验证参数

	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.Id, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	// log.Info("userInfo", userInfo)
	// log.Info("data", data)

	result, err := moveCarQRCDbx.GetMoveCarQRC(data.Id, "")
	if err != nil {
		res.Errors(err)
		res.Code = 10016
		res.Call(c)
		return
	}
	moveCarQRCProtoData := new(protos.MoveCarQRCItem)
	copier.Copy(moveCarQRCProtoData, result)

	responseData := protos.GetMoveCarQRC_Response{
		MoveCarQRC: moveCarQRCProtoData,
	}

	res.Data = protos.Encode(&responseData)

	res.Call(c)
}

func (ftc *MoveCarQRCController) UpdateMoveCarQRC(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	data := new(protos.UpdateMoveCarQRC_Request)

	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}
	// log.Info(data)
	// 3、验证参数

	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.Id, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.MoveCarQRC, validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}
	if err = validation.ValidateStruct(
		data.MoveCarQRC,
		validation.Parameter(&data.MoveCarQRC.Phone, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.MoveCarQRC.CarNumber, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.MoveCarQRC.Slogan, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	userInfoAny, exists := c.Get("userInfo")
	if userInfoAny == nil || !exists {
		res.Code = 10004
		res.Call(c)
		return
	}

	userInfo := userInfoAny.(*sso.UserInfo)

	// log.Info("userInfo", userInfo)
	// log.Info("data", data)
	moveCarQRC, err := moveCarQRCDbx.GetMoveCarQRC(data.Id, userInfo.Uid)
	if moveCarQRC == nil || err != nil {
		res.Errors(err)
		res.Code = 10006
		res.Call(c)
		return
	}

	if err := moveCarQRCDbx.UpdateMoveCarQRC(
		userInfo.Uid,
		data.Id,
		data.MoveCarQRC.Phone,
		data.MoveCarQRC.CarNumber,
		data.MoveCarQRC.Slogan,
		data.MoveCarQRC.Email,
		data.MoveCarQRC.Wechat,
		data.MoveCarQRC.ColorTheme,
	); err != nil {
		res.Errors(err)
		res.Code = 10011
		res.Call(c)
		return
	}
	moveCarQRC.Phone = data.MoveCarQRC.Phone
	moveCarQRC.CarNumber = data.MoveCarQRC.CarNumber
	moveCarQRC.Slogan = data.MoveCarQRC.Slogan
	moveCarQRC.Email = data.MoveCarQRC.Email
	moveCarQRC.Wechat = data.MoveCarQRC.Wechat
	moveCarQRC.ColorTheme = data.MoveCarQRC.ColorTheme

	// log.Info(moveCarQRC)

	moveCarQRCProtoData := new(protos.MoveCarQRCItem)
	copier.Copy(moveCarQRCProtoData, moveCarQRC)

	responseData := protos.UpdateMoveCarQRC_Response{
		MoveCarQRC: moveCarQRCProtoData,
	}

	res.Data = protos.Encode(&responseData)

	res.Call(c)
}

func (ftc *MoveCarQRCController) DeleteMoveCarQRC(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	data := new(protos.DeleteMoveCarQRC_Request)

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
		validation.Parameter(&data.Id, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	userInfoAny, exists := c.Get("userInfo")
	if userInfoAny == nil || !exists {
		res.Code = 10004
		res.Call(c)
		return
	}

	userInfo := userInfoAny.(*sso.UserInfo)

	// log.Info("userInfo", userInfo)
	// log.Info("data", data)
	moveCarQRC, err := moveCarQRCDbx.GetMoveCarQRC(data.Id, userInfo.Uid)
	if moveCarQRC == nil || err != nil {
		res.Errors(err)
		res.Code = 10006
		res.Call(c)
		return
	}

	if err := moveCarQRCDbx.DeleteMoveCarQRC(data.Id, userInfo.Uid); err != nil {
		res.Errors(err)
		res.Code = 10017
		res.Call(c)
		return
	}

	responseData := protos.DeleteMoveCarQRC_Response{}

	res.Data = protos.Encode(&responseData)

	res.Call(c)
}
