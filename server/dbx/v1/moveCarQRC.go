package dbxV1

import (
	"context"
	"errors"
	"time"

	conf "github.com/ShiinaAiiko/nyanya-toolbox/server/config"
	"github.com/ShiinaAiiko/nyanya-toolbox/server/models"
	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/cherrai/nyanyago-utils/nshortid"
	"github.com/cherrai/nyanyago-utils/nstrings"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	log = nlog.New()
)

type MoveCarQRCDbx struct {
}

func (t *MoveCarQRCDbx) GetShortId(digits int) string {
	str := nshortid.GetShortId(digits)

	shortUrl, err := t.GetMoveCarQRC(str, "")
	if shortUrl == nil || err != nil {
		return str
	}
	return t.GetShortId(digits)
}

func (t *MoveCarQRCDbx) GetMoveCarQRC(id string, authorId string) (*models.MoveCarQRC, error) {
	moveCarQRC := new(models.MoveCarQRC)

	key := conf.Redisdb.GetKey("GetMoveCarQRC")
	err := conf.Redisdb.GetStruct(key.GetKey(id), moveCarQRC)

	if authorId != "" && moveCarQRC.Id != "" && moveCarQRC.AuthorId == authorId {
		return moveCarQRC, nil
	}
	if err != nil {
		params := bson.M{
			"_id": id,
		}
		if authorId != "" {
			params["authorId"] = authorId
		}

		err := moveCarQRC.GetCollection().FindOne(context.TODO(), params).Decode(moveCarQRC)
		if err != nil {
			return nil, err
		}
	}
	err = conf.Redisdb.SetStruct(key.GetKey(id), moveCarQRC, key.GetExpiration())
	if err != nil {
		log.Info(err)
	}

	return moveCarQRC, nil
}

func (t *MoveCarQRCDbx) CreateMoveCarQRC(moveCarQRC *models.MoveCarQRC) (*models.MoveCarQRC, error) {
	// 1、插入数据
	log.Info("moveCarQRC", moveCarQRC)
	moveCarQRC.Id = t.GetShortId(9)

	err := moveCarQRC.Default()
	log.Info("err", err)
	if err != nil {
		return nil, err
	}
	log.Info("moveCarQRC", moveCarQRC)

	_, err = moveCarQRC.GetCollection().InsertOne(context.TODO(), moveCarQRC)
	if err != nil {
		return nil, err
	}
	log.Info("moveCarQRC", moveCarQRC)
	return moveCarQRC, nil
}

func (t *MoveCarQRCDbx) UpdateMoveCarQRC(
	authorId, id string,
	phone, carNumber, slogan, email, wechat, colorTheme string,
) error {
	moveCarQRC := new(models.MoveCarQRC)

	update := bson.M{
		"lastUpdateTime": time.Now().Unix(),
	}
	update["phone"] = phone
	update["carNumber"] = carNumber
	update["slogan"] = slogan

	if email != "" {
		update["email"] = email
	}
	if wechat != "" {
		update["wechat"] = wechat
	}
	if colorTheme != "" {
		update["colorTheme"] = colorTheme
	}

	// log.Info(authorId, id, update)

	updateResult, err := moveCarQRC.GetCollection().UpdateOne(context.TODO(),
		bson.M{
			"$and": []bson.M{
				{
					"_id": id,
				},
				{
					"authorId": authorId,
					"status":   1,
				},
			},
		}, bson.M{
			"$set": update,
		}, options.Update().SetUpsert(false))

	if err != nil {
		return err
	}
	if updateResult.ModifiedCount == 0 {
		return errors.New("update fail")
	}

	// 删除对应redis
	t.DeleteRedisData(authorId, id)
	return nil
}

