const TIMELIMIT = 30000;
let username, tracking;
const base_url = 'https://gruppe10.testsites.info:3000/'
/* Send request too backend to check if user is logged in */
fetch(base_url + 'silentLogin')
.then(response => response.json())
.then(data => {
  if(data.message == "success") {
    /* User is logged in -> Start tracking */
    username = data.username;
    startTracking();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.message === 'login') {
    /* Login request only if user is not already logged in */
    if(!username) {
      /* Send request to backend to get an oAuth url */
      fetch(base_url + 'getOAuthUrl')
      .then(response => response.json())
      .then(data => {
        /* Start oAuth window */
        console.log(data.url)
        chrome.identity.launchWebAuthFlow({
          url: data.url,
          interactive: true
        }, function(redirect_url) {
          /* Extract id_token and auth_code from url */
          if(redirect_url) {
            let id_token = redirect_url.substring(redirect_url.indexOf('id_token=') + 9)
            id_token = id_token.substring(0, id_token.indexOf('&'));
            let authorization_code = redirect_url.substring(redirect_url.indexOf('code=') + 5);
            authorization_code = authorization_code.substring(0, authorization_code.indexOf('&'));
            /* Send both to backend to login user */
            fetch(`${base_url}login?authorization_code=${authorization_code}&id_token=${id_token}&extension=true`)
            .then(response => response.json())
            .then(data => {
              if(data.message == "success") {
                startTracking();
              }
              username = data.username;
              chrome.runtime.sendMessage({message: 'login', username: username});
              return true;
            });
          } else {
            /* If no redirect_url was given -> Login failed */
            chrome.runtime.sendMessage({message: 'login', username: null});
          }
        });
      });
    }
  } else if(request.message === 'logout') {
    /* Send logout request to backend */
    fetch(base_url + 'logout')
      .then(response => response.json())
      .then(data => {
        if(data.message == "success") {
          username = undefined;
          chrome.runtime.sendMessage({message: 'logout'});
          stopTracking();
        }
      });
  } else if(request.message === 'isUserLoggedIn') {
    /* Send request to backend to check if user is logged in */
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
    /* If popup is opened -> Send active tab */
    getActiveTab(activeTab => {
      sendTab(activeTab, true);
    });
    return true;
  } else if(request.message === 'updateTabs') {
    /* Request when mouse or keyboard movements where registered */
    if(tracking) {
      updateTabEntry(sender.tab.id, false);
    }
  }
});
/* Function to change active tab */
function pushNewTabEntry(id){
  /* Get tab by id */
  chrome.tabs.get(id, (x)=>{
    if(x.url !== "chrome://newtab/" && x.url !== "" && !x.url.startsWith("chrome://") && !x.url.startsWith("file://")) {
      getActiveTab(activeTab=>{
        if(activeTab){
          /* If active tab exists -> update old tab and send it to backend */
          let currentTime = new Date().getTime();
          /* Check if tab is older then timelimit */
          if((currentTime - activeTab.endtime) < TIMELIMIT) {
            activeTab.endtime = new Date().getTime();
          } else {
            activeTab.endtime += TIMELIMIT;
          }
          activeTab.active = false;
          sendTab(activeTab);
        }
        /* Set new active tab and add mouse and keyboard listeners */
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
/* Function to update tab entry if no timeout or create new if timeout */
function updateTabEntry (id, isCloseEvent) {
  getActiveTab(activeTab => {
    /* Check if tab is active tab */
    if(activeTab && id == activeTab.id){
      let currentTime = new Date().getTime();
      if((currentTime - activeTab.endtime) < TIMELIMIT) {
        /* Tab was active in the last 30 seconds -> Set endtime to now */
        activeTab.endtime = currentTime;
        if(isCloseEvent) {
          /* If Tab was closed -> Send tab and set activeTab to null */
          activeTab.active = false;
          sendTab(activeTab);
          setActiveTab(null);
        } else {
          setActiveTab(activeTab);
        }
      } else {
        /* Tab was inactive for at least 30 seconds */
        activeTab.active = false;
        activeTab.endtime = activeTab.endtime + TIMELIMIT;
        /* Send tab entry and create new one */
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
/* Function to get favicon of tab */
function getFavicon(tab){
  let favicon = tab.favIconUrl? tab.favIconUrl : '/assets/images/defaultFavicon.png';
  return favicon;
}
/* Function to add mouse and keyboard listener to tab */
function addEventListenerToPage(id){
  let code = function() {
    let lastSent;
    document.addEventListener('keydown', (event) => {
      if(!lastSent || (new Date().getTime() - lastSent)> 1000) {
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
  /* Add code to tab */
  chrome.scripting.executeScript({
    target: { tabId: id },
    function: code
  });
}
/* Function to send tab information to backend */
function sendTab(tabToSend, sync){
  if(tabToSend){
    let activeTabExists = tabToSend.active && (new Date().getTime() - tabToSend.endtime) < TIMELIMIT;
    /* If tab is not active anymore -> send tab */
    if(!activeTabExists) {
      if(tabToSend.active) {
        tabToSend.endtime = tabToSend.endtime + TIMELIMIT;
        tabToSend.active = false;
        if(sync) {
          /* If tab is not active -> reset tab */
          setActiveTab(null);
        }
      }
      postData(base_url + 'webActivity', tabToSend);
    }
  }
}
/* Function to add tab listeners -> Start tracking */
function startTracking() {
  console.log("tracking started")
  chrome.tabs.onActivated.addListener(tabActivatedListener);
  chrome.tabs.onRemoved.addListener(tabRemovedListener);
  chrome.tabs.onUpdated.addListener(tabUpdatedListener);
  tracking = true;
}
/* Function to remove tab listeners -> Stop tracking */
function stopTracking() {
  console.log("tracking stopped")
  chrome.tabs.onUpdated.removeListener(tabUpdatedListener);
  chrome.tabs.onRemoved.removeListener(tabRemovedListener);
  chrome.tabs.onActivated.removeListener(tabActivatedListener);
  tracking = false;
  setActiveTab(null);
}
/* Function for a post request */
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
/* If tab was activated -> Push tab entry */
function tabActivatedListener(e) {
  pushNewTabEntry(e.tabId);
}
/* If tab was removed -> Update tab entry */
function tabRemovedListener(tabId) {
  updateTabEntry(tabId, true);
}
/* If url from tab was updated -> Check if baseurl changed */
function tabUpdatedListener(tabId, changeInfo) {
  if(changeInfo.url) {
    getActiveTab(activeTab => {
      if(activeTab && (activeTab.url.split('/')[2] == changeInfo.url.split('/')[2])) {
        /* Baseurl did not change -> Update mouse/keyboard listener and change url */
        addEventListenerToPage(tabId);
        activeTab.endtime = new Date().getTime();
        activeTab.url = changeInfo.url;
      } else {
        /* Baseurl changed -> Make new tab entry */
        pushNewTabEntry(tabId);
      }
    })
  }
}
/* Get active tab from localstorage */
function getActiveTab(callback) {
  chrome.storage.local.get(['activeTab'], function(result) {
    callback(result.activeTab);
  });
}
/* Update active tab to localstorage */
function setActiveTab(activeTab) {
  chrome.storage.local.set({activeTab: activeTab});
}