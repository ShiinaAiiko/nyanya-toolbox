package controllersV1

import (
	"encoding/json"
	"strconv"
	"strings"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	dbxV1 "github.com/ShiinaAiiko/nyanya-toolbox/server/dbx/v1"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"
	"github.com/cherrai/nyanyago-utils/nint"
	"github.com/cherrai/nyanyago-utils/nstrings"
	"github.com/cherrai/nyanyago-utils/validation"
	"github.com/gin-gonic/gin"
)

// "github.com/cherrai/nyanyago-utils/validation"

type GeoController struct {
}

func (ic *GeoController) Regeo(c *gin.Context) {
	// 1、请求体
	var res response.ResponseType
	var err error

	lat, err := strconv.ParseFloat(nstrings.StringOr(c.Query("latitude"), "0"), 64)
	if err != nil {
		res.Errors(err)
		res.Code = 10001
		res.Call(c)
		return
	}
	lng, err := strconv.ParseFloat(nstrings.StringOr(c.Query("longitude"), "0"), 64)
	if err != nil {
		res.Errors(err)
		res.Code = 10001
		res.Call(c)
		return
	}

	data := struct {
		Latitude  float64
		Longitude float64
		Platform  string
	}{
		Latitude:  lat,
		Longitude: lng,
		Platform:  c.Query("platform"),
	}

	if err = validation.ValidateStruct(
		&data,
		validation.Parameter(&data.Latitude, validation.Required()),
		validation.Parameter(&data.Longitude, validation.Required()),
		// validation.Parameter(&data.Platform,
		// 	validation.Enum([]string{"Amap"}), validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	log.Info(data.Latitude, data.Longitude)

	geoInfo := new(dbxV1.GeoInfo)

	latlng := nstrings.ToString(data.Longitude) + "," + nstrings.ToString(data.Latitude)

	key := conf.Redisdb.GetKey("Regeo")
	err = conf.Redisdb.GetStruct(key.GetKey(latlng), geoInfo)

	cache := true

	log.Info(err, geoInfo)

	if err != nil || geoInfo.Country == "" || geoInfo.Address == "" {
		cache = false
		geoInfo, err = geoDbx.RegeoByNominatim(data.Latitude, data.Longitude, 0)

		if err != nil {
			res.Errors(err)
			log.Error(err)
			res.Code = 10018
			res.Call(c)
			return
		}

		log.Info("geoInfo", geoInfo)

		if geoInfo.Country == "中国" && !(geoInfo.State == "香港" || geoInfo.State == "澳門") && (geoInfo.Address == "" || geoInfo.Town == "") {
			geoInfo, err = geoDbx.RegeoByAmap(data.Latitude, data.Longitude)

			if err != nil {
				res.Errors(err)
				log.Error(err)
				res.Code = 10018
				res.Call(c)
				return
			}
		}
	}

	if err = conf.Redisdb.SetStruct(key.GetKey(latlng), geoInfo, key.GetExpiration()); err != nil {
		res.Errors(err)
		res.Code = 10001
		res.Call(c)
		return
	}

	res.Data = response.H{
		"country":  geoInfo.Country,
		"state":    geoInfo.State,
		"region":   geoInfo.Region,
		"city":     geoInfo.City,
		"town":     geoInfo.Town,
		"road":     geoInfo.Road,
		"address":  geoInfo.Address,
		"platform": geoInfo.Platform,
		"latlng":   geoInfo.Latlng,
		"cache":    cache,
	}

	res.Code = 200
	res.Call(c)
}

func (ic *GeoController) Geo(c *gin.Context) {
	// 1、请求体
	var res response.ResponseType
	var err error

	data := struct {
		Address  string
		Platform string
	}{
		Address:  c.Query("address"),
		Platform: c.Query("platform"),
	}

	// log.Info("geo", data)

	if err = validation.ValidateStruct(
		&data,
		validation.Parameter(&data.Address, validation.Required()),
		validation.Parameter(&data.Platform,
			validation.Enum([]string{"Amap"}), validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	if data.Platform == "Amap" {

		type GeoInfo struct {
			Country   string
			State     string
			Region    string
			City      string
			Town      string
			Road      string
			Address   string
			Latitude  float64
			Longitude float64
			Code      int
			Level     string
		}
		geoInfo := new(GeoInfo)

		key := conf.Redisdb.GetKey("Regeo")
		err := conf.Redisdb.GetStruct(key.GetKey(data.Address), geoInfo)

		// log.Info("ccc", data.Address, *geoInfo, err)

		if err != nil || geoInfo.Country == "" {
			resp, err := conf.RestyClient.R().SetQueryParams(map[string]string{}).
				Get(
					"https://restapi.amap.com/v3/geocode/geo?output=json&address=" + data.Address + "&key=" + conf.Config.AmapKey + "&radius=100&extensions=all",
				)
			if err != nil {
				log.Error(err)
				res.Errors(err)
				res.Code = 10001
				res.Call(c)
				return
			}

			type AmapRes struct {
				Geocodes []struct {
					Formatted_address any
					Country           any
					Province          any
					City              any
					District          any
					Township          any
					Street            any
					Adcode            any
					Location          any
					Level             any
				}
			}
			amapRes := new(AmapRes)

			// log.Info("resp.Body()", resp.String())
			if err = json.Unmarshal(resp.Body(), amapRes); err != nil {
				res.Errors(err)
				res.Code = 10001
				res.Call(c)
				return
			}
			// log.Info("resp.Body()", *amapRes)

			// log.Info("street", nstrings.ToString(amapRes.Regeocode.AddressComponent.StreetNumber.(map[string]any)["street"]))

			if len(amapRes.Geocodes) >= 1 {
				geoCode := amapRes.Geocodes[0]
				geoInfo.Country = nstrings.ToString(geoCode.Country)
				geoInfo.State = nstrings.ToString(geoCode.Province)
				geoInfo.Region = nstrings.ToString(geoCode.City)
				geoInfo.City = nstrings.ToString(geoCode.District)
				geoInfo.Town = nstrings.ToString(geoCode.Township)
				geoInfo.Road = nstrings.ToString(geoCode.Street)
				geoInfo.Address = nstrings.ToString(geoCode.Formatted_address)

				location := strings.Split(nstrings.ToString(geoCode.Location), ",")

				if len(location) == 2 {
					lat, err := strconv.ParseFloat(nstrings.StringOr(location[1], "0"), 64)
					if err == nil {
						geoInfo.Latitude = lat
					}
					lng, err := strconv.ParseFloat(nstrings.StringOr(location[0], "0"), 64)
					if err == nil {
						geoInfo.Longitude = lng
					}
				}
				geoInfo.Code = nint.ToInt(geoCode.Adcode)
				geoInfo.Level = nstrings.ToString(geoCode.Level)

			}
		}

		if err = conf.Redisdb.SetStruct(key.GetKey(data.Address), geoInfo, key.GetExpiration()); err != nil {
			res.Errors(err)
			res.Code = 10001
			res.Call(c)
			return
		}
		res.Data = response.H{
			"country":   geoInfo.Country,
			"state":     geoInfo.State,
			"region":    geoInfo.Region,
			"city":      geoInfo.City,
			"town":      geoInfo.Town,
			"road":      geoInfo.Road,
			"address":   geoInfo.Address,
			"latitude":  geoInfo.Latitude,
			"longitude": geoInfo.Longitude,
			"code":      geoInfo.Code,
			"level":     geoInfo.Level,
		}
		res.Code = 200
		res.Call(c)

		return
	}

	res.Code = 10006
	res.Call(c)
}

func (ic *GeoController) GetCityDistricts(c *gin.Context) {
	// 1、请求体
	var res response.ResponseType
	var err error

	data := struct {
		Country string
	}{
		Country: c.Query("country"),
	}

	log.Info("geo", data)

	if err = validation.ValidateStruct(
		&data,
		validation.Parameter(&data.Country,
			validation.Enum([]string{"China"}), validation.Type("string"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	if data.Country == "China" {

		cd := geoDbx.GetChinaCityDistricts()

		res.Data = response.H{
			"cityDistricts": cd,
		}
		res.Code = 200
		res.Call(c)

		return
	}

	res.Code = 10006
	res.Call(c)
}
