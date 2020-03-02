// Initalize
let productInitialization = {
    "new": new Array(),
    "expired": new Array()
}
chrome.runtime.onInstalled.addListener(function() {
    console.log("Welcome to Cherry-Pick");
    chrome.storage.sync.set({ "products": JSON.stringify(productInitialization), "lastAccessed": Date.now() });
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
    newLinkListner(clickedData);
});

async function newLinkListner(clickedData){
    if(clickedData.menuItemId == "cp-compare"){
        var pageUrl = clickedData.pageUrl;
        if(validURL(pageUrl) && supportedUrl(pageUrl)){
            chrome.storage.sync.set({ "lastAccessed": Date.now() });
            await addProduct(pageUrl);
        } else {
            console.log("Current URL is not supported: " + pageUrl);
        }
    }
}

function addProduct(link, price = null, name = null, suggestions = null, done){
    return new Promise(resolve => {
        chrome.storage.sync.get(['products'], async function(chromeData){
            products = JSON.parse(chromeData.products);
            let sameProduct = await isSameProduct(products.new, link);
            if(sameProduct){
                return resolve();
            }
            var product = {};
            product['link'] = link;
            product['timestamp'] = Date.now();
            products["new"].push(product);
            chrome.storage.sync.set({ 'products': JSON.stringify(products) });
            return resolve();
        });
    });
}

function isSameProduct(products, newProductLink){
    return new Promise(resolve => {
        products.forEach(product => {
            if(product.link == newProductLink){
                return resolve(true);
            }
        });
        return resolve(false);
    });
}


// Storage value change listener
chrome.storage.onChanged.addListener(function(changes, storageName){
    if(storageName == "sync" && "products" in changes){
        var totalItems = JSON.parse(changes.products.newValue).new.length;
        console.log(JSON.parse(changes.products.newValue));
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