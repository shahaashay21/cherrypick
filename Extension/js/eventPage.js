const URL = "http://localhost:3000/";
// Initalize
const productInitialization = {
    recent: new Array(),
    saved: new Array(),
    expired: new Array(),
    pending: new Array()
};

const syncCategories = ["saved", "recent"];

const uniqueIdLength = 7;

const defaultOptions = {
    maxDefaultRecentProducts: 10,
    syncTimeLimit: 600, //seconds
    addCPProductOnClick: false, // add product to recent tab if it is opened by clicking on the compare product section
    savedProductExpTime: 30, // Saved product expiration time in DAYS 
    ignoreRecentProduct: true
}

const ownerIcons = {
    "amazon": "amazon.png",
    "walmart": "walmart.png",
    "bestbuy": "bestbuy.png"
}

const allWebsites = ["amazon", "walmart", "bestbuy"]

// Set cookie expiration time after 5 seconds
const cookieExpirationTime = (new Date().getTime()/1000) + 5

const storageItems = [
    "products", "lastAccessed", "defaultOptions", "lastWindow", "lastSelectedId", "recentClickedProduct"
]

// Runs once in a lifetime when cherry pick is installed
chrome.runtime.onInstalled.addListener(function () {
    console.log("Welcome to Cherry-Pick");
    chrome.storage.local.set({
        products: JSON.stringify(productInitialization),
        lastAccessed: Date.now(),
        defaultOptions: JSON.stringify(defaultOptions),
        lastWindow: "",
        lastSelectedId: "",
        recentClickedProduct: ""
    }, () => {
        drawProducts()
    })
})

// Add context menu (right click on the page)
let contextMenuItem = {
    id: "cp-compare",
    title: "Compare Price",
    contexts: ["page"]
};
chrome.contextMenus.create(contextMenuItem)

// Context menu listener
chrome.contextMenus.onClicked.addListener(function (clickedData) {
    newProductListner(clickedData);
})


// Check basic URL validation then add a new product
async function newProductListner(clickedData) {
    if (clickedData.menuItemId == "cp-compare") {
        let pageUrl = clickedData.pageUrl;
        if (validURL(pageUrl) && supportedUrl(pageUrl)) {
            chrome.storage.local.set({
                lastAccessed: Date.now()
            });
            // await addPendingProduct(pageUrl);
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
        chrome.storage.local.get(["products"], function (chromeData) {
            products = JSON.parse(chromeData.products);
            if (!products.pending.includes(link)) {
                products["pending"].push(link);
                chrome.storage.local.set({ products: JSON.stringify(products) });
            }
        });
        return resolve();
    });
}
// Remove Pending Product Once Product Is Added
function removePendingProduct(products, productLink){
    return new Promise(async resolve => {
        for(let i = 0; i < products.pending.length; i++){
            if(products.pending[i] == productLink){
                products.pending.splice(i, 1);
            }
        }
        // chrome.storage.local.set({ products: JSON.stringify(products) }, () => {
        //     return resolve();
        // });
        await setStorageData("products", JSON.stringify(products));
        return resolve();
    });
}

