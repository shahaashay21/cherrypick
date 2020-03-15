const axios = require('axios');
const cheerio = require('cheerio');
var logger = require('../utils/winston');

const productInfo = function(req, res, next){
    const url = req.query.url;
    let productInfo = {};
    let response = {};

    const start = Date.now();
    axios.get(url).then((html) => {
        const takenTime = Date.now() - start;
        logger.info(`Time taken to get Walmart information: ${takenTime} and URL: ${url}`);
        let $ = cheerio.load(html.data);

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
        productInfo['url'] = url;
        response['error'] = 0;
        response['productInfo'] = productInfo;
        
        res.json(response);
    }).catch (function (e) {
        logger.error(e.message);
        response['error'] = 1;
        response['message'] = e.message;
    });
};

const getInfo = function(req, res){
    const product = req.params.p;
    const url = "https://www.walmart.com/search/?query="+product;
    let productsInfo = {};
    let totalItems = 3;
    let j = 0;
    let response = {};

    axios.get(url).then((html) => {
        let $ = cheerio.load(html.data);
        let itemList = $(".search-result-gridview-items > li");
        for(let i = 0; i < itemList.length; i++){
            if(totalItems <= 0) break;
            totalItems--;
            productsInfo[j] = {};
            productsInfo[j]['price'] = $(itemList[i]).find(".price-main-block").find(".visuallyhidden").text();
            productsInfo[j]['price'] = productsInfo[j]['price'].match(/([0-9]+\.*[0-9]*)/)[0].trim();
            productsInfo[j]['productUrl'] = "http://walmart.com"+$(itemList[i]).find(".search-result-product-title > a").attr("href");
            productsInfo[j]['productName'] = $(itemList[i]).find(".search-result-product-title > a > span").text();
            productsInfo[j]['ratings'] = $(itemList[i]).find(".search-result-product-rating").find(".seo-avg-rating").text().trim();
            productsInfo[j]['reviews'] = $(itemList[i]).find(".search-result-product-rating").find(".seo-review-count").text().trim();
            productsInfo[j]['index'] = j;
            j++;
        }
        response['error'] = 0;
        response['productsInfo'] = productsInfo;
        res.json(response);
    }).catch(function(e){
        logger.error(e.message);
        response['error'] = 1;
        response['message'] = e.message;
    });
}

exports.productInfo = productInfo;
exports.getInfo = getInfo;