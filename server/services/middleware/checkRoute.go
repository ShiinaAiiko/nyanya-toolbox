package middleware

import (
	"net/http"
	"strings"

	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"

	"github.com/gin-gonic/gin"
)

func CheckRouteMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Is it a short ID

		// if c.Request.URL.Path == "/" || strings.Contains(c.Request.URL.Path, "/favicon.ico") || strings.Contains(c.Request.URL.Path, "/static/") {
		// 	// logo
		// 	c.Next()
		// 	return
		// }
		// log.Info("c.Request.URL.Pat", c.Request.URL.Path)
		// if !strings.Contains(c.Request.URL.Path, "/api/") &&
		// 	!strings.Contains(c.Request.URL.Path, "/favicon.ico") &&
		// 	!strings.Contains(c.Request.URL.Path, ".") {
		// 	// res.Code = 10013
		// 	// c.JSON(http.StatusOK, res.GetResponse())
		// 	shortId := c.Request.URL.Path[1:len(c.Request.URL.Path)]

		// 	uc.OpenShortUrl(c, shortId)
		// 	c.Abort()
		// 	return
		// }
		// GetShortUrl

		isStaticServer := strings.Contains(c.Request.URL.Path, "/s/")
		if isStaticServer {
			c.Set("isStaticServer", true)
			c.Next()
			return
		}
		isWSServer := strings.Contains(c.Request.URL.Path, "/socket.io")
		if isWSServer {
			c.Set("WsServer", true)
			c.Next()
			return
		}
		// Log.Info("c.Request.URL.Path,", c.Request.URL.Path, strings.Contains(c.Request.URL.Path, "/api"))
		isHttpServer := strings.Contains(c.Request.URL.Path, "/api")
		if isHttpServer {
			c.Set("isHttpServer", true)
			c.Next()
			return
		}

		res := response.ResponseType{}
		res.Code = 10013
		c.JSON(http.StatusOK, res.GetResponse())
		c.Abort()
	}
}
