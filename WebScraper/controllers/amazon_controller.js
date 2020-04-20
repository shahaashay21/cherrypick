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
        logger.info(`Time taken to get Amazon information: ${takenTime} and URL: ${url}`);
        let $ = cheerio.load(html.data);

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
    const url = "https://www.amazon.com/s?k="+product;
    let productsInfo = new Array();
    let totalItems = 3;
    let j = 0;
    let response = {};

    try{
        let html = await axios.get(url)
        let $ = cheerio.load(html.data);
        let itemList = $(".s-result-list.s-search-results > div");
        logger.info(`Itemlist length: ${itemList.length} and URL: ${url}`);
        for(let i = 0; i < itemList.length; i++){
            if(totalItems <= 0) break;
            const sponsoredProduct = $(itemList[i]).find(`[data-component-type=sp-sponsored-result]`);
            const adviserProducts = $(itemList[i]).find(`[cel_widget_id=SEARCH_RESULTS-SHOPPING_ADVISER]`);
            if(sponsoredProduct.length == 0 && adviserProducts.length == 0){
                totalItems--;
                productsInfo[j] = {};
                productsInfo[j]['match'] = 0; // Initialize
                productsInfo[j]['owner'] = "amazon";
                productsInfo[j]['price'] = $(itemList[i]).find(".a-price > .a-offscreen").html();

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

                productsInfo[j]['link'] = "http://amazon.com"+$(itemList[i]).find("a.a-link-normal.a-text-normal").attr("href");
                productsInfo[j]['img'] = $(itemList[i]).find("img.s-image").attr("src");
                productsInfo[j]['name'] = $(itemList[i]).find("a.a-link-normal.a-text-normal > span");
                if(productsInfo[j]['name']){
                    productsInfo[j]['name'] = productsInfo[j]['name'].first().text();
                    productsInfo[j]['match'] = stringSimilarity.compareTwoStrings(product.toLowerCase(), productsInfo[j]['name'].toLowerCase());
                }
                productsInfo[j]['ratings'] = $(itemList[i]).find(".a-popover-trigger").text();
                if(productsInfo[j]['ratings']){
                    productsInfo[j]['ratings'] = productsInfo[j]['ratings'].match(/(^[0-9]*\.*[0-9]*)\s/gm)[0].trim();
                }
                productsInfo[j]['index'] = j;
                j++;
            }
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