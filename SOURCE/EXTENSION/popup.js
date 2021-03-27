chrome.storage.sync.get(['token'], res=>{
  if(!res.token) {
    document.getElementById('login').innerHTML = `
    <h2> Einloggen</h2>
    <form>
          <label >Username</label>
          <input type="text" id="username"/><br>
          <label>Passwort</label>
          <input type="password" id="password"/><br>
    </form>
    <button id="loginBtn">Einloggen</button>
    <p>Noch kein Konto?<br>Hier <a id="registerLink" href="#">registrieren</a></p>
    `;
    document.getElementById('registerLink').addEventListener("click", (()=>{
      chrome.tabs.create({active: true, url: "localhost:4200/register"});
    }));

    document.getElementById('loginBtn').addEventListener("click", (()=>{
      postData('http://127.0.0.1:3000/login', {username: document.getElementById('username').value, password: document.getElementById('password').value})
        .then(async response => {
          if(response.status == 200) {
            // SUCCESS
            let res = await response.json();
            chrome.storage.sync.set({"token": res.token});
            location.reload();
          } else {
            // FAIL
          }
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
      chrome.storage.sync.set({ token: undefined });
      chrome.storage.sync.remove('token', (r)=>{
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