let token;
const TIMELIMIT = 30000;
startTimer();
// Function on tab change
chrome.tabs.onActivated.addListener(async (e) => {
  try {
    chrome.tabs.get(e.tabId, (x)=>{
      if(x.url !== "chrome://newtab/" && x.url !== "" && x.url !== "chrome://") {
        chrome.storage.sync.get(['tabs'], res=>{
          pushNewTabEntry(e.tabId, x.url, res.tabs)
        });
        executeEventListener(e.tabId);
      }
    });
  } catch(e) {}
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    chrome.storage.sync.get(['tabs'], res=>{
      updateTabEntry(sender.tab.id, res.tabs, false);
    });
  }
);

chrome.tabs.onRemoved.addListener(tabId => {
  chrome.storage.sync.get(['tabs'], res=>{
    updateTabEntry(tabId, res.tabs, true);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if(changeInfo.url) {
    chrome.storage.sync.get(['tabs'], res=>{
      let tabs = res.tabs;
      //let baseUrl = url.split('/')[2];
      //let baseUrl = url.split('/')[2].split('.').slice(url.split('/')[2].split('.').length-2, url.split('/')[2].split('.').length).join('.');
      executeEventListener(tabId);
      if(tabs.length != 0 && (tabs[tabs.length-1].url.split('/')[2] == changeInfo.url.split('/')[2])) {
        tabs[tabs.length-1].endTime = new Date().getTime();
        tabs[tabs.length-1].url = changeInfo.url;
        chrome.storage.sync.set({"tabs": tabs});
      } else {
        if(changeInfo.url != "chrome://newtab/" && changeInfo.url != "") {
          pushNewTabEntry(tabId, changeInfo.url, res.tabs);
        }
      } 
    });
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

// set last active tab to false and Push new Tab to Storage 
function pushNewTabEntry(id, url, tabs) {
  if(!tabs || tabs.length == 0){
    tabs = [];
  } else {
    tabs[tabs.length-1].active = false;
  }
  tabs.push({
    id: id,
    url: url,
    startTime: new Date().getTime(),
    endTime: new Date().getTime(),
    active: true
  });
  chrome.storage.sync.set({"tabs": tabs});
}

// Update tab entry if no timeout or create new if timeout
function updateTabEntry (id, tabs, isCloseEvent) {
  let tab = tabs[tabs.length-1]
  let currentTime = new Date().getTime();
  if((currentTime - tab.endTime) < TIMELIMIT) {
    tabs[tabs.length-1].endTime = currentTime;
    if(isCloseEvent) tabs[tabs.length-1].active = false;
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
  chrome.storage.sync.set({"tabs": tabs});
}

function startTimer() {
  setTimeout(() => {
    chrome.storage.sync.get(['tabs'], res=>{
      let tabs = res.tabs;
      if(tabs) {
        let newTabs = [];
        let activeTabExists = (tabs[tabs.length-1].endTime - new Date().getTime()) < TIMELIMIT;
        if(activeTabExists) {
          newTabs.push(tabs[tabs.length-1]);
          tabs = tabs.splice(0, tabs.length-1);
        } else {
          tabs[tabs.length-1].endTime = tabs[tabs.length-1].endTime + TIMELIMIT;
          tabs[tabs.length-1].active = false;
        }
        postData('http://127.0.0.1:3000/tracking', tabs)
        .then(async response => {
          if(response.status == 200) {
            // SUCCESS
            let res = await response.json();
            console.log(res.data)
          } else {
            // FAIL
          }
        });
        chrome.storage.sync.set({"tabs": newTabs});
      }
      startTimer();
    });
  }, 1000000);
}

function executeEventListener(id){
  let lastSent;
  let code = function() {
    document.addEventListener('keydown', (event) => {
      chrome.runtime.sendMessage({}, ()=>{});
    }, false)
    document.addEventListener('mousemove', (event) => {
      if(!lastSent || (lastSent - new Date().getTime()) > 1000) {
        chrome.runtime.sendMessage({}, ()=>{});
        lastSent = new Date().getTime()
      }
    }, false)
  };
  chrome.scripting.executeScript({
    target: { tabId: id },
    function: code,
  });
}