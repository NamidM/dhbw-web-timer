const TIMELIMIT = 30000;
let tabs = [];
let username, timeout, tracking;
const base_url = 'http://127.0.0.1:3000/'

fetch(base_url + 'silentLogin')
.then(response => response.json())
.then(data => {
  if(data.message == "success") {
    username = data.username;
    startTracking();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.message === 'login') {
    if(username) {
      console.log('Already signed in');
    } else {
      fetch(base_url + 'getOAuthUrl')
      .then(response => response.json())
      .then(data => {
        console.log(data);
        chrome.identity.launchWebAuthFlow({
          url: data.url,
          interactive: true
        }, function(redirect_url) {
          console.log(redirect_url);
          let id_token = redirect_url.substring(redirect_url.indexOf('id_token=') + 9)
          id_token = id_token.substring(0, id_token.indexOf('&'));
      
          let authorization_code = redirect_url.substring(redirect_url.indexOf('code=') + 5);
          authorization_code = authorization_code.substring(0, authorization_code.indexOf('&'));
          fetch(`${base_url}login?authorization_code=${authorization_code}&id_token=${id_token}&extension=true`)
          .then(response => response.json())
          .then(data => {
            console.log(data);
            if(data.message == "error") {
              // TODO add message that login failed
            } else {
              username = data.username;
              startTracking();
              chrome.runtime.sendMessage({message: 'login', username: username});
            }
            return true;
          });
        });
      });
    }
  } else if(request.message === 'logout') {
    fetch(base_url + 'logout')
      .then(response => response.json())
      .then(data => {
        if(data.message == "success") {
          username = undefined;
          stopTracking();
          chrome.runtime.sendMessage({message: 'logout'});
        }
      });
  } else if(request.message === 'isUserLoggedIn') {
    console.log("isuserlog")
    sendResponse(username);
  } else if(request.message === 'updateTabs') {
    if(tracking) {
      updateTabEntry(sender.tab.id, false);
    }
  } else if(request.message === 'sync') {
    console.log("syncBtn pressed")
    sendTabs();
    sendResponse('success');
  }
});


function pushNewTabEntry(id){
  chrome.tabs.get(id, (x)=>{
    if(x.url !== "chrome://newtab/" && x.url !== "" && !x.url.startsWith("chrome://")) {
      if(tabs.length != 0){
        tabs[tabs.length-1].endtime = new Date().getTime();
        tabs[tabs.length-1].active = false;
      }
      tabs.push({
        id: id,
        faviconUrl: getFavicon(x),
        url: x.url,
        starttime: new Date().getTime(),
        endtime: new Date().getTime(),
        active: true
      });
      addEventListenerToPage(id);
    }
  });
}

// Update tab entry if no timeout or create new if timeout
function updateTabEntry (id, isCloseEvent) {
  if(tabs.length != 0){
    let tab = tabs[tabs.length-1]
    let currentTime = new Date().getTime();
    if((currentTime - tab.endtime) < TIMELIMIT) {
      tabs[tabs.length-1].endtime = currentTime;
      if(isCloseEvent) {
        tabs[tabs.length-1].active = false;
      }
    } else {
      tabs[tabs.length-1].active = false;
      tabs[tabs.length-1].endtime = tab.endtime + TIMELIMIT;
      tabs.push({
        id: tab.id,
        faviconUrl: getFavicon(tab),
        url: tab.url,
        active: true
      });
    }
  }
}

function startTimer() {
  timeout = setTimeout(() => {
      sendTabs();
      startTimer();
  }, 600000);
}

function getFavicon(tab){
  var favicon = tab.favIconUrl;
  if (favicon === undefined) {
    favicon = 'chrome://favicon/' + tab.url;
  }
  console.log(favicon);
  return favicon;
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
    }, false);
    document.addEventListener('mousemove', (event) => {
      if(!lastSent || (new Date().getTime() - lastSent) > 1000) {
        chrome.runtime.sendMessage({message: 'updateTabs'});
        lastSent = new Date().getTime()
      }
    }, false);
  };
  chrome.scripting.executeScript({
    target: { tabId: id },
    function: code
  });
}

function sendTabs(){
  console.log(tabs.length, tabs.length != 0)
  if(tabs.length != 0){
    let newTabs = [];
    let activeTabExists = (new Date().getTime() - tabs[tabs.length-1].endtime) < TIMELIMIT;
    console.log(tabs[tabs.length-1].endtime, activeTabExists)

    if(activeTabExists) {
      newTabs.push(tabs[tabs.length-1]);
      tabs = tabs.splice(0, tabs.length-1);
    } else {
      tabs[tabs.length-1].endtime = tabs[tabs.length-1].endtime + TIMELIMIT;
      tabs[tabs.length-1].active = false;
    }
    console.log("Sending data", tabs);
    postData(base_url + 'webActivities', tabs)
    .then(async response => {
      if(response.status == 200) {
        let res = await response.json();
        console.log("Success: ", res);
        tabs = newTabs;
      } else {
        console.log("Failed to reach backend")
      }
    });
  }
}

function startTracking() {
  console.log("tracking started")
  startTimer();
  chrome.tabs.onActivated.addListener(tabActivatedListener);
  chrome.tabs.onRemoved.addListener(tabRemovedListener);
  chrome.windows.onRemoved.addListener(windowRemovedListener);
  chrome.tabs.onUpdated.addListener(tabUpdatedListener);
  tracking = true;
}

function stopTracking() {
  console.log("tracking stopped")
  chrome.tabs.onUpdated.removeListener(tabUpdatedListener);
  chrome.windows.onRemoved.removeListener(windowRemovedListener);
  chrome.tabs.onRemoved.removeListener(tabRemovedListener);
  chrome.tabs.onActivated.removeListener(tabActivatedListener);
  clearTimeout(timeout);
  tracking = false;
  tabs = [];
}

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

async function tabActivatedListener(e) {
  pushNewTabEntry(e.tabId);
}

function tabRemovedListener(tabId) {
  updateTabEntry(tabId, true);
}

function windowRemovedListener(windowId) {
  sendTabs();
}

function tabUpdatedListener(tabId, changeInfo) {
  if(changeInfo.url) {
      if(tabs.length != 0 && (tabs[tabs.length-1].url.split('/')[2] == changeInfo.url.split('/')[2])) {
        addEventListenerToPage(tabId);
        tabs[tabs.length-1].endtime = new Date().getTime();
        tabs[tabs.length-1].url = changeInfo.url;
      } else {
        pushNewTabEntry(tabId);
      }
  }
}