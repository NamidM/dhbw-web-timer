let token;
const TIMELIMIT = 30000;
let tabs = [];

/**
 * TODO:
 * -Login mit Oath/JWT
 * -IFrame mit Hauptstatistik in Popup.js
 */

startTimer();
// Function on tab change
chrome.tabs.onActivated.addListener(async (e) => {
  pushNewTabEntry(e.tabId);
})

function pushNewTabEntry(id){
  chrome.tabs.get(id, (x)=>{
    if(x.url !== "chrome://newtab/" && x.url !== "" && !x.url.startsWith("chrome://")) {
      if(tabs.length != 0){
        tabs[tabs.length-1].active = false;
      }
      tabs.push({
        id: id,
        url: x.url,
        startTime: new Date().getTime(),
        endTime: new Date().getTime(),
        active: true
      });
      addEventListenerToPage(id);
    }
  });
}

chrome.tabs.onRemoved.addListener(tabId => {
    updateTabEntry(tabId, true);
});

chrome.windows.onRemoved.addListener(windowId => {
  sendTabs();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if(changeInfo.url) {
      //let baseUrl = url.split('/')[2];
      //let baseUrl = url.split('/')[2].split('.').slice(url.split('/')[2].split('.').length-2, url.split('/')[2].split('.').length).join('.');
      if(tabs.length != 0 && (tabs[tabs.length-1].url.split('/')[2] == changeInfo.url.split('/')[2])) {
        addEventListenerToPage(tabId);
        tabs[tabs.length-1].endTime = new Date().getTime();
        tabs[tabs.length-1].url = changeInfo.url;
      } else {
        pushNewTabEntry(tabId);
      }
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

// Update tab entry if no timeout or create new if timeout
function updateTabEntry (id, isCloseEvent) {
  if(tabs.length != 0){
    let tab = tabs[tabs.length-1]
    let currentTime = new Date().getTime();
    if((currentTime - tab.endTime) < TIMELIMIT) {
      tabs[tabs.length-1].endTime = currentTime;
      //TODO das hier funktioniert manchmal nicht? Endtime wird nicht immer richtig gesetzt....
      if(isCloseEvent) {
        tabs[tabs.length-1].active = false;
      }
    } else {
      tabs[tabs.length-1].active = false;
      tabs[tabs.length-1].endTime = tab.endTime + TIMELIMIT;
      tabs.push({
        id: tab.id,
        url: tab.url,
        startTime: currentTime,
        endTime: currentTime,
        active: true
      });
    }
  }
}

function startTimer() {
  setTimeout(() => {
      sendTabs();
      startTimer();
  }, 600000);
}

function addEventListenerToPage(id){
  let code = function() {
    let lastSent;
    document.addEventListener('keydown', (event) => {
      if(!lastSent || (new Date().getTime() - lastSent)> 1000) {
        console.log("Hey :) keydown eventlistener wurde geaddet");
        chrome.runtime.sendMessage({message: 'updateTabs'});
        lastSent = new Date().getTime()  
      }
    }, false)
    document.addEventListener('mousemove', (event) => {
      if(!lastSent || (new Date().getTime() - lastSent) > 1000) {
        chrome.runtime.sendMessage({message: 'updateTabs'});
        lastSent = new Date().getTime()
      }
    }, false)
  };
  chrome.scripting.executeScript({
    target: { tabId: id },
    function: code,
  });
}

function sendTabs(){
  if(tabs.length != 0){
    let newTabs = [];
    let activeTabExists = (tabs[tabs.length-1].endTime - new Date().getTime()) < TIMELIMIT;
    if(activeTabExists) {
      newTabs.push(tabs[tabs.length-1]);
      tabs = tabs.splice(0, tabs.length-1);
    } else {
      tabs[tabs.length-1].endTime = tabs[tabs.length-1].endTime + TIMELIMIT;
      tabs[tabs.length-1].active = false;
    }
    // TODO -> send UserID
    console.log("Sending data");
    console.log(tabs);
    postData('http://127.0.0.1:3000/tracking', tabs)
    .then(async response => {
      if(response.status == 200) {
        let res = await response.json();
        console.log("Success: " +  res.data);
        tabs = newTabs;
      } else {
        console.log("Failed to reach backend")
      }
    });
  }
}
let user_signed_in = false;
const CLIENT_ID = encodeURIComponent('13816586294-t3d1k5mqu77um116qd9vn3dede42ppmn.apps.googleusercontent.com');
const RESPONSE_TYPE = encodeURIComponent('id_token');
const REDIRECT_URI = encodeURIComponent('https://peiiacnbhlnhkiklncejaoegaocccgom.chromiumapp.org');
const STATE = encodeURIComponent('jfkls3n');
const SCOPE = encodeURIComponent('openid');
const PROMPT = encodeURIComponent('consent');

function create_oauth2_url() {
  let nonce = encodeURIComponent(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));

  let url = `
  https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=${CLIENT_ID}
  &response_type=${RESPONSE_TYPE}
  &redirect_uri=${REDIRECT_URI}
  &state=${STATE}
  &scope=${SCOPE}
  &prompt=${PROMPT}
  &nonce=${nonce}`;

  console.log(url)

  return url;
}

function is_user_signed_in() {
  return user_signed_in;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.message === 'login') {
    if(is_user_signed_in()) {
      console.log('Already signed in');
    } else {
      chrome.identity.launchWebAuthFlow({
        url: create_oauth2_url(),
        interactive: true
      }, function(redirect_url) {
        console.log(redirect_url)

        // let id_token = redirect_url.substring(redirect_url.indexOf('id_token=') + 9)
        // id_token = id_token.substring(0, id_token.indexOf('&'));
        // const user_info = KJUR.jws.JWS.readSafeJSONString(b64utoutf8(id_token.split(".")[1]))

        sendResponse('success');
      });

      return true;
    }
  } else if(request.message === 'logout') {

  } else if(request.message === 'isUserSignedIn') {
    
  } else if(request.message === 'updateTabs') {
    updateTabEntry(sender.tab.id, false);
  } else if(request.message === 'sync') {
    sendTabs();
    sendResponse('success');
  }
});
