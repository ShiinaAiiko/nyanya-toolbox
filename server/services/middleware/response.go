package middleware

import (
	"net/http"

	"github.com/ShiinaAiiko/nyanya-toolbox/server/protos"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/services/response"
	"github.com/gin-gonic/gin"
)

func Response() gin.HandlerFunc {
	return func(c *gin.Context) {
		if _, isStaticServer := c.Get("isStaticServer"); isStaticServer {
			c.Next()
			return
		}
		if _, isWsServer := c.Get("WsServer"); isWsServer {
			c.Next()
			return
		}
		roles := new(RoleOptionsType)
		getRoles, isRoles := c.Get("roles")

		if isRoles {
			roles = getRoles.(*RoleOptionsType)
		}
		//  else {
		// 	// res := response.ResponseType{}
		// 	// res.Code = 10013
		// 	// c.JSON(http.StatusOK, res.GetResponse())
		// 	// return
		// }
		if isRoles && roles.isHttpServer {
			defer func() {
				roles := c.MustGet("roles").(*RoleOptionsType)
				// Log.Info("Response middleware", roles.ResponseEncryption)
				if roles.isHttpServer {
					switch roles.ResponseDataType {
					case "protobuf":
						getProtobufDataResponse, _ := c.Get("protobuf")
						// log.Info("getProtobufDataResponse", getProtobufDataResponse, roles)
						if getProtobufDataResponse == nil {
							getBodyDataResponse, _ := c.Get("body")
							if roles.ResponseEncryption == true {
								// if getBodyDataResponse == nil {
								// 	res.Code = 10001
								// 	c.JSON(http.StatusOK, res.Encryption(userAesKey, res))
								// } else {
								// 	// 当需要加密的时候
								// 	c.JSON(http.StatusOK, res.Encryption(userAesKey, getProtobufDataResponse))
								// }
							} else {
								if getBodyDataResponse == nil {
									var res response.ResponseProtobufType
									res.Code = 10001
									c.JSON(http.StatusOK, res.GetResponse())

								} else {
									c.JSON(http.StatusOK, getBodyDataResponse)
								}
							}
						} else {
							// fmt.Println("输出protobuf Res")
							// if roles.ResponseEncryption == true {
							// 	c.Writer.Header().Set("Content-Type", "application/x-protobuf")
							// 	c.String(http.StatusOK, res.Encryption(userAesKey, getProtobufDataResponse))
							// 	// fmt.Println("Response解析成功！！！！！！！！！！")
							// } else {
							r := getProtobufDataResponse.(*response.ResponseType)

							protoData := protos.Encode(
								&protos.ResponseType{
									Code:        r.Code,
									Data:        r.Data.(string),
									Msg:         r.Msg,
									CnMsg:       r.CnMsg,
									Error:       r.Error,
									RequestId:   r.RequestId,
									RequestTime: r.RequestTime,
									Platform:    r.Platform,
									Author:      r.Author,
								},
							)

							// dataProto := new(protos.RequestType)
							// protos.DecodeBase64(protoData, dataProto)

							// log.Info("protoData", protoData)
							// log.Info("dataProto", dataProto)

							c.Writer.Header().Set("Content-Type", "application/x-protobuf")
							c.String(http.StatusOK,
								protoData)
							// }
						}

					default:
						if roles.ResponseEncryption {
							// 当需要加密的时候
						} else {
							getResponse, _ := c.Get("body")
							c.JSON(http.StatusOK, getResponse)
						}
					}
				}
			}()
			c.Next()
		} else {
			c.Next()
		}
	}
}
