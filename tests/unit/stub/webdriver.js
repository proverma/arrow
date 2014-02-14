// Stub webdriver to use with several test cases
/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true, continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */



var Application = function () {
    this.callbacks = {};
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

var promise = {};
promise.controlFlow = function () {
    return new Application();
};


promise.createFlow = function (callback) {
    callback();
};

var By = {
    id: function (x) {
        return x;
    },
    name: function (x) {
        return x;
    },
    css: function (x) {
        return x;
    },
    xpath: function (x) {
        return x;
    }
};


var Builder = function () {
};

Builder.prototype.usingServer = function (url) {
    this.host = url;
    return this;
};
Builder.prototype.usingSession = function (id) {
    this.sessionId = id;
    return this;
};
Builder.prototype.withCapabilities = function (caps) {

    this.caps = caps;
    return this;
};
Builder.prototype.build = function () {
    console.log('***In build..');
//    return this;
    return new WebDriver(this.sessionId, this.caps);
};

Builder.prototype.getServerUrl = function () {
    return this.host;
};

var WebDriver = function (sessionId, caps) {
    var self = this;
    this.By = By;
    this.Application = Application;

    if (sessionId) {
        self.sessionId = sessionId;
    } else {
        self.sessionId = 101;
    }

    if (caps) {
        self.caps = caps;
    } else {
        self.caps = {browserName: 'browser'};
    }

    this.session_ = {
        then: function (cb) {
            cb({id: self.sessionId, capabilities: self.caps});
        }
    };

    this.currentUrl = "about:blank";
    this.scriptResults = [];
    this._actions = [];
    this.error = error;

};

WebDriver.prototype.manage = function() {

    var mgr = function () {

    };

    mgr.prototype.timeouts = function () {
        var to = function () {

        }

        to.prototype.pageLoadTimeout = function (ms) {
            console.log("Page Load Timeout :" + ms);
        }

        to.prototype.setScriptTimeout = function (ms) {
            console.log("Script Timeout :" + ms);
        }

        to.prototype.implicitlyWait = function (ms) {
            console.log("implicitlyWait Timeout :" + ms);
        }
        return new to();
    }

    mgr.prototype.window = function(){
        var win = function(){

        };

        win.prototype.maximize = function(){
            console.log("Mocked window.maximize call");
        }
        return new win();
    }

    return new mgr();

}

WebDriver.prototype.findElement = function () {
    var self = this;
    return {
        clear: function () {
        },
        sendKeys: function (value) {
            self._actions.push({ "name": "sendKeys", "value": value });
            return {
                then: function (cb) {
                    cb();
                }
            };
        },
        click: function (value) {
            self._actions.push({ "name": "click" });
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
    this._actions.push({ "name": "get", "value": url });
    return {
        then: function (cb) {
            cb();
        }
    };
};

WebDriver.prototype.executeScript = function (script) {
    var self = this;
    this._actions.push({ "name": "script", "value": script });
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
    var self = this, promise = {
        then: function (cb, err) {
            if (cb) {
                cb(self.currentUrl);
            } else if (err && self.error.message) {
                err(self.error.message);
            }
            return promise;
        }
    };
    return promise;
};

WebDriver.prototype.quit = function () {
    return {
        then: function (cb) {
            cb();
        }
    };
};

WebDriver.prototype.getCapabilities = function (cb) {


    var self = this;
    console.log('******In getCapabilities.XX...' + JSON.stringify(self.caps));
    return {
        then: function (cb) {

            var Capabilities = function () {
                console.log('****In capabilities constructor..');
            };

            Capabilities.prototype.set = function (caps) {
                console.log('***In getCapabilities set');
                self.caps = caps;
            };

            Capabilities.prototype.get = function (key) {
                console.log('***In getCapabilities get');
                var val;
                if (self.caps.hasOwnProperty(key)) {
                    val = self.caps[key];
                }
                return val;

            };

            self.capabilities = new Capabilities();
            self.capabilities.set(self.caps);

            cb(self.capabilities);

        }
    };
}

WebDriver.prototype.actions = function () {
    var self = this, promise = {
        then: function (cb, err) {
            if (cb) {
                cb(self.currentUrl);
            } else if (err && self.error.message) {
                err(self.error.message);
            }
            return promise;
        }
    };
    return {
        mouseMove: function (element) {
            return {
                perform: function () {
                    self._actions.push({ "name": "mouseMove.perform" });
                    return promise;
                }
            };
        }
    };
};

WebDriver.attachToSession = function () {
    return this;
};

WebDriver.createSession = function () {
    return this;
};


var error = { message: undefined };

function w(){

};

this.promise = promise;
this.By = By;
this.Builder = Builder;
this.WebDriver = WebDriver;
this.error = error;