func (t *MoveCarQRCDbx) UpdateMoveCarQRCStatistics(id string, typeStr string) error {
	moveCarQRC := new(models.MoveCarQRC)

	update := bson.M{}

	switch typeStr {
	case "ScanCount":
		update["statistics.scanCount"] = 1
	case "CallCount":
		update["statistics.callCount"] = 1
	case "SendEmailCount":
		update["statistics.sendEmailCount"] = 1
	case "AddWeChatCount":
		update["statistics.addWeChatCount"] = 1
	}
	// log.Info(authorId, id, update)

	updateResult, err := moveCarQRC.GetCollection().UpdateOne(context.TODO(),
		bson.M{
			"$and": []bson.M{
				{
					"_id": id,
				},
				{
					"status": 1,
				},
			},
		}, bson.M{
			"$inc": update,
		}, options.Update().SetUpsert(false))

	if err != nil {
		return err
	}
	if updateResult.ModifiedCount == 0 {
		return errors.New("update fail")
	}

	key := conf.Redisdb.GetKey("GetMoveCarQRC")
	err = conf.Redisdb.GetStruct(key.GetKey(id), moveCarQRC)

	if err != nil {
		log.Error(err)
		return nil
	}
	if moveCarQRC.Id != "" {
		if moveCarQRC.Statistics == nil {
			moveCarQRC.Statistics = &models.MoveCarQRCStatistics{
				ScanCount:      0,
				CallCount:      0,
				SendEmailCount: 0,
				AddWeChatCount: 0,
			}
		}
		switch typeStr {
		case "ScanCount":
			moveCarQRC.Statistics.ScanCount += 1
		case "CallCount":
			moveCarQRC.Statistics.CallCount += 1
		case "SendEmailCount":
			moveCarQRC.Statistics.SendEmailCount += 1
		case "AddWeChatCount":
			moveCarQRC.Statistics.AddWeChatCount += 1
		}
	}
	err = conf.Redisdb.SetStruct(key.GetKey(id), moveCarQRC, key.GetExpiration())
	if err != nil {
		log.Error(err)
	}

	return nil
}

func (t *MoveCarQRCDbx) DeleteMoveCarQRC(id, authorId string) error {
	moveCarQRC := new(models.MoveCarQRC)

	updateResult, err := moveCarQRC.GetCollection().UpdateMany(context.TODO(),
		bson.M{
			"$and": []bson.M{
				{
					"_id": id,
				},
				{
					"authorId": authorId,
					// "status":   1,
				},
			},
		}, bson.M{
			"$set": bson.M{
				"deleteTime": time.Now().Unix(),
				"status":     -1,
			},
		}, options.Update().SetUpsert(false))

	if err != nil {
		return err
	}
	if updateResult.ModifiedCount == 0 {
		return errors.New("delete fail")
	}
	// 删除对应redis
	t.DeleteRedisData(authorId, id)
	return nil
}

func (t *MoveCarQRCDbx) GetMoveCarQRCList(
	authorId string,
	pageNum, pageSize int64,
	sort string,
) ([]*models.MoveCarQRC, error) {
	moveCarQRC := new(models.MoveCarQRC)
	var results []*models.MoveCarQRC

	key := conf.Redisdb.GetKey("GetMoveCarQRCList")
	err := conf.Redisdb.GetStruct(key.GetKey(
		authorId+
			nstrings.ToString(pageNum)+
			nstrings.ToString(pageSize)+
			sort,
	), results)
	if err != nil || true {

		match := bson.M{
			"authorId": authorId,
			"status": bson.M{
				"$in": []int64{1},
			},
			// "createTime": bson.M{
			// 	"$gte": startTime,
			// 	"$lt":  endTime,
			// },
		}
		createSort := 1

		switch sort {
		case "CreateTimeDESC":
			createSort = -1
		case "CreateTimeASC":
			createSort = 1

		}
		params := []bson.M{
			{
				"$match": bson.M{
					"$and": []bson.M{
						match,
					},
				},
			}, {
				"$sort": bson.M{
					"createTime": createSort,
				},
			},
			{
				"$skip": pageSize * (pageNum - 1),
			},
			{
				"$limit": pageSize,
			},
			{
				"$project": bson.M{
					"_id":            1,
					"authorId":       1,
					"phone":          1,
					"carNumber":      1,
					"slogan":         1,
					"email":          1,
					"wechat":         1,
					"colorTheme":     1,
					"statistics":     1,
					"createTime":     1,
					"lastUpdateTime": 1,
				},
			},
		}

		opts, err := moveCarQRC.GetCollection().Aggregate(context.TODO(), params)
		if err != nil {
			// log.Error(err)
			return nil, err
		}
		if err = opts.All(context.TODO(), &results); err != nil {
			// log.Error(err)
			return nil, err
		}
	}
	err = conf.Redisdb.SetStruct(key.GetKey(
		authorId+
			nstrings.ToString(pageNum)+
			nstrings.ToString(pageSize)+
			sort,
	), results, key.GetExpiration())
	if err != nil {
		log.Info(err)
	}

	return results, nil
}

