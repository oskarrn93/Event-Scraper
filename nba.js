const request = require('request');
const crypto = require('crypto');
const mongo_client = require('mongodb').MongoClient;
//const moment = require('moment');
const moment = require('moment-timezone');

const config = require('./config').nba;
if(config.debug) console.log(config)

try {
   getRegularSeason();
}
catch(error)
{
   console.error(error);
   process.exit(1);
}

//#######################################3

function getRegularSeason() {
   request(config.url, (error, response, body) => {
      if(error) throw error;

      const parsed = JSON.parse(body);
      parseGames(parsed);
   });
}

function parseGames (data) {
   const list_of_games = [];
   const date_now = moment();

   if(config.debug) console.log("Date now:", date_now);

   data.lscd.forEach((months) => {
      months.mscd.g.forEach((game) => {
         const tmp = {
            timestamp: null,
            home: null,
            away: null,
            location: null
         };

         //parse the time in east coast time (iso formatted) and get timestamp in seconds
         tmp.timestamp = moment.tz(game.etm, "America/New_York").unix(); 

         //if the game has already been played (keep 7 days backwards)
         if(tmp.timestamp < (date_now.subtract(7, 'days').unix()))
         {
            if(config.debug) console.log("Game is older than 7 days, skip");
            return;
         }

         //if the teams that are playing are not one of the teams we are looking for
         if(config.teams.indexOf(game.v.tn) === -1 && config.teams.indexOf(game.h.tn) === -1) 
         {
            return;
         }

         tmp.home = game.h.tc + " " + game.h.tn; //e.g. Boston Celtics
         tmp.away = game.v.tc + " " + game.v.tn;
         tmp.location = game.an + ", " + game.ac + ", " + game.as; //e.g. Capital One Arena, Washington, DC

         //create a unique id for storing in mongodb
         const hash = crypto.createHash("sha256");

         //loop through all the values of the object to use for generating a unique id
         Object.values(tmp).forEach((value) => {
            //if the type is not a string, try to convert it to a string?
            if(typeof value !== "string") {
               //value = value.toString();
               value = "" + value;
            }
            
            hash.update(value);
         });

         tmp._id = hash.digest("hex"); //get the hash as a hexstring to use as unique id in mongodb
         list_of_games.push(tmp);
      });
   });

   if(config.debug) console.log(list_of_games);

   save_to_mongo_db(list_of_games);
}

/**
 * @param {object[]} list_of_games List of documents to store in MongoDB 
 * @param {function} callback Callback function
 */
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