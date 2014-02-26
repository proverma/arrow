/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
var wd = require("selenium-webdriver"),
    log4js = require("log4js"),
    logger = log4js.getLogger("Wd-Wrapper");

wd.WebDriver.prototype.waitForElementPresent = function (elm, timeout) {
    if (!timeout) {
        timeout = 10000;
    }
    var wdSelf = this;
    return this.wait(function () {
        logger.info("Waiting for Element: " + elm);
        return wdSelf.isElementPresent(elm);
    }, timeout, 'Test timed out while waiting for ' + elm.value);
};

wd.WebDriver.prototype.waitForNextPage = function(currentUrl, timeout) {
    if (!timeout) {
        timeout = 30000;
    }

    if (!currentUrl) {
        currentUrl = this._currentUrl;
    }

    var checkScheduled = false,
        checkScript = "if((window.location.href !== '" + currentUrl + "') && ('complete' === window.document.readyState)) return window.location.href; else return '';",
        nextPageUrl = "",
        wdSelf = this;

    function getNextPageUrl() {
        if (checkScheduled) {
            return;
        }
        checkScheduled = true;

        wdSelf.executeScript(checkScript).then(function (url) {
            checkScheduled = false;
            nextPageUrl = url;
        });
    }

    return this.wait(function() {
        if (nextPageUrl.length > 0) {
            this._currentUrl = nextPageUrl;
            logger.info("Next page: " + this._currentUrl);
            return true;
        }

        logger.info("Waiting for the next page to load");
        getNextPageUrl();
        return false;
    },
        timeout);
};

wd.Builder.prototype.usingSession = function(id) {
    this.sessionId_ = id;
    return this;
};

wd.Builder.prototype.getSession = function() {
    return this.sessionId_;
}

wd.Builder.prototype.build = function() {
    var url = this.getServerUrl();

    // If a remote server wasn't specified, check for browsers we support
    // natively in node before falling back to using the java Selenium server.
    if (!url) {
        var driver = createNativeDriver(this.getCapabilities());
        if (driver) {
            return driver;
        }

        // Nope, fall-back to using the default java server.
        url = AbstractBuilder.DEFAULT_SERVER_URL;
    }




    var executors = require("../../node_modules/selenium-webdriver/executors");
    var executor = executors.createExecutor(url);
    if (this.getSession()) {
        return wd.WebDriver.attachToSession(executor, this.getSession());
    } else {
        return wd.WebDriver.createSession(executor, this.getCapabilities());
    }
};

module.exports = wd;
