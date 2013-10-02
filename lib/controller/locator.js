/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var util = require("util");
var log4js = require("log4js");
var async = require("async");
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

        target = params["value"];
        if (!target) {
            callback("\"value\" parameter is required");
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
            if (true === params["click"]) {

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
                    logger.debug('Exception while waiting before click when browser is chrome :' + e);
                }

                if (stay) {
                    elem.click().then(done);
                } else if (waitForElement) {
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
                        logger.error('waitForElements shall be an array.');
                    }

                } else {
                    elem.click();
                    webdriver.waitForNextPage().then(done);
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

        if (false === params["wait"]) {
            findAndAct();
        } else { // wait for the element unless "wait" is explicitly set to false
            webdriver.waitForElementPresent(locator).then(findAndAct);
        }
    } catch (e) {
        self.logger.error(e.toString());
        callback(e);
    }
};

module.exports = LocatorController;
