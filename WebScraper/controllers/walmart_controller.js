const axios = require('axios');
const cheerio = require('cheerio');
var logger = require('../utils/winston');
var stringSimilarity = require('string-similarity');

const productInfo = async function(req, res, next){
    const url = req.query.url;
    let productInfo = {};
    let response = {};

    const start = Date.now();
    try{
        let html = await axios.get(url);
        const takenTime = Date.now() - start;
        logger.info(`Time taken to get Walmart information: ${takenTime} and URL: ${url}`);
        let $ = cheerio.load(html.data);

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

        res.json(response);
    } catch (error) {
        logger.error(error.message);
        response['error'] = 1;
        response['message'] = error.message;
        res.json(response);
    };
};

const getProducts = async function(req, res){
    const product = req.params.p;
    const url = `https://www.walmart.com/search/?grid=false&query=${product}&sort=best_match`;
    let productsInfo = new Array();
    let totalItems = 3;
    let j = 0;
    let response = {};

    try{
        let html = await axios.get(url);
        let $ = cheerio.load(html.data);
        let itemList = $(".search-result-gridview-items > li");
        if(itemList.length == 0) itemList = $("#searchProductResult > div > div");
        logger.info(`Itemlist length: ${itemList.length} and URL: ${url}`);
        for(let i = 0; i < itemList.length; i++){
            if(totalItems <= 0) break;
            totalItems--;
            productsInfo[j] = {};
            productsInfo[j]['match'] = 0; // Initialize
            productsInfo[j]['owner'] = "walmart";
            productsInfo[j]['price'] = $(itemList[i]).find(".price-main-block").find(".visuallyhidden").text();

            if(productsInfo[j]['price']){
                productsInfo[j]['price'] = productsInfo[j]['price'].match(/([0-9,\.]+)/);
                if(productsInfo[j]['price'].length > 0){
                    productsInfo[j]['price'] = productsInfo[j]['price'][0].trim();
                    productsInfo[j]['price'] = productsInfo[j]['price'].replace(",","");
                } else {
                    productsInfo[j]['price'] = -1;
                }
            } else {
                productsInfo[j]['price'] = -1;
            }

            productsInfo[j]['link'] = "http://walmart.com"+$(itemList[i]).find(".search-result-product-title > a").attr("href");
            productsInfo[j]['name'] = $(itemList[i]).find(".search-result-product-title > a > span").text();
            productsInfo[j]['match'] = stringSimilarity.compareTwoStrings(product.toLowerCase(), productsInfo[j]['name'].toLowerCase());
            productsInfo[j]['ratings'] = $(itemList[i]).find(".search-result-product-rating").find(".seo-avg-rating").text().trim();
            productsInfo[j]['reviews'] = $(itemList[i]).find(".search-result-product-rating").find(".seo-review-count").text().trim();
            productsInfo[j]['img'] = $(itemList[i]).find("img").attr("src");
            logger.info(`Image link: ${productsInfo[j]['img']}`);
            productsInfo[j]['index'] = j;
            j++;
        }
        response['error'] = 0;
        response['productsInfo'] = productsInfo;
        res.json(response);
    } catch (error) {
        logger.error(error.message);
        response['error'] = 1;
        response['message'] = error.message;
        res.json(response);
    };
}

exports.productInfo = productInfo;
exports.getProducts = getProducts;