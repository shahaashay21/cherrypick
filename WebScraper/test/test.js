var expect = require('chai').expect;
const url = "http://localhost:3000";
const request = require('request');
const axios = require('axios');
const server = require('../bin/www');
const loadtest = require('loadtest');

describe('Unit tests', function () {

	// 50 Seconds
	const requestTimeOut = 50000;
	this.timeout(requestTimeOut);

	this.afterAll(function () {
		server.close();
	});

	it('should return 200, server test ', function () {
		return new Promise(async (resolve, reject) => {
			let iterations = 3;
			while (iterations > 0) {
				let jsonResponse = await axios.get(url);
				if(jsonResponse.status == 200){
					expect(jsonResponse.status).to.equal(200);
					return resolve();
				}
				iterations--;
			}
			return reject();
		})
	});


	// performance testing
	describe.skip('Performance', function () {
		const maxRequests = 12;
		const requestsPerSecond = 3;
		it.skip(`should perform ${requestsPerSecond} requests per second`, function (done) {
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

			loadtest.loadTest(options, function (error) {
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

	const sleep = (milliseconds) => {
		return new Promise(resolve => setTimeout(resolve, milliseconds))
	}

	// DEFINE CONSTANTS
	const AMAZON_API = `${url}/amazon?url=https://www.amazon.com/gp/product/B07CVL2D2S`;
	const AMAZON_PRODUCTS_COMPARE_API = `${url}/amazon/products/Acer%20SB220Q%20bi%2021.5%20inches%20Full%20HD%20(1920%20x%201080)%20IPS%20Ultra-Thin%20Zero%20Frame%20Monitor%20(HDMI%20&%20VGA%20port)`;
	const BEST_BUY_API = `${url}/bestbuy?url=https://www.bestbuy.com/site/apple-airpods-wireless-charging-case-white/6296120.p?skuId=6296120`;
	const BEST_BUY_PRDOCTS_COMPARE_API = `${url}/bestbuy/products/airpod%20charging%20case`;
	const WALMART_API = `${url}/walmart?url=https://www.walmart.com/ip/Wireless-Charging-Case-for-AirPods/910249719`;
	const WALMART_PRDOCTS_COMPARE_API = `${url}/walmart/products/airpod%20charging%20case`;


	// Amazon APIs
	describe('Amazon', function () {

		it('should return 200 status code for product info API ', function () {
			return new Promise(async (resolve, reject) => {
				let iterations = 3;
				let error = "";
				while (iterations > 0) {
					try{
						let jsonResponse = await axios.get(AMAZON_API);
						if(jsonResponse.status == 200){
							expect(jsonResponse.status).to.equal(200);
							return resolve();
						} else {
							await sleep(2000);
						}
					} catch (e){
						error = e.message;
					}
					iterations--;
				}
				return reject(error);
			})
		});

		it('should return 5 product information ', function () {
			return new Promise(async (resolve, reject) => {
				let iterations = 3;
				let error = "";
				while (iterations > 0) {
					try{
						let jsonResponse = await axios.get(AMAZON_API);
						let amazonProduct = jsonResponse.data;
						if (amazonProduct.error == 0) {
							expect(Object.keys(amazonProduct.productInfo).length).to.equal(5);
							return resolve();
						} else {
							error = amazonProduct.error;
							await sleep(2000);
						}
					} catch (e){
						error = e.message;
					}
					iterations--;
				}
				return reject(error);
			});
		});

		it('should return 3 suggested products ', function () {
			return new Promise(async (resolve, reject) => {
				let iterations = 3;
				let error = "";
				while (iterations > 0) {
					try{
						let jsonResponse = await axios.get(AMAZON_PRODUCTS_COMPARE_API);
						let amazonProducts = jsonResponse.data;
						if (amazonProducts.error == 0) {
							expect((amazonProducts.productsInfo).length).to.equal(3);
							return resolve();
						} else {
							error = amazonProducts.error;
							await sleep(2000);
						}
					} catch (e){
						error = e.message;
					}
					iterations--;
				}
				return reject(error);
			});
		});
	});


	// Bestbuy APIs
	describe('Bestbuy', function () {

		it('should return 200 status code for product info API ', function () {
			return new Promise(async (resolve, reject) => {
				let iterations = 3;
				let error = "";
				while (iterations > 0) {
					try{
						let jsonResponse = await axios.get(BEST_BUY_API);
						if(jsonResponse.status == 200){
							expect(jsonResponse.status).to.equal(200);
							return resolve();
						} else {
							await sleep(2000);
						}
					} catch (e){
						error = e.message;
					}
					iterations--;
				}
				return reject(error);
			})
		});

		it('should return 6 product information ', function () {
			return new Promise(async (resolve, reject) => {
				let iterations = 3;
				let error = "";
				while (iterations > 0) {
					try{
						let jsonResponse = await axios.get(BEST_BUY_API);
						let bestbuyProduct = jsonResponse.data;
						if (bestbuyProduct.error == 0) {
							expect(Object.keys(bestbuyProduct.productInfo).length).to.equal(6);
							return resolve();
						} else {
							error = bestbuyProduct.error;
							await sleep(2000);
						}
					} catch (e){
						error = e.message;
					}
					iterations--;
				}
				return reject(error);
			});
		});

		it('should return 3 suggested products ', function () {
			return new Promise(async (resolve, reject) => {
				let iterations = 3;
				let error = "";
				while (iterations > 0) {
					try{
						let jsonResponse = await axios.get(BEST_BUY_PRDOCTS_COMPARE_API);
						let bestbuyProducts = jsonResponse.data;
						if (bestbuyProducts.error == 0) {
							expect((bestbuyProducts.productsInfo).length).to.equal(3);
							return resolve();
						} else {
							error = bestbuyProducts.error;
							await sleep(2000);
						}
					} catch (e){
						error = e.message;
					}
					iterations--;
				}
				return reject(error);
			});
		});
	});


	// Walmart APIs
	describe('Walmart', function () {

		it('should return 200 status code for product info API ', function () {
			return new Promise(async (resolve, reject) => {
				let iterations = 3;
				let error = "";
				while (iterations > 0) {
					try{
						let jsonResponse = await axios.get(WALMART_API);
						if(jsonResponse.status == 200){
							expect(jsonResponse.status).to.equal(200);
							return resolve();
						} else {
							await sleep(2000);
						}
					} catch (e){
						error = e.message;
					}
					iterations--;
				}
				return reject(error);
			})
		});

		it('should return 6 product information ', function () {
			return new Promise(async (resolve, reject) => {
				let iterations = 3;
				let error = "";
				while (iterations > 0) {
					try{
						let jsonResponse = await axios.get(WALMART_API);
						let walmartProduct = jsonResponse.data;
						if (walmartProduct.error == 0) {
							expect(Object.keys(walmartProduct.productInfo).length).to.equal(6);
							return resolve();
						} else {
							error = walmartProduct.error;
							await sleep(2000);
						}
					} catch (e){
						error = e.message;
					}
					iterations--;
				}
				return reject(error);
			});
		});

		it('should return 3 suggested products ', function () {
			return new Promise(async (resolve, reject) => {
				let iterations = 3;
				let error = "";
				while (iterations > 0) {
					try{
						let jsonResponse = await axios.get(WALMART_PRDOCTS_COMPARE_API);
						let amazonProducts = jsonResponse.data;
						if (amazonProducts.error == 0) {
							expect((amazonProducts.productsInfo).length).to.equal(3);
							return resolve();
						} else {
							error = amazonProducts.error;
							await sleep(2000);
						}
					} catch (e){
						error = e.message;
					}
					iterations--;
				}
				return reject(error);
			});
		});
	});



});