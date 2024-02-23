package api

var ApiVersion = "v1"

var ApiUrls = map[string](map[string]string){
	"v1": {
		// FileTransfer
		"getFileTransferShareCode":  "/fileTransfer/shareCode/get",
		"connectFileTransferRoom":   "/fileTransfer/room/connect",
		"reconnectFileTransferRoom": "/fileTransfer/room/reconnect",

		// MoveCarQRC
		"createMoveCarQRC":  "/moveCarQRC/create",
		"getMoveCarQRCList": "/moveCarQRC/list/get",
		"getMoveCarQRC":     "/moveCarQRC/get",
		"updateMoveCarQRC":  "/moveCarQRC/update",
		"deleteMoveCarQRC":  "/moveCarQRC/delete",

		// Net
		"ipDetails": "/ip/details",
		"urlToIp":   "/url/toIp",
	},
}
