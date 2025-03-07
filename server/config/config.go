package conf

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/typings"
	"github.com/cherrai/nyanyago-utils/goroutinepanic"
	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/go-resty/resty/v2"
)

var (
	Log           = nlog.New()
	log           = Log
	Config        *typings.Config
	RestyClient   = resty.New()
	G             = goroutinepanic.G
	FileTokenSign = "saass_2022_6_4"
	// TrunAddress      = "turn:192.168.1.104:3478"
	// TrunAddress      = "turn:tools.aiiko.club:3478"
	// TrunAuthSecret   = "saass_2022_6_4"
	// TrunAuthDuration = 60
	// SfuAuthSecret    = "saass_2022_6_4"
	// SfuAuthDuration  = 60
	// 文件到期后根据时间进行删除 未做
	// []string{"Image", "Video", "Audio", "Text", "File"}
	FileExpirationRemovalDeadline = 60 * 3600 * 24 * time.Second
	// 临时文件删除期限
	TempFileRemovalDeadline = 60 * 3600 * 24 * time.Second
)

func GetConfig(configPath string) {
	jsonFile, _ := os.Open(configPath)

	defer jsonFile.Close()
	decoder := json.NewDecoder(jsonFile)

	conf := new(typings.Config)
	//Decode从输入流读取下一个json编码值并保存在v指向的值里
	err := decoder.Decode(&conf)
	if err != nil {
		fmt.Println("Error:", err)
	}
	// log.Info("conf", conf)
	Config = conf
}
