const URL = "http://localhost:3000/";
// Initalize
let productInitialization = {
    new: new Array(),
    pending: new Array(),
    expired: new Array()
};
chrome.runtime.onInstalled.addListener(function () {
    console.log("Welcome to Cherry-Pick");
    chrome.storage.sync.set({
        products: JSON.stringify(productInitialization),
        lastAccessed: Date.now()
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
        chrome.tabs.sendMessage(tabs[0].id, {action: "getProductDetails"}, function(response) {
            console.log("Got the product details to add to extension");
            console.log(response);
            addProductDetails(response);
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
        let totalItems = products.new.length;
        console.log(products);
        drawProducts();
        chrome.browserAction.setBadgeText({
            text: totalItems.toString()
        });
    }
});

function drawProducts() {
    chrome.storage.sync.get(["products"], async function (chromeData) {
        if (chromeData.products) {
            products = JSON.parse(chromeData.products);
            if (products.new) {
                for (productKey in products.new) {
                    product = products.new[productKey];
                    if (product && product.name) {
                        newProduct =
                            `<li class="media" style="height: 85px; cursor: pointer;">` +
                            `<img src="https://www.w3schools.com/images/w3schools_green.jpg" height="50" width="50" style="margin-top: 7px;" class="rounded-circle mr-1" alt="...">` +
                            `<div class="media-body">` +
                            `<p class="ellipses p-title" class="mt-0 mb-1">${product.name}</p>` +
                            `<p class="ellipses">${product.name}</p>` +
                            `<p class="ellipses p-price">`;
                        if (product.price && product.price != -1) {
                            newProduct += `Price: <p class="p-amount">${product.price}</p>`;
                        } else {
                            newProduct += `Price: <p class="p-amount">Not available</p>`;
                        }
                        newProduct += `</p>` +
                            `</div>` +
                            `</li>`;
                        $("#products").append(newProduct);
                    }
                };
            }
            // DO NOT ADD PENDING PRODUCTS TO THE EXTENSION
            // if (products.pending) {
            //     for (productKey in products.pending) {
            //         productLink = products.pending[productKey];
            //         if (productLink) {
            //             newProduct =
            //                 `<li class="media" style="height: 85px; cursor: pointer;">` +
            //                 `<img src="#" height="50" width="50" style="margin-top: 7px;" class="rounded-circle mr-1" alt="...">` +
            //                 `<div class="media-body">` +
            //                 `<p class="ellipses p-title" class="mt-0 mb-1">${productLink}</p>` +
            //                 `<p class="ellipses">Processing</p>` +
            //                 `<p class="ellipses p-price">`;
            //             newProduct += `Price: <p class="p-amount">Not available</p>`;
            //             newProduct += `</p>` +
            //                 `</div>` +
            //                 `</li>`;
            //             $("#products").append(newProduct);
            //         }
            //     };

            // }
        }
    });
}

function addProductDetails(productInfo){
    return new Promise(resolve => {
        chrome.storage.sync.get(["products"], async function (chromeData) {
            let products = JSON.parse(chromeData.products);
            if (typeof productInfo != "undefined" && typeof productInfo.error != "undefined" && productInfo.error == 0) {
                productInfo = productInfo.productInfo;
                let newProduct = {};
                newProduct["owner"] = productInfo.owner;
                newProduct["link"] = productInfo.url;
                newProduct["ratings"] = productInfo.ratings;
                newProduct["price"] = productInfo.price;
                newProduct["name"] = productInfo.title;
                newProduct["timestamp"] = Date.now();
                let sameProduct = await isSameProduct(products, newProduct);
                if (sameProduct.isAvailable) {
                    products.new.splice(sameProduct.position, 1);
                }
                products["new"].push(newProduct);
                products.new.sort(function (a, b) { return b["timestamp"] - a["timestamp"] });
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

// MESSAGE LISTNER
// 1. Get product details as soon as page is loaded
chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.action == "initialProductInfo") {
        console.log("Initial Product Info");
        console.log(request.source);
    }
});