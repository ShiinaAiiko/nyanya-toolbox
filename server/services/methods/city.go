package methods

// func GetCityBoundaries(version string) {

// 	log.Info("GetCityBoundaries", version)

// 	basePath := "./cityBoundaries/" + version

// 	log.Info("basePath", basePath, nfile.IsExists(basePath))

// 	if !nfile.IsExists(basePath) {
// 		if err := nfile.CreateFolder(basePath, 0755); err != nil {
// 			log.Error(err)
// 			return
// 		}
// 	}

// 	districts, err := GetChinaCityDistrictsByAmap("中国")
// 	log.Info("districts", districts, err)
// 	if err != nil {
// 		log.Error(err)
// 		return
// 	}

// 	// if err := getCityBoundaries(districts, basePath, nil); err != nil {
// 	// 	log.Error(err)
// 	// 	return
// 	// }
// }

// type OSMDistrictRes struct {
// 	Lat     float64
// 	Lon     float64
// 	Class   string
// 	Geojson struct {
// 		Type        string
// 		Coordinates []any
// 	}
// }

// type CityBoundaries struct {
// 	CityList            [][]string
// 	BoundariesGPSLength int
// 	// 边界类型 MultiPolygon Polygon
// 	Type       string
// 	Boundaries []([]float64)
// }

// func getCityBoundaries(districts *AmapCityDistricts, basePath string, parentAddr *CityName) error {

// 	cn := GetShortCityName(districts.Name, parentAddr)
// 	log.Info(districts.Name, cn)

// 	minIndex := len(cn.List)

// 	if len(cn.List) > 1 {
// 		minIndex = len(cn.List) - 2
// 	}

// 	Address := strings.Join(narrays.Map(cn.List[minIndex:len(cn.List)], func(v *CityName, index int) string {
// 		return v.ZhCN
// 	}), "")
// 	log.Info(Address, narrays.Map(cn.List, func(v *CityName, index int) string {
// 		return v.ZhCN
// 	}))

// 	cbPath := basePath + "/" + strings.Join(narrays.Map(cn.List[0:len(cn.List)-1], func(v *CityName, index int) string {
// 		return v.EnUS
// 	}), "/")
// 	// log.Info(cbPath, cn.EnUS)

// 	tempCityBoundaries := new(CityBoundaries)

// 	csf := conf.SAaSS.CreateCloudServiceFile()
// 	cdFile, err := csf.GetFile(cbPath, cn.EnUS+".json")
// 	if err != nil {
// 		log.Error(err)
// 		return err
// 	}

// 	// log.Info("tempCityBoundaries", cdFile)
// 	// log.Info("tempCityBoundaries", tempCityBoundaries == nil)
// 	if err := cdFile.JSON(&tempCityBoundaries); err != nil {
// 		log.Error(err)
// 		return err
// 	}
// 	log.Info("tempCityBoundaries", len(tempCityBoundaries.CityList))

// 	err = CheckCityBoundaries(tempCityBoundaries)
// 	if len(tempCityBoundaries.CityList) == 0 || err != nil {

// 		resp, err := conf.RestyClient.R().SetQueryParams(map[string]string{
// 			// "q": "中国重庆市",
// 			"q":               Address,
// 			"format":          "json",
// 			"addressdetails":  "1",
// 			"polygon_geojson": "1",
// 		}).
// 			Get(

// 				"https://nominatim.openstreetmap.org/search",
// 			)
// 		if err != nil {
// 			log.Error(err)
// 			return err
// 		}
// 		osmDistrictRes := []*OSMDistrictRes{}

// 		// log.Info("resp.Body()", string(resp.Body()))
// 		if err = json.Unmarshal(resp.Body(), &osmDistrictRes); err != nil {
// 			log.Error(err)
// 			return err
// 		}

// 		if len(osmDistrictRes) == 0 {
// 			return nil
// 		}

// 		cb := CityBoundaries{
// 			CityList: narrays.Map(cn.List, func(v *CityName, index int) []string {
// 				return []string{v.ZhCN, v.EnUS}
// 			}),
// 			Boundaries: [][]float64{},
// 		}

// 		for _, vd := range osmDistrictRes {
// 			if len(vd.Geojson.Coordinates) == 2 &&
// 				nfloat.ToFloat64(vd.Geojson.Coordinates[0]) != 0 {
// 				continue
// 			}
// 			for _, v := range vd.Geojson.Coordinates {

// 				vArr := v.([]any)
// 				// log.Error(len(vArr))
// 				// log.Info(vArr)
// 				if len(vArr) == 2 {

// 					cb.Boundaries = append(cb.Boundaries, []float64{nfloat.ToFloat64(vArr[0]), nfloat.ToFloat64(vArr[1])})

// 					continue
// 				}

