import json
from pokeutils import *
from flask import Flask, request, render_template, make_response, url_for, redirect
from datetime import datetime, timedelta, date
import requests
import os

app = Flask(__name__)

API_KEY = os.environ['API_KEY']
API_STATS_URL = os.environ['API_STATS_URL']

def getCookieData(daily=""):
    prefix = ""
    if daily:
        prefix = "d_"
    try:
        secret = request.cookies.get(prefix+'secret')
        attempts = int(request.cookies.get(prefix+'attempts'))
        previousGuesses = request.cookies.get(prefix+'game_record')
        maxGen = request.cookies.get(prefix+'max_gen')
        previousGuesses = json.loads(previousGuesses)
        gameOver = 1 if len(previousGuesses) > 0 and previousGuesses[-1]["name"] == 1 else 2 if attempts <= 0 else 0
    except:
        previousGuesses = []
        gameOver = 0
        attempts = 8
        maxGen = 8

    return previousGuesses, gameOver, secret, attempts, maxGen if maxGen else 8

def handleGameOver(previousGuesses, gameOver, secret, attempts, daily, maxGen):
    if not API_KEY or not API_STATS_URL:
        return None
    # Stat collecting: Sends guesses, secret pokemon, remaining attempts and whether it's a daily attempt to stats endpoint.
    message = json.dumps({"guesses":[x['Guess'] for x in previousGuesses], "result":gameOver, 
                          "secret":secret, "attempts":attempts, "maxGen":maxGen, "daily":daily, "timestamp":str(datetime.now())})

    return requests.post(API_STATS_URL, headers={"x-api-key":API_KEY}, json={"message":message})

@app.route("/")
def index():
    gen = 8
    if 'clear' in request.args or not 'secret' in request.cookies:
        try:
            gen = int(request.args['maxgen'])
        except:
            gen = 8
            
        resp = make_response(redirect(url_for('index')))
        resp.set_cookie('game_record', "[]")
        resp.set_cookie('max_gen', f"{gen}")
        resp.set_cookie('secret', getPokemon(gen=gen))
        resp.set_cookie('attempts', '5' if gen <= 2 else '6' if gen <= 4 else '7' if gen <= 6 else '8')
        resp.set_cookie('total_attempts', '5' if gen <= 2 else '6' if gen <= 4 else '7' if gen <= 6 else '8')
        return resp

    previousGuesses, gameOver, secret, attempts, maxGen = getCookieData()
    mosaic = ""
    mosaic_names = ""

    if gameOver:
        total_attempts = request.cookies.get('total_attempts')
        guesses = len(previousGuesses) if gameOver == 1 else 'X'
        mosaic = f"Squirdle {guesses}/{total_attempts}\\n\\n" +"\\n".join([x['emoji'] for x in previousGuesses])
        mosaic_names = f"Squirdle {guesses}/{total_attempts}\\n\\n" +"\\n".join([x['emoji']+" "+x['Guess'] for x in previousGuesses])
    
    return render_template("index.html", data=previousGuesses, gameOver=gameOver, maxgen=maxGen, pokemon=getPokeList(gen=maxGen), 
                            secret=secret, error=False, mosaic=mosaic, mosaic_names=mosaic_names, attempts=attempts)

@app.route("/", methods=['POST'])
def guess():
    previousGuesses, gameOver, secret, attempts, maxGen = getCookieData()

    if(not gameOver):
        if (hint := getHint(request.form['guess'], secret)):
            previousGuesses.append(getHint(request.form['guess'], secret))
            attempts -= 1
        else:
            return render_template('index.html', data=previousGuesses, gameOver=gameOver, maxgen=maxGen, pokemon=getPokeList(gen=maxGen), 
                                    secret=secret, error=True, mosaic="", mosaic_names="", attempts=attempts)

        gameOver = 1 if previousGuesses[-1]["name"] == 1 else 2 if attempts <= 0 else 0
        if(gameOver):
            handleGameOver(previousGuesses, gameOver, secret, attempts, False, maxGen)

    total_attempts = request.cookies.get('total_attempts')
    guesses = len(previousGuesses) if gameOver == 1 else 'X'
    mosaic = f"Squirdle {guesses}/{total_attempts}\\n\\n" +"\\n".join([x['emoji'] for x in previousGuesses])
    mosaic_names = f"Squirdle {guesses}/{total_attempts}\\n\\n" +"\\n".join([x['emoji']+" "+x['Guess'] for x in previousGuesses])
    resp = make_response(render_template('index.html', data=previousGuesses, gameOver=gameOver, maxgen=maxGen, pokemon=getPokeList(gen=maxGen), 
                                          secret=secret, error=False, mosaic=mosaic, mosaic_names=mosaic_names, attempts=attempts))

    resp.set_cookie('game_record', json.dumps(previousGuesses))
    resp.set_cookie('attempts', str(attempts))

    return resp

