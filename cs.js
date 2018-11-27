const { HLTV } = require('hltv')
const crypto = require('crypto');
const mongo_client = require('mongodb').MongoClient;
const moment = require('moment-timezone');

const config = require('./config').cs;
if(config.debug) console.log(config)


HLTV.getMatches().then((result) => {
   //console.log(result);

   //filter out only the matches with the teams we want
   result = result.filter((data) => {
      console.log(data)

      try {
         return (config.teams.indexOf(data.team1.name.toLowerCase()) !== -1 || config.teams.indexOf(data.team2.name.toLowerCase()) !== -1);
      }
      catch(error)
      {
         //console.error(error);
         return false;
      }
   });

   if(config.debug) console.log(result);

   
   result = result.map((data) => {


      let duration = 1;

      /*if(data.format == "bo1") {
         duration = 1;
      }
      else*/ if(data.format == "bo2") {
         duration = 2;
      }
      else if(data.format == "bo3") {
         duration = 3;
      }
      else if(data.format == "bo5") {
         duration = 5;
      }

      const start = moment(data.date);

      let description = data.format + "\n\n";
      if(typeof data.title != "undefined") description += data.title + "\n\n";
      if(typeof data.event != "undefined" && typeof data.event.name != "undefined") description += data.event.name;



      description = description.trim();

      const game = {
         team1: data.team1.name,
         team2: data.team2.name,
         start: start.unix(),
         end: start.add(duration, "hours").unix(),
         summary: data.team1.name + " - " + data.team2.name,
         description: description
      };

      //create a unique id for storing in mongodb
      const hash = crypto.createHash("sha256");

      //loop through all the values of the object to use for generating a unique id
      Object.values(game).forEach((value) => {
         //if the type is not a string, try to convert it to a string?
         if(typeof value !== "string") {
            //value = value.toString();
            value = "" + value;
         }
         
         hash.update(value);
      });
      game._id = hash.digest("hex"); //get the hash as a hexstring to use as unique id in mongodb

      return game;
   });

   if(config.debug) console.log(result);

   save_to_mongo_db(list_of_games);

});

function save_to_mongo_db(data) {
   mongo_client.connect(config.mongo.url, function (error, client) {
      if (error) throw error;
      

      const db = client.db(config.mongo.database);

      //delete all data before adding the new data
      db.collection(config.mongo.collection).deleteMany({}, function (error, res) {
         if (error) throw error;
         
         if(config.debug) console.log("Number of removed documents from collection:", res.result.n);

         db.collection(config.mongo.collection).insertMany(data, function (error, res) {
            if (error) throw error;

            client.close();
            if(config.debug) console.log("Number of added documents to collection:", res.insertedCount);
         });
      }); 
   });
}

/*
try {
   getHLTV();
}
catch(error)
{
   console.error(error);
   process.exit(1);
}

//#######################################3

function getHLTV() {
   request(config.url, (error, response, body) => {
      if(error) throw error;

      const parsed = JSON.parse(body);
      parseGames(parsed);
   });
}
*/