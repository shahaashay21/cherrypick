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

            for(let infoType of productStorageCategories){
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

/**
 * AJAX request to get products for comparison
 * @param {String} compareAgainst // All other owners URL
 * @param {String} productName 
 */
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

/**
 * Add new suggested products
 * @param {String} productName 
 * @param {String} productOwner 
 * @param {JSON} productSuggestions 
 */
function updateSuggestedProduct(productName, productOwner, productSuggestions){
    return new Promise(resolve => {
        chrome.storage.local.get(["products"], async function (chromeData) {
            if (chromeData.products) {
                let products = JSON.parse(chromeData.products);
                for(let infoType of productStorageCategories){
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

/**
 * Request to compare all the products and draw after comparing
 * @param {Boolean} checkSyncTime 
 */
function compareAndDrawProducts(checkSyncTime){
    return new Promise(async (resolve) => {
        let isProductUpdated = await compareAllProducts(checkSyncTime);
        if(isProductUpdated) drawProducts();
        resolve();
    });
}