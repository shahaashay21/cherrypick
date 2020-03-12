let finalData;
console.log("jQuery");
$(document).ready(function(){
    console.log($);
});

function DOMtoString(document_root) {
    let html = '',
        node = document_root.firstChild;
    while (node) {
        switch (node.nodeType) {
        case Node.ELEMENT_NODE:
            html += node.outerHTML;
            break;
        case Node.TEXT_NODE:
            html += node.nodeValue;
            break;
        case Node.CDATA_SECTION_NODE:
            html += '<![CDATA[' + node.nodeValue + ']]>';
            break;
        case Node.COMMENT_NODE:
            html += '<!--' + node.nodeValue + '-->';
            break;
        case Node.DOCUMENT_TYPE_NODE:
            // (X)HTML documents are identified by public identifiers
            html += "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') + (!node.publicId && node.systemId ? ' SYSTEM' : '') + (node.systemId ? ' "' + node.systemId + '"' : '') + '>\n';
            break;
        }
        node = node.nextSibling;
    }
    return html;
}

async function readDom(){
    finalData = await webscrap();
    chrome.runtime.sendMessage({
        action: "initialProductInfo",
        source: finalData
    });
}

chrome.runtime.onMessage.addListener(async function (request, sender, callback) {
    if (request.action == "getProductDetails") {
        console.log("FINAL DATA");
        console.log(finalData);
        if(!finalData) finalData = await webscrap();
        callback(finalData);
    }
});

window.onload = readDom;

function webscrap(){
    return new Promise(async(resolve) => {
        let owner = getAPIPath(location.href);
        let productInfo = {};
        // let DOM = DOMtoString(document);
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
            default:
                console.log("Current website is not supported yet");
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

        productInfo['owner'] = "amazon";
        productInfo['price'] = $("#priceblock_ourprice").text();
        productInfo['price'] = productInfo['price'].replace(",","");
        productInfo['title'] = $("#productTitle").text();
        productInfo['title'] = productInfo['title'].replace(/\\n/gm, "").trim();
        if($(".reviewCountTextLinkedHistogram").attr("title")){
            productInfo['ratings'] = $(".reviewCountTextLinkedHistogram").attr("title").match(/(^[0-9]*\.*[0-9]*)\s/gm)[0].trim();
        }
        productInfo['url'] = location.href;
        response['error'] = 0;
        response['productInfo'] = productInfo;

        resolve(response);
    });
}

function getWalmartProduct(){
    return new Promise(resolve => {
        let productInfo = {};
        let response = {};

        productInfo['owner'] = "walmart";
        productInfo['price'] = $(".product-atf").find(".prod-PriceSection").find(".prod-PriceHero").find(".price-group > .price-characteristic").attr("content");
        if(productInfo['price']){
            productInfo['price'] = productInfo['price'].match(/([0-9,\.]+)/gm)[0].trim();
            productInfo['price'] = productInfo['price'].replace(",","");
        } else {
            productInfo['price'] = -1;
        }
        productInfo['title'] = $(".product-atf").find(".prod-ProductTitle").text().replace(/\\n/gm, "").trim();
        productInfo['ratings'] = $(".product-atf").find(".prod-productsecondaryinformation").find(`[itemprop=ratingValue]`).text().trim();
        productInfo['reviews'] = $(".product-atf").find(".prod-productsecondaryinformation").find(`[itemprop=reviewCount]`).text().trim();
        productInfo['url'] = location.href;
        response['error'] = 0;
        response['productInfo'] = productInfo;

        resolve(response);
    });
}

function getBestbuyProduct(){
    return new Promise(resolve => {
        let productInfo = {};
        let response = {};

        productInfo['owner'] = "bestbuy";
        productInfo['price'] = $(".pricing-price.priceView-price").find(".priceView-hero-price.priceView-customer-price > span").first().text();
        if(productInfo['price']){
            productInfo['price'] = productInfo['price'].match(/([0-9,\.]+)/gm)[0].trim();
            productInfo['price'] = productInfo['price'].replace(",","");
        } else {
            productInfo['price'] = -1;
        }
        productInfo['title'] = $(".sku-title > h1").text().replace(/\\n/gm, "").trim();
        productInfo['ratings'] = $(".popover-wrapper").find(".c-reviews").find(".c-review-average").text().trim();
        productInfo['url'] = location.href;
        response['error'] = 0;
        response['productInfo'] = productInfo;

        resolve(response);
    });
}