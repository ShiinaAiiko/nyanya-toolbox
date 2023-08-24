package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Cors(allowOrigin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// log.Info("c.Request.Referer()", c.Request.Referer())
		if c.Request.Referer() != "" {
			origin := ""
			if allowOrigin == "*" {
				origin = c.Request.Referer()
				origin = origin[0 : len(origin)-1]
			}
			// log.Info("当前Referer: ", c.Request.Referer(), origin)
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}
		// log.Info(c.Writer.Header().Get("Access-Control-Allow-Origin"))
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, Content-Length, X-CSRF-Token, Token, session, Origin, Host, Connection, Accept-Encoding, Accept-Language, X-Requested-With")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Request.Header.Del("Origin")

		c.Next()
	}
}
