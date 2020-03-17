const URL = "http://localhost:3000/";
// Initalize
const productInitialization = {
    recent: new Array(),
    saved: new Array(),
    expired: new Array(),
    pending: new Array()
};

const defaultOptions = {
    maxDefaultRecentProducts: 10
}

const ownerIcons = {
    "amazon": "amazon.png",
    "walmart": "walmart.png",
    "bestbuy": "bestbuy.png"
}

const allWebsites = ["amazon", "walmart", "bestbuy"];

// Runs once in a lifetime when cherry pick is installed
chrome.runtime.onInstalled.addListener(function () {
    console.log("Welcome to Cherry-Pick");
    chrome.storage.sync.set({
        products: JSON.stringify(productInitialization),
        lastAccessed: Date.now(),
        defaultOptions: JSON.stringify(defaultOptions)
    });
});

// Add context menu (right click on the page)
let contextMenuItem = {
    id: "cp-compare",
    title: "Compare Price",
    contexts: ["page"]
};
chrome.contextMenus.create(contextMenuItem);

// Context menu listener
chrome.contextMenus.onClicked.addListener(function (clickedData) {
    newProductListner(clickedData);
});


// Check basic URL validation then add a new product
async function newProductListner(clickedData) {
    if (clickedData.menuItemId == "cp-compare") {
        let pageUrl = clickedData.pageUrl;
        if (validURL(pageUrl) && supportedUrl(pageUrl)) {
            chrome.storage.sync.set({
                lastAccessed: Date.now()
            });
            await addPendingProduct(pageUrl);
            addNewProduct();
        } else {
            alert("Current URL is not supported: " + pageUrl);
        }
    }
}
// Get product details from content script and then add it to the extension
function addNewProduct(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {action: "getProductDetails"}, async function(response) {
            console.log("Got the product details to add to extension");
            console.log(response);
            await addProductDetails(response, "saved");
            await addProductDetails(response, "recent");
        });  
    });
}

// Add a new product in a pending list
function addPendingProduct(link) {
    return new Promise(resolve => {
        chrome.storage.sync.get(["products"], function (chromeData) {
            products = JSON.parse(chromeData.products);
            if (!products.pending.includes(link)) {
                products["pending"].push(link);
                chrome.storage.sync.set({ products: JSON.stringify(products) });
            }
        });
        return resolve();
    });
}
// Remove Pending Product Once Product Is Added
function removePendingProduct(products, productLink){
    return new Promise(resolve => {
        for(let i = 0; i < products.pending.length; i++){
            if(products.pending[i] == productLink){
                products.pending.splice(i, 1);
            }
        }
        chrome.storage.sync.set({ products: JSON.stringify(products) }, () => {
            return resolve();
        });
    });
}

// LISTNER ON STORAGE VALUE CHANGED
// Storage value change listener, update products count badge of extension
chrome.storage.onChanged.addListener(function (changes, storageName) {
    if (storageName == "sync" && "products" in changes) {
        let products = JSON.parse(changes.products.newValue);
        let totalItems = products.saved.length;
        drawProducts();
        chrome.browserAction.setBadgeText({
            text: totalItems.toString()
        });
    }
});

// List all the products in the extension HTML page
function drawProducts() {
    console.log("DrawProducts");
    chrome.storage.sync.get(["products"], async function (chromeData) {
        if (chromeData.products) {
            products = JSON.parse(chromeData.products);
            ["saved", "recent", "expired"].forEach(infoType => {
                $(`#${infoType}Products`).html(""); // Clear all the products first
                if (products[infoType]) {
                    for (productKey in products[infoType]) {
                        let product = products[infoType][productKey];
                        if (product && product.name) {

                            if (!product.price || product.price == -1){
                                product.price = `Not available`;
                            } else {
                                product.price = `$${product.price}`;
                            }
                            if (!product.ratings) product.ratings = `Not available`;
                            if (!product.img) product.img = `../icons/img-not-available.png`;

                            newProduct =
                                `<li class="media" style="cursor: pointer;">` +
                                `<img src="${product.img}" height="50" width="50" style="margin-top: 7px;" class="rounded-circle mr-1" alt="...">` +
                                `<div class="media-body">` +
                                    `<div style="max-width: 180px;">` +
                                        `<div class="ellipses p-title" class="mt-0 mb-1">${product.name}</div>` +
                                        `<div class="ellipses">${product.name}</div>` +
                                        `<div style="display: inline-flex;">` +
                                            `<div style="width: 130px;">` +
                                                `<div class="text-ellipses p-price">` +
                                                    `Price: <span class="p-number">${product.price}</span>`+
                                                `</div>` +
                                                    `<div class="text-ellipses p-rating">Ratings: <span class="p-number">${product.ratings}</span></div>` + 
                                                `</div>` +
                                                `<div>` +
                                                    `<img src="../icons/${ownerIcons[product.owner]}" alt="${product.owner}" height="36" width="40">` +
                                                `</div>` +
                                            `</div>` +
                                        `</div>` +
                                    `</div>` +
                                `</li>`;
                            $(`#${infoType}Products`).append(newProduct);
                        }
                    };
                }
            });
        }
    });
}

