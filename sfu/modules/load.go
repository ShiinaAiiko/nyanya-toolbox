package modules

import (
	"encoding/json"
	"flag"
	"os"
	"strings"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/sfu/config"
	"github.com/ShiinaAiiko/nyanya-toolbox/sfu/typings"
	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/pion/ion-sfu/pkg/sfu"
)

var (
	file string
)

const (
	portRangeLimit = 100
)

func load() *typings.Config {
	conf := new(typings.Config)

	// log.Info(file)

	if file == "" {
		log.Info("config file does not exist.")
		return nil
	}

	jsonFile, _ := os.Open(file)

	defer jsonFile.Close()
	log.Info("jsonFile", jsonFile, "file")
	decoder := json.NewDecoder(jsonFile)
	//Decode从输入流读取下一个json编码值并保存在v指向的值里
	err := decoder.Decode(&conf)

	if err != nil {
		log.Error(err, "sfu config file loaded failed", "file", file)
		return nil
	}

	log.Info("conf.SFU 81", conf.SFU)
	log.Info("conf.WebRTC 82", conf.WebRTC)
	log.Info("conf.Router 82", conf.Router)
	log.Info("conf.Turn 82", conf.Turn)

	if len(conf.WebRTC.ICEPortRange) > 2 {
		log.Error("config file loaded failed. webrtc port must be [min,max]", "file", file)
		return nil
	}

	if len(conf.WebRTC.ICEPortRange) != 0 && conf.WebRTC.ICEPortRange[1]-conf.WebRTC.ICEPortRange[0] < portRangeLimit {
		log.Error(nil, "config file loaded failed. webrtc port must be [min, max] and max - min >= portRangeLimit", "file", file, "portRangeLimit", portRangeLimit)
		return nil
	}

	if len(conf.Turn.PortRange) > 2 {
		log.Error(nil, "config file loaded failed. turn port must be [min,max]", "file", file)
		return nil
	}
	LOCALHOST := "localhost"
	if os.Getenv("DOCKER_LOCALHOST") != "" {
		LOCALHOST = os.Getenv("DOCKER_LOCALHOST")
	}
	conf.Mhlsso.Host = strings.Replace(conf.Mhlsso.Host, "localhost", LOCALHOST, -1)
	conf.Redis.Addr = strings.Replace(conf.Redis.Addr, "localhost", LOCALHOST, -1)

	return conf
}

type SFU struct {
	Ballast   int64 `mapstructure:"ballast"`
	WithStats bool  `mapstructure:"withstats"`
}

func LoadConfig() bool {
	nlog.SetPrefixTemplate("[{{Timer}}] [{{Count}}] [{{Type}}] [{{File}}]@{{Name}}")
	nlog.SetName("mwc")
	// nlog.SetFullFileName(true)
	nlog.SetFileNameLength(20)
	nlog.SetTimeDigits(3)

	flag.StringVar(&file, "c", "config.toml", "config file")
	flag.Parse()
	conf.Config = load()

	conf.SfuConfig = &sfu.Config{
		SFU: SFU{
			Ballast:   conf.Config.SFU.Ballast,
			WithStats: conf.Config.SFU.WithStats,
		},
		WebRTC:        conf.Config.WebRTC,
		Router:        conf.Config.Router,
		Turn:          conf.Config.Turn,
		BufferFactory: conf.Config.BufferFactory,
		TurnAuth:      conf.Config.TurnAuth,
	}
	return conf.Config == nil
}