// List all the products in the extension HTML page
async function drawProducts() {
    console.log("DrawProducts");
    let chromeData = await getStorageData();
    if (chromeData.products) {
        products = JSON.parse(chromeData.products);
        // Update badge of the saved products
        let totalItems = products.saved.length;
        chrome.browserAction.setBadgeText({
            text: totalItems.toString()
        });
        ["saved", "recent", "expired"].forEach(infoType => {
            // Clear all the products first
            $(`#${infoType}Products`).html("");
            $(`#${infoType}SuggestedProducts`).html("");
            if (products[infoType]) {
                for (productKey in products[infoType]) {
                    console.log(`Product key: ${productKey}`);
                    let uniqueKey = `${infoType}-${productKey}`;
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
                            `<li class="media" id="${uniqueKey}" pid="${infoType}-${product.pid}" style="cursor: pointer;">` +
                                `<img src="${product.img}" height="50" width="50" style="margin-top: 7px;" class="rounded-circle mr-1" alt="Product image not available">` +
                                `<div class="media-body">` +
                                    `<div style="max-width: 180px;">` +
                                        `<div class="ellipses p-title" class="mt-0 mb-1">${product.name}</div>` +
                                        `<div class="ellipses">${product.name}</div>` +
                                        `<div style="display: flex;">` +
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

                    if (product && product.suggestions) {
                        product.suggestions.forEach(suggestedProduct => {

                            if (!suggestedProduct.price || suggestedProduct.price == -1 || suggestedProduct.price == "Not available"){
                                suggestedProduct.price = `Not available`;
                            } else {
                                suggestedProduct.price = `$${suggestedProduct.price}`;
                            }
                            if (!suggestedProduct.ratings) suggestedProduct.ratings = `Not available`;
                            if (!suggestedProduct.img) suggestedProduct.img = `../icons/img-not-available.png`;


                            let suggestedProductHtml = 
                                `<li class="media ${uniqueKey} suggestedProduct" style="cursor: pointer;" url="${suggestedProduct.productUrl}" owner="${suggestedProduct.owner}" name="${suggestedProduct.productName}">` +
                                    `<img src="${suggestedProduct.img}" height="50" width="50" style="margin-top: 7px;" class="rounded-circle mr-1" alt="Product image not available">` +
                                    `<div class="media-body">` +
                                        `<div style="max-width: 320px;">` +
                                            `<div class="ellipses p-title" class="mt-0 mb-1">${suggestedProduct.productName}</div>` +
                                            `<div class="ellipses">${suggestedProduct.productName}</div>` +
                                            `<div class="ps-card-footer">` +
                                                `<div class="ps-price-ratings">` +
                                                    `<div class="text-ellipses p-price">Price: <span class="p-number">${suggestedProduct.price}</span></div>` +
                                                    `<div class="text-ellipses p-rating">Ratings: <span class="p-number">${suggestedProduct.ratings}</span></div>` +
                                                `</div>` +
                                                `<div class="ps-company-img">` +
                                                    `<img src="../icons/${ownerIcons[suggestedProduct.owner]}" height="40" width="50" alt="company name">` +
                                                `</div>` +
                                            `</div>` +
                                        `</div>` +
                                    `</div>` +
                                `</li>`;
                            $(`#${infoType}SuggestedProducts`).append(suggestedProductHtml);
                        })
                    }
                };
            }
            setupJquery(`${infoType}`);
        });
        jqueryDisplaySelectedProduct();
    }
}

// jQuery setup after displaying all the products
function setupJquery(typeId){
    jqueryDisplaySuggestedProducts(typeId);
}

// After drawing the product details, set Jquery to open product's suggestions on click
function jqueryDisplaySuggestedProducts(typeId){
    $(`#${typeId}Products > li`).bind('click', function(){
        $(".suggestedProduct").hide();
        $("." + $(this).attr('id')).show();
        $(this).siblings().removeClass("active-product");
        $(this).addClass("active-product");
        chrome.storage.local.set({ lastSelectedId: $(this).attr('pid') });
    });
    $(`#${typeId}SuggestedProducts > li`).bind('click', async function(){
        // Add cookie with expiration time to ignore the current item from adding to the recent items
        await setStorageData("recentClickedProduct", JSON.stringify({owner: $(this).attr('owner'), name: $(this).attr('name')}));
        chrome.tabs.create({ url: $(this).attr('url') });
    });
}

function jqueryDisplaySelectedProduct(){
    chrome.storage.local.get(["lastSelectedId"], function (chromeData){
        let lastSelectedId = chromeData.lastSelectedId;
        if(lastSelectedId){
            let jqueryPID = $(`[pid=${lastSelectedId}]`);
            if(jqueryPID.length > 0){
                jqueryPID.trigger( "click" );
            } else {
                openLastWindow();
            }
        } else {
            openLastWindow();
        }
    })
}

