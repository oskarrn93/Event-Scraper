

const nba = {};

nba.debug = false;

nba.teams = ["Celtics", "Lakers", "Warriors"];
nba.url = "http://data.nba.com/data/10s/v2015/json/mobile_teams/nba/2018/league/00_full_schedule.json";

nba.mongo = {}
nba.mongo.url = "mongodb://localhost:27017/";
nba.mongo.database = "events";
nba.mongo.collection = "nba";

const hltv = {};
hltv.test = "hltv"


module.exports = {
   nba: nba,
   hltv: hltv
};