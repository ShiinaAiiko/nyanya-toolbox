package conf

var SocketRouterEventNames = map[string]string{
	"JoinedFTRoom": "JoinedFTRoom",
	"ExitedFTRoom": "ExitedFTRoom",
	"Data":         "Data",
	"Error":        "Error",
}
var SocketRequestEventNames = map[string]string{
	"JoinFTRoom":              "JoinFTRoom",
	"LeaveFTRoom":             "LeaveFTRoom",
	"IncreaseFTRoomTimeLimit": "IncreaseFTRoomTimeLimit",
	"Data":                    "Data",
}
var SocketRouterNamespace = map[string]string{
	"Base":         "/",
	"FileTransfer": "/fileTransfer",
}
