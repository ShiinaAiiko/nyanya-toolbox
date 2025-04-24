package dbxV1

import (
	"encoding/json"
	"errors"
	"strings"
	"time"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	"github.com/cherrai/nyanyago-utils/narrays"
	"github.com/cherrai/nyanyago-utils/nfloat"
	"github.com/cherrai/nyanyago-utils/nint"
	"github.com/cherrai/nyanyago-utils/nstrings"
	"github.com/cherrai/nyanyago-utils/ntimer"
)

var chinaCityDistricts map[string][]*CityDistrictsItem

type (
	GeoDbx struct {
	}
	GeoInfo struct {
		Country  string
		State    string
		Region   string
		City     string
		Town     string
		Road     string
		Address  string
		Platform string
		Latlng   *CityDistrictsLatlng
	}
	CityDistrictsLatlng struct {
		Lat float64 `bson:"lat" json:"type,omitempty"`
		Lng float64 `bson:"lng" json:"type,omitempty"`
	}
	CityDistrictsItem struct {
		Adcode string `bson:"adcode" json:"adcode,omitempty"`
		Name   string `bson:"name" json:"name,omitempty"`

		// Country\State\Region\City\Town\Road
		Type       string               `bson:"type" json:"type,omitempty"`
		Latlng     *CityDistrictsLatlng `bson:"latlng" json:"latlng,omitempty"`
		ParentCity *CityDistrictsItem   `bson:"parentCity" json:"parentCity,omitempty"`
	}

	// Country\State\Region\City\Town\Road
	// CityDistricts = map[string]([]*CityDistrictsItem)
)

func (d *GeoDbx) FilterChinaGeoInfo(cd *CityDistrictsItem, displayNameArr []string, count int) bool {

	if cd == nil {
		return false
	}
	for k, v := range displayNameArr {
		if k == 0 {
			continue
		}
		// log.Info(cd.Name, v, cd.Name == v)
		if cd.Name == v {
			count += 1
			// return true
		}
	}
	if count == 2 {
		return true
	}

	return d.FilterChinaGeoInfo(cd.ParentCity, displayNameArr, count)

}

func (d *GeoDbx) GetChinaGeoInfo(town string, displayNameArr []string) *GeoInfo {
	districts := d.GetChinaCityDistricts()

	geoInfo := new(GeoInfo)

	for k, v := range districts {
		if k == "Town" || k == "City" {
			for _, sv := range v {

				if sv.Name == town {
					log.Info(sv.Name, displayNameArr)
					b := d.FilterChinaGeoInfo(sv.ParentCity, displayNameArr, 0)
					if !b {
						continue
					}

					// log.Info("sv", sv, sv.Latlng)
					d.getParentCityName(sv, geoInfo)

					d.formatAddress(geoInfo)

					return geoInfo
				}
			}
		}
	}

	return geoInfo
}

// ReverseGeocode 定义了逆地理编码的响应结构
type ReverseGeocodeByNominatim struct {
	PlaceID     int      `json:"place_id"`     // 地点ID
	Licence     string   `json:"licence"`      // 许可信息
	OsmType     string   `json:"osm_type"`     // OSM类型
	OsmID       int      `json:"osm_id"`       // OSM ID
	Lat         string   `json:"lat"`          // 纬度（字符串形式）
	Lon         string   `json:"lon"`          // 经度（字符串形式）
	Category    string   `json:"category"`     // 类别
	Type        string   `json:"type"`         // 类型
	PlaceRank   int      `json:"place_rank"`   // 地点排名
	Importance  float64  `json:"importance"`   // 重要性评分
	AddressType string   `json:"addresstype"`  // 地址类型
	Name        string   `json:"name"`         // 名称
	DisplayName string   `json:"display_name"` // 显示名称
	Address     Address  `json:"address"`      // 嵌套的地址结构
	BoundingBox []string `json:"boundingbox"`  // 边界框（字符串切片）
	GeoJSON     GeoJSON  `json:"geojson"`      // 嵌套的GeoJSON结构
}

// Address 定义了地址的详细结构
type Address struct {
	CityDistrict  string `json:"city_district"`  // 乡镇
	Town          string `json:"town"`           // 乡镇
	County        string `json:"county"`         // 城市
	District      string `json:"district"`       // 城市
	Suburb        string `json:"suburb"`         // 城市
	Neighbourhood string `json:"neighbourhood"`  // 城市
	City          string `json:"city"`           // 城市
	Region        string `json:"region"`         // 城市
	State         string `json:"state"`          // 州/省
	ISO3166_2Lvl4 string `json:"ISO3166-2-lvl4"` // ISO3166-2四级代码
	ISO3166_2Lvl3 string `json:"ISO3166-2-lvl3"` // ISO3166-2四级代码
	Country       string `json:"country"`        // 国家
	CountryCode   string `json:"country_code"`   // 国家代码
}

