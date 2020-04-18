/**
 * Iterate all the products and get suggested product if requires and update it 
 * @param {Boolean} checkSyncTime
 * If checkSyncTime is false then it will forcefully compare all products
 */
function compareAllProducts(checkSyncTime){
    return new Promise(async resolve => {
        let products = await getUniqueProducts();
        log(`Getting products`, true);
        console.log(products);
        let updateProductPromise = new Array();
        for (let product of products) {
            if (product && product.name && product.updatedTime && !product.isLoading) {
                if(!checkSyncTime || (checkSyncTime && ((Date.now() - product.updatedTime) / 1000) > DAFAULT_OPTIONS.syncTimeLimit) || product.newProduct){ // If the product hasn't been updated since more than syncTimeLimit
                    log("Adding products to ALL PROMISE");
                    updateProductPromise.push(updateProductAndSuggestions(product));
                    if(updateProductPromise.length >= ASYNC_PRODUCT_COMPARE){
                        log("UPDATING ALL PRODUCTS PROMISE");
                        await Promise.all(updateProductPromise);
                        log("DONE UPDATING ALL PRODUCTS PROMISE");
                        updateProductPromise = new Array();
                        drawProducts();
                    }
                }
            }
        }
        if(updateProductPromise.length > 0){
            log("UPDATING ALL PRODUCTS PROMISE");
            await Promise.all(updateProductPromise);
            log("DONE UPDATING ALL PRODUCTS PROMISE");
            drawProducts();
        }
    });
}

/**
 * get all the compared products, get current product details and also update the product
 * @param {JSON} product 
 */
function updateProductAndSuggestions(product){
    return new Promise(async resolve => {
        if(!$(`.syncProduct[pid=${product.pid}]`).find(".fas").hasClass("fa-spin")){
            await updateProductData(product, "isLoading", 1);
            $(`.syncProduct[pid=${product.pid}]`).find(".fas").addClass("fa-spin");
        }
        log(`Name: ${product.name} and owner: ${product.owner}`, true);
        let comparedProductsDetails = await compareProduct(product);
        let updatedProductDetails = await getProductInfo(product);
        await updateSuggestedProduct(product, comparedProductsDetails, updatedProductDetails);
        return resolve();
    })
}


/**
 * Get compared products from all the websites, update all the products and then return updated (suggested) products
 * @param {JSON} product 
 * @returns {JSON} All compared products details for the current provided product
 */
function compareProduct(product){
    return new Promise(async (resolve) => {
        let allWebsitesRequests = ALL_WEBSITES.filter(website => website != product.owner).map((website) => {
            if(website != product.owner) return compareProductRequest(website, product.name)
        });
        let allWebsitesResponse = await Promise.all(allWebsitesRequests);
        log(`compareProduct`);
        log(allWebsitesResponse);
        let allProducts = new Array();
        for(let websiteResponse of allWebsitesResponse){
            if(websiteResponse.error == 0){
                if(websiteResponse.productsInfo){
                    // l("PRODUCTS INFO");
                    // l(websiteResponse.productsInfo);
                    websiteResponse.productsInfo.forEach(productInfo => {
                        if(productInfo.price && productInfo.name){
                            allProducts.push(productInfo);
                            // Push the item and draw the product                       
                        }
                    });
                }
            }
        }
        allProducts.sort((a, b) => parseFloat(b.match) - parseFloat(a.match) );
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
                log("Got the reply");
                log(productInfo);
                return resolve(productInfo);
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
    });
}

function getProductInfo(product){
    return new Promise(resolve => {
        let path = getAPIPath(product.link);
        if (path) {
            $.ajax({
                url: URL + path + "?url=" + product.link,
                success: function(productInfo) {
                    log("Got the reply for product information");
                    log(productInfo);
                    if (typeof productInfo.error != "undefined" && productInfo.error == 0) {
                        productInfo = productInfo.productInfo;
                        var product = {};
                        if(productInfo.owner) product["owner"] = productInfo.owner;
                        if(productInfo.link) product["link"] = productInfo.link;
                        if(productInfo.ratings) product["ratings"] = productInfo.ratings;
                        if(productInfo.price) product["price"] = productInfo.price;
                        if(productInfo.name) product["name"] = productInfo.name;
                        if(productInfo.img) product["img"] = productInfo.img;
                        return resolve(product);
                    } else {
                        return resolve();
                    }
                }
            });
        } else {
            alert("Not supported right now :(");
        }
    })
}

/**
 * Add new suggested products
 * @param {String} productName 
 * @param {String} productOwner 
 * @param {JSON} productSuggestions 
 */
function updateSuggestedProduct(productObject, productSuggestions, updatedProductDetails){
    return new Promise(async resolve => {
        let chromeData = await getStorageData();
        if (chromeData.products) {
            let products = JSON.parse(chromeData.products);
            for(let infoType of PRODUCT_STORAGE_CATEGORIES){
                if (products[infoType]) {
                    for (productKey in products[infoType]) {
                        let product = products[infoType][productKey];
                        if (product && product.name == productObject.name && product.owner == productObject.owner && product.link == productObject.link) {
                            product.newProduct = 0;
                            product.updatedTime = Date.now();
                            product.isLoading = 0;
                            product.suggestions = productSuggestions;
                            if(updatedProductDetails){
                                log("Updating product details");
                                if(updatedProductDetails.price) product.price = updatedProductDetails.price;
                                if(updatedProductDetails.ratings) product.ratings = updatedProductDetails.ratings;
                                if(updatedProductDetails.name) product.name = updatedProductDetails.name;
                                if(updatedProductDetails.img) product.img = updatedProductDetails.img;
                            }
                            chrome.storage.local.set({ products: JSON.stringify(products) });                                
                        }
                    }
                }
            };
            resolve();
        }
    })
}