package protos

import (
	"encoding/base64"

	"github.com/cherrai/nyanyago-utils/nlog"
	"google.golang.org/protobuf/proto"
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
)

var (
	Log = nlog.New()
)

func Encode(data interface{}) string {
	getData, getDataErr := proto.Marshal(data.(protoreflect.ProtoMessage))
	if getDataErr != nil {
		panic(getDataErr)
	}

	enEscapeUrl := base64.StdEncoding.EncodeToString(getData)
	return enEscapeUrl
}

func DecodeBase64(data string, m protoreflect.ProtoMessage) error {
	dataBase64, dataBase64Err := base64.StdEncoding.DecodeString(data)
	if dataBase64Err != nil {
		return dataBase64Err
	}
	err := proto.Unmarshal(dataBase64, m)
	if err != nil {
		return err
	}
	return nil
}
func Decode(b []byte, m protoreflect.ProtoMessage) error {

	// newTest := &Student{}
	// err = proto.Unmarshal(data, newTest)
	// fmt.Println("newTest", newTest)
	// if err != nil {
	// 	log.Fatal("unmarshaling error: ", err)
	// }
	err := proto.Unmarshal(b, m)
	if err != nil {
		return err
	}
	return nil
}
