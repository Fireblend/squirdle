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

  function copyCurrentDay(text) {
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

  function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/"+";samesite=strict";
  }

    function getCookie(cname) {
      var cookies = ` ${document.cookie}`.split(";");
      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].split("=");
        if (cookie[0] == ` ${cname}`) {
          return cookie[1];
        }
      }
      return "";
    }

    function showState() {
      var guesses = getCookie("guessesv2")
      guesses = guesses == ""? []:JSON.parse(guesses)
      document.getElementById("guesses").style.display = guesses.length > 0? "block":"none";
      
      for (const [index,guess] of guesses.entries()) {
        if (!(document.getElementById('guess'+index) || false)) {
          
        }
      }
    }

    function handleGuess(dex) {
      const imgs = {'🟩':1, '🔼':2, '🔽':3, '🟨':4, '🟥':5}
      
      var guess_name = document.getElementById("guess").value
      var secret_name = getCookie("secret")
      guess = dex[guess_name]

      if (guess == null) {
        document.getElementById("error").style.display = "block";
        return
      }
      document.getElementById("error").style.display = "none";
      
      secret = dex[secret_name]

      var gen = guess[0] == secret[0] ? "🟩" : guess[0] < secret[0]? '🔼':'🔽'
      var t1 = guess[1] == secret[1] ? "🟩" : guess[1] == secret[1] ? '🟨':'🟥'
      var t2 = guess[2] == secret[2] ? "🟩" : guess[2] == secret[2] ? '🟨':'🟥'
      var h = guess[3] == secret[3] ? "🟩" : guess[3] < secret[3]? '🔼':'🔽'
      var w = guess[4] == secret[4] ? "🟩" : guess[4] < secret[4]? '🔼':'🔽'

      var emoji = gen+t1+t2+h+w
     
      var pokeinfo = {"Gen:":guess[0], "Type 1:":guess[1], "Type 2:":guess[2],
                    "Height:":guess[3], "Weight:":guess[4]}
                    
      var guess = {"hints":[imgs[gen], imgs[t1], imgs[t2], imgs[h], imgs[w]], 
                   "name":guess_name, "info":pokeinfo, "emoji":emoji}

      var guesses = getCookie("guessesv2")
      guesses = guesses == ""? []:JSON.parse(guesses)

      console.log(guesses)
      guesses.push(guess)

      setCookie("guessesv2", JSON.stringify(guesses), 100)

      showState()
    }