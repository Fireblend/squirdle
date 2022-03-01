function autocomplete(inp, arr) {
    var currentFocus;
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
          if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
            b = document.createElement("DIV");
            b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
            b.innerHTML += arr[i].substr(val.length);
            value = arr[i].replace("'","&#39;")
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
      text = text+"\n"+guess.mosaic+(names?guess.name:"")
    }

    text = text.replace(/1/g, '🟩');
    text = text.replace(/2/g, '🔼');
    text = text.replace(/3/g, '🔽');
    text = text.replace(/4/g, '🟨');
    text = text.replace(/5/g, '🟥');

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
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
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
      let guesses = getCookie("guessesv2", daily)
      let attempts = getCookie("t_attempts", daily)

      guesses = guesses == ""? []:JSON.parse(guesses)
      document.getElementById("guesses").style.display = guesses.length > 0? "block":"none";

      let lastAttempt = ""
      for (const [index,guess] of guesses.entries()) {
        if (!(document.getElementById('guess'+index) || false)) {
          lastAttempt = guess.name
          var rowElement = createElement({Tag:"div", id:'guess'+index, classList:'row'})

          for (const hint of guess.hints) {
            var img = createElement({Tag:"img", classList:'emoji', src:hint})
            var colElement = createElement({Tag:"div", classList:'column', childNodes:[img]})
            rowElement.appendChild(colElement)
          }
          var pokename = createElement({Tag:"p", classList:'guess', innerHTML:guess.name})
          var pokeinfo = createElement({Tag:"span", classList:'tooltiptext', innerHTML:guess.info})
          var tooltip = createElement({Tag:"div", classList:'tooltip', childNodes:[pokename, pokeinfo]})
          var colElement = createElement({Tag:"div", classList:'column', childNodes:[tooltip]})

          rowElement.appendChild(colElement)

          var guessesDiv = document.getElementById("guesses");
          guessesDiv.appendChild(rowElement);
        }
      }

      let secret_name = getCookie("secret_poke", daily).replace(/"/g, '');
      if(secret_name == lastAttempt){
        document.getElementById("guessform").style.display = "none";
        document.getElementById("results").style.display = "block";
        document.getElementById("won").style.display = "block";
      }
      else if(guesses.length == attempts){
        document.getElementById("guessform").style.display = "none";
        document.getElementById("results").style.display = "block";
        document.getElementById("lost").style.display = "block";
      }
      document.getElementById("attempts").innerHTML = attempts-guesses.length
    }

    function handleGuess(daily, im1, im2, im3, im4, im5) {
      const imgs = {'1':im1, '2':im2, '3':im3, '4':im4, '5':im5}
      let guess_name = document.getElementById("guess").value
      let secret_name = getCookie("secret_poke", daily).replace(/"/g, '');
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
                   "name":guess_name, "info":pokeinfo, "mosaic":gen+t1+t2+h+w}


      let guesses = getCookie("guessesv2", daily)
      guesses = guesses == ""? []:JSON.parse(guesses)

      guesses.push(guess_info)

      setCookie("guessesv2", JSON.stringify(guesses), 100, daily)
      showState(daily)
    }

    function getPokemon(mingen, maxgen){
      let filtered = []
      for (const [name,info] of Object.entries(pokedex)) {
        if (info[0] >= mingen & info[0] <= maxgen) {
          filtered.push(name)
        }
      }
      let chosen = filtered[filtered.length * Math.random() | 0];
      return [chosen,filtered]
    }

    function newGame(){
      let mingen = parseInt(document.getElementById("mingen").value)
      let maxgen = parseInt(document.getElementById("maxgen").value)

      if (mingen > maxgen){
        [mingen, maxgen] = [maxgen, mingen]
        document.getElementById("mingen").value = mingen
        document.getElementById("maxgen").value = maxgen
      }
      let guessesMap = {0:'5', 1:'5', 2:'6', 3:'6', 4:'7', 5:'7', 6:'8', 7:'8'}

      filterRes = getPokemon(mingen, maxgen)
      setCookie('guessesv2',"",30)
      setCookie('secret_poke',filterRes[0],30)
      setCookie('min_gene',mingen,30)
      setCookie('max_gene',maxgen,30)
      setCookie('t_attempts',guessesMap[maxgen-mingen],30)

      autocomplete(document.getElementById("guess"), filterRes[1]);

      for (x in [0,1,2,3,4,5,6,7]){
        const elem = document.getElementById('guess'+x) || false
        elem?elem.remove():false
      }
      
      document.getElementById("guessform").style.display = "block";
      document.getElementById("results").style.display = "none";
      document.getElementById("lost").style.display = "none";
      document.getElementById("won").style.display = "none";
      document.getElementById("secretpoke").innerHTML = filterRes[0]
      showState(false)
    }