// GeoJSON 定义了GeoJSON的结构
type GeoJSON struct {
	Type        string      `json:"type"`        // GeoJSON类型（如Polygon或MultiPolygon）
	Coordinates interface{} `json:"coordinates"` // 坐标数据（动态类型）
}

func (d *GeoDbx) RegeoByNominatim(lat, lng float64, zoom int) (*GeoInfo, error) {
	geoInfo := new(GeoInfo)

	if zoom == 0 {
		zoom = 14
	}
	log.Error("zoom", zoom)

	resp, err := conf.RestyClient.R().SetQueryParams(map[string]string{}).
		Get(
			conf.Config.NominatimApiUrl + "/reverse?format=jsonv2&lat=" +
				// "https://nominatim.aiiko.club/reverse?format=jsonv2&lat=" +
				nstrings.ToString(lat) + "&lon=" +
				nstrings.ToString(lng) + "&zoom=" +
				nstrings.ToString(zoom) + "&addressdetails=1&accept-language=zh-CN",
		)
	if err != nil {
		return nil, err
	}

	rgc := new(ReverseGeocodeByNominatim)

	// log.Info("resp.Body()", resp.String())
	if err = json.Unmarshal(resp.Body(), rgc); err != nil {
		return nil, err
	}

	log.Info("rgc", rgc.DisplayName, rgc.Address.State, rgc.Name)

	displayNameArr := make([]string, 6)
	displayNameArr = narrays.Filter(strings.Split(rgc.DisplayName, ", "), func(value string, index int) bool {

		return nint.ToInt(value) == 0
	})
	narrays.Reverse(&displayNameArr)
	log.Info("displayNameArr", displayNameArr)

	if rgc.Address.CountryCode == "cn" && !(rgc.Address.State == "香港" || rgc.Address.State == "澳門") {
		geoInfo = d.GetChinaGeoInfo(rgc.Name, displayNameArr)
		if geoInfo.Country == "" {
			geoInfo.Country = rgc.Address.Country
		}

		log.Info(geoInfo)
		if geoInfo.Address == "" || geoInfo.Town == "" {
			if zoom == 12 {
				return geoInfo, nil
			}

			return d.RegeoByNominatim(lat, lng, zoom-1)
		}

	} else if rgc.Address.State == "澳門" {

		geoInfo.Country = "中国"
		geoInfo.State = displayNameArr[1]
		geoInfo.City = displayNameArr[2]
	} else if rgc.Address.State == "香港" {

		geoInfo.Country = "中国"
		geoInfo.State = displayNameArr[1]
		geoInfo.Region = displayNameArr[2]
		geoInfo.City = displayNameArr[3]
		if len(displayNameArr) >= 5 {
			geoInfo.Town = displayNameArr[4]
		}
	} else if rgc.Address.CountryCode == "tw" {
		geoInfo.Country = "中国"
		geoInfo.State = displayNameArr[0]
		geoInfo.Region = displayNameArr[1]
		geoInfo.City = displayNameArr[2]
		geoInfo.Town = displayNameArr[3]
		// geoInfo.Region = nstrings.StringOr(rgc.Address.City, rgc.Address.County)
		// geoInfo.City = nstrings.StringOr(rgc.Address.Suburb, rgc.Address.Town)
		// geoInfo.Town = nstrings.StringOr(rgc.Address.Neighbourhood, rgc.Address.CityDistrict, rgc.Address.Suburb)

	} else {
		// geoInfo.Country = rgc.Address.Country
		// geoInfo.State = rgc.Address.State
		// geoInfo.Region = rgc.Address.Region
		// geoInfo.City = rgc.Address.City
		// geoInfo.Town = rgc.Address.Town
	}
	d.formatAddress(geoInfo)

	geoInfo.Platform = "Nominatim"
	geoInfo.Latlng = &CityDistrictsLatlng{
		Lat: nfloat.ToFloat64(rgc.Lat),
		Lng: nfloat.ToFloat64(rgc.Lon),
	}

	// log.Info("street", nstrings.ToString(amapRes.Regeocode.AddressComponent.StreetNumber.(map[string]any)["street"]))

	// geoInfo.Country = nstrings.ToString(amapRes.Regeocode.AddressComponent.Country)
	// geoInfo.State = nstrings.ToString(amapRes.Regeocode.AddressComponent.Province)
	// geoInfo.Region = nstrings.ToString(amapRes.Regeocode.AddressComponent.City)
	// geoInfo.City = nstrings.ToString(amapRes.Regeocode.AddressComponent.District)
	// geoInfo.Town = nstrings.ToString(amapRes.Regeocode.AddressComponent.Township)
	// geoInfo.Road = nstrings.ToString(amapRes.Regeocode.AddressComponent.StreetNumber.(map[string]any)["street"])

	return geoInfo, nil
}

