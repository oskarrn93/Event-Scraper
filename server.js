const mongo_client = require("mongodb").MongoClient;
const express = require("express");
const cors = require("cors");
const moment = require("moment-timezone");
const ical = require("ical-generator");

const app = express();
const mongo_url = "mongodb://localhost:27017/";
const domain = "oskarrosen.com";
const url = "https://oskarrosen.com:8001";

app.use(cors());

/*app.get("/cs", function (req, res) {
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
})*/

/*app.get("/debug/nba", function (req, res) {

   try {
      getNBAGames(function (result) {
         res.send(result);
     });
   }
   catch(error)
   {
      res.status(500)
      res.send(error);
   }
   
})*/

/*app.get("/calendar/football", function (req, res) {
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
})*/

app.get("/nba", function (req, res) {
    var calendar = ical({
        domain: domain,
        name: "NBA",
        url: url + "/nba",
        prodId: "//Oskar Rosen//NBA//EN",
        ttl: 3600,
        timezone: "Europe/London" //we use utc time
    });

    getNBAGames(function (games) {
         for (var a = 0; a < games.length; a++) {
            const game = games[a];
            //console.log(game)
            
            const start = moment.unix(game.timestamp).tz("Europe/London"); //we use utc time
            const summary = game.away + " - " + game.home;

            calendar.createEvent({
               start: start.toDate(),
               end: start.add(2, "hours").toDate(), 
               summary: summary,
               //description: description,
               location: game.location,
               url: "http://stats.nba.com/schedule/",
               uid: "nba-game-" + game._id
            }).createAlarm({
               type: 'audio',
               trigger: 900, // 15min
            });
         }

         //replace \r\n with \n
         let output = calendar.toString().replace(/(?:\r\n)/g, "\n");

         res.setHeader("Content-type", "application/octet-stream");
         res.setHeader("Content-disposition", "attachment; filename=nba.ics");
         res.send(output);
    });
})


app.get("/football", function (req, res) {
   var calendar = ical({
       domain: domain,
       name: "Football",
       url: url + "/football",
       prodId: "//Oskar Rosen//Football//EN",
       ttl: 3600,
       timezone: "Europe/London" //we use utc time
   });

   getFootballGames(function (games) {
        for (var a = 0; a < games.length; a++) {
           const game = games[a];
           //console.log(game)
           
           const start = moment.unix(game.timestamp).tz("Europe/London"); //we use utc time
           const summary = game.home + " - " + game.away;
           
           //const description = game.url + "\n\n" + "Channels:\n" + game.channels

           calendar.createEvent({
              start: start.toDate(),
              end: start.add(2, "hours").toDate(), 
              summary: summary,
              description: game.channels,
              location: game.location,
              url: game.url,
              uid: "football-game-" + game._id
           }).createAlarm({
              type: 'audio',
              trigger: 900, // 15min
           });
        }

        //replace \r\n with \n
        let output = calendar.toString().replace(/(?:\r\n)/g, "\n");

        res.setHeader("Content-type", "application/octet-stream");
        res.setHeader("Content-disposition", "attachment; filename=football.ics");
        res.send(output);
   });
})


/*app.get("/calendar/cs", function (req, res) {
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
})*/




app.listen(8001, function () {
    console.log("CORS-enabled web server listening on port 8001")
})



/*function getUpcoming(SPORT, callback) {
   mongo_client.connect(mongo_url, function (error, client) {
        var db = client.db("upcoming");

        if (error) {
            throw error;
        }

        db.collection(SPORT).find({}).toArray(function (error, result) {
            if (error) {
                throw error;
            }

            callback(result);
        });

        client.close();
    });
}*/


function getNBAGames(callback) {
   mongo_client.connect(mongo_url, function (error, client) {
      if (error) throw error;

      const db = client.db("events");
      
      db.collection("nba").find({}).toArray(function (error, result) {
         if (error) throw error;
        
         callback(result);
         client.close();
      });        
   });
}


function getFootballGames(callback) {
   mongo_client.connect(mongo_url, function (error, client) {
      if (error) throw error;

      const db = client.db("events");
      
      db.collection("football").find({}).toArray(function (error, result) {
         if (error) throw error;
        
         callback(result);
         client.close();
      });        
   });
}