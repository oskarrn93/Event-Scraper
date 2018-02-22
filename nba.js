const request = require('request');
const crypto = require('crypto');
const mongo_client = require('mongodb').MongoClient;
const mongo_url = "mongodb://localhost:27017/";
const url = 'http://data.nba.com/data/10s/v2015/json/mobile_teams/nba/2017/league/00_full_schedule.json';

const teams_to_search_for = ["Celtics", "Cavaliers", "Warriors"];

request(url, function (error, response, body) {
    const parsed_body = JSON.parse(body);
    const list_of_nba_games = [];
    const date_now = Math.floor(Date.now() / 1000) + 86400; //in seconds, 86400 is equal to one day, so I set time now to be tomorrow to allow games that are earlier today to show

    var tmp_nba_game = null;
    var tmp_date = null;
    var hash = null;

    parsed_body.lscd.forEach(function (months) {
        months.mscd.g.forEach(function (game) {
            tmp_nba_game = {};

            tmp_date = game.etm + "-05:00";
            tmp_nba_game.timestamp = Date.parse(tmp_date);

            //if the teams that are playing are not one of the teams we search for
            if(teams_to_search_for.indexOf(game.v.tn) == -1 && teams_to_search_for.indexOf(game.h.tn) == -1) {
                return;
            }

            //if game is over, dont add to database
            if (date_now > tmp_nba_game.timestamp) {
                return;
            }

            tmp_nba_game.away_team = game.v.tc + " " + game.v.tn; //e.g. Boston Celtics
            tmp_nba_game.home_team = game.h.tc + " " + game.h.tn;
            tmp_nba_game.location = game.an + ", " + game.ac + ", " + game.as; //e.g. Capital One Arena, Washington, DC

            //create a unique id for storing in mongodb
            hash = crypto.createHash('sha256');
            hash.update(tmp_nba_game.timestamp.toString());
            hash.update(tmp_nba_game.away_team);
            hash.update(tmp_nba_game.home_team);
            hash.update(tmp_nba_game.location);

            tmp_nba_game._id = hash.digest('hex');

            //add game to the list of games
            list_of_nba_games.push(tmp_nba_game);
        });
    });

    save_to_mongo_db(list_of_nba_games, function (err, response) {
        if (err) {
            console.log(err);
            return;
        }

        console.log(response);
    });
});


/**
 * @param {*} list_of_nba_games List of documents to store in MongoDB 
 * @param {*} callback Callback function
 */
function save_to_mongo_db(list_of_nba_games, callback) {
    mongo_client.connect(mongo_url, function (err, client) {
        if (err) {
            throw err;
        }

        const db = client.db('upcoming');

        db.collection("nba_tmp").remove({}, function (err, number_of_removed_documents) {
            if (err) {
                throw err;
            }

            console.log("Number of removed documents from collection: " + number_of_removed_documents);
        });

        db.collection("nba_tmp").insertMany(list_of_nba_games, function (err, res) {
            if (err) {
                throw err;
            }

            callback(res);
        });

        client.close();
    });
}