// 				for _, sv := range vArr {
// 					svArr := sv.([]any)
// 					// log.Error(len(svArr))

// 					if len(svArr) == 2 {

// 						cb.Boundaries = append(cb.Boundaries, []float64{nfloat.ToFloat64(svArr[0]), nfloat.ToFloat64(svArr[1])})

// 						continue
// 					}

// 					for _, ssv := range svArr {
// 						ssvArr := ssv.([]any)
// 						// log.Error(len(ssvArr))
// 						cb.Boundaries = append(cb.Boundaries, []float64{nfloat.ToFloat64(ssvArr[0]), nfloat.ToFloat64(ssvArr[1])})
// 					}

// 				}
// 			}
// 		}

// 		log.Info(len(cb.Boundaries))

// 		if err := CheckCityBoundaries(&cb); err != nil {
// 			return err
// 		}
// 		if err := csf.UploadFile(&cb, cbPath, cn.EnUS+".json", -1); err != nil {
// 			log.Error(err)
// 			return err
// 		}
// 	}

// 	for _, v := range districts.Districts {

// 		if v.Level == "street" {
// 			continue
// 		}
// 		if err := getCityBoundaries(v, basePath, cn); err != nil {
// 			return err
// 		}

// 	}

// 	return nil
// }

// func CheckCityBoundaries(cb *CityBoundaries) error {
// 	if len(cb.Boundaries) < 15 {
// 		log.Error("边界太少，有问题", len(cb.Boundaries))
// 		// 第二次还少的就直接使用amp了
// 		return errors.New("边界太少，有问题")
// 	}
// 	return nil
// }

// type CityName struct {
// 	ZhCN string
// 	EnUS string
// 	List []*CityName
// }

// // var ethnicReg:=/傣族|布朗族|独龙族|佤族|怒族|景颇族|普米族|德昂族|拉祜族|阿昌族|纳西族|哈尼族|藏族|蒙古族|回族|维吾尔族|壮族|苗族|彝族|布依族|朝鲜族|满族|侗族|瑶族|白族|土家族|哈萨克族|黎族|傈僳族|东乡族|仡佬族|拉祜族|佤族|水族|土族|羌族|达斡尔族|仫佬族|锡伯族|柯尔克孜族|景颇族|撒拉族|布朗族|毛南族|塔吉克族|普米族|阿昌族|怒族|乌孜别克族|俄罗斯族|鄂温克族|崩龙族|裕固族|保安族|京族|独龙族|赫哲族|高山族/g

// func GetShortCityName(cityName string, parentAddr *CityName) *CityName {
// 	cn := CityName{
// 		ZhCN: "",
// 		EnUS: "",
// 	}
// 	if cityName == "中华人民共和国" {
// 		cn.ZhCN = "中国"
// 		cn.EnUS = "China"
// 		if parentAddr == nil {
// 			cn.List = append(cn.List, &cn)
// 			return &cn
// 		}
// 		cn.List = append(parentAddr.List, &cn)
// 		return &cn
// 	}
// 	cn.ZhCN = cityName
// 	args := pinyin.NewArgs()
// 	pinyinStr := pinyin.LazyPinyin(cn.ZhCN, args)

// 	// 打印拼音

// 	cn.EnUS = strings.Title(strings.Join(pinyinStr, ""))

// 	if parentAddr == nil {
// 		cn.List = append(cn.List, &cn)
// 		return &cn
// 	}
// 	cn.List = append(parentAddr.List, &cn)

// 	return &cn
// }

// // 定义 GeoJSON 数据结构
// type GeoJSON struct {
// 	Type        string          `json:"type"`
// 	Coordinates [][][][]float64 `json:"coordinates"` // 适用于 MultiPolygon
// }

// // 定义 Polygon 结构（单个多边形）
// type Polygon struct {
// 	OuterBoundary [][]float64   `json:"outer_boundary"`
// 	Holes         [][][]float64 `json:"holes,omitempty"`
// }

// // 解析 GeoJSON 并转换为 Golang 结构体
// func parseGeoJSON(data []byte) (*GeoJSON, error) {
// 	var geo GeoJSON
// 	err := json.Unmarshal(data, &geo)
// 	if err != nil {
// 		return nil, err
// 	}
// 	return &geo, nil
// }

// // 提取外边界
// func extractPolygons(geo *GeoJSON) []Polygon {
// 	var polygons []Polygon
// 	for _, polygon := range geo.Coordinates {
// 		if len(polygon) > 0 {
// 			polygons = append(polygons, Polygon{
// 				OuterBoundary: polygon[0],  // 第一个数组是外边界
// 				Holes:         polygon[1:], // 之后的是“洞”
// 			})
// 		}
// 	}
// 	return polygons
// }

// // // 解析 JSON
// // geo, err := parseGeoJSON([]byte(jsonData))
// // if err != nil {
// // 	fmt.Println("Error:", err)
// // 	return
// // }

