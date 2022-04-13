import {setCookie} from "./cookies.js";
import {handleLoad} from "./game.js";

var lang_map = ""
var rev_map = ""

export function getPkmnName(name){
    if (lang_map == "") return name;
    return lang_map[name]
}

export function getRevPkmnName(name){
    if (rev_map == "") return name;
    return rev_map[name]
}

export function setLanguage(lang, isDaily){
    setCookie("lang", lang, 100, false)
    for (let x in [0, 1, 2, 3, 4, 5, 6, 7]) {
        const elem = document.getElementById('guess' + x) || false
        elem ? elem.remove() : false
    }
    if (lang == "en" | lang == "") {
        lang_map = ""
        rev_map = ""
        document.getElementById("guess").placeholder = "Who's that Pokémon?"
        handleLoad(isDaily)
    } else {
        $.getJSON( "data/"+lang+".json", function( data ) {
            lang_map = data
            rev_map = {}
            for(var prop in lang_map){
                rev_map[lang_map[prop]] = prop
            }
            if (lang == "ja"){
                document.getElementById("guess").placeholder = "秘密のポケモンは？"
            }
            else if (lang == "ko"){
                document.getElementById("guess").placeholder = "포켓몬은?"
            }
            else if (lang == "fr"){
                document.getElementById("guess").placeholder = "Quel est ce Pokemon?"
            }
            handleLoad(isDaily)
        });
    }
}

