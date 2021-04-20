chrome.storage.sync.get(['token'], res=>{
  if(!res.token) {
    document.getElementById('login').innerHTML = `
    <h2> Einloggen</h2>
    <button id="loginBtn" style="width: 150px">Einloggen</button>
    <button id="syncBtn">Sync</button>
    <p>Noch kein Konto?<br>Hier <a id="registerLink" href="#">registrieren</a></p>
    `;
    document.getElementById('registerLink').addEventListener("click", (()=>{
      chrome.tabs.create({active: true, url: "localhost:4200/register"});
    }));

    document.getElementById('loginBtn').addEventListener("click", (()=>{
      chrome.runtime.sendMessage({message: 'login'}, response => {
      });
    }));

    document.getElementById('syncBtn').addEventListener("click", (()=>{
      chrome.runtime.sendMessage({message: 'sync'}, response => {
      });
    }));
  } else {
    document.getElementById('content').innerHTML = `
    <p>Statistiken <a id="statisticsLink" href="#">Hier</a> ansehen</p>
    <button id="logoutBtn">Ausloggen</button>
    `;
    document.getElementById('statisticsLink').addEventListener("click", (()=>{
      chrome.tabs.create({active: true, url: "localhost:4200/statistics"});
    }));

    document.getElementById('logoutBtn').addEventListener("click", (()=>{
      chrome.runtime.sendMessage({message: 'login'}, response => {
        location.reload();
      });
    }));
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