// Initalize
chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({ "cp": JSON.stringify({}), "lastAccessed": Date.now() });
    console.log("Hey");
});

// add context menu (right click on the page)
var contextMenuItem = {
    id: "cp-compare",
    title: "Compare Price",
    "contexts": ["page"]
}

chrome.contextMenus.create(contextMenuItem);

// Context menu listener
chrome.contextMenus.onClicked.addListener(function(clickedData){
    if(clickedData.menuItemId == "cp-compare"){
        var pageUrl = clickedData.pageUrl;
        if(validURL(pageUrl) && supportedUrl(pageUrl)){
            chrome.storage.sync.get(['cp'], function(chromeData){
                chromeData.cp = JSON.parse(chromeData.cp);
                chrome.storage.sync.set({ "lastAccessed": Date.now() });
                if(Object.keys(chromeData.cp).length > 0){
                    chromeData.cp[pageUrl] = Date.now();
                    chrome.storage.sync.set({ 'cp': JSON.stringify(chromeData.cp) });
                } else {
                    var cp = {};
                    cp[pageUrl] = Date.now();
                    chrome.storage.sync.set({ 'cp': JSON.stringify(cp) });
                }
            });

//         if(amount && newTotal > budget.limit){
//             var notifOptions = {
//                 type: 'basic',
//                 iconUrl: 'icon48.png',
//                 title: 'Limit Reached!',
//                 message: "Uh Oh! Looks like you've reached your limit!"
//             }
//             chrome.notifications.create('limitNotif', notifOptions);
//         }

        } else {
            console.log("Current URL is not supported: " + pageUrl);
        }
    }
});


// Storage value change listener
chrome.storage.onChanged.addListener(function(changes, storageName){
    if(storageName == "sync" && "cp" in changes){
        var totalItems = Object.keys(JSON.parse(changes.cp.newValue)).length;
        chrome.browserAction.setBadgeText({ "text": totalItems.toString() });
    }
    
});

function validURL(myURL) {
    var pattern = /[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?/gmi;
    return pattern.test(myURL);
}

function supportedUrl(myURL){
    var supportedRegEx = /((amazon|amzn)\.com|walmart\.com|bestbuy\.com)/gmi;
    return supportedRegEx.test(myURL);
}