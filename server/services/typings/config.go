package typings

type Config struct {
	Server  Server
	BaseUrl string
	Redis   Redis
	// StaticPathDomain string
	Mongodb Mongodb
}

type Server struct {
	Port int
	Cors struct {
		AllowOrigins []string
	}
	// mode: release debug
	Mode string
}
type Redis struct {
	Addr     string
	Password string
	DB       int
}
type Mongodb struct {
	Currentdb struct {
		Name string
		Uri  string
	}
}
