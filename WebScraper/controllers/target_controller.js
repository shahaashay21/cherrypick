const axios = require('axios');
const cheerio = require('cheerio');
var logger = require('../utils/winston');
var helper = require('../utils/helper');

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

        productInfo['store'] = "target";

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
    let product = req.params.p;
    res.json(await getProductDetails(product));
}

function getProductDetails(p){
    return new Promise(async (resolve) => {
        let product = p;
        const targetSearchChar = 90;
        product = product.substring(0, targetSearchChar);
        const url = `https://www.target.com/s?searchTerm=${product}`;
        let productsInfo = new Array();
        let totalItems = 1;
        let j = 0;
        let response = {};

        try{ 
            let html = await axios.get(url);
            // Get JSON object to get API KEY
            let jsObject = html.data.match(/__PRELOADED_STATE__.*?({.*?)<\/script>/);
            if(jsObject.length == 2){
                jsObject = jsObject[1].trim();
            }
            jsObject = JSON.parse(JSON.stringify(jsObject));
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
                    productsInfo[j]['store'] = "target";
                    productsInfo[j]['name'] = itemList[j]["title"];
                    productsInfo[j]['match'] = helper.stringSimilarity(product, productsInfo[j]['name']);
                    productsInfo[j]['link'] = `https://www.target.com${itemList[j]["url"]}`;
                    if(itemList[j]["images"] && itemList[j]["images"][0]){
                        productsInfo[j]['img'] = `${itemList[j]["images"][0]["base_url"]}${itemList[j]["images"][0]["primary"]}?wid=325&hei=325&qlt=100&fmt=webp`;
                    }
                    productsInfo[j]['ratings'] = itemList[j]["average_rating"];
                    productsInfo[j]['reviews'] = itemList[j]["total_reviews"];
                    if(itemList[j]["price"]){
                        productsInfo[j]['price'] = itemList[j]["price"]["formatted_current_price"].match(/([0-9,\.]+)/);
                        if(productsInfo[j]['price'].length > 0){
                            productsInfo[j]['price'] = productsInfo[j]['price'][0].trim();
                            productsInfo[j]['price'] = productsInfo[j]['price'].replace(/\,/g,'');
                        } else {
                            productsInfo[j]['price'] = -1;
                        }
                    } else {
                        productsInfo[j]['price'] = -1;
                    }
                    productsInfo[j]['index'] = j;
                    j++;
                }
            }

            response['error'] = 0;
            response['productsInfo'] = productsInfo;
            return resolve(response);
        } catch (error) {
            logger.error(error.message);
            response['error'] = 1;
            response['message'] = error.message;
            return resolve(response);
        }
    });
}

exports.productInfo = productInfo;
exports.getProducts = getProducts;
exports.getProductDetails = getProductDetails;