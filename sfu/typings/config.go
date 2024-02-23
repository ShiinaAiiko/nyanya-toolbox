package typings

import "github.com/pion/ion-sfu/pkg/sfu"

type Config struct {
	sfu.Config
	SharedSecret string
	SFU          struct {
		Ballast   int64 `mapstructure:"ballast"`
		WithStats bool  `mapstructure:"withstats"`
		Port      int64 `mapstructure:"port"`
	} `mapstructure:"sfu"`
	Metrics struct {
		Port int64 `mapstructure:"port"`
	} `mapstructure:"metrics"`
	Mhlsso struct {
		AppId  string `mapstructure:"appId"`
		AppKey string `mapstructure:"appKey"`
		Host   string `mapstructure:"host"`
	}
	MeowWhisperCore struct {
		AppId  string `mapstructure:"appId"`
		AppKey string `mapstructure:"appKey"`
		Url    string `mapstructure:"url"`
	}
	Redis struct {
		Addr     string `mapstructure:"addr"`
		Password string `mapstructure:"password"`
		Db       int    `mapstructure:"db"`
	} `mapstructure:"redis"`
}
