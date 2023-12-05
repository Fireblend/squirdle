import {getCookie, setCookie} from "./utils.js";
import {getRevPkmnName} from "./i18n.js";
import {getPokemonFromId} from "./pokedex.js";

function getTitle(streak) {
    if (streak < 3){
        return "Novice Trainer"
    }
    if (streak < 7){
        return "Pokémon Trainer"
    }
    if (streak < 10){
        return "Ace Trainer"
    }
    if (streak < 15){
        return "Pokémon Collector"
    }
    if (streak < 25){
        return "Pokemaniac"
    }
    if (streak < 35){
        return "Pokémon Professor"
    }
    if (streak < 45){
        return "Gym Leader"
    }
    if (streak < 60){
        return "Elite Four"
    }
    if (streak < 75){
        return "Pokémon Champion"
    }
    return "Pokémon Master"
}

export function showState(daily) {
    let enabled = getCookie("hintsenabled", false)
    document.getElementById("toggleinfo").innerHTML = "📋 Pokémon Info " + (enabled == "0" ? "OFF" : "ON");

    let guesses = getCookie("guessesv2", daily)
    let attempts = getCookie("t_attempts", daily)

    guesses = guesses == "" ? [] : JSON.parse(guesses)
    let guessesCont = document.getElementById("guesses")
    let hintTitles = document.getElementById("hinttitles")

    if (guesses.length > 0) {
        if (guessesCont.style.display == "none") {
            guessesCont.style.display = "block";
            window.getComputedStyle(hintTitles).opacity;
            hintTitles.className += ' in';
        }
    } else {
        guessesCont.style.display = "none"
        hintTitles.className = 'row';
    }
    let lastAttempt = ""

    for (const [index, guess] of guesses.entries()) {
        if (!(document.getElementById('guess' + index) || false)) {
            lastAttempt = getPokemonFromId(guess.name)

            var rowElement = createElement({ Tag: "div", id: 'guess' + index, classList: 'row' })

            for (const hint of guess.hints) {
                var img = createElement({ Tag: "img", classList: 'emoji', src: hint })
                var colElement = createElement({ Tag: "div", classList: 'column', childNodes: [img] })
                rowElement.appendChild(colElement)
            }
            var pokename = createElement({ Tag: "p", classList: 'guess', innerHTML: lastAttempt })
            var pokeinfo = createElement({ Tag: "span", classList: 'tooltiptext', innerHTML: guess.info })
            var tooltip = createElement({ Tag: "div", classList: 'tooltip', childNodes: [pokename, pokeinfo] })
            var colElement = createElement({ Tag: "div", classList: 'column', childNodes: [tooltip] })

            rowElement.appendChild(colElement)

            guessesCont.appendChild(rowElement);
            window.getComputedStyle(rowElement).opacity;
            rowElement.className += ' in';

            let guessedPoke = pokedex[getRevPkmnName(lastAttempt)]
            let type1correct = guess.mosaic[1] == "1" | guess.mosaic[1] == "4"
            let type2correct = guess.mosaic[2] == "1" | guess.mosaic[2] == "4"

            let type1elem = document.getElementById("type_" + guessedPoke[1])
            let type2elem = document.getElementById("type_" + guessedPoke[2])
            type1elem.style.opacity = type1correct ? "1" : "0.12";
            type1elem.style.borderStyle = type1correct ? "solid" : "none";
            type2elem.style.opacity = type2correct ? "1" : "0.12";
            type2elem.style.borderStyle = type2correct ? "solid" : "none";
        }
    }

    let secret_name = getPokemonFromId(getCookie("secret_poke", daily).replace(/"/g, ''));
    if (secret_name == lastAttempt) {
        document.getElementById("secretpoke").innerHTML = secret_name
        document.getElementById("guessform").style.display = "none";
        document.getElementById("results").style.display = "block";
        document.getElementById("won").style.display = "block";
        if (daily) {
            let streak = parseInt(getCookie("streak", false))
            let title = getTitle(streak)
            document.getElementById("streak").innerHTML = "You've guessed <b>"+streak+" Pokémon</b> in a row!<br><b>Title: </b>"+title
        }
        else{
            // update wining stats for normal games
            let statsCookie = getCookie('Stats', false);
            let statsObject = statsCookie ? JSON.parse(statsCookie) : {};

            statsObject.wins += 1;

            // guesses graph
            const MAX_ELEMENTS = 7;

            if (statsObject.guesses.length >= MAX_ELEMENTS) {
                statsObject.guesses.shift();
                statsObject.guessesNo.shift();
            }
            statsObject.guesses.push(secret_name);
            statsObject.guessesNo.push(guesses.length);
            
            // average guesses
            let sum = statsObject.guessesNo.reduce((acc, guessValue) => acc + guessValue, 0);
            statsObject.averageNoGuesses = sum/statsObject.guessesNo.length

            let updatedStats = JSON.stringify(statsObject);

            setCookie('Stats', updatedStats, 300, false);
        }
    }
    else if (guesses.length == attempts) {
        document.getElementById("secretpoke").innerHTML = secret_name
        document.getElementById("guessform").style.display = "none";
        document.getElementById("results").style.display = "block";
        document.getElementById("lost").style.display = "block";
        if (daily) {
            setCookie("streak", 0, 300, false)
            document.getElementById("streak").innerHTML = "Streak Reset!<br><b>Title:</b> Novice Trainer"
        }
        else{
            // update losses for normal games
            let statsCookie = getCookie('Stats', false);
            let statsObject = statsCookie ? JSON.parse(statsCookie) : {};

            statsObject.losses += 1
            console.log(guesses);

            let updatedStats = JSON.stringify(statsObject);
            setCookie('Stats', updatedStats, 300, false);
        }
    }
    document.getElementById("attempts").innerHTML = attempts - guesses.length
}

function createElement(initObj) {
    let element = document.createElement(initObj.Tag);
    for (let prop in initObj) {
        if (prop === "childNodes") {
            initObj.childNodes.forEach(function (node) { element.appendChild(node); });
        }
        else if (prop === "attributes") {
            initObj.attributes.forEach(function (attr) { element.setAttribute(attr.key, attr.value) });
        }
        else element[prop] = initObj[prop];
    }
    return element;
}