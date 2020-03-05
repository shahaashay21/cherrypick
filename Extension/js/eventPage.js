const URL = "http://localhost:3000/";
const supportedSites = ["amazon", "amzn", "bestbuy", "walmart"]; // Has to be 1
// Initalize
let productInitialization = {
  new: new Array(),
  expired: new Array()
};
chrome.runtime.onInstalled.addListener(function() {
  console.log("Welcome to Cherry-Pick");
  chrome.storage.sync.set({
    products: JSON.stringify(productInitialization),
    lastAccessed: Date.now()
  });
});

// add context menu (right click on the page)
var contextMenuItem = {
  id: "cp-compare",
  title: "Compare Price",
  contexts: ["page"]
};
chrome.contextMenus.create(contextMenuItem);

// Context menu listener
chrome.contextMenus.onClicked.addListener(function(clickedData) {
  newProductListner(clickedData);
});

async function newProductListner(clickedData) {
  if (clickedData.menuItemId == "cp-compare") {
    var pageUrl = clickedData.pageUrl;
    if (validURL(pageUrl) && supportedUrl(pageUrl)) {
      chrome.storage.sync.set({ lastAccessed: Date.now() });
      await addProduct(pageUrl);
    } else {
      alert("Current URL is not supported: " + pageUrl);
    }
  }
}

function getAPIPath(url) {
  var regEx = "www.(";
  supportedSites.forEach(site => {
    regEx += `${site}|`;
  });
  regEx = regEx.slice(0, -1);
  regEx += ").";
  let match = new RegExp(regEx, "gmi").exec(url);
  if (match && match.length > 1) {
    return match[1];
  }
}

function addProduct(link, price = null, name = null, suggestions = null, done) {
  return new Promise(resolve => {
    chrome.storage.sync.get(["products"], async function(chromeData) {
      products = JSON.parse(chromeData.products);
      let sameProduct = await isSameProduct(products.new, link);
      if (sameProduct) {
        return resolve();
      }
      let path = getAPIPath(link);
      if (path) {
        $.ajax({
          url: URL + getAPIPath(link) + "?url=" + link,
          success: function(productInfo) {
            if (
              typeof productInfo.error != "undefined" &&
              productInfo.error == 0
            ) {
              productInfo = productInfo.productInfo;
              var product = {};
              product["link"] = productInfo.url;
              product["ratings"] = productInfo.ratings;
              product["price"] = productInfo.price;
              product["name"] = productInfo.title;
              product["timestamp"] = Date.now();
              products["new"].push(product);
              chrome.storage.sync.set(
                { products: JSON.stringify(products) },
                () => {
                  drawProducts();
                  return resolve();
                }
              );
            }
          }
        });
      } else {
          alert("Not supported right now :(")
      }
    });
  });
}

function isSameProduct(products, newProductLink) {
  return new Promise(resolve => {
    products.forEach(product => {
      if (product.link == newProductLink) {
        return resolve(true);
      }
    });
    return resolve(false);
  });
}

// Storage value change listener
chrome.storage.onChanged.addListener(function(changes, storageName) {
  if (storageName == "sync" && "products" in changes) {
    var totalItems = JSON.parse(changes.products.newValue).new.length;
    console.log(JSON.parse(changes.products.newValue));
    chrome.browserAction.setBadgeText({ text: totalItems.toString() });
  }
});

function drawProducts() {
  chrome.storage.sync.get(["products"], async function(chromeData) {
    if (chromeData.products) {
      products = JSON.parse(chromeData.products);
      console.log(products.new);
      if (products.new) {
        products.new.forEach(product => {
          if (product.name && product.price) {
            newProduct =
              `<li class="media" style="height: 85px; cursor: pointer;">` +
              `<img src="https://www.w3schools.com/images/w3schools_green.jpg" height="50" width="50" style="margin-top: 7px;" class="rounded-circle mr-1" alt="...">` +
              `<div class="media-body">` +
              `<p class="ellipses p-title" class="mt-0 mb-1">${product.name}</p>` +
              `<p class="ellipses">${product.name}</p>` +
              `<p class="ellipses p-price">` +
              `Price: <p class="p-amount">${product.price}</p>` +
              `</p>` +
              `</div>` +
              `</li>`;
            $("#products").append(newProduct);
          }
        });
      }
    }
  });
}

///////////////// HELPER /////////////////
function validURL(myURL) {
  var pattern = /[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?/gim;
  return pattern.test(myURL);
}

function supportedUrl(myURL) {
  var supportedRegEx = /((amazon|amzn)\.com|walmart\.com|bestbuy\.com)/gim;
  return supportedRegEx.test(myURL);
}
