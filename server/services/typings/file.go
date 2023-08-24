package typings

type TempFileConfigInfo struct {
	AppId string
	Name  string
	// 如果文件一样，则加密地址永远也是一样的
	EncryptionName string
	// 文件存储路径
	Path             string
	StaticFolderPath string
	StaticFileName   string
	// 临时文件夹路径
	TempFolderPath      string
	TempChuckFolderPath string
	Type                string
	ChunkSize           int64
	CreateTime          int64
	ExpirationTime      int64
	VisitCount          int64
	FileInfo            FileInfo
}

type FileInfo struct {
	Name         string
	Size         int64
	Type         string
	Suffix       string
	LastModified int64
	Hash         string
}
