const axios = require('axios');
const cheerio = require('cheerio');
var logger = require('../utils/winston');
let os = require('os');
let app = require('../app');
var stringSimilarity = require('string-similarity');

const getProducts = async function (req, res) {
    const product = req.params.p;
    let pDetails = await getProductDetails(product, req.query.page);
    if (pDetails && pDetails.error == 0) {
        if (pDetails.json == 1) {
            res.json(pDetails.productsInfo);
        } else {
            res.send(pDetails.productsInfo);
        }
    } else {
        res.json(pDetails);
    }
}

function getProductDetails(p, page = 0) {
    return new Promise(async (resolve) => {
        let response = {};
        const TOTAL_SUGGESTED_PRODUCTS = 7;
        try {
            let googleShoppingURL = `https://www.google.com/search?tbm=shop&psb=1&hl=en-US&q=${p}`;
            let prdsExtraOptions = `,start:0,num:${TOTAL_SUGGESTED_PRODUCTS}`;
            let productUrl = `http://${os.hostname()}:${gPort}/google/redirect?url=`
            let compareProductUrl;
            let compareProductsResult = [];

            let productsRes = await axios.get(googleShoppingURL, {
                headers: {
                    "user-agent": ""
                }
            });
            let $ = cheerio.load(productsRes.data);
            let comPriceLink = $(".xcR77 > div:nth-child(2)").find(".DKkjqf").attr('href');
            if (comPriceLink) {
                // let productId = comPriceLink.match(/product\/(.*)\?/);
                let splitProductUrl = comPriceLink.match(/(.*)prds=(.*?)(?:&|$)(.*)/);
                if (splitProductUrl.length == 4) {
                    splitProductUrl[2] = splitProductUrl[2] + prdsExtraOptions;
                    compareProductUrl = `https://www.google.com${splitProductUrl[1]}&prds=${splitProductUrl[2]}&${splitProductUrl[3]}`;
                }
                let comProductsRes = await axios.get(compareProductUrl, {
                    headers: {
                        "user-agent": ""
                    }
                });
                let $ = cheerio.load(comProductsRes.data);

                // Get the product name
                response.name = $("div.HsDfZc:nth-child(2) > div:nth-child(2) a").text();
                if(response.name){
                    response.match = stringSimilarity.compareTwoStrings(p.toLowerCase(), response.name.toLowerCase());
                }
                // Get the product description
                response.snippet = $("div#specs > div:nth-child(2) > div:nth-last-child(1)").text();

                // Get the product image
                let imageURL = $("div > img").attr("src");
                if (imageURL) {
                    let image = await axios.get(imageURL, { responseType: 'arraybuffer' });
                    let raw = Buffer.from(image.data).toString('base64');
                    response.img = "data:" + image.headers["content-type"] + ";base64," + raw;
                }
                
                // logger.info("Total numbers of google products: " + $("div#online > div.t9KcM").length);
                $("div#online > div.t9KcM").each((i, e) => {
                    let eachProduct = {};
                    let eachDiv = $(e).children("div");
                    // For total price, tax and shipping details
                    if (eachDiv && eachDiv[0]) {
                        let priceInfo = $(eachDiv[0]).children("div");
                        if (priceInfo && priceInfo[0]) {
                            let priceAndStatusText = $(priceInfo[0]).text();
                            if (priceAndStatusText) {
                                let priceAndStatus = priceAndStatusText.split(" ");
                                if (priceAndStatus) eachProduct.price = priceAndStatus[0].substring(1).replace(/\,/g,'');
                                if (priceAndStatus && priceAndStatus[1]) eachProduct.status = priceAndStatus[1];
                            }
                        }
                        if (priceInfo && priceInfo[1]) {
                            let taxInfo = $(priceInfo[1]).text();
                            if (taxInfo) {
                                if (taxInfo.toLowerCase() == "no tax") {
                                    eachProduct.tax = "0.00";
                                } else {
                                    eachProduct.tax = taxInfo.split(" ")[0].substring(2);
                                }
                            }
                        }
                        if (priceInfo && priceInfo[2]) {
                            let shippingInfo = $(priceInfo[2]).text();
                            if (shippingInfo) {
                                if (shippingInfo.toLowerCase() == "free shipping") {
                                    eachProduct.shipping = "0.00";
                                } else {
                                    eachProduct.shipping = shippingInfo.split(" ")[0].substring(2);
                                }
                            }
                        }
                    }
                    // For link of the product
                    if (eachDiv && eachDiv[1]) {
                        eachProduct.store = $(eachDiv[1]).find("a").text();
                        eachProduct.link = productUrl + encodeURIComponent($(eachDiv[1]).find("a").attr("href"));
                    }
                    // For user feedback (reviews and ratings)
                    if (eachDiv && eachDiv[2]) {
                        eachProduct.feedback = $(eachDiv[2]).text();
                        let reviewMatches = eachProduct.feedback.match(/\((.*)\)/);
                        let ratingMatches = eachProduct.feedback.match(/(\d+)%/);
                        if (reviewMatches && reviewMatches.length > 1) {
                            eachProduct.reviews = reviewMatches[1];
                            eachProduct.reviews = eachProduct.reviews.replace(/\,/g,'');
                        }
                        if (ratingMatches && ratingMatches.length > 1) {
                            eachProduct.ratings = (ratingMatches[1] * 5) / 100;
                        }
                    }
                    compareProductsResult.push(eachProduct);
                });

                if (page) {
                    return resolve({ json: 0, error: 0, productsInfo: comProductsRes.data });
                } else {
                    response['error'] = 0;
                    response['source'] = "google";
                    response['productsInfo'] = compareProductsResult;
                    // return resolve({ json: 1, data: product });
                    return resolve(response);
                }
            } else {
                response['error'] = 1;
                response['message'] = "Couldn't extract the products";
                return resolve(response);
            }
        } catch (error) {
            logger.error(error.message);
            response['error'] = 1;
            response['message'] = error.message;
            return resolve(response);
        };
    });
}

let redirectGoogleProduct = async (req, res) => {
    try {
        let pUrl = req.query.url;
        pUrl = decodeURIComponent(pUrl);
        let productURL = await axios.get(pUrl);
        logger.info(`Redirecting to ${productURL.request.res.responseUrl}`);
        res.redirect(productURL.request.res.responseUrl);
    } catch (error) {
        res.send(error);
    }
};

exports.getProducts = getProducts;
exports.getProductDetails = getProductDetails
exports.redirectGoogleProduct = redirectGoogleProduct;