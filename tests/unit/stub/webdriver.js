// Stub webdriver to use with several test cases

/*
 * Copyright (c) 2012, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


var promise = {};
var Application = function () {
    this.callbacks = {};
};
promise.Application = Application;

var By = {
    id: function () {
    },
    name: function () {
    },
    css: function () {
    },
    xpath: function () {
    }
};

var WebDriver = function () {
    var self = this;
    this.By = By;
    this.Application = Application;

    this.sessionId = 101;
    this.session_ = {
        then: function (cb) {
            cb({id: self.sessionId, capabilities: {browserName: 'browser'}});
        }
    };

    this.currentUrl = "about:blank";
    this.scriptResults = [];
    this.actions = [];
};
var Builder = function () {
};

Application.getInstance = function () {
    return new Application();
};
Application.prototype.on = function (eventName, callback) {
    this.callbacks[eventName] = callback;
};
Application.prototype.notify = function (eventName, data) {
    if (this.callbacks[eventName]) {
        this.callbacks[eventName].call(this, data);
    }
};

Builder.prototype.usingServer = function () {
    return this;
};
Builder.prototype.usingSession = function (id) {
    this.sessionId = id;
    return this;
};
Builder.prototype.withCapabilities = function () {
    return this;
};
Builder.prototype.build = function () {
    return new WebDriver();
};

WebDriver.prototype.findElement = function () {
    var self = this;
    return {
        clear: function () {
        },
        sendKeys: function (value) {
            self.actions.push({ "name": "sendKeys", "value": value });
            return {
                then: function (cb) {
                    cb();
                }
            };
        },
        click: function (value) {
            self.actions.push({ "name": "click" });
            return {
                then: function (cb) {
                    cb();
                }
            };
        }
    };
};

WebDriver.prototype.get = function (url) {
    this.currentUrl = url;
    this.actions.push({ "name": "get", "value": url });
    return {
        then: function (cb) {
            cb();
        }
    };
};

WebDriver.prototype.executeScript = function (script) {
    var self = this;
    this.actions.push({ "name": "script", "value": script });
    return {
        then: function (cb) {
            if (self.scriptResults.hasOwnProperty(script)) {
                cb(self.scriptResults[script]);
            } else {
                cb('');
            }
        }
    };
};

WebDriver.prototype.waitForNextPage = function () {
    return {
        then: function (cb) {
            cb();
        }
    };
};

WebDriver.prototype.waitForElementPresent = function () {
    return {
        then: function (cb) {
            cb();
        }
    };
};

WebDriver.prototype.getCurrentUrl = function () {
    var self = this;
    return {
        then: function (cb) {
            cb(self.currentUrl);
        }
    };
};

WebDriver.prototype.quit = function () {
    return {
        then: function (cb) {
            cb();
        }
    };
};

this.promise = promise;
this.By = By;
this.Builder = Builder;
this.WebDriver = WebDriver;
