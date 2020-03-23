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
            productInfo['price'] = productInfo['price'].match(/([0-9,\.]+)/)[0].trim();
            productInfo['price'] = productInfo['price'].replace(",","");
        } else {
            productInfo['price'] = -1;
        }
        productInfo['title'] = $(".product-atf").find(".prod-ProductTitle").text().replace(/\\n/gm, "").trim();
        productInfo['ratings'] = $(".product-atf").find(".prod-productsecondaryinformation").find(`[itemprop=ratingValue]`).text().trim();
        productInfo['reviews'] = $(".product-atf").find(".prod-productsecondaryinformation").find(`[itemprop=reviewCount]`).text().trim();
        productInfo['img'] = $(".prod-alt-image-wrapper").find(".slider-list").find("img").attr("src");
        if(productInfo['img']){
            productInfo['img'] = "https:" + productInfo['img'];
        }
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
    logger.info(`Prduct name: ${product}`);
    const url = `https://www.walmart.com/search/?grid=false&query=${product}&sort=best_match`;
    let productsInfo = new Array();
    let totalItems = 3;
    let j = 0;
    let response = {};

    axios.get(url).then((html) => {
        let $ = cheerio.load(html.data);
        let itemList = $(".search-result-gridview-items > li");
        if(itemList.length == 0) itemList = $("#searchProductResult > div > div");
        logger.info(`Itemlist length: ${itemList.length} and URL: ${url}`);
        for(let i = 0; i < itemList.length; i++){
            if(totalItems <= 0) break;
            totalItems--;
            productsInfo[j] = {};
            productsInfo[j]['owner'] = "walmart";
            productsInfo[j]['price'] = $(itemList[i]).find(".price-main-block").find(".visuallyhidden").text();
            let priceMatch = productsInfo[j]['price'].match(/([0-9]+\.*[0-9]*)/);
            if(priceMatch && priceMatch.length > 0){
                productsInfo[j]['price'] = priceMatch[0].trim();
            } else {
                productsInfo[j]['price'] = "Not available"
            }
            productsInfo[j]['productUrl'] = "http://walmart.com"+$(itemList[i]).find(".search-result-product-title > a").attr("href");
            productsInfo[j]['productName'] = $(itemList[i]).find(".search-result-product-title > a > span").text();
            productsInfo[j]['ratings'] = $(itemList[i]).find(".search-result-product-rating").find(".seo-avg-rating").text().trim();
            productsInfo[j]['reviews'] = $(itemList[i]).find(".search-result-product-rating").find(".seo-review-count").text().trim();
            productsInfo[j]['img'] = $(itemList[i]).find(".orientation-square").find("img").attr("src");
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
        res.json(response);
    });
}

exports.productInfo = productInfo;
exports.getInfo = getInfo;