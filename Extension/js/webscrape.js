let finalData;
$(document).ready(function(){
    log("jQuery");
});

async function readDom(){
    $(document).ready(async function(){
        finalData = await webscrap();
        chrome.runtime.sendMessage({
            action: "initialProductInfo",
            source: finalData
        });
    });
}

chrome.runtime.onMessage.addListener(async function (request, sender, callback) {
    if (request.action == "getProductDetails") {
        if(!finalData) finalData = await webscrap();
        callback(finalData);
    }
});

if(document.hidden){
    document.addEventListener('visibilitychange', function(e) {
        var hidden = document.hidden;
        if (!hidden) {
            var e = e;
            var parentArguments = arguments;
            setTimeout(function(){
                if(!document.hidden){
                    readDom();
                    e.target.removeEventListener(e.type, parentArguments.callee);
                }
            }, 1000);
        }
    });
} else {
    readDom();
}

function webscrap(){
    return new Promise(async(resolve) => {
        let owner = getAPIPath(location.href);
        let productInfo = {};
        switch(owner){
            case "amzn":
            case "amazon":
                productInfo = await getAmazonProduct();
                break;
            case "walmart":
                productInfo = await getWalmartProduct();
                break;
            case "bestbuy":
                productInfo = await getBestbuyProduct();
                break;
            case "target":
                productInfo = await getTargetProduct();
                break;
            default:
                log("Current website is not supported yet");
                productInfo["error"] = 1;
                productInfo["message"] = "Current website is not supported yet";
        }
        resolve(productInfo);
    })
}

function getAmazonProduct(){
    return new Promise(resolve => {
        let productInfo = {};
        let response = {};
        let url = location.href;

        productInfo['owner'] = "amazon";
        productInfo['price'] = $("#priceblock_ourprice").text();
        
        if(productInfo['price']){
            productInfo['price'] = productInfo['price'].match(/([0-9,\.]+)/);
            if(productInfo['price'].length > 0){
                productInfo['price'] = productInfo['price'][0].trim();
                productInfo['price'] = productInfo['price'].replace(",","");
            } else {
                productInfo['price'] = -1;    
            }
        } else {
            productInfo['price'] = -1;
        }

        productInfo['name'] = $("#productTitle").text();
        productInfo['name'] = productInfo['name'].replace(/\\n/gm, "").trim();
        if($(".reviewCountTextLinkedHistogram").attr("title")){
            productInfo['ratings'] = $(".reviewCountTextLinkedHistogram").attr("title").match(/(^[0-9]*\.*[0-9]*)\s/gm)[0].trim();
        }
        productInfo['img'] = $("#imageBlock_feature_div").find("#altImages").find(".item.imageThumbnail").find("img").attr("src");
        productInfo['link'] = url;
        response['error'] = 0;
        response['productInfo'] = productInfo;

        resolve(response);
    });
}

function getWalmartProduct(){
    return new Promise(resolve => {
        let productInfo = {};
        let response = {};
        let url = location.href;

        productInfo['owner'] = "walmart";
        productInfo['price'] = $(".product-atf").find(".prod-PriceSection").find(".prod-PriceHero").find(".price-group > .price-characteristic").attr("content");
        
        if(productInfo['price']){
            productInfo['price'] = productInfo['price'].match(/([0-9,\.]+)/);
            if(productInfo['price'].length > 0){
                productInfo['price'] = productInfo['price'][0].trim();
                productInfo['price'] = productInfo['price'].replace(",","");
            } else {
                productInfo['price'] = -1;    
            }
        } else {
            productInfo['price'] = -1;
        }

        productInfo['name'] = $(".product-atf").find(".prod-ProductTitle").text().replace(/\\n/gm, "").trim();
        productInfo['ratings'] = $(".product-atf").find(".prod-productsecondaryinformation").find(`[itemprop=ratingValue]`).text().trim();
        productInfo['reviews'] = $(".product-atf").find(".prod-productsecondaryinformation").find(`[itemprop=reviewCount]`).text().trim();
        productInfo['img'] = $(".prod-alt-image-wrapper").find(".slider-list").find("img").attr("src");
        if(productInfo['img']){
            productInfo['img'] = "https:" + productInfo['img'];
        }
        productInfo['link'] = url;
        response['error'] = 0;
        response['productInfo'] = productInfo;

        resolve(response);
    });
}

function getBestbuyProduct(){
    return new Promise(resolve => {
        let productInfo = {};
        let response = {};
        let url = location.href;

        productInfo['owner'] = "bestbuy";
        productInfo['price'] = $(".pricing-price.priceView-price").find(".priceView-hero-price.priceView-customer-price > span").first().text();
        
        if(productInfo['price']){
            productInfo['price'] = productInfo['price'].match(/([0-9,\.]+)/);
            if(productInfo['price'].length > 0){
                productInfo['price'] = productInfo['price'][0].trim();
                productInfo['price'] = productInfo['price'].replace(",","");
            } else {
                productInfo['price'] = -1;    
            }
        } else {
            productInfo['price'] = -1;
        }

        productInfo['name'] = $(".sku-title > h1").text().replace(/\\n/gm, "").trim();
        productInfo['ratings'] = $(".popover-wrapper").find(".c-reviews").find(".c-review-average").text().trim();
        productInfo['img'] = $(".shop-media-gallery").find(".thumbnail-list").find(".image-thumbnail").find("img").attr("src");
        productInfo['link'] = url;
        response['error'] = 0;
        response['productInfo'] = productInfo;

        resolve(response);
    });
}

function getTargetProduct(){
    return new Promise(async resolve => {
        let response = {};
        try{
            let productInfo = {};
            let url = location.href;
            let html = {};
            html.data = document.documentElement.outerHTML;

            let targetApiKey = "";
            let targetApiKeyMatch = html.data.match(/"apiKey":"(.*?)",/);
            if(targetApiKeyMatch.length == 2){
                targetApiKey = targetApiKeyMatch[1];
            }

            let jsObject = html.data.match(/type="application\/ld\+json">(.*?)<\/script>/);
            if(jsObject.length == 2){
                jsObject = jsObject[1];
            }
            jsObject = JSON.parse(jsObject);

            productInfo['owner'] = "target";

            if(jsObject["@graph"]){
                let productObj = jsObject["@graph"][0];
                if(productObj){
                    productInfo['name'] = productObj["name"];
                    productInfo['img'] = productObj["image"];
                    productInfo['sku'] = productObj["sku"];
                    productInfo['ratings'] = productObj["aggregateRating"]["ratingValue"];
                    productInfo['reviews'] = productObj["aggregateRating"]["reviewCount"];
                }
            }
            let priceUrl = `https://redsky.target.com/web/pdp_location/v1/tcin/${productInfo["sku"]}?pricing_store_id=2088&key=${targetApiKey}`;

            let jsonResponse = await webRequest(priceUrl);
            if(jsonResponse){
                if(jsonResponse["price"]["current_retail"]) productInfo['price'] = jsonResponse["price"]["current_retail"];
                if(jsonResponse["price"]["current_retail_min"]) productInfo['price'] = jsonResponse["price"]["current_retail_min"];
            }
            if(!productInfo['price']){
                productInfo['price'] = -1;
            }
            productInfo['link'] = url;
            response['error'] = 0;
            response['productInfo'] = productInfo;
            resolve(response);
        } catch (error){
            response['error'] = 1;
            response['message'] = error.message;
            resolve(response);
        }
    });
}