type AmapCityDistricts struct {
	Adcode    string
	Name      string
	Center    string
	Level     string
	Districts []*AmapCityDistricts
}

type AmapCityDistrictsRes struct {
	Status     string
	Info       string
	Count      string
	CreateTime int64
	Districts  []*AmapCityDistricts
}

func (d *GeoDbx) RegeoByAmap(lat, lng float64) (*GeoInfo, error) {
	geoInfo := new(GeoInfo)

	latlng := nstrings.ToString(lng) + "," + nstrings.ToString(lat)

	key := conf.Redisdb.GetKey("RegeoByAmap")

	err := conf.Redisdb.GetStruct(key.GetKey("amap"), geoInfo)
	if true || err != nil {

		resp, err := conf.RestyClient.R().SetQueryParams(map[string]string{}).
			Get(
				"https://restapi.amap.com/v3/geocode/regeo?output=json&location=" + latlng + "&key=" + conf.Config.AmapKey + "&radius=100&extensions=all",
			)
		if err != nil {
			return nil, err
		}

		type AmapRes struct {
			Regeocode struct {
				AddressComponent struct {
					Country      any
					Province     any
					City         any
					District     any
					Township     any
					StreetNumber any
				}
			}
		}
		amapRes := new(AmapRes)

		// log.Info("resp.Body()", resp.String())
		if err = json.Unmarshal(resp.Body(), amapRes); err != nil {
			return nil, err
		}

		// log.Info("street", nstrings.ToString(amapRes.Regeocode.AddressComponent.StreetNumber.(map[string]any)["street"]))

		geoInfo.Country = nstrings.ToString(amapRes.Regeocode.AddressComponent.Country)
		geoInfo.State = nstrings.ToString(amapRes.Regeocode.AddressComponent.Province)
		geoInfo.Region = nstrings.ToString(amapRes.Regeocode.AddressComponent.City)
		geoInfo.City = nstrings.ToString(amapRes.Regeocode.AddressComponent.District)
		geoInfo.Town = nstrings.ToString(amapRes.Regeocode.AddressComponent.Township)
		geoInfo.Road = nstrings.ToString(amapRes.Regeocode.AddressComponent.StreetNumber.(map[string]any)["street"])

		geoInfo.Platform = "Amap"
		d.formatAddress(geoInfo)

		if err := conf.Redisdb.SetStruct(key.GetKey("amap"), geoInfo, key.GetExpiration()); err != nil {
			return nil, err
		}
	}

	return geoInfo, nil
}

func (d *GeoDbx) formatAddress(geoInfo *GeoInfo) {
	addArr := []string{
		geoInfo.Country,
		geoInfo.State,
		geoInfo.Region,
		geoInfo.City,
		geoInfo.Town,
	}

	// log.Info("addArr", addArr)
	tempAddArr := narrays.Filter(addArr, func(value string, index int) bool {
		return value != ""
	})
	if len(tempAddArr) > 0 {
		geoInfo.Address = strings.Join(tempAddArr, "·")
	}
}

func (d *GeoDbx) getParentCityName(city *CityDistrictsItem, geoInfo *GeoInfo) {
	if city == nil {
		return
	}

	switch city.Type {
	case "Town":
		geoInfo.Town = city.Name
	case "City":
		geoInfo.City = city.Name
	case "Region":
		geoInfo.Region = city.Name
	case "State":
		geoInfo.State = city.Name

		switch city.Name {
		case "重庆市":
			geoInfo.Region = ""
		case "北京市":
			geoInfo.Region = ""
		case "上海市":
			geoInfo.Region = ""
		case "天津市":
			geoInfo.Region = ""
		}
	case "Country":
		geoInfo.Country = city.Name
	}

	if city.ParentCity != nil {
		d.getParentCityName(city.ParentCity, geoInfo)
	}
}

func (d *GeoDbx) GetChinaCityDistricts() map[string][]*CityDistrictsItem {
	return chinaCityDistricts
}

