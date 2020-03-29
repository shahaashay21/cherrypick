const supportedSites = ["amazon", "amzn", "bestbuy", "walmart"];


function isSameProduct(products, newProduct) {
    return new Promise(resolve => {
        if (products) {
            var i = 0;
            products.forEach(product => {
                if (product.owner == newProduct.owner && product.name == newProduct.name) {
                    return resolve({'isAvailable': true, 'position': i});
                }
                i++;
            });
        }
        return resolve({'isAvailable': false});
    });
}

// Get API path of the Cherry picket back-end based on the current product URL
function getAPIPath(url) {
    let match = supportedSiteRegex().exec(url);
    if (match && match.length > 1) {
        return match[1];
    }
}

function validURL(myURL) {
    var pattern = /[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?/gim;
    return pattern.test(myURL);
}

function supportedUrl(myURL) {
    return supportedSiteRegex().test(myURL);
}

function supportedSiteRegex(){
    var regExString = "(";
    supportedSites.forEach(site => {
        regExString += `${site}|`;
    });
    regExString = regExString.slice(0, -1);
    regExString += ")\\.com";
    var regEx = new RegExp(regExString, "gi");
    return regEx;
}

function getPID(products){
    let newPID;
    while(true){
        newPID = randomStr(uniqueIdLength);
        let isSamePID = false;
        for(let infoType of syncCategories){
            for (productKey in products[infoType]) {
                if(products[infoType][productKey]["pid"] == newPID){
                    isSamePID = true;
                    break;
                }
            }
            if(isSamePID) break;
        }
        if(!isSamePID) break;
    }
    return newPID;
}

// Generate random string based on the input size
function randomStr(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

/**
 * Get all the local storage data
 */
function getStorageData(){
    return new Promise(resolve => {
    chrome.storage.local.get(storageItems, chromeData => {
        return resolve(chromeData);
    });
    })
}

/**
 * Set the prodvided data to local storage
 */
function setStorageData(key, data){
    return new Promise(resolve => {
        let jsonObj = {};
        jsonObj[key] = data;
        chrome.storage.local.set(jsonObj, () => {
            return resolve();
        });
    })
}