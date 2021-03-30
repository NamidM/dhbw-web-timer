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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  updateTabEntry(sender.tab.id, false);
  }
);

chrome.tabs.onRemoved.addListener(tabId => {
    console.log("test")
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
        chrome.runtime.sendMessage({});
        lastSent = new Date().getTime()  
      }
    }, false)
    document.addEventListener('mousemove', (event) => {
      if(!lastSent || (new Date().getTime() - lastSent) > 1000) {
        chrome.runtime.sendMessage({});
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
    postData('http://127.0.0.1:3000/tracking', tabs)
    .then(async response => {
      if(response.status == 200) {
        let res = await response.json();
        console.log(res.data)
        tabs = newTabs;
      } else {
        console.log("Failed to reach backend")
      }
    });
  }
}