func (d *GeoDbx) FormatChinaCityDistricts(acd *AmapCityDistricts, parentCity *CityDistrictsItem, cdMap map[string]([]*CityDistrictsItem)) {

	center := strings.Split(acd.Center, ",")

	cd := CityDistrictsItem{
		Adcode: acd.Adcode,
		Name:   acd.Name,
		Latlng: &CityDistrictsLatlng{
			Lat: nfloat.ToFloat64(center[1]),
			Lng: nfloat.ToFloat64(center[0]),
		},
		ParentCity: parentCity,
	}

	if acd.Name == "中华人民共和国" {
		cd.Name = "中国"
	}

	if acd.Level == "country" {
		if cdMap["Country"] == nil {
			cdMap["Country"] = []*CityDistrictsItem{}
		}

		cd.Type = "Country"

		cdMap["Country"] = append(cdMap["Country"], &cd)
	}

	if acd.Level == "province" {
		if cdMap["State"] == nil {
			cdMap["State"] = []*CityDistrictsItem{}
		}

		cd.Type = "State"

		cdMap["State"] = append(cdMap["State"], &cd)
	}

	if acd.Level == "city" {
		if cdMap["Region"] == nil {
			cdMap["Region"] = []*CityDistrictsItem{}
		}

		cd.Type = "Region"

		cdMap["Region"] = append(cdMap["Region"], &cd)
	}

	if acd.Level == "district" {
		if cdMap["City"] == nil {
			cdMap["City"] = []*CityDistrictsItem{}
		}

		cd.Type = "City"

		cdMap["City"] = append(cdMap["City"], &cd)
	}

	if acd.Level == "street" {
		if cdMap["Town"] == nil {
			cdMap["Town"] = []*CityDistrictsItem{}
		}

		cd.Type = "Town"

		cdMap["Town"] = append(cdMap["Town"], &cd)
	}

	for _, v := range acd.Districts {

		d.FormatChinaCityDistricts(v, &cd, cdMap)
	}

}

func (d *GeoDbx) GetChinaCityDistrictsByAmap(country string) (map[string]([]*CityDistrictsItem), error) {
	basePath := "./cityDistricts/"

	fileName := "china.json"

	log.Info("GetChinaCityDistrictsByAmap")

	amapRes := new(AmapCityDistrictsRes)

	cdMap := map[string]([]*CityDistrictsItem){}

	csf := conf.SAaSS.CreateCloudServiceFile()
	cdFile, err := csf.GetFile(basePath, fileName)
	if err != nil {
		log.Error(err)
		return nil, err
	}

	err = cdFile.JSON(amapRes)
	log.Info(amapRes, amapRes.CreateTime, err)

	if err != nil || amapRes == nil || amapRes.CreateTime == 0 || amapRes.CreateTime < time.Now().Unix() {
		if err != nil {
			log.Error(err)
		}

		resp, err := conf.RestyClient.R().SetQueryParams(map[string]string{}).
			Get(
				// "http://192.168.204.132:23202/district.json",
				"https://restapi.amap.com/v3/config/district?keywords=" + country +
					"&subdistrict=5&key=" + conf.Config.AmapKey,
			)
		if err != nil {
			log.Error(err)
			return nil, err
		}
		// log.Info("resp.Body()", resp.String())
		if err = json.Unmarshal(resp.Body(), amapRes); err != nil {
			return nil, err
		}
		// log.Info("resp.Body()", res)

		log.Info(amapRes, conf.Config.AmapKey)

		if amapRes.Status != "1" {
			return nil, errors.New(amapRes.Info)
		}
		log.Info(amapRes.Districts, len(amapRes.Districts))

		amapRes.CreateTime = time.Now().Unix() + 3600*24*7

		if err := csf.UploadFile(amapRes, basePath, fileName, -1); err != nil {
			log.Error(err)
			return nil, err
		}
	}
	d.FormatChinaCityDistricts(amapRes.Districts[0], nil, cdMap)

	return cdMap, nil
}

func (d *GeoDbx) InitCity() {
	ntimer.SetTimeout(func() {

		d.InitChinaCityDistrictsByAmap()

		ntimer.SetRepeatTimeTimer(func() {
			d.InitChinaCityDistrictsByAmap()
		}, ntimer.RepeatTime{
			Hour: 4,
		}, "Day")
	}, 400)

}

func (d *GeoDbx) InitChinaCityDistrictsByAmap() {
	log.Info("InitChinaCityDistrictsByAmap")
	districts, err := d.GetChinaCityDistrictsByAmap("中国")
	// log.Info("districts", districts, err)
	if err != nil {
		log.Error(err)
		return
	}

	chinaCityDistricts = districts

	for k, v := range districts {
		log.Info(k, len(v))
	}

	// log.Error("GetGeoInfo", d.GetChinaGeoInfo("鸣音镇"))
	// log.Error("GetGeoInfo", d.GetChinaGeoInfo("万灵镇"))
	// log.Error("GetGeoInfo", d.GetChinaGeoInfo("董家镇"))
	// log.Error("GetGeoInfo", d.GetChinaGeoInfo("万峰湖镇"))
	// log.Error("GetGeoInfo", d.GetChinaGeoInfo("江川路街道"))
	// log.Error("GetGeoInfo", d.GetChinaGeoInfo("油尖旺区"))
}
