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
        logger.info(`Time taken to get Amazon information: ${takenTime} and URL: ${url}`);
        let $ = cheerio.load(html.data);

        productInfo['owner'] = "amazon";
        productInfo['price'] = $("#priceblock_ourprice").text();
        if(productInfo['price']){
            productInfo['price'] = productInfo['price'].match(/([0-9,\.]+)/)[0].trim();
            productInfo['price'] = productInfo['price'].replace(",","");
        } else {
            productInfo['price'] = -1;
        }
        productInfo['title'] = $("#productTitle").text();
        productInfo['title'] = productInfo['title'].replace(/\\n/gm, "").trim();
        if($(".reviewCountTextLinkedHistogram").attr("title")){
            productInfo['ratings'] = $(".reviewCountTextLinkedHistogram").attr("title").match(/(^[0-9]*\.*[0-9]*)\s/gm)[0].trim();
        }
        productInfo['img'] = $("#imageBlock_feature_div").find("#altImages").find(".item.imageThumbnail").find("img").attr("src");
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
    const url = "https://www.amazon.com/s?k="+product;
    let productsInfo = new Array();
    let totalItems = 3;
    let j = 0;
    let response = {};

    axios.get(url).then((html) => {
        let $ = cheerio.load(html.data);
        let itemList = $(".s-result-list.s-search-results > div");
        for(let i = 0; i < itemList.length; i++){
            if(totalItems <= 0) break;
            const sponsoredProduct = $(itemList[i]).find(`[data-component-type=sp-sponsored-result]`);
            const adviserProducts = $(itemList[i]).find(`[cel_widget_id=SEARCH_RESULTS-SHOPPING_ADVISER]`);
            if(sponsoredProduct.length == 0 && adviserProducts.length == 0){
                totalItems--;
                productsInfo[j] = {};
                productsInfo[j]['owner'] = "amazon";
                productsInfo[j]['price'] = $(itemList[i]).find(".a-price > .a-offscreen").html();
                productsInfo[j]['productUrl'] = "http://amazon.com"+$(itemList[i]).find("a.a-link-normal.a-text-normal").attr("href");
                productsInfo[j]['img'] = $(itemList[i]).find("img.s-image").attr("src");
                productsInfo[j]['productName'] = $(itemList[i]).find("a.a-link-normal.a-text-normal > span");
                if(productsInfo[j]['productName']){
                    productsInfo[j]['productName'] = productsInfo[j]['productName'].first().text();
                }
                productsInfo[j]['ratings'] = $(itemList[i]).find(".a-popover-trigger").text().match(/(^[0-9]*\.*[0-9]*)\s/gm)[0].trim();
                productsInfo[j]['index'] = j;
                j++;
            }
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