package typings

import (
	sakisso "github.com/cherrai/saki-sso-go"
	socketio "github.com/googollee/go-socket.io"
)

type SocketConn = socketio.Conn

type SocketEmit struct {
	Code int
	Data map[string]interface{}
}

type SocketEncryptionQuery struct {
	Data string
	Key  string
}
type SocketQuery struct {
	Token     string
	DeviceId  string
	UserAgent sakisso.UserAgent
}
