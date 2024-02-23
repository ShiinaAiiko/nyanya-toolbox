package socketioMiddleware

import "github.com/cherrai/nyanyago-utils/nsocketio"

// 默认全部都要进行加密，且全部输出protobuf
// 全部都要进行权限校验
// 所以权限暂时弃用
func RoleMiddleware() nsocketio.HandlerFunc {
	return func(c *nsocketio.EventInstance) error {
		c.Next()
		return nil
	}
}
