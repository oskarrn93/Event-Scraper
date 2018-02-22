!#/usr/bin/python2
# -*- coding: utf-8 -*-
import urllib2
import time
import hashlib
from pymongo import MongoClient
from bs4 import BeautifulSoup
#import re

def get_date(soup):
    tmp = soup.parent.parent["data-hash"] + " " + soup.find("time").text.encode('utf8')
    return time.mktime(time.strptime(tmp, "%Y-%m-%d %H:%M"))

def get_channels(soup):
    channels = []
    tmp_channels = soup.find("div", {"class" : "channels"}).find_all("a", {"class" : "channel"})
    for channel in tmp_channels:
        channels.append(channel["title"].encode('utf8'))
    return channels

def hltv(DEBUG = False):
    #DEBUG = True
    req = urllib2.Request("http://www.hltv.org/matches")
    req.add_header('User-Agent', 'Mozilla/5.0')

    response = urllib2.urlopen(req)
    the_page = response.read()
    soup = BeautifulSoup(the_page, "html5lib")

    #TEAM_TO_SEARCH_FOR = "fnatic".lower()
    TEAMS_TO_SEARCH_FOR = ["fnatic", "NiP", "FaZe"]

    soup.find_all("a", {"class" : "upcoming-match"})
    upcoming_games_team = soup.find_all("div", {"class" : "team"})

    games = []

    for upcoming_game in upcoming_games_team:
        #if TEAM_TO_SEARCH_FOR in (tmp_game.lower() for tmp_game in upcoming_game):
        if any(x in upcoming_game.text for x in TEAMS_TO_SEARCH_FOR ):
            #reset variable
            game = []
            #print upcoming_game
            #game.append(TEAM_TO_SEARCH_FOR)
            #print upcoming_game.parent.parent.parent.find_all("div", {"class" : "team"})
            for tmp_other_team in upcoming_game.parent.parent.parent.find_all("div", {"class" : "team"}):
                #print tmp_other_team.text
                #if TEAM_TO_SEARCH_FOR not in str(tmp_other_team).lower():
                if any(x in tmp_other_team.text for x in TEAMS_TO_SEARCH_FOR ):
                    #print tmp_other_team.text
                    game.append(tmp_other_team.text)
                else:
                    game.append(tmp_other_team.text)

            timestamp = upcoming_game.parent.parent.parent.find("div", {"class" : "time"})["data-unix"]
            #game.append(datetime.datetime.fromtimestamp(int(timestamp)/1000).strftime('%Y-%m-%d %H:%M:%S'))
            game.append(long(timestamp)/1000)
            game.append("https://www.hltv.org" + upcoming_game.parent.parent.parent.parent.parent.parent["href"])

            games.append(game)
    return games

def tvmatchen(url, TEAMS_TO_SEARCH_FOR, DEBUG = False):
    #DEBUG = False
    #req = urllib2.Request("http://www.tvmatchen.nu/fotboll/")
    req = urllib2.Request(url)
    req.add_header('User-Agent', 'Mozilla/5.0')

    response = urllib2.urlopen(req)
    the_page = response.read()
    soup = BeautifulSoup(the_page, "html5lib")

    #TEAMS_TO_SEARCH_FOR = ["Real Madrid", "Malmö FF", "Paris Saint Germain", "Manchester United", "Chelsea", "Arsenal", "Manchester City"]

    #To select all the span tags
    soup.find_all("ul", {"id" : "matches"})

    soup.find_all("div", {"class" : "details"})
    upcoming_games = soup.find_all("h3")

    games = []

    for upcoming_game in upcoming_games:
        if any(x in upcoming_game.text.encode('utf-8') for x in TEAMS_TO_SEARCH_FOR):
            #reset variables
            game = []

            tmp_teams = upcoming_game.text.encode('utf-8').split("\xe2\x80\x93")

            game.append(tmp_teams[0].strip()) #add team 1
            if(DEBUG): print game[0]
            game.append(tmp_teams[1].strip()) #add team 2
            if(DEBUG): print game[1]
            date = get_date(upcoming_game.parent.parent)
            game.append(date)
            if(DEBUG): print game[2]
            channels = get_channels(upcoming_game.parent);
            game.append(channels)
            if(DEBUG):
                print game[3]
                print "\n"
            games.append(game)

    return games

    """if(DEBUG):
        if games:
            for game in games:
                print game
                #print  game[2] + ": " + game[0] + " - " + game[1] + "\n" + game[3] + "\n"
"""

def save_to_db(games, SPORT, DEBUG = False):

    client = MongoClient('localhost', 27017)
    db = client['upcoming']
    collection = db[SPORT]

    for game in games:
        m = hashlib.md5()
        #print "".join(str(element) for element in game)
        m.update(" ".join(str(element) for element in game))
        post = {"type": SPORT,
                "team1"     : game[0],
                "team2"     : game[1],
                "date"      : game[2],
                "channels"  : game[3],
                "_id"       : m.hexdigest()
                }

        if(DEBUG):
            print "inserted into database:"
            print post
        try:
            collection.insert_one(post) #insert_one ?
        except:
            if(DEBUG): print "already existing in db"

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
        print(document)


def football_games(DEBUG = False):
    games = tvmatchen("http://www.tvmatchen.nu/fotboll/", ["Real Madrid", "Malmö FF", "Paris Saint Germain", "Manchester United", "Chelsea", "Arsenal", "Manchester City"], DEBUG)
    save_to_db(games, "football", DEBUG)

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

def nba(DEBUG = True):
    req = urllib2.Request("http://www.nba.com/celtics/schedule")
    req.add_header('User-Agent', 'Mozilla/5.0')

    response = urllib2.urlopen(req)
    the_page = response.read()

    soup = BeautifulSoup(the_page, "html5lib")
    tmp_games = soup.find_all("li", {"class": "event"})

    games = list();

    for tmp_game in tmp_games:
        game = {}
        game['time'] = tmp_game.get("data-eventtime")
        game['arena'] = tmp_game.get("data-arena")
        game['info'] = tmp_game.find("div", {"class": "etowah-schedule__event__opponent-logo"}).find("span", {"class": "element-invisible"}).text
        game['home_team'] = "Boston Celtics"
        game['away_team'] = tmp_game.find("div", {"class": "etowah-schedule__event__opponent-logo"}).find("img", {"class": "logo"}).get("alt")

        #if(re.match("(?:Game between the )(. *)(?: and the )([\w\s] * )(?: on)", game['info']) is not None):
           # print "heeej"
        games.append(game)

    return games

def nba_save_to_db(games, DEBUG = False):

    client = MongoClient('localhost', 27017)
    db = client['upcoming']
    collection = db["nba2"]

    for game in games:
        m = hashlib.md5()
        #print "".join(str(element) for element in game)
        m.update(" ".join(str(element) for element in game))
        post = {"type": "nba2",
                "date"     : game['time'],
                "arena"    : game['arena'],
                "info"     : game['info'],
                "home_team": game['home_team'],
                "away_team": game['away_team'],
                "_id"      : m.hexdigest()
                }

        try:
            collection.insert_one(post) #insert_one ?
        except:
            if(DEBUG): print "already existing in db " + post['_id']





if __name__ == "__main__":
    #remove_database("nba")
    #remove_database("cs")
    #show_all_database("nba")
    #nba_games(True)
    #run_all(True)

    nba(True)
