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

// add context menu (right click on the page)
var contextMenuItem = {
    id: "cp-compare",
    title: "Compare Price",
    contexts: ["page"]
};
chrome.contextMenus.create(contextMenuItem);

// Context menu listener
chrome.contextMenus.onClicked.addListener(function (clickedData) {
    newProductListner(clickedData);
});

async function newProductListner(clickedData) {
    if (clickedData.menuItemId == "cp-compare") {
        var pageUrl = clickedData.pageUrl;
        if (validURL(pageUrl) && supportedUrl(pageUrl)) {
            chrome.storage.sync.set({
                lastAccessed: Date.now()
            });
            await addPendingProduct(pageUrl);
            await addProduct(pageUrl);
        } else {
            alert("Current URL is not supported: " + pageUrl);
        }
    }
}

function addPendingProduct(link) {
    return new Promise(resolve => {
        chrome.storage.sync.get(["products"], function (chromeData) {
            products = JSON.parse(chromeData.products);
            if (!products.pending.includes(link)) {
                products["pending"].push(link);
                chrome.storage.sync.set({ products: JSON.stringify(products) }, () => {
                    drawProducts();
                });
            }
        });
        return resolve();
    });
}

function addProduct(link, price = null, name = null, suggestions = null) {
    return new Promise(resolve => {
        chrome.storage.sync.get(["products"], function (chromeData) {
            products = JSON.parse(chromeData.products);
            let path = getAPIPath(link);
            console.log(path);
            if (path) {
                console.log("Sending request to get product information");
                $.ajax({
                    url: URL + path + "?url=" + link,
                    timeout: 6000,
                    tryCount: 0,
                    retryLimit: 2,
                    success: async function (productInfo) {
                        console.log("Got the reply");
                        console.log(productInfo);
                        if (typeof productInfo.error != "undefined" && productInfo.error == 0) {
                            productInfo = productInfo.productInfo;
                            var newProduct = {};
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
                                await removePendingProduct(products, link);
                                drawProducts();
                                if (sameProduct.isAvailable) {
                                    console.log(`Product is already added to Cherry Pick: ${link} `);
                                }
                                return resolve();
                            });
                        }
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        if (textStatus == 'timeout') {
                            this.tryCount++;
                            if (this.tryCount <= this.retryLimit) {
                                //try again
                                console.log(`Remaining Retry: ${this.retryLimit - 1}`);
                                $.ajax(this);
                                return;
                            } else {
                                alert(`Failed to add an item. Please try again: ${link}`);
                                console.log("AJAX time out");
                            }
                            return;
                        }
                    },
                });
            } else {
                alert("Not supported right now :(")
            }
        });
    });
}

function removePendingProduct(products, productLink){
    return new Promise(resolve => {
        for(var i = 0; i < products.pending.length; i++){
            if(products.pending[i] == productLink){
                products.pending.splice(i, 1);
            }
        }
        chrome.storage.sync.set({ products: JSON.stringify(products) }, () => {
            return resolve();
        });
    });
}

// Storage value change listener, update products count badge of extension
chrome.storage.onChanged.addListener(function (changes, storageName) {
    if (storageName == "sync" && "products" in changes) {
        var products = JSON.parse(changes.products.newValue);
        var totalItems = products.new.length + products.pending.length;
        console.log(products);
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
            if (products.pending) {
                for (productKey in products.pending) {
                    productLink = products.pending[productKey];
                    if (productLink) {
                        newProduct =
                            `<li class="media" style="height: 85px; cursor: pointer;">` +
                            `<img src="#" height="50" width="50" style="margin-top: 7px;" class="rounded-circle mr-1" alt="...">` +
                            `<div class="media-body">` +
                            `<p class="ellipses p-title" class="mt-0 mb-1">${productLink}</p>` +
                            `<p class="ellipses">Processing</p>` +
                            `<p class="ellipses p-price">`;
                        newProduct += `Price: <p class="p-amount">Not available</p>`;
                        newProduct += `</p>` +
                            `</div>` +
                            `</li>`;
                        $("#products").append(newProduct);
                    }
                };

            }
        }
    });
}



chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.action == "getSource") {
        console.log(request.source);
    }
});