package api

var ApiVersion = "v1"

var ApiUrls = map[string](map[string]string){
	"v1": {
		// FileTransfer
		"getFileTransferShareCode":  "/fileTransfer/shareCode/get",
		"connectFileTransferRoom":   "/fileTransfer/room/connect",
		"reconnectFileTransferRoom": "/fileTransfer/room/reconnect",

		// MoveCarQRC
		"createMoveCarQRC":           "/moveCarQRC/create",
		"getMoveCarQRCList":          "/moveCarQRC/list/get",
		"getMoveCarQRC":              "/moveCarQRC/get",
		"updateMoveCarQRC":           "/moveCarQRC/update",
		"deleteMoveCarQRC":           "/moveCarQRC/delete",
		"sendEmail":                  "/moveCarQRC/sendEmail",
		"updateMoveCarQRCStatistics": "/moveCarQRC/statistics/update",

		// CountdownDays
		"getUploadTokenOfCountdownDays": "/countdownDays/uploadToken/get",
		"getCountdownDaysFileUrls":      "/countdownDays/fileUrls/get",

		// Net 对外api
		"ipDetails":       "/ip/details",
		"urlToIp":         "/url/toIp",
		"weatherForecast": "/weather/forecast",

		"httpProxy": "/net/httpProxy",
		"regeo":     "/geocode/regeo",
		"geo":       "/geocode/geo",
	},
}