@app.route("/daily")
def daily():
    print(request.cookies)
    if not 'd_secret' in request.cookies:
        resp = make_response(redirect(url_for('daily')))
        expire_date = datetime.combine(datetime.date(datetime.now()-timedelta(hours=10)), datetime.min.time())+timedelta(days=1, hours=10)
        resp.set_cookie('d_game_record', "[]", expires=expire_date)
        resp.set_cookie('d_secret', getPokemon(daily=True), expires=expire_date)
        resp.set_cookie('d_attempts', '8', expires=expire_date)
        resp.set_cookie('d_max_gen', '8', expires=expire_date)
        resp.set_cookie('d_total_attempts', '8', expires=expire_date)
        return resp

    previousGuesses, gameOver, secret, attempts, maxGen = getCookieData(daily=True)
    
    mosaic = ""
    mosaic_names = ""

    if gameOver:
        day = getDay(secret)
        total_attempts = request.cookies.get('d_total_attempts')
        guesses = len(previousGuesses) if gameOver == 1 else 'X'
        mosaic = f"Squirdle Daily {day} - {guesses}/{total_attempts}\\n\\n" +"\\n".join([x['emoji'] for x in previousGuesses])
        mosaic_names = f"Squirdle Daily {day} - {guesses}/{total_attempts}\\n\\n" +"\\n".join([x['emoji']+" "+x['Guess'] for x in previousGuesses])

    return render_template("daily.html", data=previousGuesses, gameOver=gameOver, pokemon=getPokeList(), 
                            secret=secret, error=False, mosaic=mosaic, mosaic_names=mosaic_names, attempts=attempts)

@app.route("/daily", methods=['POST'])
def dailyGuess():
    previousGuesses, gameOver, secret, attempts, maxGen = getCookieData(daily=True)

    if(not gameOver):
        if (hint := getHint(request.form['guess'], secret, daily=True)):
            previousGuesses.append(hint)
            attempts -= 1
        else:
            mosaic = "\n".join([x['emoji'] for x in previousGuesses])
            return render_template('daily.html', data=previousGuesses, gameOver=gameOver, pokemon=getPokeList(), secret=secret, error=True, mosaic=mosaic, attempts=attempts)

        gameOver = 1 if previousGuesses[-1]["name"] == 1 else 2 if attempts <= 0 else 0
        if(gameOver):
            handleGameOver(previousGuesses, gameOver, secret, attempts, True, maxGen)

    total_attempts = request.cookies.get('d_total_attempts')
    guesses = len(previousGuesses) if gameOver == 1 else 'X'
    day = getDay(secret)

    mosaic = f"Squirdle Daily {day} - {guesses}/{total_attempts}\\n\\n" +"\\n".join([x['emoji'] for x in previousGuesses])
    mosaic_names = f"Squirdle Daily {day} - {guesses}/{total_attempts}\\n\\n" +"\\n".join([x['emoji']+" "+x['Guess'] for x in previousGuesses])

    resp = make_response(render_template('daily.html', data=previousGuesses, gameOver=gameOver, pokemon=getPokeList(), 
                                          secret=secret, error=False, mosaic=mosaic, mosaic_names=mosaic_names, attempts=attempts))
                                          
    resp.set_cookie('d_game_record', json.dumps(previousGuesses))
    resp.set_cookie('d_attempts', str(attempts))

    return resp

if __name__ == "__main__":
    app.run(debug=True, use_reloader=True)