// // // 提取多边形数据
// // polygons := extractPolygons(geo)

// // // 打印解析结果
// // for i, poly := range polygons {
// // 	fmt.Printf("Polygon %d:\n", i+1)
// // 	fmt.Println("  Outer Boundary:", poly.OuterBoundary)
// // 	if len(poly.Holes) > 0 {
// // 		fmt.Println("  Holes:", poly.Holes)
// // 	}
// // }
// // package main

// // import (
// // 	"encoding/json"
// // 	"fmt"
// // )

// // // GeoJSON 结构体
// // type GeoJSON struct {
// // 	Type        string    `json:"type"`
// // 	Coordinates Geometry  `json:"coordinates"`
// // }

// // // Geometry 结构体，兼容 Polygon 和 MultiPolygon
// // type Geometry struct {
// // 	Polygons [][][]float64 // 存储多边形的坐标数据
// // }

// // // 实现 `UnmarshalJSON`，兼容 `Polygon` 和 `MultiPolygon`
// // func (g *Geometry) UnmarshalJSON(data []byte) error {
// // 	var multiPolygon [][][][]float64
// // 	var polygon [][]float64

// // 	// 尝试解析为 MultiPolygon
// // 	if err := json.Unmarshal(data, &multiPolygon); err == nil {
// // 		// 解析成功，说明是 MultiPolygon
// // 		g.Polygons = multiPolygon
// // 		return nil
// // 	}

// // 	// 尝试解析为 Polygon
// // 	if err := json.Unmarshal(data, &polygon); err == nil {
// // 		// 解析成功，转换为 MultiPolygon 格式（单个 Polygon）
// // 		g.Polygons = [][][]float64{polygon}
// // 		return nil
// // 	}

// // 	return fmt.Errorf("无法解析 coordinates，数据格式错误")
// // }

// // // Polygon 结构体，存储一个多边形
// // type Polygon struct {
// // 	OuterBoundary [][]float64 `json:"outer_boundary"`
// // 	Holes         [][][]float64 `json:"holes,omitempty"`
// // }

// // // 提取外边界数据
// // func extractPolygons(geo *GeoJSON) []Polygon {
// // 	var polygons []Polygon
// // 	for _, polygon := range geo.Coordinates.Polygons {
// // 		if len(polygon) > 0 {
// // 			polygons = append(polygons, Polygon{
// // 				OuterBoundary: polygon[0], // 第一个数组是外边界
// // 				Holes:         polygon[1:], // 之后的是“洞”
// // 			})
// // 		}
// // 	}
// // 	return polygons
// // }

// // func main() {
// // 	// 测试数据：MultiPolygon
// // 	multiPolygonData := `{
// // 		"type": "MultiPolygon",
// // 		"coordinates": [
// // 			[
// // 				[
// // 					[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]
// // 				]
// // 			],
// // 			[
// // 				[
// // 					[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]
// // 				]
// // 			]
// // 		]
// // 	}`

// // 	// 测试数据：Polygon（单一区域）
// // 	polygonData := `{
// // 		"type": "Polygon",
// // 		"coordinates": [
// // 			[ [102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0] ]
// // 		]
// // 	}`

// // 	// 解析 MultiPolygon
// // 	var geoMulti GeoJSON
// // 	if err := json.Unmarshal([]byte(multiPolygonData), &geoMulti); err != nil {
// // 		fmt.Println("解析 MultiPolygon 失败:", err)
// // 		return
// // 	}

// // 	// 解析 Polygon
// // 	var geoPolygon GeoJSON
// // 	if err := json.Unmarshal([]byte(polygonData), &geoPolygon); err != nil {
// // 		fmt.Println("解析 Polygon 失败:", err)
// // 		return
// // 	}

// // 	// 提取多边形数据
// // 	polygonsMulti := extractPolygons(&geoMulti)
// // 	polygonsPolygon := extractPolygons(&geoPolygon)

// // 	// 输出解析结果
// // 	fmt.Println("MultiPolygon 解析结果:")
// // 	for i, poly := range polygonsMulti {
// // 		fmt.Printf("Polygon %d:\n", i+1)
// // 		fmt.Println("  Outer Boundary:", poly.OuterBoundary)
// // 		if len(poly.Holes) > 0 {
// // 			fmt.Println("  Holes:", poly.Holes)
// // 		}
// // 	}

// // 	fmt.Println("\nPolygon 解析结果:")
// // 	for i, poly := range polygonsPolygon {
// // 		fmt.Printf("Polygon %d:\n", i+1)
// // 		fmt.Println("  Outer Boundary:", poly.OuterBoundary)
// // 		if len(poly.Holes) > 0 {
// // 			fmt.Println("  Holes:", poly.Holes)
// // 		}
// // 	}
// // }
