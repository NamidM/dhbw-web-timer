let username;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.message === 'login') {
    /* Login request message was sent -> Set user name */
    username = request.username;
    if(username) {
      showMainPage();
    } else {
      /* Show login page with error message */
      showLoginPage("error");
    }
  } else if(request.message === 'logout') {
    /* Logout request message was sent -> reset username */
    username = undefined;
    showLoginPage();
  }
});
/* Send request to check if user is logged in */
chrome.runtime.sendMessage({message: 'isUserLoggedIn'}, response => {
  if(!response) {
    showLoginPage();
  } else {
    /* User is logged in -> Set username and show main page */
    username = response;
    showMainPage();
  }
});
/* Function to show main page */
function showMainPage() {
  /* Reset login div and set content div */
  document.getElementById('login').innerHTML = "";
  document.getElementById('login').style.display = "none";
  document.getElementById('content').innerHTML = `
    <iframe src="https://gruppe10.testsites.info" style="max-width: 780px; max-height: 450px" width="900" height="500" name="homepage"></iframe>
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
    chrome.tabs.create({active: true, url: "https://gruppe10.testsites.info/statistics"});
  }));
  /* When user clicks on logout button -> Send logout message to background script */
  document.getElementById('logoutBtn').addEventListener("click", (()=>{
    chrome.runtime.sendMessage({message: 'logout'});
  }));
}
/* Function to show login page */
function showLoginPage(error) {
  /* Reset content div and set login div */
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
    chrome.tabs.create({active: true, url: "https://gruppe10.testsites.info/register"});
  }));
  /* When user clicks on login button -> Send login message to background script */
  document.getElementById('loginBtn').addEventListener("click", (()=>{
    chrome.runtime.sendMessage({message: 'login'});
  }));
}