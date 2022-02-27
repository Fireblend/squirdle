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
    secret = request.cookies.get(prefix+'secret_poke')
    attempts = int(request.cookies.get(prefix+'t_attempts'))
    maxGen = request.cookies.get(prefix+'max_gene')
    maxGen = maxGen if maxGen else 8
    minGen = request.cookies.get(prefix+'min_gene')
    minGen = minGen if minGen else 1
    return secret, attempts, minGen, maxGen

# Stat collecting: Sends guesses, secret pokemon, remaining attempts and whether it's a daily attempt to a stats endpoint.
def sendStats(previousGuesses, gameOver, secret, attempts, daily, minGen, maxGen):
    # Skip if API URL or key not available.
    if not API_KEY or not API_STATS_URL: return None
    message = json.dumps({"guesses":[x['Guess'] for x in previousGuesses], "result":gameOver,
                          "secret":secret, "attempts":attempts, "minGen":minGen, "maxGen":maxGen,
                          "daily":daily, "timestamp":str(datetime.now())})

    return requests.post(API_STATS_URL, headers={"x-api-key":API_KEY}, json={"message":message})

# Shows the current state of the game to handle GET calls
def showGameState(is_daily):
    day = getDay() if is_daily else None
    secret, attempts, minGen, maxGen = getCookieData(daily=is_daily)
    pokedex=getDexJson()

    imgs = [url_for('static', filename=f'{x}.png') for x in ['correct','up','down','wrongpos','wrong']]

    return render_template("daily.html" if is_daily else "index.html", pokedex=pokedex, mingen=minGen, maxgen=maxGen, day=day,
                            secret=secret, attempts=attempts, im=imgs)

# Handles a new game, mostly sets cookies needed to play a new game
def handleNewGame(is_daily):
    # Cookies need to expire by next day if in daily mode
    expire_date = None
    if is_daily:
        expire_date = datetime.combine(datetime.date(datetime.now()-timedelta(hours=10)),
                                       datetime.min.time())+timedelta(days=1, hours=10)
    else:
        expire_date = datetime.date(datetime.now())+timedelta(days=7)

    # Edit the right cookies depending on mode
    prefix = "d_" if is_daily else ""

    # Set cookies for new game
    resp = make_response(redirect(url_for('daily' if is_daily else 'index')))
    resp.set_cookie(prefix+'guessesv2', "", expires=expire_date)
    resp.set_cookie(prefix+'secret_poke', getPokemon(daily=is_daily), expires=expire_date)
    resp.set_cookie(prefix+'min_gene', "1", expires=expire_date)
    resp.set_cookie(prefix+'max_gene', "8", expires=expire_date)
    resp.set_cookie(prefix+'t_attempts', "8", expires=expire_date)
    return resp

# Handle GET requests to index page (free play mode)
@app.route("/")
def index():
    # If new game is requested, set cookies accordingly
    if not 'secret_poke' in request.cookies:
        return handleNewGame(is_daily=False)
    return showGameState(is_daily=False)

# Handle GET requests to daily page (daily mode)
@app.route("/daily")
def daily():
    # If new game is requested, set cookies accordingly
    if not 'd_secret_poke' in request.cookies:
        return handleNewGame(is_daily=True)
    return showGameState(is_daily=True)

if __name__ == "__main__":
    app.run(debug=True, use_reloader=True)