// Add a new product to an extension and update it if the product is already available
function addProductDetails(productInfo, infoType){
    return new Promise(resolve => {
        chrome.storage.local.get(["products", "defaultOptions"], async function (chromeData) {
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
                newProduct["createdTime"] = Date.now();
                newProduct["updatedTime"] = Date.now();
                newProduct["newProduct"] = 1; // 1 to get the product suggestions
                newProduct["pid"] = getPID(products);
                let sameProduct = await isSameProduct(products[infoType], newProduct);
                if (sameProduct.isAvailable) { // remove same product before adding
                    products[infoType].splice(sameProduct.position, 1);
                    console.log(`Product is already added to Cherry Pick: ${productInfo.url} `);
                }
                products[infoType].push(newProduct);
                products[infoType].sort(function (a, b) { return b["createdTime"] - a["createdTime"] });
                if(infoType == "recent"){ // if the product reaches to the max limit then remove oldest product
                    if(products[infoType].length > defaultOptions.maxDefaultRecentProducts){
                        products[infoType].splice(products[infoType].length - 1, 1);
                    }
                    // if the product is new then make it as a recent visited product so when user opens the CP, it shows the last added product
                    chrome.storage.local.set({ lastSelectedId: newProduct["pid"] });
                }
                chrome.storage.local.set({ products: JSON.stringify(products) }, async () => {
                    drawProducts();
                    // await removePendingProduct(products, productInfo.url);
                    compareAndDrawProducts(true);
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

/**
 * Iterate all the products and get suggested product if requires and update it 
 * @param {Boolean} checkSyncTime
 * If checkSyncTime is false then it will forcefully compare all products
 */
function compareAllProducts(checkSyncTime){
    return new Promise(async resolve => {
        let chromeData = await getStorageData();
        if (chromeData.products) {
            let products = JSON.parse(chromeData.products);
            let defaultOptions = JSON.parse(chromeData.defaultOptions);
            let isProductUpdated = 0;

            for(let infoType of syncCategories){
                if (products[infoType]) {
                    for (productKey in products[infoType]) {
                        let product = products[infoType][productKey];
                        if (product && product.name && product.updatedTime) {
                            if(!checkSyncTime || (checkSyncTime && ((Date.now() - product.updatedTime) / 1000) > defaultOptions.syncTimeLimit) || product.newProduct){ // If the product hasn't been updated since more than syncTimeLimit
                                let productDetails = await compareProduct(product);
                                await updateSuggestedProduct(product.name, product.owner, productDetails);
                                isProductUpdated = 1;
                                // console.log("Final product details");
                                // console.log(productDetails);
                            }
                        }
                    }
                }
            }
            console.log("Sending back compareAllProducts");
            return resolve(isProductUpdated);
        }
    });
}


/**
 * Get compared products from all the websites, update all the products and then return updated (suggested) products
 * @param {JSON} product 
 * @returns {JSON} All compared products details for the current provided product
 */
function compareProduct(product){
    return new Promise(async (resolve) => {
        let allWebsitesRequests = allWebsites.filter(website => website != product.owner).map((website) => {
            if(website != product.owner) return compareProductRequest(website, product.name)
        });
        let allWebsitesResponse = await Promise.all(allWebsitesRequests);
        console.log(`compareProduct`);
        console.log(allWebsitesResponse);
        let allProducts = new Array();
        for(let websiteResponse of allWebsitesResponse){
            if(websiteResponse.error == 0){
                if(websiteResponse.productsInfo){
                    // console.log("PRODUCTS INFO");
                    // console.log(websiteResponse.productsInfo);
                    websiteResponse.productsInfo.forEach(productInfo => {
                        if(productInfo.price && productInfo.productName){
                            allProducts.push(productInfo);                            
                        }
                    });
                }
            }
        }
        allProducts.sort((a, b) => parseFloat(a.index) - parseFloat(b.index) );
        resolve(allProducts);
    });
}

// AJAX request to get products for comparison
function compareProductRequest(compareAgainst, productName){
    return new Promise(resolve => {
        productName = productName.replace(/[^\x00-\x7F]/g, "");
        productName = encodeURIComponent(productName);
        let urlPath = URL + compareAgainst + "/products/" + productName;
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
                        // alert(`Failed to add an item. Please try again: ${urlPath}`);
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

// Add new suggested products
function updateSuggestedProduct(productName, productOwner, productSuggestions){
    return new Promise(resolve => {
        chrome.storage.local.get(["products"], async function (chromeData) {
            if (chromeData.products) {
                let products = JSON.parse(chromeData.products);
                for(let infoType of syncCategories){
                    if (products[infoType]) {
                        for (productKey in products[infoType]) {
                            let product = products[infoType][productKey];
                            if (product && product.name == productName && product.owner == productOwner) {
                                product.newProduct = 0;
                                product.updatedTime = Date.now();
                                product.suggestions = productSuggestions;
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

function compareAndDrawProducts(checkSyncTime){
    return new Promise(async (resolve) => {
        let isProductUpdated = await compareAllProducts(checkSyncTime);
        if(isProductUpdated) drawProducts();
        resolve();
    });
}

// MESSAGE LISTNER
// 1. Get product details as soon as page is loaded
chrome.runtime.onMessage.addListener(async function (request, sender) {
    if (request.action == "initialProductInfo") {
        console.log("Initial Product Info");
        console.log(request.source);
        let chromeData = await getStorageData();
        let defaultOptions = JSON.parse(chromeData.defaultOptions);
        if(defaultOptions.ignoreRecentProduct && chromeData.recentClickedProduct){
            let recentClickedProduct = JSON.parse(chromeData.recentClickedProduct);
            if(request.source && request.source.productInfo && recentClickedProduct.owner != request.source.productInfo.owner && recentClickedProduct.name == request.source.productInfo.title){
                addProductDetails(request.source, "recent");
            }
        } else {
            addProductDetails(request.source, "recent");
        }
        setStorageData("recentClickedProduct", "");
    }
});

$(document).ready(async (e) => {
    console.log("Testing");
    drawProducts();
    $(".ex").click(async (e) => {
        await compareAndDrawProducts(false);
    });
    await compareAndDrawProducts(true);
});