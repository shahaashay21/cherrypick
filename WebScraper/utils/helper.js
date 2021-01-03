var SS = require('string-similarity');

let stringSimilarity = ((pName, storePName) => {
    let matchSubstr = SS.compareTwoStrings(pName.toLowerCase(), storePName.substr(0, pName.length).toLowerCase());
    let matchStr = SS.compareTwoStrings(pName.toLowerCase(), storePName.toLowerCase());
    return matchSubstr >= matchStr ? matchSubstr : matchStr;
});

exports.stringSimilarity = stringSimilarity;