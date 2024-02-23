// Package cmd contains an entrypoint for running an ion-sfu instance.
package main

import (
	"net"
	"net/http"
	_ "net/http/pprof"
	"os"
	"strconv"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/sfu/config"
	"github.com/ShiinaAiiko/nyanya-toolbox/sfu/modules"
	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/gorilla/websocket"
	"github.com/pion/ion-sfu/cmd/signal/json-rpc/server"
	ionLog "github.com/pion/ion-sfu/pkg/logger"
	"github.com/pion/ion-sfu/pkg/middlewares/datachannel"
	"github.com/pion/ion-sfu/pkg/sfu"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sourcegraph/jsonrpc2"
	websocketjsonrpc2 "github.com/sourcegraph/jsonrpc2/websocket"
)

// logC need to get logger options from config
type logC struct {
	Config ionLog.GlobalConfig `mapstructure:"log"`
}

var (
	cert           string
	key            string
	addr           string
	metricsAddr    string
	verbosityLevel int
	logConfig      logC
	ionLogger      = ionLog.New()
	log            = nlog.New()
)

const (
	portRangeLimit = 100
)

func startMetrics(addr string) {
	// start metrics server
	m := http.NewServeMux()
	m.Handle("/metrics", promhttp.Handler())
	srv := &http.Server{
		Handler: m,
	}

	metricsLis, err := net.Listen("tcp", addr)
	if err != nil {
		log.Error(err, "cannot bind to metrics endpoint", "addr", addr)
		os.Exit(1)
	}
	log.Info("Metrics Listening", "addr", addr)

	err = srv.Serve(metricsLis)
	if err != nil {
		log.Error(err, "Metrics server stopped1")
	}
}

func main() {
	if modules.LoadConfig() {
		log.Info("config file does not exist.")
		return
	}
	addr = ":" + strconv.FormatInt(conf.Config.SFU.Port, 10)
	metricsAddr = ":" + strconv.FormatInt(conf.Config.Metrics.Port, 10)

	// Check that the -v is not set (default -1)
	if verbosityLevel < 0 {
		verbosityLevel = logConfig.Config.V
	}

	ionLog.SetGlobalOptions(ionLog.GlobalConfig{V: verbosityLevel})
	log.Info("--- Starting SFU Node ---")

	// Pass logr instance
	sfu.Logger = ionLogger

	// config.SfuConfig.TurnAuth = modules.GetTurnAuth(
	// 	config.SfuConfig.Turn.Auth.Credentials,
	// 	config.SfuConfig.Turn.Auth.Secret,
	// 	config.SfuConfig.Turn.Realm,
	// )

	s := sfu.NewSFU(*conf.SfuConfig)

	dc := s.NewDatachannel(sfu.APIChannelLabel)
	dc.Use(datachannel.SubscriberAPI)

	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}

	http.Handle("/sfuws", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			panic(err)
		}
		defer c.Close()
		log.Info("modules.WSAuth(r)", modules.WSAuth(r))
		if !modules.WSAuth(r) {
			return
		}

		p := server.NewJSONSignal(sfu.NewPeer(s), ionLogger)
		defer p.Close()

		jc := jsonrpc2.NewConn(r.Context(), websocketjsonrpc2.NewObjectStream(c), p)
		<-jc.DisconnectNotify()
	}))

	go startMetrics(metricsAddr)

	var err error
	if key != "" && cert != "" {
		log.Info("Started listening", "addr", "https://"+addr)
		err = http.ListenAndServeTLS(addr, cert, key, nil)
	} else {
		log.Info("Started listening", "addr", "http://"+addr)
		err = http.ListenAndServe(addr, nil)
	}
	if err != nil {
		panic(err)
	}
}