// func (t *MoveCarQRCDbx) GetTripById(id string) (*models.Trip, error) {
// 	trip := new(models.Trip)

// 	key := conf.Redisdb.GetKey("GetTrip")
// 	err := conf.Redisdb.GetStruct(key.GetKey(id), trip)
// 	if err != nil {
// 		params := bson.M{
// 			"_id": id,
// 		}
// 		err := trip.GetCollection().FindOne(context.TODO(), params).Decode(trip)
// 		if err != nil {
// 			return nil, err
// 		}
// 	}
// 	err = conf.Redisdb.SetStruct(key.GetKey(id), trip, key.GetExpiration())
// 	if err != nil {
// 		log.Info(err)
// 	}

// 	return trip, nil
// }

// func (t *MoveCarQRCDbx) PermanentlyDeleteTrip(id string) error {
// 	trip := new(models.Trip)

// 	deleteResult, err := trip.GetCollection().DeleteOne(context.TODO(),
// 		bson.M{
// 			"$and": []bson.M{
// 				{
// 					"_id": id,
// 				},
// 			},
// 		})

// 	if err != nil {
// 		return err
// 	}
// 	if deleteResult.DeletedCount == 0 {
// 		return errors.New("delete fail")
// 	}
// 	// 删除对应redis
// 	t.DeleteRedisData("", id)
// 	return nil
// }

// func (t *MoveCarQRCDbx) GetShareKey(digits int) string {
// 	str := nshortid.GetShortId(digits)

// 	shareKey, err := t.GetTripByShareKey(str)
// 	if shareKey == "" || err != nil {
// 		return str
// 	}
// 	return t.GetShortId(digits)
// }

// func (t *MoveCarQRCDbx) UpdateTripPosition(authorId, id string, positions []*models.TripPosition) error {
// 	trip := new(models.Trip)

// 	if len(positions) == 0 {
// 		return nil
// 	}

// 	updateResult, err := trip.GetCollection().UpdateOne(context.TODO(),
// 		bson.M{
// 			"$and": []bson.M{
// 				{
// 					"_id":      id,
// 					"authorId": authorId,
// 					"status":   0,
// 				},
// 			},
// 		}, bson.M{
// 			"$push": bson.M{
// 				"positions": bson.M{
// 					"$each": positions,
// 				},
// 			},
// 		}, options.Update().SetUpsert(false))

// 	if err != nil {
// 		return err
// 	}
// 	if updateResult.ModifiedCount == 0 {
// 		return errors.New("delete fail")
// 	}

// 	// 删除对应redis
// 	t.DeleteRedisData(authorId, id)
// 	return nil
// }

// func (t *MoveCarQRCDbx) FinishTrip(authorId, id string,
// 	statistics *models.TripStatistics,
// 	permissions *models.TripPermissions, endTime int64) error {

// 	trip := new(models.Trip)

// 	updateResult, err := trip.GetCollection().UpdateOne(context.TODO(),
// 		bson.M{
// 			"$and": []bson.M{
// 				{
// 					"_id":      id,
// 					"authorId": authorId,
// 					"status":   0,
// 				},
// 			},
// 		}, bson.M{
// 			"$set": bson.M{
// 				"status":      1,
// 				"statistics":  statistics,
// 				"permissions": permissions,
// 				"endTime":     endTime,
// 			},
// 		}, options.Update().SetUpsert(false))

