package mongodb

import (
	"context"

	"github.com/cherrai/nyanyago-utils/nlog"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	Log = nlog.New()
)
var mongoClient *mongo.Client
var mongoClients map[string]*mongo.Client

func ConnectMongoDB(uri string, database string) {
	if mongoClient == nil {
		mongoClients = make(map[string]*mongo.Client)
	}
	// Set client options
	clientOptions := options.Client().ApplyURI(uri)

	// Connect to MongoDB
	client, err := mongo.Connect(context.TODO(), clientOptions)

	mongoClient = client

	mongoClients[database] = client

	if err != nil {
		Log.Error(err)
		return
	}

	// Check the connection
	err = client.Ping(context.TODO(), nil)

	if err != nil {
		Log.Error(err)
		return
	}

	// ash := Trainer{"Ash", 10, "Pallet Town"}

	// brock := Trainer{"Brock", 15, "Pewter City"}

	// trainers := []interface{}{misty, brock}
	// insertResult, err := collection.InsertOne(context.TODO(), ash)

	Log.Info("Connected to MongoDB<" + database + ">!")

	// err = client.Disconnect(context.TODO())

	// if err != nil {
	// 	log.Fatal(err)
	// }
	// fmt.Println("Connection to MongoDB closed.")
}

func GetMongoCollection(collectionName string) *mongo.Collection {
	collection := mongoClient.Database("github.com/cherrai/SAaSS").Collection(collectionName)
	return collection
}
func GetCollection(database string, collectionName string) *mongo.Collection {
	collection := mongoClients[database].Database(database).Collection(collectionName)
	return collection
}
