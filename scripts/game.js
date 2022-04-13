import {getCookie, setCookie} from "./cookies.js";
import {autocomplete} from "./autocomplete.js";
import {getRevPkmnName} from "./i18n.js";
import {getIdFromPokemon, getPokemon, getPokemonFromId} from "./pokedex.js";
import {showState} from "./renderer.js"

function replaceAt(str, index, ch) {
  return str.replace(/./g, (c, i) => i == index ? ch : c);
}

export function copyCurrentDay(day, names) {
  let attempts = parseInt(getCookie("t_attempts", day > -1))
  let guesses = JSON.parse(getCookie("guessesv2", day > -1))
  let gnum = guesses.length
  if (document.getElementById('lost').style.display == "block") {
    gnum = "X"
  }
  let dailyinfo = day == -1 ? "" : ("Daily " + day + " - ")

  let text = ""
  for (const guess of guesses) {
    let mosaic = guess.mosaic
    if (day > -1 & (mosaic[0] == "2" | mosaic[0] == "3")) {
      mosaic = replaceAt(mosaic, 0, '6')
    }
    text = text + "\n" + mosaic + (names ? getPokemonFromId(guess.name) : "")
  }

  text = text.replace(/1/g, '🟩');
  text = text.replace(/2/g, '🔼');
  text = text.replace(/3/g, '🔽');
  text = text.replace(/4/g, '🟨');
  text = text.replace(/5/g, '🟥');
  text = text.replace(/6/g, '🟦');


  text = "Squirdle " + dailyinfo + gnum + "/" + attempts + text

  let success = "Copied mosaic to clipboard!";
  if (window.clipboardData && window.clipboardData.setData) {
    alert(success);
    return clipboardData.setData("Text", text);
  } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
    let textarea = document.createElement("textarea");
    textarea.textContent = text;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      return document.execCommand("copy");
    } catch (ex) {
      console.warn("Copy to clipboard failed. Let Fireblend know!", ex);
      return false;
    } finally {
      document.body.removeChild(textarea);
      alert(success);
    }
  }
}


export function handleGuess(daily) {
  const imgs = { '1': "imgs/correct.png", '2': "imgs/up.png", '3': "imgs/down.png", '4': "imgs/wrongpos.png", '5': "imgs/wrong.png" }
  let guess_name = getRevPkmnName(document.getElementById("guess").value)
  let secret_name = getRevPkmnName(getPokemonFromId(getCookie("secret_poke", daily).replace(/"/g, '')));
  let guess = pokedex[guess_name]

  if (guess == null) {
    document.getElementById("error").style.display = "block";
    return
  }
  document.getElementById("error").style.display = "none";
  document.getElementById("guess").value = "";

  let secret = pokedex[secret_name]

  let gen = guess[0] == secret[0] ? "1" : guess[0] < secret[0] ? '2' : '3'
  let t1 = guess[1] == secret[1] ? "1" : guess[1] == secret[2] ? '4' : '5'
  let t2 = guess[2] == secret[2] ? "1" : guess[2] == secret[1] ? '4' : '5'
  let h = guess[3] == secret[3] ? "1" : guess[3] < secret[3] ? '2' : '3'
  let w = guess[4] == secret[4] ? "1" : guess[4] < secret[4] ? '2' : '3'

  let pokeinfo = "<b>Gen:</b> " + guess[0] + "<br><b>Type 1:</b> " + guess[1] +
    "<br><b>Type 2:</b> " + (guess[2] == "" ? "None" : guess[2]) +
    "<br><b>Height:</b> " + guess[3] + "<br><b>Weight:</b> " + guess[4]

  let guess_info = {
    "hints": [imgs[gen], imgs[t1], imgs[t2], imgs[h], imgs[w]],
    "name": getIdFromPokemon(guess_name), "info": pokeinfo, "mosaic": gen + t1 + t2 + h + w
  }


  let guesses = getCookie("guessesv2", daily)
  guesses = guesses == "" ? [] : JSON.parse(guesses)

  guesses.push(guess_info)

  setCookie("guessesv2", JSON.stringify(guesses), 100, daily)
  showState(daily)
}

export function toggleHints(daily) {
  let enabled = getCookie("hintsenabled", false)
  let min = parseInt(getCookie("min_gene", daily))
  let max = parseInt(getCookie("max_gene", daily))

  enabled = enabled == "0" ? "1" : "0"
  setCookie("hintsenabled", enabled)
  document.getElementById("toggleinfo").innerHTML = "📋 Pokémon Info " + (enabled == "1" ? "ON" : "OFF");

  let filterRes = getPokemon(min, max)
  autocomplete(document.getElementById("guess"), filterRes[1]);
}

export function newGame(isDaily) {
  let mingen = isDaily ? 1 : parseInt(document.getElementById("mingen").value)
  let maxgen = isDaily ? 8 : parseInt(document.getElementById("maxgen").value)

  if (mingen > maxgen) {
    [mingen, maxgen] = [maxgen, mingen]
    document.getElementById("mingen").value = mingen
    document.getElementById("maxgen").value = maxgen
  }
  let guessesMap = { 0: '5', 1: '5', 2: '6', 3: '6', 4: '7', 5: '7', 6: '8', 7: '8' }

  let filterRes = isDaily ? [getIdFromPokemon(window.dailypoke), pokedex] : getPokemon(mingen, maxgen)
  setCookie('guessesv2', "", 30, isDaily)
  setCookie('secret_poke', filterRes[0], 30, isDaily)
  setCookie('min_gene', mingen, 30, isDaily)
  setCookie('max_gene', maxgen, 30, isDaily)
  setCookie('t_attempts', guessesMap[maxgen - mingen], 30, isDaily)

  autocomplete(document.getElementById("guess"), filterRes[1]);

  for (let x in [0, 1, 2, 3, 4, 5, 6, 7]) {
    const elem = document.getElementById('guess' + x) || false
    elem ? elem.remove() : false
  }

  let types2 = ["Normal", "Fire", "Water", "Grass", "Electric", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dark", "Dragon", "Steel", "Fairy", ""]

  for (let i = 0; i < types2.length; i++) {
    let type = types2[i];
    let typeb = document.getElementById("type_" + type)
    typeb.style.opacity = "0.7"
    typeb.style.borderStyle = "none"
  }

  document.getElementById("guessform").style.display = "block";
  document.getElementById("results").style.display = "none";
  document.getElementById("lost").style.display = "none";
  document.getElementById("won").style.display = "none";
  document.getElementById("secretpoke").innerHTML = getPokemonFromId(filterRes[0])
  showState(isDaily)
}

export function handleLoad(isDaily) {
  let poke = getCookie("secret_poke", isDaily)
  let mingen = 1
  let maxgen = 8

  if (poke == "") {
    if (!isDaily) {
      document.getElementById("mingen").value = mingen
      document.getElementById("maxgen").value = maxgen
    }
    newGame(isDaily)
  } else {
    mingen = parseInt(getCookie("min_gene", isDaily))
    maxgen = parseInt(getCookie("max_gene", isDaily))
    if (!isDaily) {
      document.getElementById("mingen").value = mingen
      document.getElementById("maxgen").value = maxgen
    }
  }

  autocomplete(document.getElementById("guess"), getPokemon(mingen, maxgen)[1]);
  showState(isDaily)
}