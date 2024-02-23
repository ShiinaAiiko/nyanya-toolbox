package api

var Namespace = map[string](map[string]string){
	"v1": {
		"base":         "/",
		"fileTransfer": "/fileTransfer",
	},
}

var EventName = map[string](map[string](map[string]string)){
	"v1": {
		"routeEventName": {
			// App
			"error":              "Error",
			"otherDeviceOnline":  "OtherDeviceOnline",
			"otherDeviceOffline": "OtherDeviceOffline",
			"forceOffline":       "ForceOffline",

			// Room
			// type apply/agree/disagree
			"joinRoomMessage":    "JoinRoomMessage",
			"otherUserJoinRoom":  "OtherUserJoinRoom",
			"otherUserLeaveRoom": "OtherUserLeaveRoom",
			"roomInfoUpdated":    "RoomInfoUpdated",
			// 房主删除此房间后
			"forceLeaveRoom": "ForceLeaveRoom",

			// Message
			"receiveMessage":     "ReceiveMessage",
			"receiveEditMessage": "ReceiveEditMessage",
			// 通过messageId
			"readMessage": "ReadMessage",
			// 通过roomId
			"readAllMessages": "ReadAllMessages",
			"recalledMessage": "RecalledMessage",
			"deleteMessages":  "DeleteMessages",

			// Contact
			"updateContactStatus": "UpdateContactStatus",

			// Group
			"updateGroupStatus": "UpdateGroupStatus",
			"updateGroupInfo":   "UpdateGroupInfo",

			// Call
			"startCallingMessage":   "StartCallingMessage",
			"hangupMessage":         "HangupMessage",
			"callReconnectMessages": "CallReconnectMessages",
		},
		"requestEventName": {
			"joinRoom": "JoinRoom",
			// Message 聊天用
			"sendMessage": "SendMessage",
			"editMessage": "EditMessage",
			// 通过messageId
			"readMessage": "ReadMessage",
			// 通过roomId 阅读该房间的所有消息
			"readAllMessage": "ReadAllMessage",
			"recallMessage":  "RecallMessage",

			// Call
			// 以roomId为单位，可以选择哪些用户参与
			"startCalling":  "StartCalling",
			"hangup":        "Hangup",
			"callReconnect": "CallReconnect",
		},
	},
}
