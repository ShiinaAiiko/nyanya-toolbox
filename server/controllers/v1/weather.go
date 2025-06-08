package controllersV1

import (
	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/protos"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"
	"github.com/cherrai/nyanyago-utils/nshortid"
	"github.com/cherrai/nyanyago-utils/saass"
	"github.com/cherrai/nyanyago-utils/validation"
	sso "github.com/cherrai/saki-sso-go"
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/copier"
)

type WeatherController struct {
}

func getWeatherFileName(c *gin.Context, rename bool) string {
	token := c.GetString("token")
	deviceId := c.GetString("deviceId")
	userAgent := c.MustGet("userAgent").(*sso.UserAgent)

	authorId := c.MustGet("userInfo").(*sso.UserInfo).Uid

	fileName := ""
	fName, err :=
		conf.SSO.AppData.Get("WeatherDataFileName",
			token, deviceId, userAgent,
		)
	if err == nil {
		fileName = fName.(string)
	}

	if rename {
		path := "/appData/NyaNyaToolbox/weather/"
		conf.SAaSS.MoveFilesToTrash(path, []string{fileName + ".json"},
			conf.SAaSS.GenerateRootPath(authorId), authorId)
	}

	if fileName == "" || rename {
		fileName = nshortid.GetShortId(12)
		conf.SSO.AppData.Set("WeatherDataFileName",
			fileName, token, deviceId, userAgent,
		)
	}

	return fileName
}

func (fc *WeatherController) GetUploadToken(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	data := new(protos.GetUploadTokenOfWeather_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}

	// 3、验证参数
	if err = validation.ValidateStruct(
		data,
		validation.Parameter(&data.Size, validation.Type("int64"), validation.Required()),
		validation.Parameter(&data.Hash, validation.Type("string"), validation.Required()),
		validation.Parameter(&data.LastUpdateTime, validation.Type("int64"), validation.Required()),
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	authorId := c.MustGet("userInfo").(*sso.UserInfo).Uid

	// 4、获取Token
	chunkSize := int64(512 * 1024)

	fileName := getWeatherFileName(c, false)

	fileInfo := &saass.FileInfo{
		Name:         fileName,
		Size:         data.Size,
		Type:         "application/json",
		Suffix:       ".json",
		LastModified: data.LastUpdateTime,
		Hash:         data.Hash,
	}
	path := "/appData/NyaNyaToolbox/weather/"

	ut, err := conf.SAaSS.CreateChunkUploadToken(&saass.CreateUploadTokenOptions{
		FileInfo:       fileInfo,
		Path:           path,
		FileName:       fileInfo.Name + fileInfo.Suffix,
		ChunkSize:      chunkSize,
		VisitCount:     -1,
		ExpirationTime: -1,
		// Type:           "File",
		FileConflict: "Replace",
		AllowShare:   1,
		RootPath:     conf.SAaSS.GenerateRootPath(authorId),
		UserId:       authorId,
		ShareUsers:   []string{"AllUser"},

		OnProgress: func(progress saass.Progress) {
			// log.Info("progress", progress)
		},
		OnSuccess: func(urls saass.Urls) {
			// log.Info("urls", urls)
		},
		OnError: func(err error) {
			// log.Info("err", err)
		},
	})
	if err != nil {
		res.Errors(err)
		res.Code = 10001
		res.Call(c)
		return
	}
	urls := protos.Urls{
		DomainUrl: ut.Urls.DomainUrl,
		ShortUrl:  ut.Urls.ShortUrl,
		Url:       ut.Urls.Url,
	}
	// log.Info("ChunkSize", ut)
	// log.Info("ChunkSize", ut.ChunkSize, chunkSize)

	fi := new(protos.FileInfo)
	copier.Copy(fi, fileInfo)
	protoData := &protos.GetUploadTokenOfWeather_Response{
		Urls:              &urls,
		ApiUrl:            ut.ApiUrl,
		Token:             ut.Token,
		ChunkSize:         ut.ChunkSize,
		UploadedOffset:    ut.UploadedOffset,
		UploadedTotalSize: ut.UploadedTotalSize,
		FileInfo:          fi,
	}

	res.Data = protos.Encode(protoData)

	res.Call(c)
}

func (fc *WeatherController) GetWeatherFileUrls(c *gin.Context) {
	// 1、请求体
	var res response.ResponseProtobufType
	res.Code = 200

	// 2、获取参数
	data := new(protos.GetWeatherFileUrls_Request)
	var err error
	if err = protos.DecodeBase64(c.GetString("data"), data); err != nil {
		res.Error = err.Error()
		res.Code = 10002
		res.Call(c)
		return
	}

	// 3、验证参数
	if err = validation.ValidateStruct(
		data,
	); err != nil {
		res.Errors(err)
		res.Code = 10002
		res.Call(c)
		return
	}

	authorId := c.MustGet("userInfo").(*sso.UserInfo).Uid

	path := "/appData/NyaNyaToolbox/weather/"
	rootPath := conf.SAaSS.GenerateRootPath(authorId)

	// conf.SAaSS.GetAppToken(rootPath string, userId string)

	fileName := getWeatherFileName(c, false)

	files, err := conf.SAaSS.GetFolderFiles(
		path,
		rootPath,
		authorId)
	log.Info("files", authorId, err, path, files)
	if err != nil {
		res.Error = err.Error()
		res.Code = 10020
		res.Call(c)
		return
	}

	fi := new(protos.FileInfo)
	urls := new(protos.Urls)

	for _, file := range files.List {
		log.Info(file.FileInfo.Name, file.LastUpdateTime, fileName)
		if file.FileInfo.Name == fileName {
			urls.DomainUrl = file.Urls.DomainUrl
			urls.ShortUrl = file.Urls.ShortUrl
			urls.Url = file.Urls.Url

			copier.Copy(fi, file.FileInfo)

		}

	}
	// log.Info("ChunkSize", ut)
	// log.Info("ChunkSize", ut.ChunkSize, chunkSize)

	protoData := &protos.GetWeatherFileUrls_Response{
		FileInfo: fi,
		Urls:     urls,
	}

	res.Data = protos.Encode(protoData)

	res.Call(c)
}
