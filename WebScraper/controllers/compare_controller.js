var logger = require('../utils/winston');
var { OWNERS } = require('../config/conf');

var controller = require('./index');

const compareProducts = async function (req, res, next) {
    let q = req.params.q;

    logger.info(`***** COMPARE PRODUCT FOR ${q} *****`);
    logger.info(q);

    let ownerPromise = new Array();
    for (let eachOwner of OWNERS) {
        // if (eachOwner != store && eachOwner != "index") {
            ownerPromise.push(controller[eachOwner].getProductDetails(q));
        // }
    }

    let ans = await Promise.all(ownerPromise);
    let i = 0;
    for (let eachAns of ans) {
        if (eachAns.error == 0) {
            ownerPromise.splice(i, 1);
        } else {
            i++;
        }
    }
    let pendingAns = await Promise.all(ownerPromise);
    for (i = 0; i < ans.length; i++) {
        if (ans[i].error != 0) {
            ans[i] = pendingAns.shift();
        } else {
            i++;
        }
    }
    res.json(ans);
}

exports.compareProducts = compareProducts;