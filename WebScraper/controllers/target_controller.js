const axios = require('axios');
const cheerio = require('cheerio');
var logger = require('../utils/winston');
var stringSimilarity = require('string-similarity');

const productInfo = function(req, res, next){



    const url = req.query.url;
    let productInfo = {};
    let response = {};

    const start = Date.now();
    axios.get(url).then((html) => {
        // logger.info(html.data);
        const takenTime = Date.now() - start;
        logger.info(`Time taken to get Target information: ${takenTime} and URL: ${url}`);
        let $ = cheerio.load(html.data);

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
        logger.info(`Target: priceUrl: ${priceUrl}`);
        axios.get(priceUrl).then((jsonResponse) => {
            jsonResponse = jsonResponse.data;
            if(jsonResponse["price"]){
                if(jsonResponse["price"]["current_retail"]) productInfo['price'] = jsonResponse["price"]["current_retail"];
                if(jsonResponse["price"]["current_retail_min"]) productInfo['price'] = jsonResponse["price"]["current_retail_min"];
            }
            
            if(!productInfo['price']){
                productInfo['price'] = -1;
            }

            if(!productInfo['name']) productInfo['name'] = $(".product-atf").find(".prod-ProductTitle").text().replace(/\\n/gm, "").trim();
            if(!productInfo['ratings'] || productInfo['reviews']){
                let reviewRatings = $(`[data-test=ratings]`).find(`.h-sr-only`).html().trim().match(/(\d\.*\d*) out of (\d\.*\d*) stars with (\d+)* reviews/);
                if(reviewRatings.length == 4){
                    productInfo['ratings'] = reviewRatings[1];
                    productInfo['reviews'] = reviewRatings[3];
                }
            }
            if(!productInfo['img']) productInfo['img'] = $(".slideDeckPicture").find("img").attr("src");
            productInfo['link'] = url;
            response['error'] = 0;
            response['productInfo'] = productInfo;

            res.json(response);
        }).catch (function (e) {
            logger.error(e.message);
            response['error'] = 1;
            response['message'] = e.message;
            res.json(response);
        });
    }).catch (function (e) {
        logger.error(e.message);
        response['error'] = 1;
        response['message'] = e.message;
        res.json(response);
    });
};

const getProducts = function(req, res){
    const product = req.params.p;
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
    }).catch(function(e){
        logger.error(e.message);
        response['error'] = 1;
        response['message'] = e.message;
        res.json(response);
    });
}

exports.productInfo = productInfo;
exports.getProducts = getProducts;