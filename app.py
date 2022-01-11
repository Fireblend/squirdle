import json
from pokeutils import *
from flask import Flask, request, render_template, make_response, url_for, redirect

app = Flask(__name__)

def getCookieData():
    try:
        secret = request.cookies.get('secret')
        attempts = int(request.cookies.get('attempts'))
        previousGuesses = request.cookies.get('game_record')
        previousGuesses = json.loads(previousGuesses)
        gameOver = 1 if previousGuesses[-1]["name"] == 1 else 2 if attempts <= 0 else 0
    except:
        previousGuesses = []
        gameOver = 0
        attempts = 8

    return previousGuesses, gameOver, secret, attempts

@app.route("/")
def index():
    if 'clear' in request.args or not 'secret' in request.cookies:
        gen = int(request.args['gen']) if 'gen' in request.cookies else 8
        resp = make_response(redirect(url_for('index')))
        resp.set_cookie('game_record', "[]")
        resp.set_cookie('secret', getPokemon(gen=gen))
        resp.set_cookie('attempts', '8' if int(gen) == 8 else '5')
        resp.set_cookie('total_attempts', '8' if int(gen) == 8 else '5')
        return resp

    previousGuesses, gameOver, secret, attempts = getCookieData()
    mosaic = "\n".join([x['emoji'] for x in previousGuesses])
    return render_template("index.html", data=previousGuesses, gameOver=gameOver, pokemon=getPokeList(), secret=secret, error=False, mosaic=mosaic, attempts=attempts)

@app.route("/", methods=['POST'])
def guess():
    previousGuesses, gameOver, secret, attempts = getCookieData()

    if(not gameOver):
        if (hint := getHint(request.form['guess'], secret)):
            previousGuesses.append(getHint(request.form['guess'], secret))
            attempts -= 1
        else:
            mosaic = "\n".join([x['emoji'] for x in previousGuesses])
            return render_template('index.html', data=previousGuesses, gameOver=gameOver, pokemon=getPokeList(), secret=secret, error=True, mosaic=mosaic, attempts=attempts)

        gameOver = 1 if previousGuesses[-1]["name"] == 1 else 2 if attempts <= 0 else 0

    total_attempts = request.cookies.get('total_attempts')
    guesses = len(previousGuesses) if gameOver == 1 else 'X'
    mosaic = f"Squirdle {guesses}/{total_attempts}\\n\\n" +"\\n".join([x['emoji'] for x in previousGuesses])
    resp = make_response(render_template('index.html', data=previousGuesses, gameOver=gameOver, pokemon=getPokeList(), secret=secret, error=False, mosaic=mosaic, attempts=attempts))
    resp.set_cookie('game_record', json.dumps(previousGuesses))
    resp.set_cookie('attempts', str(attempts))

    return resp

if __name__ == "__main__":
    app.run(debug=True, use_reloader=True)