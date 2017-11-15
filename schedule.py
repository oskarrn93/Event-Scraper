from apscheduler.schedulers.blocking import BlockingScheduler

import event_scraper
sched = BlockingScheduler()

@sched.scheduled_job('interval', seconds=24*3600) #every 24 hours
def football_job():
    print('Fetching Football games')
    event_scraper.football_games(False)

@sched.scheduled_job('interval', seconds=24*3600) #every 24 hours
def cs_job():
    print('Fetching CS games')
    event_scraper.cs_games(False)

@sched.scheduled_job('interval', seconds=2*3600) #every 2 hours
def nba_job():
    print('Fetching NBA games')
    event_scraper.nba_games(False)
    
#@sched.scheduled_job('cron', day_of_week='mon-fri', hour=10)
#def scheduled_job():
#    print('This job is run every weekday at 10am.')

sched.start()
