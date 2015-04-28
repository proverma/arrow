/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var util = require("util");
var log4js = require("log4js");
var Controller = require("../interface/controller");

function LocatorController(testConfig, testParams, driver) {
    Controller.call(this, testConfig, testParams, driver);

    this.logger = log4js.getLogger("LocatorController");

}

util.inherits(LocatorController, Controller);

LocatorController.prototype.execute = function (callback) {
    var self = this,
        config = this.testConfig,
        params = this.testParams,
        logger = this.logger,
        webdriver,
        locator,
        strategy,
        target,
        stay,
        waitForElement,
        waitForElements,
        elem,
        mouseMoveOffset,
        done;

    try {

        webdriver = self.driver.getWebDriver();

        done = function() {
            logger.info("done");
            callback();
        };

        if (!webdriver) {
            callback("Locator controller is only supported for the selenium driver");
            return;
        }

        strategy = params["using"];

        if (!strategy) {
            strategy = "css";
        }

        /**
         * @param: stay
         * @purpose: passed, override default behavior of click requiring new page load
         *   (for in-page interactions)
         * @example: click on an element, to open a menu
         *
         * @usage:
                 {
                    "controller": "locator",
                    "params": {
                        "value": ".yom-menu-switch",
                        "click" : true,
                        "stay" : true
                    }
                }
         */
        stay = params["stay"];
        if (!stay) {
            stay = false;
        }

        /**
         * @param: waitForElement
         * @purpose: if passed, waits for the element to appear on page before executing the test.
         * @example: wait for
         *
         * @usage:
         {
            "controller": "locator",
            "params": {
                "value": "#btnQuotes",
                "click" : true,
                "waitForElement" : ".yfi_rt_quote_summary"
            }
        }
         */
        waitForElement = params["waitForElement"];


        /**
         * @param: waitForElements
         * @purpose: if passed, waits for the elements to appear on page, and the only executes test.
         * @example: wait for
         *
         * @usage:
         {
            "controller": "locator",
            "params": {
                "value": "#btnQuotes",
                "click" : true,
                "waitForElements" : "[.yfi_rt_quote_summary1,.yfi_rt_quote_summary2]"
            }
        }
         */
        waitForElements = params["waitForElements"];

        target = params["value"];

        if (!target && !waitForElement && !waitForElements) {
            callback("\"value\" or \"waitForElement\" or \"waitForElements\" parameter is required for locator controller.");
            return;
        }

        locator = webdriver.By[strategy](target);

        function waitFn(currIndex, callback) {

            var element, loc;

            if (currIndex < waitForElements.length) {

                element = waitForElements[currIndex];
                currIndex += 1;

                logger.debug('Waiting for ...' + element);
                webdriver.waitForElementPresent(webdriver.By[strategy](element)).then(waitFn(currIndex, function() {
                    callback();
                }));
            } else {
                callback();
            }

        }

        function findAndAct() {

            elem = webdriver.findElement(locator);
            logger.info("Finding element: By " + strategy + " (" + target + ")");
            if (true === params["hover"]) {
                try {
                    webdriver.actions().mouseMove(elem, {x:0,y:0}).perform().then(function(){
                        mouseMoveOffset = self.testParams["mouseMoveOffset"] || {x:1,y:1};
                        // Move the mouse a little bit
                        webdriver.actions().mouseMove(mouseMoveOffset).perform().then(function() {
                            logger.info("Mouse hover: By " + strategy + " (" + target + ")");
                            if (waitForElement) {
                                logger.debug('Waiting for ...' + waitForElement);
                                webdriver.waitForElementPresent(webdriver.By[strategy](waitForElement)).then(done);
                            } else if (waitForElements) {
                                //TODO - Error handling..To be done in schema check
                                // Right now, if user doesnt pass array of strings, Arrow will ignore it
                                if (waitForElements instanceof Array) {
                                    waitFn(0, function() {
                                        done();
                                    });
                                } else {
                                    logger.error('waitForElements must be an array.');
                                    done();
                                }
                            } else {
                                done();
                            }
                        }).then(null,callback);
                    }).then(null,callback);
                } catch (e) {
                    logger.error('Exception while mouse hover:' + e);
                }
            } else if (true === params["click"]) {

                try {

                    var waitTimeBeforeClick = 100;

                    /**
                     * @param: waitTimeBeforeClick
                     * @purpose: if passed, sleeps for that much time before clicking
                     * @example: wait for
                     *
                     * @usage:
                     {
                        "controller": "locator",
                        "params": {
                            "value": "#btnQuotes",
                            "click" : true,
                            "waitTimeBeforeClick":100
                            "waitForElement" : ".yfi_rt_quote_summary1"
                        }
                    }
                     */

                    // If browser is chrome or waitTimeBeforeClick is passed in params
                    if (params["waitTimeBeforeClick"] || self.driver.config.browser === 'chrome') {

                        // If waitTimeBeforeClick is passed, use it or else default wait time of 100 ms
                        if (params["waitTimeBeforeClick"]) {
                            waitTimeBeforeClick = params["waitTimeBeforeClick"];
                        }
                        logger.debug('Waiting ' + waitTimeBeforeClick + ' ms before clicking');
                        webdriver.sleep(waitTimeBeforeClick);

                    }

                } catch (e) {
                    logger.error('Exception while waiting before click :' + e);
                }

                if (waitForElement) {
                    elem.click();
                    webdriver.waitForElementPresent(webdriver.By[strategy](waitForElement)).then(done);
                } else if (waitForElements) {
                    elem.click();

                    //TODO - Error handling..To be done in schema check
                    // Right now, if user doesnt pass array of strings, Arrow will ignore it
                    if (waitForElements instanceof Array) {
                        waitFn(0, function() {
                            done();
                        });
                    } else {
                        logger.error('waitForElements must be an array.');
                    }

                } else {
                    if (stay) {
                        elem.click().then(done);
                    } else {
                        elem.click();
                        webdriver.waitForNextPage().then(done);
                    }
                }
            } else {
                var sendKeys = params["text"];
                if (sendKeys) {
                    elem.clear();
                    elem.sendKeys(sendKeys).then(done);
                } else {
                    done();
                }
            }
        }
        //checking if locator (value) was given ?
        if (locator) {
            if (false === params["wait"]) {
                findAndAct();
            } else { // wait for the element unless "wait" is explicitly set to false
                webdriver.waitForElementPresent(locator).then(findAndAct);
            }
        } else {
            // if there was no value passed, user intend to use locator controller just for doing waitForElement.
            if (waitForElement) {
                webdriver.waitForElementPresent(webdriver.By[strategy](waitForElement)).then(done);
            } else if (waitForElements) {
                //TODO - Error handling..To be done in schema check
                // Right now, if user doesnt pass array of strings, Arrow will ignore it
                if (waitForElements instanceof Array) {
                    waitFn(0, function() {
                        done();
                    });
                } else {
                    logger.error('waitForElements must be an array.');
                }

            }
        }
    } catch (e) {
        self.logger.error(e.toString());
        callback(e);
    }
};

module.exports = LocatorController;
