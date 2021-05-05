const TIMELIMIT = 30000;
let username, tracking;
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
    fetch(base_url + 'silentLogin')
    .then(response => response.json())
    .then(data => {
      if(data.message == "success") {
        username = data.username;
        sendResponse(username);
      } else {
        sendResponse();
      }
    });
    getActiveTab(activeTab => {
      sendTab(activeTab, true);
    });
    return true;
  } else if(request.message === 'updateTabs') {
    if(tracking) {
      updateTabEntry(sender.tab.id, false);
    }
  }
});

function pushNewTabEntry(id){
  chrome.tabs.get(id, (x)=>{
    if(x.url !== "chrome://newtab/" && x.url !== "" && !x.url.startsWith("chrome://") && !x.url.startsWith("file://")) {
      getActiveTab(activeTab=>{
        if(activeTab){
          let currentTime = new Date().getTime();
          if((currentTime - activeTab.endtime) < TIMELIMIT) {
            activeTab.endtime = new Date().getTime();
          } else {
            activeTab.endtime += TIMELIMIT;
          }

          activeTab.active = false;
          sendTab(activeTab);
        }
        setActiveTab({
          id: id,
          faviconUrl: getFavicon(x),
          url: x.url,
          starttime: new Date().getTime(),
          endtime: new Date().getTime(),
          active: true
        });
        addEventListenerToPage(id);
      })
    }
  });
}

// Update tab entry if no timeout or create new if timeout
function updateTabEntry (id, isCloseEvent) {
  getActiveTab(activeTab => {
    if(activeTab && id == activeTab.id){
      let currentTime = new Date().getTime();
      if((currentTime - activeTab.endtime) < TIMELIMIT) {
        // Active Tab was active in the last 30 seconds
        // Set endtime to now
        activeTab.endtime = currentTime;
        if(isCloseEvent) {
          // If Tab was closed -> Send tab and set activeTab to null
          activeTab.active = false;
          sendTab(activeTab);
          setActiveTab(null);
        } else {
          setActiveTab(activeTab);
        }
      } else {
        // Active Tab was inactive for at least 30 seconds
        activeTab.active = false;
        activeTab.endtime = activeTab.endtime + TIMELIMIT;
        // Send tab entry and create new one
        sendTab(activeTab);
        setActiveTab({
          id: activeTab.id,
          faviconUrl: getFavicon(activeTab),
          url: activeTab.url,
          active: true,
          startime: currentTime,
          endtime: currentTime
        });
      }
    }
  })
}

function getFavicon(tab){
  let favicon = tab.favIconUrl? tab.favIconUrl : '/assets/images/defaultFavicon.png';
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

function sendTab(tabToSend, sync){
  if(tabToSend){
    let activeTabExists = tabToSend.active && (new Date().getTime() - tabToSend.endtime) < TIMELIMIT;

    if(!activeTabExists) {
      if(tabToSend.active) {
        tabToSend.endtime = tabToSend.endtime + TIMELIMIT;
        tabToSend.active = false;
        if(sync) {
          setActiveTab(null);
        }
      }
      postData(base_url + 'webActivity', tabToSend)
      .then(async response => {
        if(response.status == 200) {
          let res = await response.json();
          console.log("Success: ", res);
        } else {
          console.log("Failed to reach backend")
        }
      });
    }
  }
}

function startTracking() {
  console.log("tracking started")
  chrome.tabs.onActivated.addListener(tabActivatedListener);
  chrome.tabs.onRemoved.addListener(tabRemovedListener);
  chrome.tabs.onUpdated.addListener(tabUpdatedListener);
  tracking = true;
}

function stopTracking() {
  console.log("tracking stopped")
  chrome.tabs.onUpdated.removeListener(tabUpdatedListener);
  chrome.tabs.onRemoved.removeListener(tabRemovedListener);
  chrome.tabs.onActivated.removeListener(tabActivatedListener);
  tracking = false;
  setActiveTab(null);
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

function tabUpdatedListener(tabId, changeInfo) {
  if(changeInfo.url) {
    getActiveTab(activeTab => {
      if(activeTab && (activeTab.url.split('/')[2] == changeInfo.url.split('/')[2])) {
        addEventListenerToPage(tabId);
        activeTab.endtime = new Date().getTime();
        activeTab.url = changeInfo.url;
      } else {
        pushNewTabEntry(tabId);
      }
    })
  }
}

function getActiveTab(callback) {
  chrome.storage.local.get(['activeTab'], function(result) {
    callback(result.activeTab);
  });
}

function setActiveTab(activeTab) {
  chrome.storage.local.set({activeTab: activeTab});
}