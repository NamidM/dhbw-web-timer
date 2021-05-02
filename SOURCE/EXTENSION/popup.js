let username;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.message === 'login') {
    username = request.username;
    if(username) {
      showMainPage();
    } else {
      showLoginPage("error");
    }
  } else if(request.message === 'logout') {
    username = undefined;
    showLoginPage();
  }
});
console.log("test")

chrome.runtime.sendMessage({message: 'isUserLoggedIn'}, response => {
  console.log(response)
  if(!response) {
    showLoginPage();
  } else {
    username = response;
    showMainPage();
  }
});

async function postData(url = '', data = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response;
}

function showMainPage() {
  document.getElementById('login').innerHTML = "";
  document.getElementById('login').style.display = "none";
  document.getElementById('content').innerHTML = `
    <iframe src="http://localhost:4200/" style="max-width: 780px; max-height: 450px" width="900" height="500" name="homepage"></iframe>
    <div class="bottom">
      <div class="row">
        <div class="col-sm">
          <p class="statistics-txt">Statistiken <a id="statisticsLink" href="#">Hier</a> ansehen</p>
        </div>
        <div class="col-sm">
          <p class="welcome-txt">Willkommen: <b>${username}</b></p>
        </div>
        <div class="col-sm">
          <button id="logoutBtn" class="btn btn-secondary">Ausloggen</button>
        </div>
      </div>
    </div>
    `;
  document.getElementById('statisticsLink').addEventListener("click", (()=>{
    chrome.tabs.create({active: true, url: "localhost:4200/statistics"});
  }));

  document.getElementById('logoutBtn').addEventListener("click", (()=>{
    chrome.runtime.sendMessage({message: 'logout'});
  }));
}

function showLoginPage(error) {
  document.getElementById('content').innerHTML = "";
  document.getElementById('login').style.display = "block";
  let errorMsg = error ? "<span id='err'>Login fehlgeschlagen</span>" : "";
  document.getElementById('login').innerHTML = `
  <h2> Einloggen</h2>
  <button id="loginBtn" style="width: 150px" class="btn btn-primary">Mit Google anmelden</button>
  ${errorMsg}
  <p>Noch kein Konto?<br>Hier <a id="registerLink" href="#">registrieren</a></p>
  `;
  document.getElementById('registerLink').addEventListener("click", (()=>{
    chrome.tabs.create({active: true, url: "localhost:4200/register"});
  }));

  document.getElementById('loginBtn').addEventListener("click", (()=>{
    chrome.runtime.sendMessage({message: 'login'});
  }));
}