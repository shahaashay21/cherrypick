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
                if(a.newProduct == b.newProduct) return (a.updatedTime < b.updatedTime) ? 1 : -1;
                return (a.newProduct > b.newProduct) ? 1 : -1;
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
 * 
 * @param {JSON} productObject 
 * @param {String} key 
 * @param {String} value 
 */
function updateProductData(productObject, key, value){
    return new Promise(resolve => {
        chrome.storage.local.get(["products"], async function (chromeData) {
            if (chromeData.products) {
                let products = JSON.parse(chromeData.products);
                for(let infoType of PRODUCT_STORAGE_CATEGORIES){
                    if (products[infoType]) {
                        for (productKey in products[infoType]) {
                            let product = products[infoType][productKey];
                            if (product && product.name == productObject.name && product.owner == productObject.owner && product.link == productObject.link) {
                                product[key] = value;
                                chrome.storage.local.set({ products: JSON.stringify(products) });                                
                            }
                        }
                    }
                };
                resolve();
            }
        });
    })
}

function log(message, showAlways = false){
    let d = new Date();
    if(DEBUG || showAlways) console.log(`${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}::: ${message}`);
}