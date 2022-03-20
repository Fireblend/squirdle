  function autocomplete(inp, arr) {
    var currentFocus;
    let hintsenabled = getCookie("hintsenabled", false)
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);
        for (i = 0; i < arr.length; i++) {
          let matches = arr[i][0].substr(0, val.length).toUpperCase() == val.toUpperCase()? 1:0 
          let words = arr[i][0].split(" ")
          let highlight = true
          for (j = 0; j < words.length; j++){
            matches += words[j].substr(0, val.length).toUpperCase() == val.toUpperCase()? 1:0 
          }
          if(matches == 0){
            highlight = false
            let filters = val.split(" ")
            let fvalues = []
            for (f = 0; f < filters.length; f++){
              if (filters[f].includes("gen:")){
                fvalues.push(filters[f].split(":")[1] == arr[i][1][0].toString()? 1:0)
              }
              else if (filters[f].includes("type1:")){
                fvalues.push(filters[f].split(":")[1].toLowerCase() == arr[i][1][1].toLowerCase()? 1:0)
              }
              else if (filters[f].includes("type2:")){
                let t2 = filters[f].split(":")[1].toLowerCase()
                t2 =  t2 == ""?"-":t2
                t2 =  t2 == "none"?"":t2
                fvalues.push(t2 == arr[i][1][2].toLowerCase()? 1:0)
              }
              else if (filters[f].includes("height:")){
                fvalues.push(filters[f].split(":")[1] == arr[i][1][3].toString()? 1:0)
              }
              else if (filters[f].includes("weight:")){
                fvalues.push(filters[f].split(":")[1] == arr[i][1][4].toString()? 1:0)
              }
            }
            matches = fvalues.length > 0? Math.min(...fvalues):0
          }
          if (matches > 0) {
            b = document.createElement("DIV");
            index = arr[i][0].toLowerCase().indexOf(val.toLowerCase())
            if(highlight){
              b.innerHTML = arr[i][0].substr(0, index)
              b.innerHTML += "<strong>" + arr[i][0].substr(index, val.length) + "</strong>";
              b.innerHTML += arr[i][0].substr(index+val.length);
            } else {
              b.innerHTML = arr[i][0]
            }
            if (hintsenabled == "1" | hintsenabled == ""){
              let type1 = arr[i][1][1]
              let type2 = arr[i][1][2]
              let h = arr[i][1][3]
              let w = arr[i][1][4]
              let gen = arr[i][1][0]
              b.innerHTML += "<br><span class=\"dropinfo\"> Gen "+gen+", "+type1+"/"+(type2 == ""?"None":type2)+", "+h+"m, "+w+"kg"+"</span>";
            }
            value = arr[i][0].replace("'","&#39;")
            b.innerHTML += "<input type='hidden' value='" + value + "'>";
            b.addEventListener("click", function(e) {
                inp.value = this.getElementsByTagName("input")[0].value;
                closeAllLists();
            });
            a.appendChild(b);
          }
        }
    });
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
          currentFocus++;
          addActive(x);
        } else if (e.keyCode == 38) { 
          currentFocus--;
          addActive(x);
        } else if (e.keyCode == 13) {
          e.preventDefault();
          if (currentFocus > -1) {
            if (x) x[currentFocus].click();
          }
        }
    });
    function addActive(x) {
      if (!x) return false;
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = (x.length - 1);
      x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
      for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
      }
    }
    function closeAllLists(elmnt) {
      var x = document.getElementsByClassName("autocomplete-items");
      for (var i = 0; i < x.length; i++) {
        if (elmnt != x[i] && elmnt != inp) {
          x[i].parentNode.removeChild(x[i]);
        }
      }
    }
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
  }

  function replaceAt(str, index, ch) {
    return str.replace(/./g, (c, i) => i == index ? ch : c);
  }

  function copyCurrentDay(day, names) {
    let attempts = parseInt(getCookie("t_attempts", day > -1))
    var guesses = JSON.parse(getCookie("guessesv2", day > -1))
    var gnum = guesses.length
    if (document.getElementById('lost').style.display == "block") {
      gnum = "X"
    }
    var dailyinfo = day == -1?"":("Daily "+day+" - ")

    var text = ""
    for (const guess of guesses) {
      let mosaic = guess.mosaic
      if (day > -1 & (mosaic[0] == "2" | mosaic[0] == "3")){
        mosaic = replaceAt(mosaic, 0, '6')
      }
      text = text+"\n"+mosaic+(names?getPokemonFromId(guess.name):"")
    }

    text = text.replace(/1/g, '🟩');
    text = text.replace(/2/g, '🔼');
    text = text.replace(/3/g, '🔽');
    text = text.replace(/4/g, '🟨');
    text = text.replace(/5/g, '🟥');
    text = text.replace(/6/g, '🟦');


    text = "Squirdle "+dailyinfo+gnum+"/"+attempts+text

    var success = "Copied mosaic to clipboard!";
    if (window.clipboardData && window.clipboardData.setData) {
        alert(success);
        return clipboardData.setData("Text", text);
    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
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

  function setCookie(cname, cvalue, exdays, daily) {
    cname = (daily?"d_":"")+cname
    const d = new Date();
    if(daily){
      d.setTime(d.getTime() + (24*60*60*1000));
      d.setHours(0)
      d.setMinutes(0)
      d.setSeconds(0)
    } else {
      d.setTime(d.getTime() + (exdays*24*60*60*1000));
    }
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/"+";samesite=strict";
  }

    function getCookie(cname, daily) {
      cname = (daily?"d_":"")+cname
      var cookies = ` ${document.cookie}`.split(";");
      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].split("=");
        if (cookie[0] == ` ${cname}`) {
          return cookie[1];
        }
      }
      return "";
    }
    
    function getPokemonFromId(id) {
      return isNaN(id)? id : Object.keys(pokedex)[parseInt(id)];
    }

    function getIdFromPokemon(pokemon) {
      return Object.keys(pokedex).indexOf(pokemon);
    }

    let createElement= (initObj)=> {
      var element = document.createElement(initObj.Tag);
      for (var prop in initObj) {
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
      
    function showState(daily) {
      let enabled = getCookie("hintsenabled", false)
      document.getElementById("toggleinfo").innerHTML = "📋 Pokémon Info "+ (enabled =="0"?"OFF":"ON");

      let guesses = getCookie("guessesv2", daily)
      let attempts = getCookie("t_attempts", daily)

      guesses = guesses == ""? []:JSON.parse(guesses)
      let guessesCont  = document.getElementById("guesses")
      let hintTitles = document.getElementById("hinttitles")

      if (guesses.length > 0) {
        if (guessesCont.style.display == "none"){
          guessesCont.style.display = "block";
          window.getComputedStyle(hintTitles).opacity;
          hintTitles.className += ' in';
        }
      } else {
        guessesCont.style.display = "none"
        hintTitles.className = 'row';
      }
      let lastAttempt = ""

      for (const [index,guess] of guesses.entries()) {
        if (!(document.getElementById('guess'+index) || false)) {
          lastAttempt = getPokemonFromId(guess.name)

          var rowElement = createElement({Tag:"div", id:'guess'+index, classList:'row'})

          for (const hint of guess.hints) {
            var img = createElement({Tag:"img", classList:'emoji', src:hint})
            var colElement = createElement({Tag:"div", classList:'column', childNodes:[img]})
            rowElement.appendChild(colElement)
          }
          var pokename = createElement({Tag:"p", classList:'guess', innerHTML:lastAttempt})
          var pokeinfo = createElement({Tag:"span", classList:'tooltiptext', innerHTML:guess.info})
          var tooltip = createElement({Tag:"div", classList:'tooltip', childNodes:[pokename, pokeinfo]})
          var colElement = createElement({Tag:"div", classList:'column', childNodes:[tooltip]})

          rowElement.appendChild(colElement)

          guessesCont.appendChild(rowElement);
          window.getComputedStyle(rowElement).opacity;
          rowElement.className += ' in';

          let guessedPoke = pokedex[lastAttempt]
          let type1correct = guess.mosaic[1] == "1" | guess.mosaic[1] == "4"
          let type2correct = guess.mosaic[2] == "1" | guess.mosaic[2] == "4"

          let type1elem = document.getElementById("type_"+guessedPoke[1])
          let type2elem = document.getElementById("type_"+guessedPoke[2])
          type1elem.style.opacity = type1correct? "1":"0.12";
          type1elem.style.borderStyle = type1correct? "solid":"none";
          type2elem.style.opacity = type2correct? "1":"0.12";
          type2elem.style.borderStyle = type2correct? "solid":"none";
        }
      }

      let secret_name = getPokemonFromId(getCookie("secret_poke", daily).replace(/"/g, ''));
      if(secret_name == lastAttempt){
        document.getElementById("secretpoke").innerHTML = secret_name
        document.getElementById("guessform").style.display = "none";
        document.getElementById("results").style.display = "block";
        document.getElementById("won").style.display = "block";
      }
      else if(guesses.length == attempts){
        document.getElementById("secretpoke").innerHTML = secret_name
        document.getElementById("guessform").style.display = "none";
        document.getElementById("results").style.display = "block";
        document.getElementById("lost").style.display = "block";
      }
      document.getElementById("attempts").innerHTML = attempts-guesses.length
    }

    function handleGuess(daily) {
      const imgs = {'1':"imgs/correct.png", '2':"imgs/up.png", '3':"imgs/down.png", '4':"imgs/wrongpos.png", '5':"imgs/wrong.png"}
      let guess_name = document.getElementById("guess").value
      let secret_name = getPokemonFromId(getCookie("secret_poke", daily).replace(/"/g, ''));
      let guess = pokedex[guess_name]

      if (guess == null) {
        document.getElementById("error").style.display = "block";
        return
      }
      document.getElementById("error").style.display = "none";
      document.getElementById("guess").value = "";

      secret = pokedex[secret_name]

      let gen = guess[0] == secret[0] ? "1" : guess[0] < secret[0]? '2':'3'
      let t1 = guess[1] == secret[1] ? "1" : guess[1] == secret[2] ? '4':'5'
      let t2 = guess[2] == secret[2] ? "1" : guess[2] == secret[1] ? '4':'5'
      let h = guess[3] == secret[3] ? "1" : guess[3] < secret[3]? '2':'3'
      let w = guess[4] == secret[4] ? "1" : guess[4] < secret[4]? '2':'3'

      let pokeinfo = "<b>Gen:</b> "+guess[0]+"<br><b>Type 1:</b> "+guess[1]+
                    "<br><b>Type 2:</b> "+(guess[2]==""?"None":guess[2])+
                    "<br><b>Height:</b> "+guess[3]+"<br><b>Weight:</b> "+guess[4]
                    
      let guess_info = {"hints":[imgs[gen], imgs[t1], imgs[t2], imgs[h], imgs[w]], 
                  "name":getIdFromPokemon(guess_name), "info":pokeinfo, "mosaic":gen+t1+t2+h+w}


      let guesses = getCookie("guessesv2", daily)
      guesses = guesses == ""? []:JSON.parse(guesses)

      guesses.push(guess_info)

      setCookie("guessesv2", JSON.stringify(guesses), 100, daily)
      showState(daily)
    }

    function toggleHints(daily) {
      let enabled = getCookie("hintsenabled", false)
      let min = parseInt(getCookie("min_gene", daily))
      let max = parseInt(getCookie("max_gene", daily))

      enabled = enabled == "0"? "1":"0"
      setCookie("hintsenabled", enabled)
      document.getElementById("toggleinfo").innerHTML = "📋 Pokémon Info "+ (enabled =="1"?"ON":"OFF");

      filterRes = getPokemon(min, max)
      autocomplete(document.getElementById("guess"), filterRes[1]);
    }

    function getPokemon(mingen, maxgen){
      console.log(mingen, maxgen)
      let filtered = []
      for (const [name,info] of Object.entries(pokedex)) {
        if (info[0] >= mingen & info[0] <= maxgen) {
          filtered.push([name,info])
        }
      }
      let chosen = filtered[filtered.length * Math.random() | 0][0];
      return [getIdFromPokemon(chosen),filtered]
    }

    function newGame(isDaily){
      let mingen = isDaily? 1:parseInt(document.getElementById("mingen").value)
      let maxgen = isDaily? 8:parseInt(document.getElementById("maxgen").value)

      if (mingen > maxgen){
        [mingen, maxgen] = [maxgen, mingen]
        document.getElementById("mingen").value = mingen
        document.getElementById("maxgen").value = maxgen
      }
      let guessesMap = {0:'5', 1:'5', 2:'6', 3:'6', 4:'7', 5:'7', 6:'8', 7:'8'}

      filterRes = isDaily?[getIdFromPokemon(dailypoke),pokedex]:getPokemon(mingen, maxgen)
      setCookie('guessesv2',"", 30, isDaily)
      setCookie('secret_poke',filterRes[0], 30, isDaily)
      setCookie('min_gene',mingen, 30, isDaily)
      setCookie('max_gene',maxgen, 30, isDaily)
      setCookie('t_attempts',guessesMap[maxgen-mingen], 30, isDaily)

      autocomplete(document.getElementById("guess"), filterRes[1]);

      for (x in [0,1,2,3,4,5,6,7]){
        const elem = document.getElementById('guess'+x) || false
        elem?elem.remove():false
      }

      let types2 = ["Normal", "Fire", "Water", "Grass", "Electric", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dark", "Dragon", "Steel", "Fairy", ""]
      
      for (i = 0; i < types2.length; i++) {
        type = types2[i];
        let typeb = document.getElementById("type_"+type)
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

    function handleLoad(isDaily){
      let poke = getCookie("secret_poke", isDaily)
      let mingen = 1
      let maxgen = 8

      if (poke == "") {
        if (!isDaily){
          document.getElementById("mingen").value = mingen
          document.getElementById("maxgen").value = maxgen
        }
        newGame(isDaily)
      } else {
        mingen = parseInt(getCookie("min_gene", isDaily))
        maxgen = parseInt(getCookie("max_gene", isDaily))
        if (!isDaily){
          document.getElementById("mingen").value = mingen
          document.getElementById("maxgen").value = maxgen
        }
      }

      autocomplete(document.getElementById("guess"), getPokemon(mingen, maxgen)[1]);
      showState(isDaily)
    }