from pokeutils import *
from flask import Flask, request, render_template, make_response, url_for, redirect
from datetime import datetime, timedelta
import requests
import json
import os

app = Flask(__name__)

# Load API URL and key to send stats payload upon game end.
API_KEY = os.environ['API_KEY']
API_STATS_URL = os.environ['API_STATS_URL']

# Retrieves cookies needed to play the game.
def getCookieData(daily=""):
    # Cookies prepended with "d_" refer to daily mode cookies.
    prefix = "d_" if daily else ""

    secret = request.cookies.get(prefix+'secret')
    attempts = int(request.cookies.get(prefix+'attempts'))
    previousGuesses = request.cookies.get(prefix+'game_record')
    maxGen = request.cookies.get(prefix+'max_gen')
    maxGen = maxGen if maxGen else 8
    minGen = request.cookies.get(prefix+'min_gen')
    minGen = minGen if minGen else 1
    previousGuesses = json.loads(previousGuesses)
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

# Returns the text block that gets copied into the user's clipboard for sharing.
def getEmojiMosaic(previousGuesses, victory, day=None):
    prefix = "d_" if day else ""
    daily = f" Daily {day} -" if day else ""

    total_attempts = request.cookies.get(prefix+'total_attempts')
    guesses = len(previousGuesses) if victory else 'X'
    mosaic = f"Squirdle{daily} {guesses}/{total_attempts}\\n\\n" +"\\n".join([x['emoji'] for x in previousGuesses])
    mosaic_names = f"Squirdle{daily} {guesses}/{total_attempts}\\n\\n" +"\\n".join([x['emoji']+" "+x['Guess'] for x in previousGuesses])
    return mosaic, mosaic_names

# Shows the current state of the game to handle GET calls
def handleShowGame(is_daily, is_error=False, prevoverride=None, attoverride=None, gooverride=None):
    day = getDay() if is_daily else None
    previousGuesses, gameOver, secret, attempts, minGen, maxGen = getCookieData(daily=is_daily)

    # If handleShowGame is called from handleNextGuess, we need to override these 3 cookie values:
    previousGuesses = prevoverride if prevoverride else previousGuesses
    gameOver = gooverride if gooverride else gameOver
    attempts = attoverride if attoverride else attempts

    mosaic, mosaic_names = getEmojiMosaic(previousGuesses, gameOver==1, day)

    return render_template("daily.html" if is_daily else "index.html", data=previousGuesses, 
                            gameOver=gameOver, mingen=minGen, maxgen=maxGen, pokemon=getPokeList(mingen=minGen, maxgen=maxGen), 
                            secret=secret, error=is_error, mosaic=mosaic, mosaic_names=mosaic_names, attempts=attempts)

# Handles the next page shown when user is given a hint (handles POST calls)
def handleNextGuess(is_daily):
    previousGuesses, gameOver, secret, attempts, minGen, maxGen = getCookieData(daily=is_daily)
    prefix = "d_" if is_daily else ""

    if(not gameOver):
        # Get next hint information
        if (hint := getHint(request.form['guess'], secret, daily=True if is_daily else False)):
            previousGuesses.append(hint)
            attempts -= 1
        else:
            return handleShowGame(is_daily, is_error=True)

        # Determine whether the game has ended
        gameOver = 1 if previousGuesses[-1]["name"] == 1 else 2 if attempts <= 0 else 0
        if(gameOver):
            sendStats(previousGuesses, gameOver, secret, attempts, is_daily, minGen, maxGen)

    # Build response
    resp = make_response(handleShowGame(is_daily, prevoverride=previousGuesses, attoverride=attempts, gooverride=gameOver))
    resp.set_cookie(prefix+'game_record', json.dumps(previousGuesses))
    resp.set_cookie(prefix+'attempts', str(attempts))
    return resp

# Handles a new game, mostly sets cookies needed to play a new game
def handleNewGame(is_daily):
    # Cookies need to expire by next day if in daily mode
    expire_date = None 
    if is_daily:
        expire_date = datetime.combine(datetime.date(datetime.now()-timedelta(hours=10)), datetime.min.time())+timedelta(days=1, hours=10)

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
    resp.set_cookie(prefix+'min_gen', f"{mingen}", expires=expire_date)
    resp.set_cookie(prefix+'max_gen', f"{maxgen}", expires=expire_date)
    resp.set_cookie(prefix+'secret', getPokemon(daily=is_daily, mingen=mingen, maxgen=maxgen), expires=expire_date)
    resp.set_cookie(prefix+'attempts', guessesMap[maxgen-mingen], expires=expire_date)
    resp.set_cookie(prefix+'total_attempts', guessesMap[maxgen-mingen], expires=expire_date)
    return resp

# Handle GET requests to index page (free play mode)
@app.route("/")
def index():
    # If new game is requested, set cookies accordingly
    if 'clear' in request.args or not 'secret' in request.cookies:
        return handleNewGame(is_daily=False)
    return handleShowGame(is_daily=False)

# Handle POST requests to index page (free play mode)
@app.route("/", methods=['POST'])
def guess():
    return handleNextGuess(is_daily=False)

# Handle GET requests to daily page (daily mode)
@app.route("/daily")
def daily():
    # If the old cookie expired, load data for today's game
    if not 'd_secret' in request.cookies:
        return handleNewGame(is_daily=True)
    return handleShowGame(is_daily=True)

# Handle POST requests to daily page (daily mode)
@app.route("/daily", methods=['POST'])
def dailyGuess():
    return handleNextGuess(is_daily=True)

if __name__ == "__main__":
    app.run(debug=True, use_reloader=True)