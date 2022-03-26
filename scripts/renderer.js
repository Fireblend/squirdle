import {getCookie} from "./cookies.js";
import {getRevPkmnName} from "./i18n.js";
import {getPokemonFromId} from "./pokedex.js";

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
    }
    else if (guesses.length == attempts) {
        document.getElementById("secretpoke").innerHTML = secret_name
        document.getElementById("guessform").style.display = "none";
        document.getElementById("results").style.display = "block";
        document.getElementById("lost").style.display = "block";
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