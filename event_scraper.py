#/usr/bin/python3
# -*- coding: utf-8 -*-
import urllib.request
import time
import hashlib
from pymongo import MongoClient
from bs4 import BeautifulSoup
import traceback
#import re

#request the page and read it
def getTvmatchen(url, DEBUG = False):
   req = urllib.request.Request(
      url, 
      data=None, 
      headers={
         "User-Agent": "Mozilla/5.0"
      }
   )
   get = urllib.request.urlopen(req)
   html = get.read()
   return html

#for testing so we don't get banned for dosing the site
def testTvmatchenData(DEBUG = False):
   f = open("tvmatchen.txt","r+")
   html = f.read()
   return html

#parse the html on the website
def parseTvmatchen(html, TEAMS_TO_SEARCH_FOR, DEBUG = False):
   soup = BeautifulSoup(html, "html5lib")
   games = []

   """
   the dom elements are constructed like this on the website:

   day
      games
         game
            details
         ...
   """
   for html_date in soup.findAll("li", {"class" : "day"}):
      date_day = html_date["data-hash"] #get the day, e.g  2018-12-24

      for html_game in html_date.findAll("li", {"class" : "match"}):
         #if anything fails we just continue to the next element in the array
         try:       
            html_details = html_game.find("div", {"class" : "details"})

            html_teams = html_details.find("h3") #save this one for later since if we match we want the link to the game on the website
            teams = html_teams.text.encode("utf-8") #encode as utf-8 to match åäö characters

            #we search in lowercase if the teams we are searching are playing, if not then ignore
            if any(x in teams.lower() for x in TEAMS_TO_SEARCH_FOR):
               #[home, away] = teams.split(b"\xc3\xa2\xe2\x82\xac\xe2\x80\x9c") #split on " - " in unicode ascii, this is in ubuntu bash on windows
               [home, away] = teams.split(b"\xe2\x80\x93") #split on " - " in unicode ascii
               
               home = home.decode("utf-8").strip() #decode the name of the home team and strip whitespace
               away = away.decode("utf-8").strip() #decode the name of the away team and strip whitespace

               date_time = html_game.find("time").text #the time of the game, e.g. 21:00

               #get the channels the game is broadcast on
               for html_channels in html_details.find_all("div", {"class" : "channels"}):
                  channels = html_channels.find_all("a", {"class" : "channel"})
                  channels = [x["title"] for x in channels]

               channels = ", ".join([str(x) for x in channels]) #convert array to string e.g. "channel1, channel2"

               #get the url to the game
               link = html_teams.find("a")
               link = link["href"]
               link = "https://www.tvmatchen.nu"+link

               #get the timestamp from the date and time
               timestamp = int(time.mktime(time.strptime(str(date_day+date_time), "%Y-%m-%d%H:%M")))

               if(DEBUG):
                  print("home", home)
                  print("away", away)
                  print("date_time", date_time)
                  print("date_day", date_day)
                  print("timestamp", timestamp)
                  print("channels", channels)
                  print("link", link)
                  print("")

               #create a dict of the game with all the values
               game = {
                  "home": home,
                  "away": away,
                  "timestamp": timestamp,
                  "channels": channels,
                  "link": link
               }

               games.append(game)    
         except:
            print("error", traceback.print_exc())
            continue #go to next element in the array

          
   if(DEBUG):
      print("games", games)

   return games

"""
def remove_database(SPORT):
    client = MongoClient('localhost', 27017)
    db = client['upcoming']
    collection = db[SPORT]
    collection.remove({})

def show_all_database(SPORT):
    client = MongoClient('localhost', 27017)
    db = client['upcoming']
    collection = db[SPORT]
    cursor = collection.find()
    for document in cursor:
        print (document)
"""
"""
def football_games(DEBUG = False):
   #html = getTvmatchen("http://www.tvmatchen.nu/fotboll/", DEBUG)
   html = testTvmatchenData(DEBUG)

   #these are the teams we are searching for
   teams = ["Real Madrid", "Malmö FF", "Paris Saint Germain", "Manchester United"]
   teams = [x.lower().encode('utf-8') for x in teams] #convert to lowercase and encode to utf8 to handle åäö characters

   print(teams)

   parseTvmatchen(html, teams , DEBUG)

   #save_to_db(games, "football", DEBUG)

def nba_games(DEBUG = False):
    games = tvmatchen("http://www.tvmatchen.nu/basket/nba/", ["Boston Celtics", "Golden State Warriors", "Cleveland Cavaliers"], DEBUG)
    for index in xrange(len(games)):
        games[index][2] = games[index][2] + 86400 #add 1 day since tvmatchen is weird with nba matches with one day behind
    save_to_db(games, "nba", DEBUG)

def cs_games(DEBUG = False):
    games = hltv(DEBUG)
    save_to_db(games, "cs", DEBUG)

def run_all(DEBUG = False):
    football_games(DEBUG)
    nba_games(DEBUG)
    cs_games(DEBUG)
"""

def generateHash(game):
   hash = hashlib.md5()
   #generate a unique id generated by the information about game
   tmp = " ".join(str(value) for key, value in game.items())
   tmp = tmp.encode("utf-8") #remember to encode to utf8 otherwise hash.update will throw error on unicode chars
   hash.update(tmp)
   game["_id"] = hash.hexdigest()
   return game

def saveToDatabaseTvMatchen(games, DEBUG = False):
   client = MongoClient("localhost", 27017)
   db = client["events"]
   collection = db["football"]
   
   games = map(generateHash, games)
   games = list(games)

   print("games", games)
      
     
   try:
      collection.delete_many({}) #first delete everything so we don't have any old information
      collection.insert_many(games) #then insert everything
      if(DEBUG):
         print ("successfully inserted into database:")
   except:
      if(DEBUG): 
         print("error", traceback.print_exc())
   
   #print("games", games)

def tvMatchen(DEBUG = False):
   #html = getTvmatchen("http://www.tvmatchen.nu/fotboll/", DEBUG)
   html = testTvmatchenData(DEBUG)

   #these are the teams we are searching for
   teams = ["Real Madrid", "Malmö FF", "Paris Saint Germain", "Manchester United"]
   teams = [x.lower().encode('utf-8') for x in teams] #convert to lowercase and encode to utf8 to handle åäö characters

   games = parseTvmatchen(html, teams, DEBUG)
   saveToDatabaseTvMatchen(games, DEBUG)


if __name__ == "__main__":
    #remove_database("nba")
    #remove_database("cs")
    #show_all_database("nba")
    #nba_games(True)
    #run_all(True)

    tvMatchen(False)

