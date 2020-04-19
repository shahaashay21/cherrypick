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

        // Get price of the prduct using an API
        let jsonResponse = await axios.get(priceUrl);
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
    
    } catch (error) {
        logger.error(error.message);
        response['error'] = 1;
        response['message'] = error.message;
        res.json(response);
    }
};

const getProducts = async function(req, res){
    const product = req.params.p;
    const url = `https://www.target.com/s?searchTerm=${product}`;
    let productsInfo = new Array();
    let totalItems = 3;
    let j = 0;
    let response = {};

    try{ 
        let html = await axios.get(url);
        // Get JSON object to get API KEY
        let jsObject = html.data.match(/__PRELOADED_STATE__.*?({.*?)<\/script>/);
        if(jsObject.length == 2){
            jsObject = jsObject[1].trim();
        }
        jsObject = JSON.parse(jsObject);
        let targetApiKey = "";
        if(jsObject["firefly"]){
            if(jsObject["firefly"]["apiKey"]) targetApiKey = jsObject["firefly"]["apiKey"];
        }

        // Another way to fetch API KEY (fallback)
        if(!targetApiKey){
            let targetApiKeyMatch = html.data.match(/"apiKey":"(.*?)",/);
            if(targetApiKeyMatch.length == 2){
                targetApiKey = targetApiKeyMatch[1];
            }
        }

        // Get all the products detail in JSON
        let priceUrl = `https://redsky.target.com/v2/plp/search/?&key=${targetApiKey}&keyword=${product}&pricing_store_id=2088`;
        logger.info(`Target: products compare: ${priceUrl}`);

        // Get price of the prduct using an API
        let jsonResponse = await axios.get(priceUrl);
        jsonResponse = jsonResponse.data;

        if(jsonResponse["search_response"] && jsonResponse["search_response"]["items"]){
            let itemList = jsonResponse["search_response"]["items"]["Item"];
            for(let i = 0; i < itemList.length; i++){
                if(totalItems <= 0) break;
                totalItems--;
                productsInfo[j] = {};
                productsInfo[j]['match'] = 0; // Initialize
                productsInfo[j]['owner'] = "target";
                productsInfo[j]['name'] = itemList[j]["title"];
                productsInfo[j]['match'] = stringSimilarity.compareTwoStrings(product.toLowerCase(), productsInfo[j]['name'].toLowerCase());
                productsInfo[j]['link'] = `https://www.target.com${itemList[j]["url"]}`;
                if(itemList[j]["images"] && itemList[j]["images"][0]){
                    productsInfo[j]['img'] = `${itemList[j]["images"][0]["base_url"]}${itemList[j]["images"][0]["primary"]}?wid=325&hei=325&qlt=100&fmt=webp`;
                }
                productsInfo[j]['ratings'] = itemList[j]["average_rating"];
                productsInfo[j]['reviews'] = itemList[j]["total_reviews"];
                if(itemList[j]["total_reviews"]){
                    productsInfo[j]['price'] = itemList[j]["total_reviews"]["current_retail"];
                }
                productsInfo[j]['index'] = j;
                j++;
            }
        }
        response['productsInfo'] = productsInfo;
        res.json(response);
    } catch (error) {
        logger.error(error.message);
        response['error'] = 1;
        response['message'] = error.message;
        res.json(response);
    }
}

exports.productInfo = productInfo;
exports.getProducts = getProducts;