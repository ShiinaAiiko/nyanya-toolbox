package controllersV1

import (
	"encoding/json"
	"errors"
	"net"
	"strings"

	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"
	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/cherrai/nyanyago-utils/validation"
	"github.com/go-resty/resty/v2"

	// "github.com/cherrai/nyanyago-utils/validation"
	"github.com/gin-gonic/gin"
)

var (
	log         = nlog.New()
	restyClient = resty.New()
)

type IpController struct {
}

// HasLocalIPAddr 检测 IP 地址字符串是否是内网地址
func (ic *IpController) HasLocalIPAddr(ip string) bool {
	return ic.HasLocalIP(net.ParseIP(ip))
}

// HasLocalIP 检测 IP 地址是否是内网地址
// 通过直接对比ip段范围效率更高
func (ic *IpController) HasLocalIP(ip net.IP) bool {
	if ip.IsLoopback() {
		return true
	}

	ip4 := ip.To4()
	if ip4 == nil {
		return false
	}

	return ip4[0] == 10 || // 10.0.0.0/8
		(ip4[0] == 172 && ip4[1] >= 16 && ip4[1] <= 31) || // 172.16.0.0/12
		(ip4[0] == 169 && ip4[1] == 254) || // 169.254.0.0/16
		(ip4[0] == 192 && ip4[1] == 168) // 192.168.0.0/16
}

func (ic *IpController) GetIp(url string) (string, string, error) {
	ips, err := net.LookupIP(url)
	if err != nil {
		return "", "", err
	}
	log.Info("ips", ips)
	ipv4 := ""
	ipv6 := ""
	for _, ip := range ips {
		if strings.Contains(ip.String(), ".") {
			ipv4 = ip.String()
		}
		if strings.Contains(ip.String(), ":") {
			ipv6 = ip.String()
		}
	}
	return ipv4, ipv6, nil
}

func (ic *IpController) IpDetails(c *gin.Context) {
	// 1、请求体
	var res response.ResponseType

	data := struct {
		Ip       string
		Language string
	}{
		Ip:       c.Query("ip"),
		Language: c.Query("language"),
	}
	// log.Info("IpInfo", data)

	var err error
	if err = validation.ValidateStruct(
		&data,
		validation.Parameter(&data.Ip, validation.Type("string")),
		validation.Parameter(&data.Language, validation.Type("string")),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	if data.Ip == "" {
		reqIP := c.ClientIP()
		// log.Info("reqIP", reqIP)
		if reqIP == "::1" {
			reqIP = "127.0.0.1"
		}
		if !ic.HasLocalIPAddr(reqIP) {
			data.Ip = reqIP
		} else {
			res.Errors(errors.New("Local IP cannot get IP details."))
			res.Code = 10001
			res.Call(c)
			return
		}
	}
	ipv4, ipv6, err := ic.GetIp(data.Ip)
	if err != nil {
		log.Error(err)
		res.Errors(err)
		res.Code = 10001
		res.Call(c)
		return
	}

	resp, err := restyClient.R().SetQueryParams(map[string]string{
		"lang":   data.Language,
		"fields": "status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query",
	}).Get(
		"http://ip-api.com/json/" + ipv4,
	)
	if err != nil {
		return
	}
	var respMap map[string]interface{}
	err = json.Unmarshal(resp.Body(), &respMap)
	// log.Info(s.options.BaseUrl + s.apiUrl + "/chunkupload/create")
	// log.Info(respMap, string(resp.Body()), options, err)
	if err != nil {
		return
	}
	// log.Info("data", respMap)
	if respMap != nil && respMap["status"] == "success" {

		res.Data = response.H{
			"ipv4":          ipv4,
			"ipv6":          ipv6,
			"as":            respMap["as"],
			"asname":        respMap["asname"],
			"city":          respMap["city"],
			"continent":     respMap["continent"],
			"continentCode": respMap["continentCode"],
			"country":       respMap["country"],
			"countryCode":   respMap["countryCode"],
			"currency":      respMap["currency"],
			"district":      respMap["district"],
			"hosting":       respMap["hosting"],
			"isp":           respMap["isp"],
			"lat":           respMap["lat"],
			"lon":           respMap["lon"],
			"mobile":        respMap["mobile"],
			"offset":        respMap["offset"],
			"org":           respMap["org"],
			"proxy":         respMap["proxy"],
			"region":        respMap["region"],
			"regionName":    respMap["regionName"],
			"reverse":       respMap["reverse"],
			"timezone":      respMap["timezone"],
			"zip":           respMap["zip"],
		}
	} else {
		res.Data = response.H{
			"ipv4": ipv4,
			"ipv6": ipv6,
		}
	}
	res.Code = 200
	res.Call(c)
}

func (ic *IpController) UrlToIp(c *gin.Context) {
	// 1、请求体
	var res response.ResponseType
	res.Code = 200

	data := struct {
		Url string
	}{
		Url: c.Query("url"),
	}

	var err error
	if err = validation.ValidateStruct(
		&data,
		validation.Parameter(&data.Url, validation.Type("string")),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	ipv4, ipv6, err := ic.GetIp(data.Url)
	if err != nil {
		log.Error(err)
		res.Errors(err)
		res.Code = 10001
		res.Call(c)
		return
	}
	res.Data = response.H{
		"ipv4": ipv4,
		"ipv6": ipv6,
	}
	res.Call(c)
}
