import numpy as np

def readPokedex():
    dex = np.recfromcsv("pokedex.csv", encoding="utf-8")
    return dex

def getPokemon():
    secret = np.random.choice(readPokedex(), 1)['name'][0]
    print(secret)
    return secret

def getPokeList():
    return list(readPokedex().name)
    
def getPokeInfo(pokemon):
    dex = readPokedex()
    print(pokemon)
    return dex[dex['name']==pokemon][0]

def getHint(guess_str, secret_str):
    try:
        guess = getPokeInfo(guess_str)
        secret = getPokeInfo(secret_str)
        hint = dict()
        hint['Gen'] = '🟩' if guess["generation"] == secret["generation"] else '🔼' if guess["generation"] < secret["generation"] else '🔽'
        hint['Type 1'] = '🟩' if guess["type_1"] == secret["type_1"] else '🟨' if guess["type_1"] == secret["type_2"] else '🟥'
        hint['Type 2'] = '🟩' if guess["type_2"] == secret["type_2"] else '🟨' if guess["type_2"] == secret["type_1"] else '🟥'
        hint['Height'] = '🟩' if guess["height_m"] == secret["height_m"] else '🔼' if guess["height_m"] < secret["height_m"] else '🔽'
        hint['Weight'] = '🟩' if guess["weight_kg"] == secret["weight_kg"] else '🔼' if guess["weight_kg"] < secret["weight_kg"] else '🔽'
        hint['emoji'] = getHintMoji(hint)
        hint['name'] = 1 if guess_str == secret_str else 5
        hint['Guess'] = guess_str
        hint['pokeinfo'] = formatInfo(guess)
        print(hint)
        return hint
    except:
        return False

def getHintMoji(hint):
    return "".join([val for x,val in hint.items()])

def formatInfo(pokemon):
    txt = f"<b>Gen:</b> {pokemon['generation']}<br>"
    txt += f"<b>Type 1:</b> {pokemon['type_1']}<br>"
    t2 = pokemon['type_2'] if pokemon['type_2'] != "" else "None"
    txt += f"<b>Type 2:</b> {t2}<br>"
    txt += f"<b>Height:</b> {pokemon['height_m']} m<br>"
    txt += f"<b>Weight:</b> {pokemon['weight_kg']} kg<br>"
    print(txt)

    return txt