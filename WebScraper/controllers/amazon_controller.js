const axios = require('axios');
const cheerio = require('cheerio');
var logger = require('../utils/winston');

const productInfo = function(req, res, next){
    const url = req.query.url;
    let productInfo = {};

    axios.get(url).then((html) => {
        let $ = cheerio.load(html.data);
        productInfo['price'] = $("#priceblock_ourprice").text();
        productInfo['title'] = $("#productTitle").text();
        productInfo['title'] = productInfo['title'].replace(/\\n/gm, "").trim();
        productInfo['ratings'] = $(".reviewCountTextLinkedHistogram").attr("title").match(/(^[0-9]*\.*[0-9]*)\s/gm)[0].trim();
        productInfo['url'] = url;
        logger.info("Product url: " + url, "productInfo()");
        res.json(productInfo);
    }).catch (function (e) {
        res.send(e);
    });
};

const getInfo = function(req, res){
    const product = req.params.p;
    const url = "https://www.amazon.com/s?k="+product;
    let productsInfo = {};
    let totalItems = 3;
    let j = 0;

    axios.get(url).then((html) => {
        let $ = cheerio.load(html.data);
        let itemList = $(".s-result-list.s-search-results > div");
        for(let i = 0; i < itemList.length; i++){
            if(totalItems <= 0) break;
            const sponsoredProduct = $(itemList[i]).find(`[data-component-type=sp-sponsored-result]`);
            if(sponsoredProduct.length == 0){
                totalItems--;
                productsInfo[j] = {};
                productsInfo[j]['price'] = $(itemList[i]).find(".a-price > .a-offscreen").html();
                productsInfo[j]['productUrl'] = "http://amazon.com"+$(itemList[i]).find("a.a-link-normal.a-text-normal").attr("href");
                productsInfo[j]['productName'] = $(itemList[i]).find("a.a-link-normal.a-text-normal").find("span").html();
                productsInfo[j]['ratings'] = $(itemList[i]).find(".a-popover-trigger").text().match(/(^[0-9]*\.*[0-9]*)\s/gm)[0].trim();
                productsInfo[j]['index'] = j;
                j++;
            }
        }
        res.json(productsInfo);
    }).catch(function(e){
        res.send(e);
    });
}

exports.productInfo = productInfo;
exports.getInfo = getInfo;