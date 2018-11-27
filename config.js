

const nba = {};

nba.debug = false;

nba.teams = ["Celtics", "Lakers", "Warriors"];
nba.url = "http://data.nba.com/data/10s/v2015/json/mobile_teams/nba/2018/league/00_full_schedule.json";

nba.mongo = {}
nba.mongo.url = "mongodb://localhost:27017/";
nba.mongo.database = "events";
nba.mongo.collection = "nba";

const cs = {};
cs.debug = true;
cs.url = "hltv"
cs.teams = ["fnatic", "nip", "faze", "g2"];

cs.mongo = {}
cs.mongo.url = "mongodb://localhost:27017/";
cs.mongo.database = "events";
cs.mongo.collection = "cs";

module.exports = {
   nba: nba,
   cs: cs
};