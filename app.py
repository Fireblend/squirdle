from pokeutils import *
from flask import Flask, request, render_template, make_response, url_for, redirect
from datetime import datetime, timedelta
import requests
import json
import os

app = Flask(__name__)

# Load API URL and key to send stats payload upon game end.
API_KEY = os.getenv('API_KEY')
API_STATS_URL = os.getenv('API_STATS_URL')

# Retrieves cookies needed to play the game.
def getCookieData(daily=""):
    # Cookies prepended with "d_" refer to daily mode cookies.
    prefix = "d_" if daily else ""

    secret = request.cookies.get(prefix+'secret')
    attempts = int(request.cookies.get(prefix+'attempts'))
    previousGuesses = json.loads(request.cookies.get(prefix+'game_record'))
    maxGen = request.cookies.get(prefix+'max_gen')
    maxGen = maxGen if maxGen else 8
    minGen = request.cookies.get(prefix+'min_gen')
    minGen = minGen if minGen else 1
    gameOver = 1 if len(previousGuesses) > 0 and previousGuesses[-1]["name"] == 1 else 2 if attempts <= 0 else 0

    return previousGuesses, gameOver, secret, attempts, minGen, maxGen

# Stat collecting: Sends guesses, secret pokemon, remaining attempts and whether it's a daily attempt to a stats endpoint.
def sendStats(previousGuesses, gameOver, secret, attempts, daily, minGen, maxGen):
    # Skip if API URL or key not available.
    if not API_KEY or not API_STATS_URL: return None

    message = json.dumps({"guesses":[x['Guess'] for x in previousGuesses], "result":gameOver,
                          "secret":secret, "attempts":attempts, "minGen":minGen, "maxGen":maxGen,
                          "daily":daily, "timestamp":str(datetime.now())})

    return requests.post(API_STATS_URL, headers={"x-api-key":API_KEY}, json={"message":message})

# Shows the current state of the game to handle GET calls
def showGameState(is_daily, prev=None, at=None, go=None):
    day = getDay() if is_daily else None
    previousGuesses, gameOver, secret, attempts, minGen, maxGen = getCookieData(daily=is_daily)

    # If showGameState is called from handleNextGuess, we need to override these 3 cookie values:
    previousGuesses = prev if prev else previousGuesses
    gameOver = go if go else gameOver
    attempts = at if at else attempts

    with open("static/pokedex.json") as pokefile:
        pokedex = pokefile.read()

    print(pokedex)
    return render_template("daily.html" if is_daily else "index.html", data=previousGuesses, pokedex=pokedex,
                            gameOver=gameOver, mingen=minGen, maxgen=maxGen, pokemon=getPokeList(mingen=minGen, maxgen=maxGen), 
                            secret=secret, attempts=attempts)

# Handles a new game, mostly sets cookies needed to play a new game
def handleNewGame(is_daily):
    # Cookies need to expire by next day if in daily mode
    expire_date = None
    if is_daily:
        expire_date = datetime.combine(datetime.date(datetime.now()-timedelta(hours=10)),
                                       datetime.min.time())+timedelta(days=1, hours=10)

    # Edit the right cookies depending on mode
    prefix = "d_" if is_daily else ""

    # Read min and max generation and reverse if needed
    mingen = int(request.args['mingen']) if 'mingen' in request.args else 1
    maxgen = int(request.args['maxgen']) if 'maxgen' in request.args else 8
    if mingen > maxgen:
        mingen, maxgen = maxgen, mingen

    guessesMap = {0:'5', 1:'5', 2:'6', 3:'6', 4:'7', 5:'7', 6:'8', 7:'8'}
    # Set cookies for new game
    resp = make_response(redirect(url_for('daily' if is_daily else 'index')))
    resp.set_cookie(prefix+'game_record', "[]", expires=expire_date)
    resp.set_cookie(prefix+'secret', getPokemon(daily=is_daily, mingen=mingen, maxgen=maxgen), expires=expire_date)
    resp.set_cookie(prefix+'min_gen', f"{mingen}", expires=expire_date)
    resp.set_cookie(prefix+'max_gen', f"{maxgen}", expires=expire_date)
    resp.set_cookie(prefix+'attempts', guessesMap[maxgen-mingen], expires=expire_date)
    resp.set_cookie(prefix+'total_attempts', guessesMap[maxgen-mingen], expires=expire_date)
    return resp

# Handle GET requests to index page (free play mode)
@app.route("/")
def index():
    # If new game is requested, set cookies accordingly
    if 'clear' in request.args or not 'secret' in request.cookies:
        return handleNewGame(is_daily=False)
    return showGameState(is_daily=False)

# Handle GET requests to daily page (daily mode)
@app.route("/daily")
def daily():
    # If new game is requested, set cookies accordingly
    if 'clear' in request.args or not 'secret' in request.cookies:
        return handleNewGame(is_daily=True)
    return showGameState(is_daily=True)

if __name__ == "__main__":
    app.run(debug=True, use_reloader=True)