package i18n

import (
	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	ni18n "github.com/cherrai/nyanyago-utils/i18n"
)

var (
	I18n *ni18n.I18n
	log  = conf.Log
)

func InitI18n() {

	I18n = ni18n.New(&ni18n.NewOptions{
		// Resources: ni18n.Resource{
		// 	"zh-CN": ni18n.ResourceLanguage{
		// 		"common": ni18n.ResourceNamespace{
		// 			"test": "测试",
		// 			"obj": ni18n.ResourceNamespace{
		// 				"x": "关闭",
		// 			},
		// 			"obj1": ni18n.ResourceNamespace{
		// 				"obj": ni18n.ResourceNamespace{
		// 					"x": "关闭",
		// 				},
		// 			},
		// 		},
		// 	},
		// 	"en-US": ni18n.ResourceLanguage{
		// 		"common": ni18n.ResourceNamespace{
		// 			"test": "Test",
		// 			"obj": ni18n.ResourceNamespace{
		// 				"x": "Close",
		// 			},
		// 		},
		// 	},
		// },
		Resources:       ni18n.LangDirectory("./services/i18n", "json"),
		DefaultLanguage: "zh-CN",
		DefaultNS:       "common",
	})

}
