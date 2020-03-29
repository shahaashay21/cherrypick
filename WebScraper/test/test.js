var expect  = require('chai').expect;
const url = "http://localhost:3000";
const request = require('request');
const server = require('../bin/www');
const loadtest = require('loadtest');

describe('Unit tests', function() {

  // 50 Seconds
  const requestTimeOut = 50000;
  this.timeout(requestTimeOut);

  this.afterAll(function(){
    server.close();
  });

  it('should return 200, server test ', function(done) {
    request(url , function(error, response, body) {
        expect(response.statusCode).to.equal(200);
        done();
    });
  });
  

  // performance testing
  describe.skip('Performance', function(){
    const maxRequests = 12;
    const requestsPerSecond = 3;
    it(`should perform ${requestsPerSecond} requests per second`, function(done){
      function statusCallback(error, result, latency) {
          console.log('Current latency %j, result %j, error %j', latency, result, error);
          console.log('----');
          console.log('Request elapsed milliseconds: ', result.requestElapsed);
          console.log('Request index: ', result.requestIndex);
          console.log('Request loadtest() instance index: ', result.instanceIndex);
      }
      const options = {
        // url: 'http://localhost:3000/amazon/products/Acer%20SB220Q%20bi%2021.5%20inches%20Full%20HD%20(1920%20x%201080)%20IPS%20Ultra-Thin%20Zero%20Frame%20Monitor%20(HDMI%20&%20VGA%20port)',
        url: 'http://localhost:3000/walmart/products/airpod%20charging%20case',
        maxRequests: maxRequests,
        requestsPerSecond: requestsPerSecond,
        // timeout: requestTimeOut,
        // statusCallback: statusCallback
      };

      loadtest.loadTest(options, function(error)
      {
        if (error) {
          console.error('Got an error: %s', error);
          done(error);
        } else {
          console.log('Tests run successfully');
          done();
       }
      });
    });
  });
  

  // Amazon APIs
  describe('Amazon', function() {

    it('should return 200 status code for product info API ', function(done) {
      request(url + "/amazon?url=https://www.amazon.com/gp/product/B07CVL2D2S" , function(error, response, body) {
        expect(response.statusCode).to.equal(200);
        done();
      });
    });

    it('should return 5 product information ', function(done) {
      request(url + "/amazon?url=https://www.amazon.com/gp/product/B07CVL2D2S" , function(error, response, body) {
        body = JSON.parse(body);
        if(body.error == 0){
          expect(Object.keys(body.productInfo).length).to.equal(5);
          done();
        } else {
          done(body.message);
        }
      });
    });

    it('should return 3 suggested products ', function(done) {
      request(url + "/amazon/products/Acer%20SB220Q%20bi%2021.5%20inches%20Full%20HD%20(1920%20x%201080)%20IPS%20Ultra-Thin%20Zero%20Frame%20Monitor%20(HDMI%20&%20VGA%20port)" , function(error, response, body) {
        body = JSON.parse(body);
        if(body.error == 0){
          expect((body.productsInfo).length).to.equal(3);
          done();
        } else {
          done(body.message);
        }
      });
    });
  });


  // Bestbuy APIs
  describe('Bestbuy', function() {

    it('should return 200 status code for product info API ', function(done) {
      request(url + "/bestbuy?url=https://www.bestbuy.com/site/apple-airpods-wireless-charging-case-white/6296120.p?skuId=6296120" , function(error, response, body) {
        expect(response.statusCode).to.equal(200);
        done();
      });
    });

    it('should return 5 product information ', function(done) {
      request(url + "/bestbuy?url=https://www.bestbuy.com/site/apple-airpods-wireless-charging-case-white/6296120.p?skuId=6296120" , function(error, response, body) {
        body = JSON.parse(body);
        if(body.error == 0){
          expect(Object.keys(body.productInfo).length).to.equal(6);
          done();
        } else {
          done(body.message);
        }
      });
    });

    it('should return 3 suggested products ', function(done) {
      request(url + "/bestbuy/products/airpod%20charging%20case" , function(error, response, body) {
        body = JSON.parse(body);
        if(body.error == 0){
          expect((body.productsInfo).length).to.equal(3);
          done();
        } else {
          done(body.message);
        }
      });
    });
  });


  // Walmart APIs
  describe('Walmart', function() {

    it('should return 200 status code for product info API ', function(done) {
      request(url + "/walmart?url=https://www.walmart.com/ip/Wireless-Charging-Case-for-AirPods/910249719" , function(error, response, body) {
        expect(response.statusCode).to.equal(200);
        done();
      });
    });

    it('should return 6 product information ', function(done) {
      request(url + "/walmart?url=https://www.walmart.com/ip/Wireless-Charging-Case-for-AirPods/910249719" , function(error, response, body) {
        body = JSON.parse(body);
        if(body.error == 0){
          expect(Object.keys(body.productInfo).length).to.equal(6);
          done();
        } else {
          done(body.message);
        }
      });
    });

    it('should return 3 suggested products ', function(done) {
      request(url + "/walmart/products/airpod%20charging%20case" , function(error, response, body) {
        body = JSON.parse(body);
        if(body.error == 0){
          expect((body.productsInfo).length).to.equal(3);
          done();
        } else {
          done(body.message);
        }
      });
    });
  });



});