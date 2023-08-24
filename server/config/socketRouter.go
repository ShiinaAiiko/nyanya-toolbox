package conf

var SocketRouterEventNames = map[string]string{
	"AddFriend":           "AddFriend",
	"AgreeFriend":         "AgreeFriend",
	"DisagreeFriend":      "DisagreeFriend",
	"DeleteFriend":        "DeleteFriend",
	"Error":               "Error",
	"ChatMessage":         "ChatMessage",
	"StartCallingMessage": "StartCallingMessage",
	"LeaveRoom":           "LeaveRoom",
	"JoinRoom":            "JoinRoom",
	"OnAnonymousMessage":  "OnAnonymousMessage",
	"CloseSecretChat":     "CloseSecretChat",
	"UpdateSecretChat":    "UpdateSecretChat",
	"RestartSecretChat":   "RestartSecretChat",
	"OtherDeviceOnline":   "OtherDeviceOnline",
	"OtherDeviceOffline":  "OtherDeviceOffline",
	"OnForceOffline":      "OnForceOffline",

	"SyncData": "SyncData",
}
var SocketRouterNamespace = map[string]string{
	"Sync": "/sync",
	"Base": "/",
}
