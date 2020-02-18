const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

router.get('/', function(req, res, next){
    getInfo(req, function(productInfo) {
        res.send(productInfo);
    });
});

const getInfo = function(req, res){
    const url = req.query.url;
    let productInfo = {};

    axios.get(url).then((html) => {
        let $ = cheerio.load(html.data);
        productInfo['price'] = $("#priceblock_ourprice").text();
        productInfo['title'] = $("#productTitle").text();
        productInfo['title'] = productInfo['title'].replace(/\\n/gm, "").trim();
        productInfo['ratings'] = $(".reviewCountTextLinkedHistogram").attr("title").match(/(^[0-9]*\.*[0-9]*)\s/gm)[0].trim();
        productInfo['url'] = url;
        res(productInfo);
    }).catch (function (e) {
        console.log(e);
        res(productInfo);
    });
};

module.exports = router;