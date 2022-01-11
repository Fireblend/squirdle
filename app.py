import json
from pokeutils import *
from flask import Flask, request, render_template, make_response, url_for, redirect

app = Flask(__name__)

def getCookieData():
    try:
        secret = request.cookies.get('secret')
        previousGuesses = request.cookies.get('game_record')
        previousGuesses = json.loads(previousGuesses)
        gameOver = 1 if previousGuesses[-1]["name"] == 1 else 2 if len(previousGuesses) >= 8 else 0
    except:
        previousGuesses = []
        gameOver = 0

    return previousGuesses, gameOver, secret

@app.route("/")
def index():
    if 'clear' in request.args or not 'secret' in request.cookies:
        resp = make_response(redirect(url_for('index')))
        resp.set_cookie('game_record', "[]")
        resp.set_cookie('secret', getPokemon())
        return resp

    previousGuesses, gameOver, secret = getCookieData()
    mosaic = "\n".join([x['emoji'] for x in previousGuesses])
    return render_template("index.html", data=previousGuesses, gameOver=gameOver, pokemon=getPokeList(), secret=secret, error=False, mosaic=mosaic)

@app.route("/", methods=['POST'])
def guess():
    previousGuesses, gameOver, secret = getCookieData()

    if(not gameOver):
        if (hint := getHint(request.form['guess'], secret)):
            previousGuesses.append(getHint(request.form['guess'], secret))
        else:
            mosaic = "\n".join([x['emoji'] for x in previousGuesses])
            return render_template('index.html', data=previousGuesses, gameOver=gameOver, pokemon=getPokeList(), secret=secret, error=True, mosaic=mosaic)

        gameOver = 2 if len(previousGuesses) >= 8 else 1 if previousGuesses[-1]["name"] == 1 else 0

    guesses = len(previousGuesses) if len(previousGuesses) < 8 or gameOver == 1 else 'X'
    mosaic = f"Squirdle {guesses}/8\\n\\n" +"\\n".join([x['emoji'] for x in previousGuesses])
    resp = make_response(render_template('index.html', data=previousGuesses, gameOver=gameOver, pokemon=getPokeList(), secret=secret, error=False, mosaic=mosaic))
    resp.set_cookie('game_record', json.dumps(previousGuesses))

    return resp

if __name__ == "__main__":
    app.run(debug=True, use_reloader=True)