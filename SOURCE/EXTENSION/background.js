let color = '#3aa757';
let token;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log('Default background color set to %cgreen', `color: ${color}`);
});

// Function on tab change
chrome.tabs.onActivated.addListener(async (e) => {
  // TODO If tab was never started before -> Add to storage

  chrome.tabs.get(e.tabId, (x)=>{
    console.log(x.url);

    chrome.storage.sync.get(['tabs'], res=>{
      let tabs = res.tabs;
      if(!search(e.tabId, tabs)) {
        tabs.push({
          tabId: e.tabId,
          url: x.url,
          firstActivated: new Date().toLocaleString()
        })
        chrome.storage.sync.set({"tabs": tabs});
        console.log("Added", tabs.length)
      }
    });

    // let code = function() {document.addEventListener('keydown', (event) => {
    //   return event.key;
    // }, false)};

    // chrome.scripting.executeScript({
    //   target: { tabId: e.tabId },
    //   function: code,
    // }, result => {
    //   console.log(result)
    // });
  });
});

chrome.tabs.onRemoved.addListener(tabId => {
  // TODO: Add API call to send total time
  chrome.storage.sync.get(['tabs'], res=>{
    let tabs = res.tabs;
    
    postData('http://127.0.0.1:3000/test2', {test: 42})
      .then(async response => {
        if(response.status == 200) {
          // SUCCESS
          let res = await response.json();
          console.log(res.data)
        } else {
          // FAIL
        }
    });
    tabs.splice(search(tabId, tabs, true), 1)
    chrome.storage.sync.set({"tabs": tabs});
    console.log("Removed", tabs.length, tabs, new Date())
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if(changeInfo.url) {
    chrome.storage.sync.get(['tabs'], res=>{
      let tabs = res.tabs;
      tabs[search(tabId,tabs,true)] = {
        tabId: tabId,
        url: changeInfo.url,
        firstActivated: tabs[search(tabId,tabs,true)].firstActivated
      };
      chrome.storage.sync.set({"tabs": tabs});
      console.log("Updated", tabs.length, tabs)
    });
  }
});

function search(tabId, arr, index){
  for (var i=0; i < arr.length; i++) {
      if (arr[i].tabId === tabId) {
          if(index) return i;
          return true;
      }
  }
  return false;
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