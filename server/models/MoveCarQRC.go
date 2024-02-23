package models

import (
	"errors"
	"time"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	mongodb "github.com/ShiinaAiiko/nyanya-toolbox/server/db/mongo"
	"github.com/cherrai/nyanyago-utils/validation"
	"go.mongodb.org/mongo-driver/mongo"
)

type MoveCarQRC struct {
	// 使用短ID
	Id       string `bson:"_id" json:"id,omitempty"`
	AuthorId string `bson:"authorId" json:"authorId,omitempty"`

	// 必填
	Phone string `bson:"phone" json:"phone,omitempty"`
	// 必填
	CarNumber string `bson:"carNumber" json:"carNumber,omitempty"`
	// 必填
	Slogan     string `bson:"slogan" json:"slogan,omitempty"`
	Email      string `bson:"email" json:"email,omitempty"`
	Wechat     string `bson:"wechat" json:"wechat,omitempty"`
	ColorTheme string `bson:"colorTheme" json:"colorTheme,omitempty"`

	// 1 normal -1 delete
	Status int64 `bson:"status" json:"status,omitempty"`

	// CreateTime Unix timestamp
	CreateTime int64 `bson:"createTime" json:"createTime,omitempty"`
	// LastUpdateTime Unix timestamp
	LastUpdateTime int64 `bson:"lastUpdateTime" json:"lastUpdateTime,omitempty"`
	// DeleteTime Unix timestamp
	DeleteTime int64 `bson:"deleteTime" json:"deleteTime,omitempty"`
}

func (s *MoveCarQRC) Default() error {
	// 使用短ID
	// if s.Id == primitive.NilObjectID {
	// 	s.Id = primitive.NewObjectID()
	// }
	unixTimeStamp := time.Now().Unix()

	if s.CreateTime == 0 {
		s.CreateTime = unixTimeStamp
	}
	if s.LastUpdateTime == 0 {
		s.LastUpdateTime = -1
	}
	if s.DeleteTime == 0 {
		s.DeleteTime = -1
	}

	if err := s.Validate(); err != nil {
		return errors.New(s.GetCollectionName() + " Validate: " + err.Error())
	}
	return nil
}

func (s *MoveCarQRC) GetCollectionName() string {
	return "MoveCarQRC"
}

func (s *MoveCarQRC) GetCollection() *mongo.Collection {
	return mongodb.GetCollection(conf.Config.Mongodb.Currentdb.Name, s.GetCollectionName())
}

func (s *MoveCarQRC) Validate() error {
	return validation.ValidateStruct(
		s,
		validation.Parameter(&s.Id, validation.Required(), validation.Type("string")),
		validation.Parameter(&s.AuthorId, validation.Required()),

		validation.Parameter(&s.Phone, validation.Type("string"), validation.Required()),
		validation.Parameter(&s.CarNumber, validation.Type("string"), validation.Required()),
		validation.Parameter(&s.Slogan, validation.Type("string"), validation.Required()),
		validation.Parameter(&s.Email, validation.Type("string")),
		validation.Parameter(&s.Wechat, validation.Type("string")),
		validation.Parameter(&s.ColorTheme, validation.Type("string")),

		validation.Parameter(&s.Status, validation.Required(), validation.Enum([]int64{1, 0, -1})),

		validation.Parameter(&s.CreateTime, validation.Required()),
		validation.Parameter(&s.LastUpdateTime, validation.Required()),
		validation.Parameter(&s.DeleteTime, validation.Required()),
	)
}
