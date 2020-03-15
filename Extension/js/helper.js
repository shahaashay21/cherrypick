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


















// $.ajax({
//     url: URL + path + "?url=" + link,
//     timeout: 6000,
//     tryCount: 0,
//     retryLimit: 2,
//     success: async function (productInfo) {
//         console.log("Got the reply");
//         console.log(productInfo);
//     },
//     error: function (xhr, textStatus, errorThrown) {
//         if (textStatus == 'timeout') {
//             this.tryCount++;
//             if (this.tryCount <= this.retryLimit) {
//                 //try again
//                 console.log(`Remaining Retry: ${this.retryLimit - 1}`);
//                 $.ajax(this);
//                 return;
//             } else {
//                 alert(`Failed to add an item. Please try again: ${link}`);
//                 console.log("AJAX time out");
//             }
//             return;
//         }
//     },
// });