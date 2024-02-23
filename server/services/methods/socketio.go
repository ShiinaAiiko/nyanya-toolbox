package methods

import (
	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/typings"

	"github.com/cherrai/nyanyago-utils/nsocketio"
)

type SocketConn struct {
	Conn      *nsocketio.ConnContext
	EventName string
	Data      map[string]interface{}
	Query     *typings.SocketEncryptionQuery
}

func (s *SocketConn) Emit(data response.ResponseType) {
	var res response.ResponseType = response.ResponseType{
		Code:      data.Code,
		Data:      data.Data,
		RequestId: s.Data["requestId"].(string),
	}

	s.Conn.Emit(s.EventName, res.GetResponse())
}

func (s *SocketConn) LeaveRoom(namespace, uid, roomId string) {
	cc := conf.SocketIO.GetConnContextByTag(namespace, "Uid", uid)
	if len(cc) == 0 {
		return
	}

	for _, v := range cc {
		v.LeaveRoom(namespace, roomId)
	}

}