// 	if err != nil {
// 		return err
// 	}
// 	if updateResult.ModifiedCount == 0 {
// 		return errors.New("delete fail")
// 	}

// 	// 删除对应redis
// 	t.DeleteRedisData(authorId, id)
// 	return nil
// }

// func (t *MoveCarQRCDbx) GetTripByShareKey(shareKey string) (string, error) {
// 	trip := new(models.Trip)

// 	key := conf.Redisdb.GetKey("GetTripByShareKey")
// 	nv, err := conf.Redisdb.Get(key.GetKey(shareKey))
// 	if err != nil {
// 		return "", err
// 	}
// 	sk := nv.String()
// 	if sk != "" {
// 		return sk, nil

// 	}
// 	params := bson.M{
// 		"permissions.shareKey": shareKey,
// 	}

// 	opts := options.FindOne().SetProjection(
// 		bson.D{
// 			{"permissions", 1},
// 		},
// 	)
// 	err = trip.GetCollection().FindOne(
// 		context.TODO(), params, opts,
// 	).Decode(trip)

// 	if err != nil {
// 		return "", err
// 	}
// 	err = conf.Redisdb.Set(key.GetKey(shareKey), trip.Permissions.ShareKey, key.GetExpiration())
// 	if err != nil {
// 		log.Info(err)
// 	}

// 	return trip.Permissions.ShareKey, nil
// }

// func (t *MoveCarQRCDbx) GetTripsBaseData(authorId, typeStr string, startTime, endTime int64) ([]*models.Trip, error) {
// 	trip := new(models.Trip)
// 	var results []*models.Trip

// 	key := conf.Redisdb.GetKey("GetTrips")
// 	err := conf.Redisdb.GetStruct(key.GetKey(authorId+typeStr+nstrings.ToString(startTime)+nstrings.ToString(endTime)), results)
// 	if err != nil || true {
// 		match := bson.M{
// 			"authorId": authorId,
// 			"status": bson.M{
// 				"$in": []int64{1, 0},
// 			},
// 		}
// 		if typeStr != "All" {
// 			match["type"] = typeStr
// 		}
// 		params := []bson.M{
// 			{
// 				"$match": bson.M{
// 					"$and": []bson.M{
// 						match,
// 						{
// 							"createTime": bson.M{
// 								"$gte": startTime,
// 								"$lt":  endTime,
// 							},
// 						},
// 					},
// 				},
// 			}, {
// 				"$sort": bson.M{
// 					"createTime": -1,
// 				},
// 			},
// 			{
// 				"$project": bson.M{
// 					"_id":         1,
// 					"name":        1,
// 					"type":        1,
// 					"status":      1,
// 					"statistics":  1,
// 					"permissions": 1,
// 					"startTime":   1,
// 					"endTime":     1,
// 					"createTime":  1,
// 				},
// 			},
// 		}

// 		opts, err := trip.GetCollection().Aggregate(context.TODO(), params)
// 		if err != nil {
// 			// log.Error(err)
// 			return nil, err
// 		}
// 		if err = opts.All(context.TODO(), &results); err != nil {
// 			// log.Error(err)
// 			return nil, err
// 		}
// 	}
// 	err = conf.Redisdb.SetStruct(key.GetKey(authorId+typeStr+nstrings.ToString(startTime)+nstrings.ToString(endTime)), results, key.GetExpiration())
// 	if err != nil {
// 		log.Info(err)
// 	}

// 	return results, nil
// }

func (t *MoveCarQRCDbx) DeleteRedisData(authorId, id string) error {
	log.Info("DeleteRedisData", authorId, id)

	key := conf.Redisdb.GetKey("GetMoveCarQRC")
	err := conf.Redisdb.Delete(key.GetKey(id))
	if err != nil {
		return err
	}
	return nil
}
