const mongo_client = require("mongodb").MongoClient;
const express = require("express");
const cors = require("cors");
const moment = require("moment");
const ical = require("ical-generator");

const app = express();
const mongo_url = "mongodb://localhost:27017/";
const domain = "oskarrosen.com";
const url = "https://oskarrosen.com:8001";

app.use(cors());

app.get("/cs", function (req, res) {
    getUpcoming("cs", function (result) {
        console.log("cs");

        //console.log(result);
        res.send(result);
    });
})

app.get("/football", function (req, res) {
    getUpcoming("football", function (result) {
        console.log("football");

        // console.log(result);
        res.send(result);
    });
})

app.get("/nba", function (req, res) {
    getNBAGames(function (result) {
        res.send(result);
    });
})

app.get("/calendar/football", function (req, res) {
    var cal_football = ical({
        domain: domain,
        name: "Fotball Matches",
        url: url + "/calendar/football",
        prodId: "//Oskar Rosen//Football Games//EN",
        ttl: 3600,
        timezone: "Europe/Berlin"
    });
    var time_now = Math.round(Date.now() / 1000);
    getUpcoming("football", function (result) {
        //var fotball_events = result.filter(event => event.date > time_now);
        var fotball_events = result;

        var event = null,
            start = null;
        for (var a = 0; a < fotball_events.length; a++) {
            event = fotball_events[a];
            start = new Date(Math.round(event.date * 1000));

            cal_football.createEvent({
                start: start,
                end: new Date(start.getTime() + 7200000), //2 hours
                summary: event.team1 + " - " + event.team2,
                description: event.channels.join(", "),

                uid: "football-games-" + event._id
            });
        }

        res.setHeader("Content-type", "application/octet-stream");
        res.setHeader("Content-disposition", "attachment; filename=football.ics");
        res.send(cal_football.toString().replace(/(?:\r\n)/g, "\n"));
        // res.send(cal_football.toString()); //.replace(/(?:\r\n)/g, "\n")
    });
})

app.get("/calendar/nba", function (req, res) {
    var calendar = ical({
        domain: domain,
        name: "NBA Games",
        url: url + "/calendar/nba",
        prodId: "//Oskar Rosen//NBA Games//EN",
        ttl: 3600,
        timezone: "Europe/Berlin"
    });

    getNBAGames(function (games) {
        for (var a = 0; a < games.length; a++) {
            const game = games[a];
            console.log(game)
            
            const start = moment.unix(game.timestamp)

            const description = game.away + " - " + game.home;

            calendar.createEvent({
                start: start.toDate(),
                end: start.add(3, "hours").toDate(), 
                summary: description,
                description: description,
                location: game.location,
                url: "http://stats.nba.com/schedule/",
                uid: "nba-game-" + game._id
            });
        }
        res.setHeader("Content-type", "application/octet-stream");
        res.setHeader("Content-disposition", "attachment; filename=nba.ics");
        res.send(calendar.toString().replace(/(?:\r\n)/g, "\n"));
    });
})

app.get("/calendar/cs", function (req, res) {
    var cal_cs = ical({
        domain: domain,
        name: "CS Matches",
        url: url + "/calendar/cs",
        prodId: "//Oskar Rosen//CS Matches//EN",
        ttl: 3600,
        timezone: "Europe/Berlin"
    });
    var time_now = Math.round(Date.now() / 1000);
    getUpcoming("cs", function (result) {
        //var cs_events = result.filter(event => event.date > time_now);

        var cs_events = result;

        var event = null,
            start = null;
        for (var a = 0; a < cs_events.length; a++) {
            event = cs_events[a];
            start = new Date(Math.round(event.date * 1000));

            cal_cs.createEvent({
                start: start,
                end: new Date(start.getTime() + 3600000), //1 hour
                summary: event.team1 + " - " + event.team2,
                description: event.url,
                uid: "cs-games-" + event._id
            });
        }
        res.setHeader("Content-type", "application/octet-stream");
        res.setHeader("Content-disposition", "attachment; filename=cs.ics");
        res.send(cal_cs.toString()); //replace(/(?:\r\n)/g, "\n")
    });
})




app.listen(8001, function () {
    console.log("CORS-enabled web server listening on port 8001")
})



function getUpcoming(SPORT, callback) {
   mongo_client.connect(mongo_url, function (err, client) {
        var db = client.db("upcoming");

        if (err) {
            throw err;
        }

        db.collection(SPORT).find({}).toArray(function (err, result) {
            if (err) {
                throw err;
            }

            callback(result);
        });

        client.close();
    });
}


function getNBAGames(callback) {
   mongo_client.connect(mongo_url, function (error, client) {
      if (error) throw err;

      const db = client.db("events");
      
      db.collection("nba").find({}).toArray(function (error, result) {
         if (error) throw err;
         client.close();
         callback(result);
      });        
   });
}