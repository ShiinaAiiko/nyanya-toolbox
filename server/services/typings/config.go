package typings

type Config struct {
	Server  Server
	SSO     Sso
	BaseUrl string
	Redis   Redis
	// StaticPathDomain string
	Mongodb Mongodb
	Sfu     Sfu
	Turn    Turn
}

type Server struct {
	Port int
	Cors struct {
		AllowOrigins []string
	}
	// mode: release debug
	Mode string
}
type Sso struct {
	AppId  string
	AppKey string
	Host   string
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

type Sfu struct {
	Auth struct {
		Secret   string
		Duration int64
	}
}

type Turn struct {
	Address string
	Auth    struct {
		Secret   string
		Duration int64
	}
}
