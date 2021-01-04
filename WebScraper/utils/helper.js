var SS = require('string-similarity');
var axios = require('axios');

let stringSimilarity = ((pName, storePName) => {
    let matchSubstr = SS.compareTwoStrings(pName.toLowerCase(), storePName.substr(0, pName.length).toLowerCase());
    let matchStr = SS.compareTwoStrings(pName.toLowerCase(), storePName.toLowerCase());
    return matchSubstr >= matchStr ? matchSubstr : matchStr;
});

let requestTimeoutInterceptor = config => {
    if (config.timeout === undefined || config.timeout === 0) {
      return config;
    }
  
    const source = axios.CancelToken.source();
  
    setTimeout(() => {
      source.cancel(`Cancelled request. Took longer than ${config.timeout}ms to get complete response.`);
    }, config.timeout);
  
    // If caller configures cancelToken, preserve cancelToken behaviour.
    if (config.cancelToken) {
      config.cancelToken.promise.then(cancel => {
        source.cancel(cancel.message);
      });
    }
  
    return { ...config, cancelToken: source.token };
  };

exports.stringSimilarity = stringSimilarity;
exports.requestTimeoutInterceptor = requestTimeoutInterceptor;