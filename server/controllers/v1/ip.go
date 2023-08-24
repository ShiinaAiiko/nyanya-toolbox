package controllersV1

import (
	"net"

	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"
	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/cherrai/nyanyago-utils/validation"

	// "github.com/cherrai/nyanyago-utils/validation"
	"github.com/gin-gonic/gin"
)

var (
	log = nlog.New()
)

type IpController struct {
}

func (ic *IpController) IpDetails(c *gin.Context) {
	// 1、请求体
	var res response.ResponseType

	data := struct {
		Ip string
	}{
		Ip: c.Query("ip"),
	}
	log.Info("IpInfo", data)

	var err error
	if err = validation.ValidateStruct(
		&data,
		validation.Parameter(&data.Ip, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	// 先检测有没有对应url的历史记录、没有再新增

	// getShortUrl, err := urlDbx.GetShortUrl("", data.Url)
	// log.Info("getShortUrl", getShortUrl, err)
	// // if err != nil {
	// // 	res.Errors(err)
	// // 	res.Code = 10016
	// // 	res.Call(c)
	// // 	return
	// // }
	// if getShortUrl != nil {
	// 	res.Code = 200
	// 	res.Data = response.H{
	// 		"shortId":  getShortUrl.ShortId,
	// 		"shortUrl": conf.Config.BaseUrl + getShortUrl.ShortId,
	// 	}
	// 	res.Call(c)
	// 	return
	// }

	// shortUrl, err := urlDbx.AddShortUrl(data.Url)
	// log.Info(shortUrl, err)
	// if err != nil {
	// 	res.Errors(err)
	// 	res.Code = 10016
	// 	res.Call(c)
	// 	return
	// }

	res.Code = 200
	res.Data = response.H{
		// "shortId":  shortUrl.ShortId,
		// "shortUrl": conf.Config.BaseUrl + shortUrl.ShortId,
	}
	res.Call(c)
}

func (ic *IpController) UrlToIp(c *gin.Context) {
	// 1、请求体
	var res response.ResponseType

	data := struct {
		Url string
	}{
		Url: c.Query("url"),
	}
	log.Info("IpInfo", data)

	var err error
	if err = validation.ValidateStruct(
		&data,
		validation.Parameter(&data.Url, validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	// 先检测有没有对应url的历史记录、没有再新增

	// getShortUrl, err := urlDbx.GetShortUrl("", data.Url)
	// log.Info("getShortUrl", getShortUrl, err)
	// // if err != nil {
	// // 	res.Errors(err)
	// // 	res.Code = 10016
	// // 	res.Call(c)
	// // 	return
	// // }
	// if getShortUrl != nil {
	// 	res.Code = 200
	// 	res.Data = response.H{
	// 		"shortId":  getShortUrl.ShortId,
	// 		"shortUrl": conf.Config.BaseUrl + getShortUrl.ShortId,
	// 	}
	// 	res.Call(c)
	// 	return
	// }

	// shortUrl, err := urlDbx.AddShortUrl(data.Url)
	// log.Info(shortUrl, err)
	// if err != nil {
	// 	res.Errors(err)
	// 	res.Code = 10016
	// 	res.Call(c)
	// 	return
	// }

	ips, err := net.LookupIP("aiiko.club")
	if err != nil {
		log.Error(err)
		res.Errors(err)
		res.Code = 10001
		res.Call(c)
		return
	}
	for _, ip := range ips {
		res.Code = 200
		res.Data = response.H{
			"ip": ip.String(),
		}
	}
	res.Call(c)
}