// Add a new product to an extension and update it if the product is already available
function addProductDetails(productInfo, infoType){
    return new Promise(resolve => {
        chrome.storage.sync.get(["products", "defaultOptions"], async function (chromeData) {
            let products = JSON.parse(chromeData.products);
            let defaultOptions = JSON.parse(chromeData.defaultOptions);
            if (typeof productInfo != "undefined" && typeof productInfo.error != "undefined" && productInfo.error == 0 && productInfo.productInfo.title) {
                productInfo = productInfo.productInfo;
                let newProduct = {};
                newProduct["owner"] = productInfo.owner;
                newProduct["link"] = productInfo.url;
                newProduct["ratings"] = productInfo.ratings;
                newProduct["price"] = productInfo.price;
                newProduct["name"] = productInfo.title;
                newProduct["img"] = productInfo.img;
                newProduct["timestamp"] = Date.now();
                let sameProduct = await isSameProduct(products[infoType], newProduct);
                if (sameProduct.isAvailable) {
                    products[infoType].splice(sameProduct.position, 1);
                }
                products[infoType].push(newProduct);
                products[infoType].sort(function (a, b) { return b["timestamp"] - a["timestamp"] });
                if(infoType == "recent"){
                    if(products[infoType].length > defaultOptions.maxDefaultRecentProducts){
                        products[infoType].splice(products[infoType].length - 1, 1);
                    }
                }
                chrome.storage.sync.set({ products: JSON.stringify(products) }, async () => {
                    await removePendingProduct(products, productInfo.url);
                    if (sameProduct.isAvailable) {
                        console.log(`Product is already added to Cherry Pick: ${productInfo.url} `);
                    }
                    return resolve();
                });
            } else {
                if(typeof productInfo != "undefined" &&productInfo.error == 1){
                    console.log(productInfo.message);
                } else {
                    console.log("Couldn't get the product information");
                }
                return resolve();
            }
        });
    });
}

function compareAllProducts(){
    return new Promise(resolve => {
        chrome.storage.sync.get(["products", "defaultOptions"], async function (chromeData) {
            if (chromeData.products) {
                let products = JSON.parse(chromeData.products);
                let defaultOptions = JSON.parse(chromeData.defaultOptions);

                ["saved", "recent"].forEach(async (infoType) => {
                    if (products[infoType]) {
                        for (productKey in products[infoType]) {
                            let product = products[infoType][productKey];
                            if (product && product.name && product.timestamp) {
                                if(((Date.now() - product.timestamp) / 1000) > 5){ // If the product hasn't been updated since more than 1 hr
                                    let productDetails = await compareProduct(product);
                                }
                            }
                        }
                    }
                });
            }
        });
    })
}

function compareProduct(product){
    return new Promise(async (resolve) => {
        let allWebsitesRequests = allWebsites.filter(website => website != product.owner).map((website) => {
            if(website != product.owner) return compareProductRequest(website, product.name)
        });
        let allWebsitesResponse = await Promise.all(allWebsitesRequests);
        console.log(`compareProduct`);
        console.log(allWebsitesResponse);
        resolve(allWebsitesResponse);
    });
}

function compareProductRequest(compareAgainst, productName){
    return new Promise(resolve => {
        let urlPath = URL + compareAgainst + "/products/" + encodeURI(productName);
        $.ajax({
            url: urlPath,
            timeout: 6000,
            tryCount: 0,
            retryLimit: 2,
            success: function (productInfo) {
                console.log("Got the reply");
                console.log(productInfo);
                return resolve(productInfo);
            },
            error: function (xhr, textStatus, errorThrown) {
                if (textStatus == 'timeout') {
                    this.tryCount++;
                    if (this.tryCount <= this.retryLimit) {
                        //try again
                        console.log(`Remaining Retry: ${this.retryLimit - 1}`);
                        $.ajax(this);
                    } else {
                        alert(`Failed to add an item. Please try again: ${urlPath}`);
                        console.log("AJAX time out");
                        return resolve({error: 1, message: textStatus});
                    }
                } else {
                    return resolve({error: 1, message: textStatus});
                }
            },
        });
    });
}

// MESSAGE LISTNER
// 1. Get product details as soon as page is loaded
chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.action == "initialProductInfo") {
        console.log("Initial Product Info");
        console.log(request.source);
        addProductDetails(request.source, "recent");
    }
});

$(document).ready(e => {
    drawProducts();
    compareAllProducts();
});