import numpy as np
from datetime import datetime, timedelta

def readPokedex(mingen=1, maxgen=8):
    dex = np.recfromcsv("pokedex.csv", encoding="utf-8")
    dex = dex[(dex['generation'] <= int(maxgen)) & (dex['generation'] >= int(mingen))]
    return dex

def getDexJson(mingen=1, maxgen=8):
    dex = readPokedex(mingen, maxgen)
    return {x.name:[x.generation, x.type_1, x.type_2, x.height_m, x.weight_kg] for x in dex}

def getPokemon(mingen=1, maxgen=8, daily=False):
    if daily:
        today = str(datetime.date(datetime.now()-timedelta(hours=10)))
        dex = np.recfromcsv("daily.csv", encoding="utf-8")
        row = dex[dex['date'] == today]
        secret = row['pokemon'][0]
    else:
        dex = readPokedex(mingen, maxgen)
        secret = np.random.choice(dex, 1)['name'][0]
    return secret

def getDay():
    today = str(datetime.date(datetime.now()-timedelta(hours=10)))
    dex = np.recfromcsv("daily.csv", encoding="utf-8")
    return list(dex['date']).index(today)