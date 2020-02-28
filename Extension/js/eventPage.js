// Initalize
chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({ "limit": 0, "total": 0 });
    console.log("Hey");
});

// add context menu (right click on the page)
var contextMenuItem = {
    id: "cp-compare",
    title: "Compare Price",
    "contexts": ["all"]
}

chrome.contextMenus.create(contextMenuItem);

// Context menu listener
chrome.contextMenus.onClicked.addListener(function(clickedData){
    if(clickedData.menuItemId == "cp-compare"){
        console.log(clickedData);
        console.log(clickedData.pageUrl);
        // if(parseInt(clickedData.selectionText)){
        //     var newTotal = 0;
        //     chrome.storage.sync.get(["total", "limit"], function(budget){
        //         if(budget.total > 0){
        //             newTotal += parseInt(budget.total);
        //         }
    
        //         var amount = parseInt(clickedData.selectionText);
        //         if(amount){
        //             newTotal += parseInt(amount);
        //         }
    
        //         if(amount && newTotal > budget.limit){
        //             var notifOptions = {
        //                 type: 'basic',
        //                 iconUrl: 'icon48.png',
        //                 title: 'Limit Reached!',
        //                 message: "Uh Oh! Looks like you've reached your limit!"
        //             }
        //             chrome.notifications.create('limitNotif', notifOptions);
        //         }
    
        //         chrome.storage.sync.set({ "total": newTotal });
        //     });
        // }
    }
});


// Storage value change listener
chrome.storage.onChanged.addListener(function(changes, storageName){
    if(storageName == "sync" && "total" in changes){
        chrome.browserAction.setBadgeText({ "text": changes.total.newValue.toString() });
    }
    
})