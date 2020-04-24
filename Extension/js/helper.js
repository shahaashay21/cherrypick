const supportedSites = ["amazon", "amzn", "bestbuy", "walmart", "target"];

/**
 * Return true if the same product is already available or return false
 * @param {JSON} products 
 * @param {JSON} newProduct 
 */
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

/**
 * Get API path of the Cherry picket back-end based on the current product URL
 * @param {String} url 
 */
function getAPIPath(url) {
    let match = supportedSiteRegex().exec(url);
    if (match && match.length > 1) {
        return match[1];
    }
}

/**
 * Validating the current URL
 * @param {String} myURL 
 */
function validURL(myURL) {
    var pattern = /[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?/gim;
    return pattern.test(myURL);
}

/**
 * URL match with the supported regex
 * @param {String} myURL 
 */
function supportedUrl(myURL) {
    return supportedSiteRegex().test(myURL);
}

/**
 * Creates a regex consisting of all the supported websites by CP
 */
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

/**
 * Create a new unique ID for the each new product
 * @param {JSON} products 
 */
function getPID(products){
    let newPID;
    while(true){
        newPID = randomStr(UNIQUE_ID_LENGTH);
        let isSamePID = false;
        for(let infoType of PRODUCT_STORAGE_CATEGORIES){
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
        chrome.storage.local.get(STORAGE_ITEMS, chromeData => {
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

/**
 * return an array of unique products sorted by new product and updated time
 */
function getUniqueProducts(){
    return new Promise(async resolve => {
        let chromeData = await getStorageData();
        let unique = new Array();
        if (chromeData.products) {
            let products = JSON.parse(chromeData.products);

            // Concat all the products
            for(let infoType of PRODUCT_STORAGE_CATEGORIES){
                if (products[infoType]) {
                    unique = unique.concat(products[infoType]);
                }
            }

            // Sort the products based on new product and updated time
            unique.sort((a, b) => {
                if(a.newProduct == b.newProduct) return (a.updatedTime - b.updatedTime);
                return (b.newProduct - a.newProduct);
            });

            // Filter the product based on the same owner:productName:link
            let tempUniqueMap = new Map();
            unique = unique.filter(product => {
                let val = tempUniqueMap.get(`${product.owner}:${product.name}:${product.link}`);
                if(!val){
                    tempUniqueMap.set(`${product.owner}:${product.name}:${product.link}`, product.name);
                    return true;
                } else {
                    return false;
                }
            });
        }
        return resolve(unique);
    });
}

/**
 * Update any key value (data) of all the products
 * @param {JSON} productObject 
 * @param {String} key 
 * @param {String} value 
 */
function updateProductsData(productObject, key, value, all = false){
    return new Promise(resolve => {
        chrome.storage.local.get(["products"], async function (chromeData) {
            if (chromeData.products) {
                let products = JSON.parse(chromeData.products);
                for(let infoType of PRODUCT_STORAGE_CATEGORIES){
                    if (products[infoType]) {
                        for (productKey in products[infoType]) {
                            let product = products[infoType][productKey];
                            if (product && ((productObject && product.name == productObject.name && product.owner == productObject.owner && product.link == productObject.link) || all)) {
                                product[key] = value;
                            }
                        }
                    }
                };
                chrome.storage.local.set({ products: JSON.stringify(products) });
                resolve();
            }
        });
    })
}

/**
 * Generate error stack trace
 */
function getErrorObject(){
    try { throw Error('') } catch(err) { return err; }
}

/**
 * Generic logs
 * @param {String} message 
 * @param {Boolean} showAlways 
 */
function log(message, showAlways = false){
    let traceDetails = "";
    let fileName = "";
    let line = "";
    var err = getErrorObject();
    var lines = err.stack.split("\n");
    var callerLine = lines[3];
    let callerLineMatch = callerLine.match(/.*[\/](.*):(.*):(.*)/);
    if(callerLineMatch.length == 4){
        fileName = callerLineMatch[1];
        line = callerLineMatch[2];
    }
    if(fileName != "" && line != "") traceDetails = `[${fileName}:${line}]::`;
    let d = new Date();
    if(DEBUG || showAlways) console.log(`${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}::${traceDetails}${message}`);
}

/**
 * Serves any web request with url the type of method
 * @param {String} url
 * @param {String} method 
 */
function getHttp(url, method = "GET"){
    return new Promise(resolve => {
        $.ajax({
            url: url,
            method: method,
            timeout: 6000,
            tryCount: 0,
            retryLimit: 2,
            success: function (data) {
                return resolve(data);
            },
            error: function (xhr, textStatus, errorThrown) {
                if (textStatus == 'timeout') {
                    this.tryCount++;
                    if (this.tryCount <= this.retryLimit) {
                        //try again
                        log(`Remaining Retry: ${this.retryLimit - 1}`);
                        $.ajax(this);
                    } else {
                        // alert(`Failed to add an item. Please try again: ${urlPath}`);
                        log("AJAX time out");
                        return resolve({error: 1, message: textStatus});
                    }
                } else {
                    return resolve({error: 1, message: textStatus});
                }
            },
        });
    })
}

/**
 * Mainly used by content script to get the web request from the background script
 * @param {String} url 
 * @param {String} method 
 */
let webRequest = function (url, method = "GET"){
    return new Promise(resolve => {
        chrome.runtime.sendMessage({
            url: url,
            method: method,
            action: 'webRequest',
        }, function(webResponse) {
            return resolve(webResponse);
        });
    });
}