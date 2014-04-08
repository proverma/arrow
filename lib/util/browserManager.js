/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 *
 *
 */
var
    SelLib = require('../../arrow_selenium/selLib'),
    BrowserManager = module.exports = {},
    log4js = require("log4js"),
    logger = log4js.getLogger("BrowserManager");

/**
 * Open browsers as part of setup
 * @param browser
 * @param config
 * @param capabilities
 * @param cb
 */
BrowserManager.openBrowsers = function (browser, config, capabilities, cb) {

    var selLib = new SelLib(config);

    // Use default browser if browser not passed
    if (!browser || browser === null) {
        browser = config.browser;
        logger.info('No browser passed. Defaulting to ' + config.browser);
    }

    selLib.open(browser, capabilities, function(error) {

        if (error) {
            logger.error('Error while opening browser ' + browser + ' :' + error);
            process.exit(1);
        } else {
            if (cb) {
                cb();
            }
        }


    });

};

/**
 * Close browsers as part of teardown
 * close browsers
 * @param config
 * @param cb
 */
BrowserManager.closeBrowsers = function (config, cb) {
    var selLib = new SelLib(config);

    selLib.close(function(cb) {
        if (cb) {
            cb();
        }
    });

};

module.exports = BrowserManager;