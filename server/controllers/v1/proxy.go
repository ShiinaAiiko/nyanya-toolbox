package controllersV1

import (
	"encoding/json"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"
	"github.com/cherrai/nyanyago-utils/validation"
	"github.com/gin-gonic/gin"
)

// "github.com/cherrai/nyanyago-utils/validation"

type ProxyController struct {
}

func (ic *IpController) HttpProxy(c *gin.Context) {
	// 1、请求体
	var res response.ResponseType

	data := struct {
		Url    string
		Method string
	}{
		Url:    c.Query("url"),
		Method: c.Query("method"),
	}

	var err error
	if err = validation.ValidateStruct(
		&data,
		validation.Parameter(&data.Url, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.Method,
			validation.Enum([]string{"GET"}), validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	// log.Info("data.Url", data.Url)

	switch data.Method {
	case "GET":

		resp, err := conf.RestyClient.R().SetQueryParams(map[string]string{}).
			Get(
				data.Url,
			)
		if err != nil {
			log.Error(err)
			res.Errors(err)
			res.Code = 10001
			res.Call(c)
			return
		}
		var respMap map[string]interface{}

		dataStr := `{"data":` + resp.String() + `}`
		dataBytes := []byte(dataStr)

		if err = json.Unmarshal(dataBytes, &respMap); err != nil {
			res.Errors(err)
			res.Code = 10001
			res.Call(c)
			return
		}

		res.Data = respMap["data"]

	}

	res.Code = 200
	res.Call(c)
}
